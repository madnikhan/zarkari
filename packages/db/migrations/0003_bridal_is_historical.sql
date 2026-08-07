ALTER TABLE "bridal_orders" ADD COLUMN IF NOT EXISTS "is_historical" boolean NOT NULL DEFAULT false;
