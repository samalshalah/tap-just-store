/**
 * check-schema.mjs — fail loudly when the database is missing a column the
 * code selects.
 *
 * This exists because of a real outage: a column was added to the Drizzle
 * schema and to the local database, the migration was never run against
 * production, and every query that touched those tables threw. The read layer
 * catches errors and returns an empty list, so the site did not error — it
 * quietly showed an empty shop, which is worse.
 *
 *   node scripts/check-schema.mjs                 # uses DATABASE_URL
 *   node scripts/check-schema.mjs <connection>    # or an explicit one
 *
 * Exits non-zero and names the missing columns. Run it after every migration
 * and before trusting a deploy.
 */

import pg from "pg";

/** Column names the application selects, per table. Keep in sync with src/lib/schema. */
const EXPECTED = {
  stand_types: ["id", "slug", "name", "description", "hero_image_url", "sort_order", "created_at"],
  business_uses: ["id", "slug", "name", "description", "hero_image_url", "sort_order", "created_at"],
  stands: [
    "id", "slug", "name", "stand_type_id", "badge", "destination_label",
    "destination_kind", "printed_headline", "headline_editable", "description",
    "status", "main_image_url", "branded_image_url", "front_template_url",
    "seo_title", "seo_description", "sort_order", "created_at", "updated_at",
  ],
  stand_variants: [
    "id", "stand_id", "size", "option_code", "price_cents", "monthly_cents",
    "sku", "active",
  ],
  stand_business_uses: ["stand_id", "business_use_id"],
  volume_tiers: ["id", "min_quantity", "discount_percent", "label"],
  admin_login_attempts: ["id", "ip", "succeeded", "attempted_at"],
  orders: [
    "id", "confirmation_code", "customer_name", "customer_email",
    "customer_phone", "notes", "status", "total_price", "created_at",
    "updated_at",
    // Amounts are stored per component so a dispute or a tax filing can be
    // answered from the row rather than reconstructed.
    "subtotal_cents", "discount_cents", "discount_label", "shipping_cents",
    "tax_cents",
    "ship_name", "ship_line1", "ship_line2", "ship_city", "ship_state",
    "ship_postal_code", "ship_country",
    "payment_status", "stripe_payment_intent_id", "stripe_tax_calculation_id",
    "paid_at",
  ],
  order_items: [
    "id", "order_id", "stand_variant_id", "stand_name", "size", "option_code",
    "quantity", "price_cents",
    // What gets programmed and printed. Without these the production queue
    // cannot make the stand.
    "destination_url", "business_name", "logo_path",
  ],
};

/** Constraints and indexes that must exist, whatever the columns say. */
const EXPECTED_INDEXES = [
  "orders_confirmation_code_key",
  "orders_created_at_idx",
  "order_items_order_id_idx",
  "stands_status_sort_idx",
  "admin_login_attempts_ip_time_idx",
  "orders_status_idx",
  "orders_payment_status_idx",
  // The idempotency guarantee: one order per Stripe payment intent. Without
  // this a retried webhook is a duplicate order.
  "orders_payment_intent_key",
];

const connectionString = process.argv[2] || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No connection string. Pass one as an argument or set DATABASE_URL.");
  process.exit(2);
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
    ? undefined
    : { rejectUnauthorized: false },
});

await client.connect();

const { rows } = await client.query(
  `select table_name, column_name
     from information_schema.columns
    where table_schema = 'public'
      and table_name = ANY($1)`,
  [Object.keys(EXPECTED)]
);
const { rows: indexRows } = await client.query(
  `select indexname from pg_indexes where schemaname = 'public'`
);
await client.end();

const actual = new Map();
for (const row of rows) {
  if (!actual.has(row.table_name)) actual.set(row.table_name, new Set());
  actual.get(row.table_name).add(row.column_name);
}

const problems = [];
for (const [table, columns] of Object.entries(EXPECTED)) {
  const present = actual.get(table);
  if (!present) {
    problems.push(`${table}: table is missing entirely`);
    continue;
  }
  const missing = columns.filter((c) => !present.has(c));
  if (missing.length) problems.push(`${table}: missing ${missing.join(", ")}`);
}

const haveIndexes = new Set(indexRows.map((r) => r.indexname));
for (const name of EXPECTED_INDEXES) {
  if (!haveIndexes.has(name)) problems.push(`index ${name} is missing`);
}

if (problems.length) {
  console.error("Schema drift — the code selects columns this database does not have:\n");
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error("\nRun the outstanding files in drizzle/ against this database.");
  process.exit(1);
}

console.log(
  `✓ schema matches: ${Object.keys(EXPECTED).length} tables, all expected columns present, ` +
    `${EXPECTED_INDEXES.length} required indexes in place`
);
