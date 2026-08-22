import "server-only";
import Stripe from "stripe";

/**
 * The Stripe client.
 *
 * Built lazily and cached, because the key lives in a Cloudflare secret that
 * is not present at module-evaluation time in every environment — importing
 * this file must never throw just because payments are not configured yet.
 *
 * `isStripeConfigured()` is the honest check to make before offering
 * checkout. A missing key is a deployment problem, and the site should say
 * "payments are not switched on" rather than fail deep inside a request.
 */
let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return typeof key === "string" && key.startsWith("sk_");
}

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  cached = new Stripe(key, {
    // Cloudflare Workers has no Node http stack; Stripe's fetch client is the
    // supported transport there and works identically under `next dev`.
    httpClient: Stripe.createFetchHttpClient(),
    telemetry: false,
  });
  return cached;
}

export interface CreatedIntent {
  id: string;
  clientSecret: string;
}

/**
 * Create the payment intent for an order.
 *
 * The amount is passed in already computed by the server. Automatic payment
 * methods are on, which is what makes Apple Pay, Google Pay and Link appear in
 * the embedded Payment Element without any extra work.
 */
export async function createPaymentIntent({
  amountCents,
  email,
  metadata,
}: {
  amountCents: number;
  email: string;
  metadata?: Record<string, string>;
}): Promise<CreatedIntent> {
  if (!Number.isInteger(amountCents) || amountCents < 50) {
    // Stripe's own floor for USD is 50 cents; failing here gives a clearer
    // error than the API's.
    throw new Error(`Invalid charge amount: ${amountCents}`);
  }

  const intent = await stripe().paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    receipt_email: email,
    automatic_payment_methods: { enabled: true },
    metadata: metadata ?? {},
  });

  if (!intent.client_secret) {
    throw new Error("Stripe returned an intent with no client secret");
  }
  return { id: intent.id, clientSecret: intent.client_secret };
}

/**
 * A client used only for verifying webhook signatures.
 *
 * Verification is pure HMAC over the request body — it never calls the API —
 * but the SDK only exposes it as an instance method, so an instance is needed.
 * Deliberately not `stripe()`: that one throws without STRIPE_SECRET_KEY, and
 * webhook verification must not depend on an unrelated variable. The webhook
 * simulator caught exactly that, where a correctly signed event was rejected
 * because the API key happened to be absent.
 */
let verifier: Stripe | null = null;

function webhookVerifier(): Stripe {
  if (verifier) return verifier;
  verifier = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_unused_for_verification", {
    httpClient: Stripe.createFetchHttpClient(),
    telemetry: false,
  });
  return verifier;
}

/**
 * Verify a webhook signature.
 *
 * This is the security boundary of the whole payment flow: the webhook is what
 * marks an order paid, so an unverified body is an attacker marking their own
 * order paid. Stripe signs `<timestamp>.<raw body>` with the endpoint secret,
 * and the check includes a timestamp tolerance so a captured request cannot be
 * replayed later.
 *
 * The async variant is required — the synchronous one uses Node crypto, which
 * does not exist on Workers.
 */
export async function verifyWebhook(
  payload: string,
  signature: string | null
): Promise<Stripe.Event> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  if (!signature) throw new Error("Missing Stripe signature header");

  return webhookVerifier().webhooks.constructEventAsync(
    payload,
    signature,
    secret,
    undefined,
    Stripe.createSubtleCryptoProvider()
  );
}
