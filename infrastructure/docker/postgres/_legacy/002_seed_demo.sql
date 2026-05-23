-- Demo seed for local integration (runs only on fresh Postgres volume init).
-- Idempotent: skips when demo org already present.

INSERT INTO organizations (id, legal_name, country_code, region_code)
SELECT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'VENEXT Demo Supplier Collective',
  'SN',
  'dakar'
WHERE NOT EXISTS (
  SELECT 1
  FROM organizations
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

INSERT INTO organizations (id, legal_name, country_code, region_code)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'VENEXT Demo Retail Network',
  'SN',
  'thies'
WHERE NOT EXISTS (
  SELECT 1
  FROM organizations
  WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

INSERT INTO users (id, email, phone, locale)
SELECT '11111111-1111-1111-1111-111111111111',
  'demo.operator@venext.local',
  '+22100000001',
  'fr'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111111');

INSERT INTO users (id, email, phone, locale)
SELECT '22222222-2222-2222-2222-222222222222',
  'demo.buyer@venext.local',
  '+22100000002',
  'fr'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '22222222-2222-2222-2222-222222222222');

INSERT INTO user_organization_facets (user_id, organization_id, facets)
SELECT '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  ARRAY['WHOLESALER_A', 'COMMERCIAL_OPERATOR']::text[]
WHERE NOT EXISTS (
  SELECT 1
  FROM user_organization_facets
  WHERE user_id = '11111111-1111-1111-1111-111111111111'
    AND organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

INSERT INTO user_organization_facets (user_id, organization_id, facets)
SELECT '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  ARRAY['RETAILER']::text[]
WHERE NOT EXISTS (
  SELECT 1
  FROM user_organization_facets
  WHERE user_id = '22222222-2222-2222-2222-222222222222'
    AND organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

INSERT INTO relationships (
    id,
    from_organization_id,
    to_organization_id,
    edge_kind,
    lifecycle,
    trust_score
  )
SELECT 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'SUPPLY',
  'ACTIVE',
  0.82
WHERE NOT EXISTS (
  SELECT 1
  FROM relationships
  WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

INSERT INTO catalogs (id, owner_organization_id, name)
SELECT 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Demo relational catalog'
WHERE NOT EXISTS (SELECT 1 FROM catalogs WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd');

INSERT INTO products (id, sku, owner_organization_id, base_metadata)
SELECT 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'DEMO-SKU-001',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '{"label":"Demo staple SKU","uom":"carton"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

INSERT INTO catalog_products (catalog_id, product_id)
SELECT 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
WHERE NOT EXISTS (
  SELECT 1
  FROM catalog_products
  WHERE catalog_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
    AND product_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

INSERT INTO product_visibility (id, product_id, relationship_id, visibility)
SELECT 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '{"mode":"relationship_scoped"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1
  FROM product_visibility
  WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

INSERT INTO feature_flags (flag_key, scope_type, scope_value, enabled, priority)
SELECT 'wallet', 'global', NULL, TRUE, 1
WHERE NOT EXISTS (
  SELECT 1
  FROM feature_flags
  WHERE flag_key = 'wallet'
    AND scope_type = 'global'
    AND scope_value IS NULL
);

INSERT INTO feature_flags (flag_key, scope_type, scope_value, enabled, priority)
SELECT 'ai', 'country', 'SN', TRUE, 5
WHERE NOT EXISTS (
  SELECT 1
  FROM feature_flags
  WHERE flag_key = 'ai'
    AND scope_type = 'country'
    AND scope_value = 'SN'
);

INSERT INTO feature_flags (flag_key, scope_type, scope_value, enabled, priority)
SELECT 'wallet', 'role_facet', 'RETAILER', FALSE, 50
WHERE NOT EXISTS (
  SELECT 1
  FROM feature_flags
  WHERE flag_key = 'wallet'
    AND scope_type = 'role_facet'
    AND scope_value = 'RETAILER'
);
