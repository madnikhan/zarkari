# Soro SEO Integration for ZARKARI

[Soro](https://trysoro.com/) automates keyword research, article writing, and daily publishing to your Shopify blog.

## One-time setup

### 1. Create a Soro account

1. Go to [trysoro.com](https://trysoro.com/) and sign up (~$39–99/month)
2. Choose the plan that includes daily publishing

### 2. Connect Shopify

1. In Soro dashboard, click **Add Website**
2. Enter your store URL: `https://zarkari.co.uk` (or your domain)
3. Select **Shopify** as the CMS platform
4. Authorize Soro to access your Shopify store (OAuth)
5. Select the blog to publish to: **News** (handle: `news`)

### 3. Configure brand voice

1. Soro will scan your existing site content
2. Add brand keywords: Pakistani clothing, lawn suits, desi fashion, UK, women's wear
3. Set tone: Elegant, heritage luxury, approachable

### 4. Target keywords (examples)

Soro will discover these automatically, but you can seed:

- Pakistani lawn suits UK
- desi formal wear London
- unstitched suit delivery UK
- Pakistani pret wear online
- Eid outfit ideas UK
- Asian size guide UK clothing
- Pakistani wedding dress UK

## Daily workflow (automated)

```
Soro researches keywords
    → Writes SEO-optimized article
    → Adds meta title, description, internal links
    → Publishes to Shopify blog (handle: news)
    → Article appears at zarkari.co.uk/blog/[slug]
```

The client does nothing daily. Optional: review new posts in **Shopify Admin → Blog posts**.

## How articles appear on the storefront

The Next.js storefront fetches blog articles via Shopify Storefront API:

- Blog listing: `/blog`
- Individual article: `/blog/[handle]`

Soro-published articles appear automatically — no code changes needed.

## Editing or removing Soro articles

1. **Shopify Admin → Online Store → Blog posts**
2. Click any article to edit title, content, or SEO fields
3. To remove: Delete the post in Shopify Admin

## Monitoring performance

- **Google Search Console**: Connect your domain to track rankings
- **Soro dashboard**: View impressions, clicks, and published articles
- **GA4**: Track blog traffic via `NEXT_PUBLIC_GA_MEASUREMENT_ID`

## Best practices

- Let Soro run for 30+ days before evaluating SEO impact
- Manually review the first 5–10 articles for brand voice accuracy
- Add internal links to product/collection pages in high-performing articles
- Pair blog content with social posts (Instagram, TikTok) linking to articles
