# Firebase setup (live orders + push)

ZARKARI uses Firebase for **live customer order updates**, **staff notification badges**, and **web push** — while keeping PostgreSQL (Neon) as the system of record.

## 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. Enable **Authentication** → Sign-in method → allow custom tokens (default).
3. Enable **Cloud Firestore** in production mode (rules deployed separately).
4. Enable **Cloud Messaging**.

## 2. Web app config

Project settings → Your apps → Add web app. Copy values into `.env`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## 3. VAPID key (web push)

Project settings → Cloud Messaging → Web Push certificates → Generate key pair:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

## 4. Service account (server)

Project settings → Service accounts → Generate new private key. Set:

```env
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

On Vercel, paste the private key with literal `\n` newlines or use multiline env if supported.

## 5. Firestore security rules

Deploy [firestore.rules](../firestore.rules) from the repo root:

```bash
firebase deploy --only firestore:rules
```

Rules allow:
- Staff (`admin` / `supplier` custom claims): read `live_orders` and `staff_inbox`
- Customers: read only their order (`orderId` claim from OTP session)

All writes go through the Next.js server (Admin SDK), not client writes.

## 6. Data model (mirror)

| Collection | Purpose |
|------------|---------|
| `live_orders/{orderId}` | Status, label, delivery date |
| `live_orders/{orderId}/messages/{id}` | Customer ↔ staff chat mirror |
| `staff_inbox/shared` | Unread notification counter for admin bell |

Postgres remains authoritative; Firestore is updated after each successful API write.

## 7. Local testing

1. Set all Firebase env vars in `apps/web/.env.local`.
2. `npm run dev` from repo root.
3. Log in as staff → allow notifications when prompted.
4. Open `/my-order`, verify with demo order → allow notifications.
5. Post a staff message on an order → customer portal should update without refresh.

Without Firebase env vars, the app falls back to Postgres-only (no live listeners; bell polls every 60s).

## 8. Production checklist

- [ ] All `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_ADMIN_*` set on Vercel
- [ ] Firestore rules deployed
- [ ] Neon `DATABASE_URL` uses **pooler** hostname for serverless
- [ ] `npm run db:push` run after pulling schema changes (indexes + `device_tokens`)
