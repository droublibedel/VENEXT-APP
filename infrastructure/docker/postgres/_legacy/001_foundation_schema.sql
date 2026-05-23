-- VENEXT foundation schema — scalable tables, no business logic procedures
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_name TEXT NOT NULL,
  country_code CHAR(2),
  region_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_organization_facets (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  facets TEXT[] NOT NULL,
  PRIMARY KEY (user_id, organization_id)
);

CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_organization_id UUID NOT NULL REFERENCES organizations (id),
  to_organization_id UUID NOT NULL REFERENCES organizations (id),
  edge_kind TEXT NOT NULL,
  lifecycle TEXT NOT NULL,
  trust_score NUMERIC(6, 3),
  catalog_scope_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_organization_id, to_organization_id, edge_kind)
);

CREATE TABLE relationship_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_organization_id UUID NOT NULL REFERENCES organizations (id),
  to_organization_id UUID REFERENCES organizations (id),
  invitee_contact_hash TEXT,
  status TEXT NOT NULL,
  channel TEXT NOT NULL,
  otp_challenge_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_organization_id UUID NOT NULL REFERENCES organizations (id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT,
  owner_organization_id UUID NOT NULL REFERENCES organizations (id),
  base_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog_products (
  catalog_id UUID NOT NULL REFERENCES catalogs (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  PRIMARY KEY (catalog_id, product_id)
);

CREATE TABLE product_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  relationship_id UUID NOT NULL REFERENCES relationships (id) ON DELETE CASCADE,
  visibility JSONB NOT NULL DEFAULT '{}',
  UNIQUE (product_id, relationship_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_organization_id UUID NOT NULL REFERENCES organizations (id),
  seller_organization_id UUID NOT NULL REFERENCES organizations (id),
  relationship_id UUID REFERENCES relationships (id),
  status TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  terms JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL,
  sender_user_id UUID REFERENCES users (id),
  context JSONB NOT NULL DEFAULT '{}',
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations (id),
  currency TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, currency)
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets (id),
  amount NUMERIC(24, 6) NOT NULL,
  direction TEXT NOT NULL,
  reference JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE geo_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations (id),
  signal_type TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  payload JSONB NOT NULL DEFAULT '{}',
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE industrial_poles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations (id),
  pole_type TEXT NOT NULL,
  site_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  scope_value TEXT,
  enabled BOOLEAN NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_flags_lookup ON feature_flags (flag_key, scope_type, scope_value);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users (id),
  organization_id UUID REFERENCES organizations (id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sync_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES users (id),
  last_vector JSONB NOT NULL DEFAULT '{}',
  network_quality TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
