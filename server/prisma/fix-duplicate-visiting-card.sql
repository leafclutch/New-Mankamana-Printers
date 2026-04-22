-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Deactivate duplicate / empty "Visiting Card" product group
--
-- The canonical Visiting Card group is e06c90c2-0ab1-4806-86d0-4ad2972d1b4d.
-- All products (VIS-500-VELVET, VIS-800-KRAFT, VIS-800-MATTE, VIS-800-MATTE-TEXTURE)
-- are assigned to this group.  Any other group whose name contains "visiting"
-- has zero active products and shows as a dead card on the services page.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1 — Preview (run this first, no writes)
SELECT
    pg.id,
    pg.group_code,
    pg.name,
    pg.is_active,
    COUNT(p.id) AS active_product_count
FROM product_groups pg
LEFT JOIN products p ON p.group_id = pg.id AND p.is_active = true
GROUP BY pg.id, pg.group_code, pg.name, pg.is_active
ORDER BY pg.created_at;

-- Step 2 — Deactivate every active "Visiting Card"-like group except the canonical one
UPDATE product_groups
SET    is_active = false,
       updated_at = NOW()
WHERE  id        <> 'e06c90c2-0ab1-4806-86d0-4ad2972d1b4d'
  AND  LOWER(name) LIKE '%visiting%'
  AND  is_active = true;

-- Step 3 — Verify: should now show exactly one active visiting-card group
SELECT id, group_code, name, is_active
FROM   product_groups
WHERE  LOWER(name) LIKE '%visiting%'
ORDER BY is_active DESC, created_at;
