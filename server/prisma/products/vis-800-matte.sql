-- ═══════════════════════════════════════════════════════════════════════════════
-- 800 GSM + Matte — two variants
--   VIS-800-MATTE-UV-FOIL        : UV + Foil           (no die shape)
--   VIS-800-MATTE-UV-FOIL-DIECUT : UV + Foil + Die-Cut (36 die shapes)
--
-- Assigned to the existing "Visiting Card" product group.
-- Pricing dimension: quantity
-- combination_key format: "quantity:<val>"
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── RE-STRUCTURING: uncomment if you need to re-run cleanly ─────────────────
-- DELETE FROM variant_pricing WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE product_code = 'VIS-800-MATTE'));
-- DELETE FROM option_groups     WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = (SELECT id FROM products WHERE product_code = 'VIS-800-MATTE'));
-- DELETE FROM product_variants  WHERE product_id = (SELECT id FROM products WHERE product_code = 'VIS-800-MATTE');
-- DELETE FROM products          WHERE product_code = 'VIS-800-MATTE';
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. (category already exists — no insert needed) ─────────────────────────

-- ─── 2. Product — assigned to existing "Visiting Card" group ─────────────────
-- category_id = ec83231e  (Visiting Card category)
-- group_id    = e06c90c2  (Visiting Card group, confirmed from products table)
INSERT INTO products (category_id, group_id, product_code, name, description, image_url, preview_images, production_days, is_active)
VALUES (
    'ec83231e-12f6-406e-a35c-4d39e623f2b2',
    'e06c90c2-0ab1-4806-86d0-4ad2972d1b4d',
    'VIS-800-MATTE',
    '800 GSM + Matte',
    '800 GSM matte with UV/Foil options and optional die-cut variant',
    NULL,
    ARRAY[]::text[],
    3,
    true
)
ON CONFLICT (product_code) DO UPDATE
    SET name            = EXCLUDED.name,
        description     = EXCLUDED.description,
        category_id     = EXCLUDED.category_id,
        group_id        = EXCLUDED.group_id,
        production_days = EXCLUDED.production_days,
        is_active       = EXCLUDED.is_active;

-- ─── 3. Variants ──────────────────────────────────────────────────────────────
INSERT INTO product_variants (product_id, variant_code, variant_name, min_quantity, is_active)
VALUES
    (
        (SELECT id FROM products WHERE product_code = 'VIS-800-MATTE'),
        'VIS-800-MATTE-UV-FOIL',
        '800 GSM + Matte + UV + Foil',
        1,
        true
    ),
    (
        (SELECT id FROM products WHERE product_code = 'VIS-800-MATTE'),
        'VIS-800-MATTE-UV-FOIL-DIECUT',
        '800 GSM + Matte + UV + Foil + Die-Cut',
        1,
        true
    )
ON CONFLICT (variant_code) DO UPDATE
    SET variant_name = EXCLUDED.variant_name,
        min_quantity = EXCLUDED.min_quantity,
        is_active    = EXCLUDED.is_active;

-- ─── 4. Option Groups ─────────────────────────────────────────────────────────
-- quantity is the pricing dimension.

INSERT INTO option_groups (variant_id, name, label, display_order, is_required, is_pricing_dimension)
VALUES
    -- V1: UV + Foil (no die shape)
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL'), 'quantity',           'Quantity',           0, true,  true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL'), 'printing',           'Printing',           1, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL'), 'spot_uv',            'Spot UV',            2, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL'), 'foil',               'Foil',               3, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL'), 'foil_color',         'Foil Color',         4, false, false),

    -- V2: UV + Foil + Die-Cut (has die shape)
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL-DIECUT'), 'quantity',          'Quantity',           0, true,  true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL-DIECUT'), 'printing',          'Printing',           1, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL-DIECUT'), 'spot_uv',           'Spot UV',            2, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL-DIECUT'), 'foil',              'Foil',               3, true,  false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL-DIECUT'), 'foil_color',        'Foil Color',         4, false, false),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL-DIECUT'), 'die_shape',         'Die Shape',          5, false, false)
ON CONFLICT (variant_id, name) DO UPDATE
    SET label                = EXCLUDED.label,
        display_order        = EXCLUDED.display_order,
        is_required          = EXCLUDED.is_required,
        is_pricing_dimension = EXCLUDED.is_pricing_dimension;

