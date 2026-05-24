-- Safe, non-destructive client tax identifier field.
-- Existing clients keep their data; old rows receive NULL until updated.

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS pan_vat_no TEXT;

ALTER TABLE registration_requests
ADD COLUMN IF NOT EXISTS pan_vat_no TEXT;
