-- Run this in the Supabase SQL Editor to add the missing columns

ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa_10th NUMERIC(4, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS percentage_12th NUMERIC(5, 2) DEFAULT 0.00;

-- Reload schema cache to instantly apply changes
NOTIFY pgrst, 'reload schema';
