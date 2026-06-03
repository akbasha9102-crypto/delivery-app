ALTER TABLE items ADD COLUMN IF NOT EXISTS item_status TEXT DEFAULT 'available';
UPDATE items SET item_status = CASE WHEN is_available THEN 'available' ELSE 'hidden' END WHERE item_status IS NULL OR item_status = 'available';
