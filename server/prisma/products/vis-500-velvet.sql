-- ═══════════════════════════════════════════════════════════════════════════════
-- 500 GSM Velvet — 6 variants
--
--   Legacy ProductId → variant code (all ≤20 chars) → variant name
--     152 → VIS-500-VELVET-V1 : 500 GSM Velvet
--     157 → VIS-500-VELVET-V2 : 500 GSM Velvet + UV
--     159 → VIS-500-VELVET-V3 : 500 GSM Velvet + UV + Foil
--     160 → VIS-500-VELVET-V4 : 500 GSM Velvet + UV + Foil + Die Cut
--     223 → VIS-500-VELVET-V5 : 500 GSM Velvet + UV + Foil + Die Cut v2
--     276 → VIS-500-VELVET-V6 : 500 GSM Velvet + UV + Foil + Custom Die Cut
--
--   Assigned to existing "Visiting Card" group (e06c90c2).
--   Pricing dimension: quantity only → combination_key = "quantity:500"
--
--   Stored prices are unit_price (per card), not batch totals:
--     V1: 1.338    V4: 1.578
--     V2: 1.578    V5: 1.978
--     V3: 1.978    V6: 2.138
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── RE-STRUCTURING: uncomment if you need to re-run cleanly ─────────────────
-- DELETE FROM variant_pricing WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE product_code = 'VIS-500-VELVET'));
-- DELETE FROM option_groups     WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE product_code = 'VIS-500-VELVET'));
-- DELETE FROM product_variants  WHERE product_id = (SELECT id FROM products WHERE product_code = 'VIS-500-VELVET');
-- DELETE FROM products          WHERE product_code = 'VIS-500-VELVET';
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. PRODUCT
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO products (category_id, group_id, product_code, name, description, image_url, preview_images, production_days, is_active)
VALUES (
    'ec83231e-12f6-406e-a35c-4d39e623f2b2',
    'e06c90c2-0ab1-4806-86d0-4ad2972d1b4d',
    'VIS-500-VELVET',
    '500 GSM Velvet',
    '500 GSM velvet visiting card — available with UV, foil, and die-cut options',
    'https://hvvdnlsrwpenyulgfgsz.supabase.co/storage/v1/object/public/product-assets/visiting-card/500-gsm-velvet/thumb.jpeg',
    ARRAY[
        'https://hvvdnlsrwpenyulgfgsz.supabase.co/storage/v1/object/public/product-assets/visiting-card/500-gsm-velvet/preview-1.jpeg',
        'https://hvvdnlsrwpenyulgfgsz.supabase.co/storage/v1/object/public/product-assets/visiting-card/500-gsm-velvet/preview-2.jpeg'
    ],
    3,
    true
)
ON CONFLICT (product_code) DO UPDATE
    SET name            = EXCLUDED.name,
        description     = EXCLUDED.description,
        category_id     = EXCLUDED.category_id,
        group_id        = EXCLUDED.group_id,
        image_url       = EXCLUDED.image_url,
        preview_images  = EXCLUDED.preview_images,
        production_days = EXCLUDED.production_days,
        is_active       = EXCLUDED.is_active;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. VARIANTS  (codes kept to ≤20 chars using V1–V6 suffix)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO product_variants (product_id, variant_code, variant_name, min_quantity, is_active)
VALUES
    ((SELECT id FROM products WHERE product_code = 'VIS-500-VELVET'), 'VIS-500-VELVET-V1', '500 GSM Velvet',                              500, true),
    ((SELECT id FROM products WHERE product_code = 'VIS-500-VELVET'), 'VIS-500-VELVET-V2', '500 GSM Velvet + UV',                         500, true),
    ((SELECT id FROM products WHERE product_code = 'VIS-500-VELVET'), 'VIS-500-VELVET-V3', '500 GSM Velvet + UV + Foil',                  500, true),
    ((SELECT id FROM products WHERE product_code = 'VIS-500-VELVET'), 'VIS-500-VELVET-V4', '500 GSM Velvet + UV + Foil + Die Cut',        500, true),
    ((SELECT id FROM products WHERE product_code = 'VIS-500-VELVET'), 'VIS-500-VELVET-V5', '500 GSM Velvet + UV + Foil + Die Cut v2',     500, true),
    ((SELECT id FROM products WHERE product_code = 'VIS-500-VELVET'), 'VIS-500-VELVET-V6', '500 GSM Velvet + UV + Foil + Custom Die Cut', 500, true)
ON CONFLICT (variant_code) DO UPDATE
    SET variant_name = EXCLUDED.variant_name,
        min_quantity = EXCLUDED.min_quantity,
        is_active    = EXCLUDED.is_active;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. OPTION GROUPS
-- ═══════════════════════════════════════════════════════════════════════════════