-- ═══════════════════════════════════════════════════════════════════════════════
-- OPTION VALUES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Quantity (both variants) ─────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('500_minus', '500-', 0)
) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-MATTE-UV-FOIL', 'VIS-800-MATTE-UV-FOIL-DIECUT')
  AND og.name = 'quantity'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Printing (both variants) ─────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('single_side', 'Single Side', 0),
    ('both_side',   'Both Side',   1)
) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-MATTE-UV-FOIL', 'VIS-800-MATTE-UV-FOIL-DIECUT')
  AND og.name = 'printing'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Spot UV (both variants) ──────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('front_side', 'Front Side', 0),
    ('back_side',  'Back Side',  1),
    ('both_side',  'Both Side',  2),
    ('not_required', 'Not Required', 3)
) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-MATTE-UV-FOIL', 'VIS-800-MATTE-UV-FOIL-DIECUT')
  AND og.name = 'spot_uv'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Foil (both variants) ─────────────────────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('front_side',   'Front Side',   0),
    ('back_side',    'Back Side',    1),
    ('both_side',    'Both Side',    2),
    ('not_required', 'Not Required', 3)
) AS v(code, label, display_order)
WHERE pv.variant_code IN ('VIS-800-MATTE-UV-FOIL', 'VIS-800-MATTE-UV-FOIL-DIECUT')
  AND og.name = 'foil'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Foil Color (both variants) ───────────────────────────────────────────────
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
WHERE pv.variant_code IN ('VIS-800-MATTE-UV-FOIL', 'VIS-800-MATTE-UV-FOIL-DIECUT')
  AND og.name = 'foil_color'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Die Shape — V2 only (Die No. 1–36) ──────────────────────────────────────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, v.code, v.label, v.display_order, true, NULL
FROM option_groups og
JOIN product_variants pv ON pv.id = og.variant_id
CROSS JOIN (VALUES
    ('die_no_1',  'Die No. 1',  0),
    ('die_no_2',  'Die No. 2',  1),
    ('die_no_3',  'Die No. 3',  2),
    ('die_no_4',  'Die No. 4',  3),
    ('die_no_5',  'Die No. 5',  4),
    ('die_no_6',  'Die No. 6',  5),
    ('die_no_7',  'Die No. 7',  6),
    ('die_no_8',  'Die No. 8',  7),
    ('die_no_9',  'Die No. 9',  8),
    ('die_no_10', 'Die No. 10', 9),
    ('die_no_11', 'Die No. 11', 10),
    ('die_no_12', 'Die No. 12', 11),
    ('die_no_13', 'Die No. 13', 12),
    ('die_no_14', 'Die No. 14', 13),
    ('die_no_15', 'Die No. 15', 14),
    ('die_no_16', 'Die No. 16', 15),
    ('die_no_17', 'Die No. 17', 16),
    ('die_no_18', 'Die No. 18', 17),
    ('die_no_19', 'Die No. 19', 18),
    ('die_no_20', 'Die No. 20', 19),
    ('die_no_21', 'Die No. 21', 20),
    ('die_no_22', 'Die No. 22', 21),
    ('die_no_23', 'Die No. 23', 22),
    ('die_no_24', 'Die No. 24', 23),
    ('die_no_25', 'Die No. 25', 24),
    ('die_no_26', 'Die No. 26', 25),
    ('die_no_27', 'Die No. 27', 26),
    ('die_no_28', 'Die No. 28', 27),
    ('die_no_29', 'Die No. 29', 28),
    ('die_no_30', 'Die No. 30', 29),
    ('die_no_31', 'Die No. 31', 30),
    ('die_no_32', 'Die No. 32', 31),
    ('die_no_33', 'Die No. 33', 32),
    ('die_no_34', 'Die No. 34', 33),
    ('die_no_35', 'Die No. 35', 34),
    ('die_no_36', 'Die No. 36', 35)
) AS v(code, label, display_order)
WHERE pv.variant_code = 'VIS-800-MATTE-UV-FOIL-DIECUT'
  AND og.name = 'die_shape'
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VARIANT PRICING
-- combination_key dimension: quantity
--
-- V1 (UV+Foil, no die):    500- = 2198.00
-- V2 (UV+Foil+Die-Cut):    500- = 2298.00
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO variant_pricing (variant_id, combination_key, selected_options, price, discount_type, discount_value, is_active)
VALUES
    (
        (SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL'),
        'quantity:500_minus',
        '{"quantity":"500_minus"}'::jsonb,
        2198.00, NULL, 0.00, true
    ),
    (
        (SELECT id FROM product_variants WHERE variant_code = 'VIS-800-MATTE-UV-FOIL-DIECUT'),
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
    pg.name                   AS "group",
    p.product_code,
    p.name                    AS product,
    pv.variant_code,
    pv.variant_name           AS variant,
    COUNT(vpr.id)             AS pricing_rows
FROM products p
JOIN product_variants pv      ON pv.product_id = p.id
LEFT JOIN variant_pricing vpr ON vpr.variant_id = pv.id
LEFT JOIN product_groups pg   ON pg.id = p.group_id
WHERE p.product_code = 'VIS-800-MATTE'
GROUP BY pg.name, p.product_code, p.name, pv.variant_code, pv.variant_name
ORDER BY pv.variant_code;

COMMIT;
