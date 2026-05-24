-- Set the platform-wide production/delivery estimate to 7 days.
-- Run this once against production after deploying the Prisma schema default.

ALTER TABLE products
  ALTER COLUMN production_days SET DEFAULT 7;

UPDATE products
SET production_days = 7;
