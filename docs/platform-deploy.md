# ZARKARI Platform Deployment

## Stack

| Service | Purpose | Free tier |
|---------|---------|-----------|
| Vercel | Next.js hosting | Hobby |
| Neon | PostgreSQL | Free |
| Cloudflare R2 | File storage | Free |
| Stripe | Retail checkout | Pay per transaction |
| Soro | SEO blog webhook | Paid |
| Meta | Pixel + catalog | Paid |

## Environment Variables

Set in Vercel project settings:

```env
DATABASE_URL=postgresql://...@neon.tech/zarkari
NEXT_PUBLIC_SITE_URL=https://zarkari.co.uk
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
SORO_WEBHOOK_SECRET=your-soro-secret
NEXT_PUBLIC_META_PIXEL_ID=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=zarkari-files
```

## Deploy Steps

1. Push repo to GitHub and import into Vercel.
2. Set root directory to repo root; build command `npm run build`.
3. Run `npm run db:push` locally with production `DATABASE_URL` to migrate schema.
4. Point `zarkari.co.uk` DNS to Vercel.
5. Configure Stripe webhook to `https://zarkari.co.uk/api/stripe/webhook`.
6. Point Meta catalog to `https://zarkari.co.uk/api/meta/catalog.xml`.
7. Configure Soro publish webhook to `POST https://zarkari.co.uk/api/soro/publish`.

## Demo Mode

Without `DATABASE_URL`, the app runs on in-memory seed data. Demo logins:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@zarkari.co.uk | demo123 |
| Staff | staff@zarkari.co.uk | demo123 |
| Supplier | supplier@zarkari.co.uk | demo123 |

Customer portal demo: order `BR-2026-0152`, phone `447700900123`.

## Local Development

```bash
unset NPM_CONFIG_PREFIX
npm install
npm run dev
```

Open http://localhost:3000
