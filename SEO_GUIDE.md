# 🔍 SEO Action Guide — The Atelier

Goal: Rank #1 on Google for **"The Atelier Nepal"** and **"The Atelier Kathmandu"** within 60-90 days.

---

## ✅ What's already done (technical SEO — auto-applied)

The following are now live on your site after this commit:

- **Optimized title tags** on all 12 public pages, mentioning "Kathmandu" and "Nepal"
- **Detailed meta descriptions** (150-160 chars) with location keywords
- **Keywords meta** (helps Bing/Yandex; ignored by Google but no harm)
- **Open Graph tags** — link previews on WhatsApp, Instagram DMs, Facebook, LinkedIn
- **Twitter Card tags** — beautiful preview when shared on X
- **Canonical URLs** — prevents duplicate-content penalties
- **Geographic meta tags** — `geo.region: NP-3`, `geo.position: 27.7172;85.3240` (Kathmandu)
- **JSON-LD structured data** (Schema.org) on key pages:
  - Homepage: `ClothingStore` + `WebSite` schema with sitelinks search box
  - About: `AboutPage`
  - Contact: `ContactPage` with phone, email, address
  - Collection: `CollectionPage`
  - Product detail: dynamic `Product` schema with price, currency (NPR), availability
- **`sitemap.xml`** at `/sitemap.xml` listing all 11 public pages
- **`robots.txt`** at `/robots.txt` blocking admin pages from being indexed

After this code deploys, every page tells Google clearly:
- Who you are (The Atelier)
- Where you are (Kathmandu, Nepal)
- What you sell (luxury ready-to-wear, custom embroidery, designer clothing)
- Price range and currency (NPR)

---

## 🚀 What YOU need to do (off-page SEO)

These are NOT in the code — they're things you must do yourself in various services. **In priority order:**

### 1. Submit to Google Search Console (15 min) — 🔴 CRITICAL
This tells Google your site exists. Without this, Google may take months to find you organically.

**Steps:**
1. Go to https://search.google.com/search-console
2. Sign in with your Google account
3. Click "Add property" → choose "URL prefix"
4. Enter: `https://theatelier-ta.com/`
5. Verify ownership (easiest method: HTML meta tag — Google will give you a code, paste it into `<head>` of `index.html`)
6. Once verified, go to **Sitemaps** in left sidebar
7. Enter: `sitemap.xml`
8. Click Submit

Within 1-2 days, Google starts crawling all your pages.

### 2. Create Google Business Profile (15 min) — 🔴 CRITICAL for local SEO
This is **the single highest-impact thing you can do** for "near me" and local searches.

**Steps:**
1. Go to https://www.google.com/business/
2. Sign in
3. Add your business: **The Atelier**
4. Category: **Clothing Store** (also add: Boutique, Fashion Designer)
5. Address: Your Kathmandu address
6. Phone: +977-9742590718
7. Website: https://theatelier-ta.com/
8. Verify (Google sends a postcard or calls you)
9. Once verified, fill in:
   - Business hours
   - Photos (storefront, interior, products) — at least 10 high-quality photos
   - Description (use phrases like "luxury fashion Kathmandu", "designer clothing Nepal")

After verification, your business appears in Google Maps + the side panel when someone searches "The Atelier Nepal".

### 3. Set up Bing Webmaster Tools (10 min)
Same as Google Search Console but for Bing/Yahoo.

**Steps:**
1. Go to https://www.bing.com/webmasters
2. Sign in
3. Add site: `https://theatelier-ta.com/`
4. Submit `sitemap.xml`

### 4. Update social profiles to link your website (5 min each)

Make sure these all link to https://theatelier-ta.com/:
- Instagram bio
- Facebook page "Website" field
- TikTok bio
- LinkedIn (if you have a business profile)

### 5. Build backlinks (ongoing — 1 hour/week)

Backlinks from real Nepali sites are the #1 ranking factor for competitive terms. Outreach plan:

**Easy wins:**
- Get listed on **NepalShops.com**, **HamroBazar**, **Daraz** (even with one product) — they have authority and link to you
- Submit to local directories: **NepalYellowPages.com**, **NepalTradeInfo**

