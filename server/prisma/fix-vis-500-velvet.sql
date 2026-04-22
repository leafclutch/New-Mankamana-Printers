-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: VIS-500-VELVET — duplicate variants + quantity/pricing model
--
-- Problems fixed:
--   1. Legacy variant codes (any code NOT in V1-V6) left as is_active=true
--      → deactivated below; they no longer appear in the variant dropdown
--
--   2. Quantity option code '500_minus' is non-numeric.
--      The server computes total = unit_price × quantity.
--      Storing 669.00 as "total for 500 cards" then multiplying by user-entered
--      quantity produces a wildly wrong number.
--      Fix: rename to numeric code '500' → hasSingleQtyBase = true →
--      user enters multiples of 500 (500/1000/1500/2000/…) in a number input
--      with step = 500 and min = 500.
--
--   3. Prices corrected from total-batch values (669.00) to per-card unit prices
--      (1.338 NPR/card) so that total = unit_price × quantity works correctly:
--        500 cards  → 1.338 × 500  =  669.00 NPR  ✓
--       1000 cards  → 1.338 × 1000 = 1338.00 NPR  ✓
--       1500 cards  → 1.338 × 1500 = 2007.00 NPR  ✓
--       2000 cards  → 1.338 × 2000 = 2676.00 NPR  ✓
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── Step 1: Deactivate any variant codes that are NOT V1-V6 ─────────────────
-- (These are old legacy codes left over from a previous import)
UPDATE product_variants
SET    is_active = false
WHERE  product_id = (SELECT id FROM products WHERE product_code = 'VIS-500-VELVET')
  AND  variant_code NOT IN (
           'VIS-500-VELVET-V1','VIS-500-VELVET-V2','VIS-500-VELVET-V3',
           'VIS-500-VELVET-V4','VIS-500-VELVET-V5','VIS-500-VELVET-V6'
       );

-- ─── Step 2: Set min_quantity = 500 on all V1-V6 variants ────────────────────
UPDATE product_variants
SET    min_quantity = 500
WHERE  variant_code IN (
           'VIS-500-VELVET-V1','VIS-500-VELVET-V2','VIS-500-VELVET-V3',
           'VIS-500-VELVET-V4','VIS-500-VELVET-V5','VIS-500-VELVET-V6'
       );

-- ─── Step 3: Remove old '500_minus' option values from quantity groups ────────
-- (CASCADE won't help here; we need an explicit DELETE so we can re-insert '500')
DELETE FROM option_values
WHERE  group_id IN (
           SELECT og.id
           FROM   option_groups og
           JOIN   product_variants pv ON pv.id = og.variant_id
           WHERE  og.name = 'quantity'
             AND  pv.variant_code IN (
                      'VIS-500-VELVET-V1','VIS-500-VELVET-V2','VIS-500-VELVET-V3',
                      'VIS-500-VELVET-V4','VIS-500-VELVET-V5','VIS-500-VELVET-V6'
                  )
       )
  AND  code = '500_minus';

-- ─── Step 4: Insert numeric '500' option value into all quantity groups ───────
INSERT INTO option_values (group_id, code, label, display_order, is_active, image_url)
SELECT og.id, '500', '500', 0, true, NULL
FROM   option_groups og
JOIN   product_variants pv ON pv.id = og.variant_id
WHERE  og.name = 'quantity'
  AND  pv.variant_code IN (
           'VIS-500-VELVET-V1','VIS-500-VELVET-V2','VIS-500-VELVET-V3',
           'VIS-500-VELVET-V4','VIS-500-VELVET-V5','VIS-500-VELVET-V6'
       )
ON CONFLICT (group_id, code) DO UPDATE
    SET label = EXCLUDED.label, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- ─── Step 5: Upsert pricing rows → numeric combination_key + per-card price ──
-- Per-card unit prices:  669/500=1.338  789/500=1.578  989/500=1.978  1069/500=2.138
DELETE FROM variant_pricing
WHERE  variant_id IN (
           SELECT id FROM product_variants
           WHERE variant_code IN (
               'VIS-500-VELVET-V1','VIS-500-VELVET-V2','VIS-500-VELVET-V3',
               'VIS-500-VELVET-V4','VIS-500-VELVET-V5','VIS-500-VELVET-V6'
           )
       )
  AND  combination_key = 'quantity:500_minus';

INSERT INTO variant_pricing (variant_id, combination_key, selected_options, price, discount_type, discount_value, is_active)
VALUES
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V1'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.338, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V2'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.578, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V3'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.978, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V4'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.578, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V5'), 'quantity:500', '{"quantity":"500"}'::jsonb, 1.978, NULL, 0.00, true),
    ((SELECT id FROM product_variants WHERE variant_code = 'VIS-500-VELVET-V6'), 'quantity:500', '{"quantity":"500"}'::jsonb, 2.138, NULL, 0.00, true)
ON CONFLICT (variant_id, combination_key) DO UPDATE
SET
    selected_options = EXCLUDED.selected_options,
    price            = EXCLUDED.price,
    discount_type    = EXCLUDED.discount_type,
    discount_value   = EXCLUDED.discount_value,
    is_active        = EXCLUDED.is_active;

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT
    pv.variant_code,
    pv.variant_name,
    pv.is_active,
    pv.min_quantity,
    ov.code            AS qty_code,
    ov.label           AS qty_label,
    vpr.combination_key,
    vpr.price
FROM   product_variants pv
JOIN   products p          ON p.id = pv.product_id
LEFT JOIN option_groups og ON og.variant_id = pv.id AND og.name = 'quantity'
LEFT JOIN option_values ov ON ov.group_id = og.id
LEFT JOIN variant_pricing vpr ON vpr.variant_id = pv.id
WHERE  p.product_code = 'VIS-500-VELVET'
ORDER  BY pv.variant_code;

COMMIT;
