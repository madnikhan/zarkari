# Social Media & Analytics Setup

## Environment variables

Add pixel IDs to `apps/web/.env.local`:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
NEXT_PUBLIC_TIKTOK_PIXEL_ID=XXXXXXXXXX
NEXT_PUBLIC_PINTEREST_TAG_ID=XXXXXXXXXX
NEXT_PUBLIC_WHATSAPP_NUMBER=44XXXXXXXXXX
```

Pixels are loaded via `src/components/analytics/Analytics.tsx` and only fire when IDs are set.

## Google Analytics 4

1. Create property at [analytics.google.com](https://analytics.google.com)
2. Data stream: Web → `https://zarkari.co.uk`
3. Copy Measurement ID (G-XXXXXXXXXX)
4. Enable enhanced measurement (scrolls, outbound clicks, site search)

## Meta Pixel (Facebook + Instagram)

1. [Meta Events Manager](https://business.facebook.com/events_manager) → Create Pixel
2. Copy Pixel ID to `NEXT_PUBLIC_META_PIXEL_ID`
3. Enable **Conversions API (CAPI)** for server-side tracking (recommended for iOS 14+)

## TikTok Pixel

1. [TikTok Ads Manager](https://ads.tiktok.com) → Assets → Events → Create Pixel
2. Copy Pixel ID to `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

## Pinterest Tag

1. [Pinterest Business](https://business.pinterest.com) → Ads → Conversions → Create tag
2. Copy Tag ID to `NEXT_PUBLIC_PINTEREST_TAG_ID`

## WhatsApp Business

1. Set up WhatsApp Business account
2. Add UK number to `NEXT_PUBLIC_WHATSAPP_NUMBER` (format: `447XXXXXXXXX`, no +)
3. Floating button appears in footer automatically

## GDPR / Cookie consent

`CookieConsent` component shows a UK GDPR-compliant banner on first visit:

- **Accept All** — enables analytics and marketing cookies
- **Essential Only** — disables optional tracking

Consent preference is stored in `localStorage` (`zarkari-cookie-consent`).

For full GDPR compliance, also:
- Publish Privacy Policy at `/pages/privacy`
- Register with ICO if processing personal data at scale (UK requirement for businesses)

## Conversion events to track

| Event | Platform | Trigger |
|-------|----------|---------|
| PageView | All | Every page load |
| ViewContent | Meta, TikTok | Product page view |
| AddToCart | Meta, TikTok, GA4 | Add to bag click |
| InitiateCheckout | Meta, TikTok | Checkout redirect |
| Purchase | Meta, TikTok, GA4, Pinterest | Order confirmation page |
