CREATE TYPE "public"."bridal_status" AS ENUM('order_created', 'sent_to_supplier', 'supplier_rejected', 'order_received', 'fabric_preparation', 'embroidery', 'stitching', 'finishing', 'packing', 'shipping', 'delivered_to_shop', 'redesign_in_progress', 'ready_for_collection', 'collected', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."timeline_event_type" AS ENUM('order_created', 'sent_to_supplier', 'accepted', 'rejected', 'production_started', 'redesign_requested', 'cancelled', 'refunded', 'completed', 'ready_for_collection', 'received_at_shop', 'collected', 'stage_update');--> statement-breakpoint
CREATE TYPE "public"."cash_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."cash_payment_method" AS ENUM('cash', 'online');--> statement-breakpoint
CREATE TYPE "public"."cash_transaction_source" AS ENUM('manual', 'auto');--> statement-breakpoint
CREATE TYPE "public"."cash_transaction_type" AS ENUM('order_deposit', 'order_collection', 'ready_made_sale', 'other_in', 'supplier_payment', 'business_expense', 'refund', 'partner_loan', 'other_out');--> statement-breakpoint
CREATE TYPE "public"."supplier_ledger_type" AS ENUM('bill', 'stock', 'payment');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'staff', 'supplier');--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content_html" text NOT NULL,
	"image_url" text,
	"published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"author" text DEFAULT 'ZARKARI',
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "shop_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bridal_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"supplier_id" uuid,
	"status" "bridal_status" DEFAULT 'order_created' NOT NULL,
	"booking_date" timestamp DEFAULT now() NOT NULL,
	"delivery_date" timestamp NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"deposit_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"remaining_balance" numeric(10, 2) NOT NULL,
	"dress_type" text,
	"colour" text,
	"size" text,
	"comments" text,
	"customisation_notes" text,
	"files_unlocked_at" timestamp,
	"supplier_locked" boolean DEFAULT false NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bridal_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "bridal_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"sender_type" text NOT NULL,
	"sender_name" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"thread_id" uuid,
	"href" text,
	"title" text NOT NULL,
	"body" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_cancellations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"comment" text,
	"cancelled_by_role" text NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"collection_date" timestamp NOT NULL,
	"balance_paid" boolean NOT NULL,
	"amount_paid" numeric(10, 2),
	"outstanding_amount" numeric(10, 2),
	"alteration_notes" text,
	"staff_comments" text,
	"collected_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_collections_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "order_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"category" text NOT NULL,
	"file_name" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text,
	"uploaded_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_redesigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"comment" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"comment" text,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text,
	"refund_date" timestamp NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_timeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"event_type" timeline_event_type NOT NULL,
	"comment" text,
	"metadata" jsonb,
	"performed_by_id" uuid,
	"performed_by_name" text,
	"performed_by_role" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"delivery_date" timestamp NOT NULL,
	"bill_number" text NOT NULL,
	"courier_name" text,
	"tracking_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_completions_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "cash_opening_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_date" date NOT NULL,
	"cash_in_hand" numeric(12, 2) NOT NULL,
	"online_bank" numeric(12, 2) NOT NULL,
	"set_by_user_id" uuid,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"direction" "cash_direction" NOT NULL,
	"type" "cash_transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" "cash_payment_method" NOT NULL,
	"reference" text,
	"description" text,
	"business_date" date NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"order_id" uuid,
	"retail_order_id" uuid,
	"supplier_id" uuid,
	"source" "cash_transaction_source" DEFAULT 'manual' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text,
	"category" text DEFAULT 'general',
	"uploaded_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "collections_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "product_collections" (
	"product_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	CONSTRAINT "product_collections_product_id_collection_id_pk" PRIMARY KEY("product_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"title" text NOT NULL,
	"sku" text,
	"price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"inventory_qty" integer DEFAULT 0 NOT NULL,
	"options" jsonb
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"description_html" text,
	"fabric" text,
	"tags" text[],
	"featured_image_url" text,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "retail_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"title" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"measurements" jsonb
);
--> statement-breakpoint
CREATE TABLE "retail_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"stripe_session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "retail_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "social_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"body" text NOT NULL,
	"external_message_id" text,
	"sent_by_user_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"external_thread_id" text,
	"contact_name" text,
	"contact_handle" text,
	"contact_phone" text,
	"subject" text,
	"status" text DEFAULT 'open' NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"last_message_preview" text,
	"assigned_to_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"type" "supplier_ledger_type" NOT NULL,
	"order_id" uuid,
	"description" text,
	"bill_number" text,
	"amount_gbp" numeric(12, 2) DEFAULT '0' NOT NULL,
	"amount_pkr" numeric(14, 2) DEFAULT '0' NOT NULL,
	"exchange_rate" numeric(12, 4),
	"business_date" date NOT NULL,
	"cash_transaction_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"supplier_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cash_opening_balances_date_idx" ON "cash_opening_balances" USING btree ("business_date");--> statement-breakpoint
CREATE UNIQUE INDEX "social_threads_platform_external_idx" ON "social_threads" USING btree ("platform","external_thread_id");