# Meta & WhatsApp Social Inbox Setup

This guide connects ZARKARI's admin **Social Inbox** to Facebook Messenger, Instagram DMs, and WhatsApp Business Cloud API.

## Overview

| Channel | Webhook | Reply from admin |
|---------|---------|------------------|
| Facebook Messenger | `POST /api/webhooks/meta` | Yes — Graph API |
| Instagram DMs | `POST /api/webhooks/meta` | Yes — Graph API |
| WhatsApp Business | `POST /api/webhooks/whatsapp` | Yes — Cloud API |
| TikTok / other | Manual "Log inquiry" in `/admin/inbox` | Internal note only |

Production webhook URLs (replace with your domain):

- Meta: `https://zarkari.co.uk/api/webhooks/meta`
- WhatsApp: `https://zarkari.co.uk/api/webhooks/whatsapp`

Webhooks require **public HTTPS**. Local development cannot receive Meta webhooks unless you use a tunnel (e.g. Cloudflare) and set `NEXT_PUBLIC_SITE_URL` accordingly.

## 1. Create a Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com) and create an app (type: **Business**).
2. Add products:
   - **Messenger** — for Facebook Page messages
   - **Instagram** — enable Instagram Messaging (Page-linked Professional account)
   - **WhatsApp** — Cloud API
3. In **Business Settings**, connect your Facebook Page and Instagram Professional account.

## 2. Webhook subscription

### Messenger + Instagram

1. In the app → **Messenger** → **Settings** → Webhooks → **Add Callback URL**:
   - URL: `https://zarkari.co.uk/api/webhooks/meta`
   - Verify token: same value as `META_VERIFY_TOKEN` in Vercel
2. Subscribe your Page to fields: `messages`, `messaging_postbacks` (messages is required).
3. For Instagram: **Instagram** → **Configuration** → connect the same webhook URL and subscribe to `messages`.

### WhatsApp

1. **WhatsApp** → **Configuration** → Webhook:
   - URL: `https://zarkari.co.uk/api/webhooks/whatsapp`
   - Verify token: `WHATSAPP_VERIFY_TOKEN` (can match `META_VERIFY_TOKEN`)
2. Subscribe to the `messages` field.

Meta sends a `GET` request with `hub.mode=subscribe` to verify; ZARKARI responds with the challenge when the verify token matches.

## 3. Access tokens

Generate a **Page access token** with permissions:

- `pages_messaging`
- `pages_manage_metadata`
- `instagram_manage_messages` (for Instagram DMs)

Set in Vercel:

```env
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_VERIFY_TOKEN=choose_a_random_string
META_PAGE_ACCESS_TOKEN=page_access_token

WHATSAPP_PHONE_NUMBER_ID=from_whatsapp_manager
WHATSAPP_ACCESS_TOKEN=system_user_or_whatsapp_token
WHATSAPP_VERIFY_TOKEN=same_as_meta_or_separate
```

`META_APP_SECRET` is used to validate `X-Hub-Signature-256` on incoming webhooks in production.

## 4. App review (production)

For messages from customers who are **not** app admins/testers, Meta requires **App Review** approval for:

- `pages_messaging`
- `instagram_manage_messages`

Until approved, only test users and Page roles can trigger inbox messages.

WhatsApp Cloud API typically works in production once the business number is verified and the webhook is subscribed.

## 5. Database

Run Drizzle push after deploying schema changes:

```bash
npm run db:push
```

Tables: `social_threads`, `social_messages`.

Without `DATABASE_URL`, the inbox uses in-memory demo data (resets on server restart).

## 6. Admin usage

1. Open **Admin → Inbox** (`/admin/inbox`).
2. Filter by platform or unread.
3. Click a thread to read and reply.
4. For TikTok/Pinterest/email/walk-in: use **Log inquiry**.
5. Dashboard shows unread counts; notification bell links to new threads.

## 7. Troubleshooting

| Issue | Check |
|-------|--------|
| Webhook verify fails | `META_VERIFY_TOKEN` / `WHATSAPP_VERIFY_TOKEN` match Meta dashboard exactly |
| No inbound messages | Page subscribed to webhook; app has messaging permissions |
| Signature 403 in production | `META_APP_SECRET` set correctly |
| Reply fails | `META_PAGE_ACCESS_TOKEN` valid; 24-hour messaging window for Messenger/IG |
| WhatsApp reply fails | `WHATSAPP_PHONE_NUMBER_ID` + token; customer must have messaged first |

## Related env vars

- `NEXT_PUBLIC_WHATSAPP_NUMBER` — storefront click-to-chat link (unchanged)
- `DATABASE_URL` — Neon PostgreSQL for persistent inbox
- `NEXT_PUBLIC_SITE_URL` — must match production domain for absolute URLs
