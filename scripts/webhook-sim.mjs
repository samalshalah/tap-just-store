/**
 * webhook-sim.mjs — prove the payment path without Stripe.
 *
 * Stripe stays switched off until the whole build is signed off, which creates
 * a real risk: the payment code would sit unexercised for weeks and get tested
 * for the first time on launch day. That is how a big-bang integration failure
 * happens.
 *
 * This closes it. Stripe signs a webhook as HMAC-SHA256 over
 * `<timestamp>.<raw body>` using the endpoint's signing secret — a scheme we
 * can reproduce exactly with a locally chosen secret. So this script signs a
 * synthetic event and posts it at the REAL webhook route, exercising the real
 * signature verification, the real database writes and the real idempotency
 * guard. Nothing is stubbed except Stripe's own servers.
 *
 * It checks, in order:
 *   1. an unsigned request is refused
 *   2. a forged signature is refused
 *   3. a stale timestamp is refused (replay protection)
 *   4. a correctly signed payment_intent.succeeded marks the order paid
 *   5. redelivering that same event changes nothing (Stripe retries; it must
 *      not produce a second receipt)
 *   6. payment_intent.payment_failed marks an order failed
 *   7. charge.refunded marks a paid order refunded without touching fulfilment
 *
 *   STRIPE_WEBHOOK_SECRET=whsec_localtest node scripts/webhook-sim.mjs
 *
 * Requires the dev server running and DATABASE_URL set. Run it before any
 * release that touches orders.
 */

import { createHmac } from "node:crypto";
import pg from "pg";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const CONNECTION = process.env.DATABASE_URL;

if (!SECRET) {
  console.error("Set STRIPE_WEBHOOK_SECRET to the same value the dev server has.");
  process.exit(2);
}
if (!CONNECTION) {
  console.error("Set DATABASE_URL.");
  process.exit(2);
}

const client = new pg.Client({
  connectionString: CONNECTION,
  ssl: /localhost|127\.0\.0\.1/.test(CONNECTION) ? undefined : { rejectUnauthorized: false },
});
await client.connect();

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

/** Reproduce Stripe's signature scheme. */
function sign(payload, timestampSec) {
  const mac = createHmac("sha256", SECRET)
    .update(`${timestampSec}.${payload}`)
    .digest("hex");
  return `t=${timestampSec},v1=${mac}`;
}

async function post(payload, header) {
  const res = await fetch(`${BASE}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(header ? { "stripe-signature": header } : {}),
    },
    body: payload,
  });
  return { status: res.status, body: await res.text() };
}

function event(type, object) {
  return JSON.stringify({
    id: `evt_sim_${Math.abs(hash(type + JSON.stringify(object)))}`,
    object: "event",
    type,
    api_version: "2024-06-20",
    created: 1_770_000_000,
    data: { object },
  });
}

/** Deterministic, because Math.random in a test makes failures unreproducible. */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** Insert an order in the state /api/orders leaves it: unpaid, intent recorded. */
async function seedOrder(suffix) {
  const intentId = `pi_sim_${suffix}`;
  const code = `TJ-SIM${suffix}`.toUpperCase().slice(0, 12);
  await client.query(`delete from orders where stripe_payment_intent_id = $1`, [intentId]);
  const { rows } = await client.query(
    `insert into orders (
       confirmation_code, customer_name, customer_email, customer_phone,
       status, subtotal_cents, discount_cents, discount_label, shipping_cents,
       tax_cents, total_price, ship_name, ship_line1, ship_city, ship_state,
       ship_postal_code, payment_status, stripe_payment_intent_id
     ) values (
       $1,'Sim Customer','sim@example.com','2025550100',
       'pending', 3900, 0, '', 495, 234, 4629, 'Sim Customer', '1 Test St',
       'Washington','DC','20001','unpaid',$2
     ) returning id`,
    [code, intentId]
  );
  const orderId = rows[0].id;
  await client.query(
    `insert into order_items (order_id, stand_variant_id, stand_name, size,
       option_code, quantity, price_cents, destination_url, business_name)
     values ($1, null, 'Google Review Stand', 'a5', 'standard_direct', 1, 3900,
       'https://g.page/r/CsimABC/review', '')`,
    [orderId]
  );
  return { orderId, intentId };
}

async function orderRow(intentId) {
  const { rows } = await client.query(
    `select payment_status, paid_at, status from orders where stripe_payment_intent_id = $1`,
    [intentId]
  );
  return rows[0];
}

const now = Math.floor(Date.now() / 1000);

console.log("\nRejecting what should be rejected");
{
  const payload = event("payment_intent.succeeded", { id: "pi_sim_never" });
  check("unsigned request refused", (await post(payload, null)).status === 400);
  check(
    "forged signature refused",
    (await post(payload, `t=${now},v1=${"0".repeat(64)}`)).status === 400
  );
  // Stripe's tolerance is 5 minutes; an old signature is a replayed capture.
  check(
    "stale timestamp refused",
    (await post(payload, sign(payload, now - 60 * 60))).status === 400
  );
  const { rows } = await client.query(
    `select count(*)::int as n from orders where stripe_payment_intent_id = 'pi_sim_never'`
  );
  check("nothing was created by any rejected request", rows[0].n === 0);
}

console.log("\nA real payment");
{
  const { intentId } = await seedOrder("paid");
  const payload = event("payment_intent.succeeded", { id: intentId });
  const first = await post(payload, sign(payload, now));
  check("signed event accepted", first.status === 200, `status ${first.status}`);

  const after = await orderRow(intentId);
  check("order is marked paid", after?.payment_status === "paid", after?.payment_status);
  check("paid_at is stamped", Boolean(after?.paid_at));
  check(
    "fulfilment status untouched",
    after?.status === "pending",
    "payment and fulfilment are separate facts"
  );

  // Stripe retries until it gets a 2xx, and can deliver twice regardless.
  const second = await post(payload, sign(payload, now));
  check("redelivery still returns 200", second.status === 200);
  const again = await orderRow(intentId);
  check(
    "redelivery does not re-stamp paid_at",
    String(again.paid_at) === String(after.paid_at),
    "a second receipt must not be sent"
  );
}

console.log("\nA declined payment");
{
  const { intentId } = await seedOrder("failed");
  const payload = event("payment_intent.payment_failed", { id: intentId });
  check("accepted", (await post(payload, sign(payload, now))).status === 200);
  check(
    "order is marked failed",
    (await orderRow(intentId))?.payment_status === "failed"
  );
}

console.log("\nA refund");
{
  const { intentId } = await seedOrder("refund");
  const paid = event("payment_intent.succeeded", { id: intentId });
  await post(paid, sign(paid, now));
  const refund = event("charge.refunded", { id: "ch_sim", payment_intent: intentId });
  check("accepted", (await post(refund, sign(refund, now))).status === 200);
  const row = await orderRow(intentId);
  check("order is marked refunded", row?.payment_status === "refunded");
  check(
    "fulfilment status still untouched",
    row?.status === "pending",
    "a refunded order may already have shipped"
  );
}

await client.query(`delete from orders where stripe_payment_intent_id like 'pi_sim_%'`);
await client.end();

console.log(
  failures === 0
    ? "\n✓ the payment path behaves correctly without Stripe being live\n"
    : `\n✗ ${failures} check(s) failed\n`
);
process.exit(failures === 0 ? 0 : 1);
