-- ═══════════════════════════════════════════════════════════════════════════════
-- 800 GSM Kraft Paper — two variants
--   VIS-800-KRAFT-FOIL        : Kraft + Foil           (no die shape)
--   VIS-800-KRAFT-FOIL-DIECUT : Kraft + Foil + Die Cut (36 die shapes)
--
-- Assigned to the existing "Visiting Card" group (e06c90c2).
-- Pricing dimension: quantity only → combination_key = "quantity:<val>"
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── RE-STRUCTURING: uncomment if you need to re-run cleanly ─────────────────
-- DELETE FROM variant_pricing WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE product_code = 'VIS-800-KRAFT'));
-- DELETE FROM option_groups     WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE product_code = 'VIS-800-KRAFT'));
-- DELETE FROM product_variants  WHERE product_id = (SELECT id FROM products WHERE product_code = 'VIS-800-KRAFT');
-- DELETE FROM products          WHERE product_code = 'VIS-800-KRAFT';
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Product ───────────────────────────────────────────────────────────────
INSERT INTO products (category_id, group_id, product_code, name, description, image_url, preview_images, production_days, is_active)
VALUES (
    'ec83231e-12f6-406e-a35c-4d39e623f2b2',
    'e06c90c2-0ab1-4806-86d0-4ad2972d1b4d',
    'VIS-800-KRAFT',
    '800 GSM Kraft Paper',
    '800 GSM kraft paper with foil and optional die-cut',
    'https://hvvdnlsrwpenyulgfgsz.supabase.co/storage/v1/object/public/product-assets/visiting-card/800-gsm-kraft/thumb.jpeg',
    ARRAY[
        'https://hvvdnlsrwpenyulgfgsz.supabase.co/storage/v1/object/public/product-assets/visiting-card/800-gsm-kraft/preview-1.jpeg',
        'https://hvvdnlsrwpenyulgfgsz.supabase.co/storage/v1/object/public/product-assets/visiting-card/800-gsm-kraft/preview-2.jpeg'
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

-- ─── 2. Variants ──────────────────────────────────────────────────────────────
INSERT INTO product_variants (product_id, variant_code, variant_name, min_quantity, is_active)
VALUES
    (
        (SELECT id FROM products WHERE product_code = 'VIS-800-KRAFT'),
        'VIS-800-KRAFT-FOIL',
        '800 GSM Kraft + Foil',
        1, true
    ),
    (
        (SELECT id FROM products WHERE product_code = 'VIS-800-KRAFT'),
        'VIS-800-KRAFT-FOIL-DIECUT',
        '800 GSM Kraft + Foil + Die Cut',
        1, true
    )
ON CONFLICT (variant_code) DO UPDATE
    SET variant_name = EXCLUDED.variant_name,
        min_quantity = EXCLUDED.min_quantity,
        is_active    = EXCLUDED.is_active;

-- ─── 3. Option Groups ─────────────────────────────────────────────────────────
INSERT INTO option_groups (variant_id, name, label, display_order, is_required, is_pricing_dimension)
VALUES
    -- V1: Kraft + Foil
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL'), 'quantity',          'Quantity',          0, true,  true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL'), 'printing',          'Printing',          1, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL'), 'white_base',        'White Base',        2, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL'), 'foil',              'Foil',              3, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL'), 'foil_color',        'Foil Color',        4, false, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL'), 'packaging_privacy', 'Privacy Packaging', 5, true,  false),

    -- V2: Kraft + Foil + Die Cut
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL-DIECUT'), 'quantity',          'Quantity',          0, true,  true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL-DIECUT'), 'printing',          'Printing',          1, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL-DIECUT'), 'white_base',        'White Base',        2, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL-DIECUT'), 'foil',              'Foil',              3, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL-DIECUT'), 'foil_color',        'Foil Color',        4, false, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL-DIECUT'), 'die_shape',         'Die Shape',         5, false, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL-DIECUT'), 'packaging_privacy', 'Privacy Packaging', 6, true,  false)
ON CONFLICT (variant_id, name) DO UPDATE
    SET label                = EXCLUDED.label,
        display_order        = EXCLUDED.display_order,
        is_required          = EXCLUDED.is_required,
        is_pricing_dimension = EXCLUDED.is_pricing_dimension;

