# ZARKARI UK Launch Checklist

## Pre-launch (Shopify)

- [ ] Shopify UK store created with GBP currency
- [ ] Domain connected (`zarkari.co.uk`)
- [ ] Shopify Payments activated (cards, Apple Pay, Google Pay)
- [ ] UK VAT enabled (20%, prices include tax)
- [ ] Shipping zones configured (Royal Mail, DPD)
- [ ] Policies published (Returns, Privacy, Terms, Shipping)
- [ ] Collections created (lawn, pret, formal, unstitched, new-arrivals)
- [ ] Metafields created (`node scripts/shopify/setup-metafields.js`)
- [ ] Initial product catalog loaded (min. 10 products)
- [ ] Storefront API app created; tokens in `.env.local`
- [ ] Test order placed and fulfilled end-to-end

## Pre-launch (Storefront)

- [ ] Environment variables set in Vercel
- [ ] `npm run build` passes
- [ ] Deployed to Vercel with custom domain
- [ ] All pages load: home, collections, products, blog, lookbook, size guide
- [ ] Add to cart → Shopify checkout redirect works
- [ ] Mobile responsive on iOS and Android
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1

## Marketing & SEO

- [ ] Soro connected to Shopify blog
- [ ] GA4 property created and tracking verified
- [ ] Meta Pixel installed and firing (check Events Manager)
- [ ] TikTok Pixel installed
- [ ] Pinterest Tag installed
- [ ] Instagram Shopping catalog synced and approved
- [ ] Google Search Console domain verified
- [ ] Sitemap submitted: `https://zarkari.co.uk/sitemap.xml`

## Legal & Compliance

- [ ] Privacy Policy live at `/pages/privacy`
- [ ] Terms of Service live at `/pages/terms`
- [ ] Cookie consent banner working
- [ ] ICO registration considered (if required for your scale)
- [ ] Returns policy clearly stated (14-day UK consumer rights)

## Soft launch

1. Share with small group (friends, family, beta customers)
2. Monitor Shopify Admin → Analytics for first orders
3. Check GA4 for traffic and bounce rate
4. Review Soro's first published articles
5. Gather feedback on sizing, checkout, mobile UX

## Post-launch (Week 2+)

- [ ] Run Meta/TikTok retargeting ads to site visitors
- [ ] Post daily on Instagram and TikTok with product links
- [ ] Enable Klaviyo welcome and abandoned cart flows
- [ ] Plan Phase 2: Shopify Markets for EU/US expansion