**High-impact wins:**
- Reach out to fashion bloggers/influencers (DM on Instagram). Offer one piece in exchange for an Instagram post + blog feature with link
- Pitch to: **ECS Nepal**, **The Kathmandu Post fashion section**, **WAVE Magazine**, **Boss Magazine Nepal**
- Get featured on **Nepali fashion week** if possible

**Worth knowing:**
- One link from a real Nepali fashion site = worth more than 100 directory links
- A single feature in **The Kathmandu Post** could put you on page 1 within weeks

### 6. Encourage Google reviews (ongoing)

Once your Google Business Profile is verified:
- Add a "Leave a Review" link on `contactUs.html` and in your delivery emails
- After successful delivery, message customers via WhatsApp asking for a Google review
- 5-10 genuine 5-star reviews = massive ranking boost for local searches

### 7. Post consistently on Instagram (ongoing)

Google now indexes Instagram posts heavily. Tips:
- Tag location: **Kathmandu, Nepal**
- Use these hashtags consistently: **#TheAtelierNepal #TheAtelierKathmandu #LuxuryFashionNepal #KathmanduFashion**
- Always have your website link in bio
- Post at least 3x/week

---

## 📈 Realistic timeline expectations

**Week 1-2:**
- Google indexes your site after Search Console submission
- Google Business Profile starts appearing in local searches
- "site:theatelier-ta.com" shows your indexed pages

**Month 1-2:**
- You appear on page 1-2 for "The Atelier Kathmandu"
- Google Business Profile drives local "near me" traffic
- First few backlinks (if you've done outreach) start counting

**Month 2-3:**
- **Top 3 for "The Atelier Nepal"** — ACHIEVABLE
- **Top 3 for "The Atelier Kathmandu"** — ACHIEVABLE
- Top 10 for "luxury clothing Nepal"

**Month 4-6 (with consistent backlink building):**
- Top 1-3 for "The Atelier Nepal"
- Top 5 for "luxury fashion Kathmandu"
- Featured snippets possible for niche queries

**Year 1-2 (long game):**
- First page for just "The Atelier" (competing with global brands)

---

## 🔍 How to check your progress

**Once a week, run these searches in incognito mode:**

1. `site:theatelier-ta.com` — shows how many pages Google has indexed (should grow weekly)
2. `"The Atelier" Nepal` — your target rank
3. `"The Atelier" Kathmandu` — your target rank
4. `luxury clothing Nepal` — broader market
5. `theatelier-ta.com` — should be #1 immediately

**Tools:**
- **Google Search Console** — shows actual queries people use to find you
- **Google Analytics 4** (free) — track visitors, behavior, conversions
- **Ahrefs Webmaster Tools** (free tier) — backlink monitoring

---

## ⚠️ What NOT to do (SEO sins that hurt rankings)

- **Don't buy backlinks** — Google penalizes this and it can permanently damage your domain
- **Don't keyword-stuff** product descriptions with "luxury Nepal Kathmandu fashion clothing buy"
- **Don't copy-paste competitor descriptions** — duplicate content kills rankings
- **Don't auto-translate to other languages** without proper hreflang tags
- **Don't use spammy meta keywords** — caused penalties in past

---

## 🎯 30-day priority checklist

Print this and tick as you go:

- [ ] Verify domain in Google Search Console
- [ ] Submit sitemap.xml in Search Console
- [ ] Create + verify Google Business Profile
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Update Instagram bio with website link
- [ ] Update Facebook page with website link
- [ ] Reach out to 5 Nepali fashion bloggers for collaboration
- [ ] Get listed on Daraz / HamroBazar
- [ ] Add Google review link on contact page
- [ ] Ask 5 happy customers for Google reviews via WhatsApp
- [ ] Post 12 Instagram posts using #TheAtelierNepal #TheAtelierKathmandu
- [ ] Pitch one editorial feature to a Nepali fashion publication

After 30 days of this, you'll see your search rankings start climbing.

---

Need help with any of these steps? Tell Claude what you're stuck on.