-- ═══════════════════════════════════════════════════════════════════════════════
-- OPTION VALUES  — must specify column names or positional mapping hits id/group_id wrong
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Quantity ─────────────────────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES ('500_minus', '500-', 0)) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-KRAFT-FOIL', 'VIS-800-KRAFT-FOIL-DIECUT')
  AND og.name = 'quantity'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Printing ─────────────────────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('single', 'Single Side', 0),
    ('both',   'Both Side',   1)
) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-KRAFT-FOIL', 'VIS-800-KRAFT-FOIL-DIECUT')
  AND og.name = 'printing'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── White Base ───────────────────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('front',        'Front',        0),
    ('back',         'Back',         1),
    ('both',         'Both',         2),
    ('not_required', 'Not Required', 3)
) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-KRAFT-FOIL', 'VIS-800-KRAFT-FOIL-DIECUT')
  AND og.name = 'white_base'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Foil ─────────────────────────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('front',        'Front',        0),
    ('back',         'Back',         1),
    ('both',         'Both',         2),
    ('not_required', 'Not Required', 3)
) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-KRAFT-FOIL', 'VIS-800-KRAFT-FOIL-DIECUT')
  AND og.name = 'foil'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Foil Color ───────────────────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('gold',   'Gold',   0),
    ('silver', 'Silver', 1),
    ('red',    'Red',    2),
    ('green',  'Green',  3),
    ('blue',   'Blue',   4)
) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-KRAFT-FOIL', 'VIS-800-KRAFT-FOIL-DIECUT')
  AND og.name = 'foil_color'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Privacy Packaging ────────────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('not_required', 'Not Required', 0),
    ('required',     'Required (+5)', 1)
) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-KRAFT-FOIL', 'VIS-800-KRAFT-FOIL-DIECUT')
  AND og.name = 'packaging_privacy'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Die Shape — V2 only (Die No. 1–36) ──────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, 'die_no_' || i, 'Die No. ' || i, i - 1, true, NULL
FROM generate_series(1, 36) AS i
JOIN option_groups og ON og.name = 'die_shape'
JOIN product_variants pv ON pv.id = og.variant_id
WHERE pv.variant_code = 'VIS-800-KRAFT-FOIL-DIECUT'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VARIANT PRICING
-- Prices are total order amounts (qty × price/pc), not per-piece rates.
-- V1 (Kraft+Foil):         500- → 2198.00 NPR
-- V2 (Kraft+Foil+DieKut):  500- → 2298.00 NPR
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO variant_pricing (variant_id, combination_key, selected_options, price, discount_type, discount_value, is_active)
VALUES
    (
        (SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL'),
        'quantity:500_minus',
        '{"quantity":"500_minus"}'::jsonb,
        2198.00, NULL, 0.00, true
    ),
    (
        (SELECT id FROM product_variants WHERE variant_code = 'VIS-800-KRAFT-FOIL-DIECUT'),
        'quantity:500_minus',
        '{"quantity":"500_minus"}'::jsonb,
        2298.00, NULL, 0.00, true
    )
ON CONFLICT (variant_id, combination_key) DO UPDATE
    SET selected_options = EXCLUDED.selected_options,
        price            = EXCLUDED.price,
        discount_type    = EXCLUDED.discount_type,
        discount_value   = EXCLUDED.discount_value,
        is_active        = EXCLUDED.is_active;

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT
    pg.name        AS "group",
    p.product_code,
    p.name         AS product,
    pv.variant_code,
    pv.variant_name AS variant,
    COUNT(vpr.id)  AS pricing_rows
FROM products p
JOIN product_variants pv      ON pv.product_id = p.id
LEFT JOIN variant_pricing vpr ON vpr.variant_id = pv.id
LEFT JOIN product_groups pg   ON pg.id = p.group_id
WHERE p.product_code = 'VIS-800-KRAFT'
GROUP BY pg.name, p.product_code, p.name, pv.variant_code, pv.variant_name
ORDER BY pv.variant_code;

COMMIT;
