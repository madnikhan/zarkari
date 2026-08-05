ALTER TABLE "cargo_box_items" ADD COLUMN IF NOT EXISTS "item_kind" text NOT NULL DEFAULT 'sample';
UPDATE "cargo_box_items"
SET "item_kind" = 'custom'
WHERE "bridal_order_id" IS NOT NULL AND ("item_kind" IS NULL OR "item_kind" = 'sample');