-- V1: Velvet only (Quantity + Printing)
INSERT INTO option_groups (variant_id, name, label, display_order, is_required, is_pricing_dimension)
VALUES
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V1'), 'quantity', 'Quantity', 0, true,  true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V1'), 'printing', 'Printing', 1, true,  false)
ON CONFLICT (variant_id, name) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order,
        is_required = EXCLUDED.is_required, is_pricing_dimension = EXCLUDED.is_pricing_dimension;

-- V2: Velvet + UV (Quantity + Printing + Spot UV + Die Shape)
INSERT INTO option_groups (variant_id, name, label, display_order, is_required, is_pricing_dimension)
VALUES
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V2'), 'quantity',  'Quantity',  0, true,  true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V2'), 'printing',  'Printing',  1, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V2'), 'spot_uv',   'Spot UV',   2, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V2'), 'die_shape', 'Die Shape', 3, false, false)
ON CONFLICT (variant_id, name) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order,
        is_required = EXCLUDED.is_required, is_pricing_dimension = EXCLUDED.is_pricing_dimension;

-- V3: Velvet + UV + Foil (Quantity + Printing + Spot UV + Foil + Foil Color + Die Shape)
INSERT INTO option_groups (variant_id, name, label, display_order, is_required, is_pricing_dimension)
VALUES
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V3'), 'quantity',   'Quantity',   0, true,  true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V3'), 'printing',   'Printing',   1, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V3'), 'spot_uv',    'Spot UV',    2, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V3'), 'foil',       'Foil',       3, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V3'), 'foil_color', 'Foil Color', 4, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V3'), 'die_shape',  'Die Shape',  5, false, false)
ON CONFLICT (variant_id, name) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order,
        is_required = EXCLUDED.is_required, is_pricing_dimension = EXCLUDED.is_pricing_dimension;

-- V4: Velvet + UV + Foil + Die Cut (Quantity + Printing + Spot UV — no foil/foil color/die shape)
INSERT INTO option_groups (variant_id, name, label, display_order, is_required, is_pricing_dimension)
VALUES
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V4'), 'quantity', 'Quantity', 0, true, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V4'), 'printing', 'Printing', 1, true, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V4'), 'spot_uv',  'Spot UV',  2, true, false)
ON CONFLICT (variant_id, name) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order,
        is_required = EXCLUDED.is_required, is_pricing_dimension = EXCLUDED.is_pricing_dimension;

-- V5: Velvet + UV + Foil + Die Cut v2 (Quantity + Printing + Spot UV + Foil + Foil Color)
INSERT INTO option_groups (variant_id, name, label, display_order, is_required, is_pricing_dimension)
VALUES
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V5'), 'quantity',   'Quantity',   0, true, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V5'), 'printing',   'Printing',   1, true, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V5'), 'spot_uv',    'Spot UV',    2, true, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V5'), 'foil',       'Foil',       3, true, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V5'), 'foil_color', 'Foil Color', 4, true, false)
ON CONFLICT (variant_id, name) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order,
        is_required = EXCLUDED.is_required, is_pricing_dimension = EXCLUDED.is_pricing_dimension;

