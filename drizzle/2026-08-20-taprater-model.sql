-- ===========================================================
-- Tap Rater product model
-- A stand is one canonical product named after the action.
-- Size (A5/A4) x option (standard/branded/multilink) = variants.
-- Stand type: one per stand. Business uses: many per stand.
-- ===========================================================

CREATE TABLE IF NOT EXISTS stand_types (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_uses (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stands (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  stand_type_id integer NOT NULL REFERENCES stand_types(id),
  -- copy is driven by the destination, never by a Google fallback
  badge text NOT NULL DEFAULT '',
  destination_label text NOT NULL DEFAULT 'direct link',
  destination_kind text NOT NULL DEFAULT 'direct',
  printed_headline text NOT NULL DEFAULT '',
  headline_editable boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  -- three media slots
  main_image_url text,
  branded_image_url text,
  front_template_url text,
  -- SEO: auto-generated unless overridden here
  seo_title text,
  seo_description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stands_status_check CHECK (status IN ('draft','active')),
  CONSTRAINT stands_kind_check CHECK (destination_kind IN ('direct','multilink'))
);

CREATE TABLE IF NOT EXISTS stand_business_uses (
  stand_id integer NOT NULL REFERENCES stands(id) ON DELETE CASCADE,
  business_use_id integer NOT NULL REFERENCES business_uses(id) ON DELETE CASCADE,
  PRIMARY KEY (stand_id, business_use_id)
);

CREATE TABLE IF NOT EXISTS stand_variants (
  id serial PRIMARY KEY,
  stand_id integer NOT NULL REFERENCES stands(id) ON DELETE CASCADE,
  size text NOT NULL,
  option_code text NOT NULL,
  price_cents integer NOT NULL,
  monthly_cents integer NOT NULL DEFAULT 0,
  sku text,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT stand_variants_size_check CHECK (size IN ('a5','a4')),
  CONSTRAINT stand_variants_option_check
    CHECK (option_code IN ('standard_direct','branded_qr_direct','hosted_multilink')),
  CONSTRAINT stand_variants_unique UNIQUE (stand_id, size, option_code)
);

CREATE TABLE IF NOT EXISTS volume_tiers (
  id serial PRIMARY KEY,
  min_quantity integer NOT NULL UNIQUE,
  discount_percent integer NOT NULL,
  label text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS stands_status_idx ON stands (status);
CREATE INDEX IF NOT EXISTS stands_type_idx ON stands (stand_type_id);
CREATE INDEX IF NOT EXISTS stand_variants_stand_idx ON stand_variants (stand_id);