-- V6: Velvet + UV + Foil + Custom Die Cut (Quantity + Printing + Spot UV + Foil + Foil Color)
INSERT INTO option_groups (variant_id, name, label, display_order, is_required, is_pricing_dimension)
VALUES
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V6'), 'quantity',   'Quantity',   0, true, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V6'), 'printing',   'Printing',   1, true, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V6'), 'spot_uv',    'Spot UV',    2, true, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V6'), 'foil',       'Foil',       3, true, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V6'), 'foil_color', 'Foil Color', 4, true, false)
ON CONFLICT (variant_id, name) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order,
        is_required = EXCLUDED.is_required, is_pricing_dimension = EXCLUDED.is_pricing_dimension;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. OPTION VALUES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── V1: Quantity + Printing ─────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, '500', '500', 0, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-500-VELVET-V1' AND og.name = 'quantity'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('single', 'Single Side', 0), ('both', 'Both Side', 1)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V1' AND og.name = 'printing'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── V2: Quantity + Printing + Spot UV + Die Shape ────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, '500', '500', 0, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-500-VELVET-V2' AND og.name = 'quantity'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('single', 'Single Side', 0), ('both', 'Both Side', 1)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V2' AND og.name = 'printing'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('front', 'Front Side', 0), ('back', 'Back Side', 1),
    ('both', 'Both Side', 2), ('not_required', 'Not Required', 3)
) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V2' AND og.name = 'spot_uv'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, 'die_no_' || i, 'Die No. ' || i, i - 1, true, NULL
FROM generate_series(1, 36) AS i
JOIN option_groups og ON og.name = 'die_shape'
JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-500-VELVET-V2'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── V3: Quantity + Printing + Spot UV + Foil + Foil Color + Die Shape ────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, '500', '500', 0, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-500-VELVET-V3' AND og.name = 'quantity'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('single', 'Single Side', 0), ('both', 'Both Side', 1)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V3' AND og.name = 'printing'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('front', 'Front Side', 0), ('back', 'Back Side', 1),
    ('both', 'Both Side', 2), ('not_required', 'Not Required', 3)
) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V3' AND og.name = 'spot_uv'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('front', 'Front Side', 0), ('back', 'Back Side', 1), ('both', 'Both Side', 2)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V3' AND og.name = 'foil'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('gold','Gold',0),('silver','Silver',1),('red','Red',2),('green','Green',3),('blue','Blue',4)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V3' AND og.name = 'foil_color'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, 'die_no_' || i, 'Die No. ' || i, i - 1, true, NULL
FROM generate_series(1, 36) AS i
JOIN option_groups og ON og.name = 'die_shape'
JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-500-VELVET-V3'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── V4: Quantity + Printing + Spot UV (no foil, no die shape) ───────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, '500', '500', 0, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-500-VELVET-V4' AND og.name = 'quantity'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('single', 'Single Side', 0), ('both', 'Both Side', 1)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V4' AND og.name = 'printing'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- Note: no "Not Required" for V4 Spot UV per legacy data
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('front', 'Front Side', 0), ('back', 'Back Side', 1), ('both', 'Both Side', 2)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V4' AND og.name = 'spot_uv'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── V5: Quantity + Printing + Spot UV + Foil + Foil Color ────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, '500', '500', 0, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-500-VELVET-V5' AND og.name = 'quantity'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('single', 'Single Side', 0), ('both', 'Both Side', 1)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V5' AND og.name = 'printing'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('front', 'Front Side', 0), ('back', 'Back Side', 1),
    ('both', 'Both Side', 2), ('not_required', 'Not Required', 3)
) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V5' AND og.name = 'spot_uv'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('front', 'Front Side', 0), ('back', 'Back Side', 1), ('both', 'Both Side', 2)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V5' AND og.name = 'foil'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('gold','Gold',0),('silver','Silver',1),('red','Red',2),('green','Green',3),('blue','Blue',4)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V5' AND og.name = 'foil_color'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── V6: Quantity + Printing + Spot UV + Foil + Foil Color (Custom Die Cut) ───
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, '500', '500', 0, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-500-VELVET-V6' AND og.name = 'quantity'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('single', 'Single Side', 0), ('both', 'Both Side', 1)) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V6' AND og.name = 'printing'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('front', 'Front Side', 0), ('back', 'Back Side', 1),
    ('both', 'Both Side', 2), ('not_required', 'Not Required', 3)
) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V6' AND og.name = 'spot_uv'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- Foil for V6 includes "Not Required" (legacy ValueId 3852)
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('front', 'Front Side', 0), ('back', 'Back Side', 1),
    ('both', 'Both Side', 2), ('not_required', 'Not Required', 3)
) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-500-VELVET-V6' AND og.name = 'foil'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- Foil Color for V6: only Gold in legacy data (ValueId 3853)
-- Add Silver/Red/Green/Blue here if they are also applicable
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, 'gold', 'Gold', 0, true, NULL
FROM option_groups og JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-500-VELVET-V6' AND og.name = 'foil_color'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. VARIANT PRICING  (unit_price per card)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO variant_pricing (variant_id, combination_key, selected_options, price, discount_type, discount_value, is_active)
VALUES
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V1'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.338, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V2'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.578, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V3'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.978, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V4'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.578, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V5'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.978, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V6'), 'quantity:500', '{"quantity":"500"}'::jsonb, 2.138, NULL, 0.00, true)
ON CONFLICT (variant_id, combination_key) DO UPDATE
    SET selected_options = EXCLUDED.selected_options,
        price            = EXCLUDED.price,
        discount_type    = EXCLUDED.discount_type,
        discount_value   = EXCLUDED.discount_value,
        is_active        = EXCLUDED.is_active;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. VERIFY
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
    pg.name                AS "group",
    p.product_code,
    p.name                 AS product,
    pv.variant_code,
    pv.variant_name        AS variant,
    COUNT(DISTINCT og.id)  AS option_groups,
    COUNT(DISTINCT ov.id)  AS option_values,
    COUNT(DISTINCT vpr.id) AS pricing_rows
FROM products p
JOIN product_variants pv       ON pv.product_id = p.id
LEFT JOIN option_groups og     ON og.variant_id = pv.id
LEFT JOIN option_values ov     ON ov.group_id = og.id
LEFT JOIN variant_pricing vpr  ON vpr.variant_id = pv.id
LEFT JOIN product_groups pg    ON pg.id = p.group_id
WHERE p.product_code = 'VIS-500-VELVET'
GROUP BY pg.name, p.product_code, p.name, pv.variant_code, pv.variant_name
ORDER BY pv.variant_code;

COMMIT;
