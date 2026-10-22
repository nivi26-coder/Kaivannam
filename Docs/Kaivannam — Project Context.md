# Kaivannam — Project Context

Oct 15, 2026 · @BK

## Instructions for the AI assistant

Paste this file at the start of a new AI conversation to restore full context, then follow these rules.

- I am building this project for learning AND as a potential real product or company.
- Explain the why behind code and decisions, not just the what.
- Use TypeScript, Next.js App Router, Tailwind CSS, and MongoDB Atlas + Mongoose.
- Design mobile-first; most Indian buyers and artists use phones.
- Stay within the current phase scope (see Current phase). Don't add features beyond it unless I ask.
- Always follow the coding rules, especially: never trust prices sent from the browser.
- For legal or tax steps, remind me to confirm with a CA or lawyer.
- Check the Progress section before suggesting next steps.

## Brand name

The working brand name is **Kaivannam (கைவண்ணம்)**, a Tamil word meaning "the artistry of the hand" or "handiwork." Tagline idea: *Handmade gifts, made just for you.*

| Name | Tamil | Meaning | Status |
| --- | --- | --- | --- |
| Kaivannam | கைவண்ணம் | Artistry of the hand | Chosen; no existing gift business found in a web search |
| Unakkaga | உனக்காக | For you | Backup; no existing gift business found |
| Ninaivu | நினைவு | Memory | Common word; harder to trademark |
| Parisu | பரிசு | Gift | Too generic alone; could work as "Parisu Studio" |
| Anbalippu | அன்பளிப்பு | Gift of love | Avoid: taken by Anbalippu.In (Chennai, corporate gifts, est. 2018) and a 1969 Tamil film |

A Tamil name fits a Tamil Nadu-first launch, which also simplifies GST for non-registered artists. Add an English tagline when expanding to other states.

Before committing:

- [ ] Pick one English spelling (Kaivannam vs Kaivanam) and secure the common variants
- [ ] Check .com and .in domain availability
- [ ] Check the Instagram handle
- [ ] Search the IP India public trademark database (Class 35 covers online marketplace services)
- [ ] Check MCA name availability when registering the company

## The idea and the problem

Kaivannam is a marketplace where Indian artists create profiles and sell handmade, personalized gifts such as resin art, custom portraits, embroidery hoops, hand-lettering and personalized hampers. Buyers browse artists, customize through structured forms, approve previews, and pay safely. The focus is modern custom gifts, not traditional handloom or ethnic wear.

Today these gifts are mostly sold through Instagram DMs and WhatsApp, which is also the real competition: free, familiar and direct.

| Who | Pain points today |
| --- | --- |
| Buyers | Paying advance to unknown Instagram accounts feels risky; no recourse if the artist disappears or the product doesn't match; hard to discover good artists; unreliable reviews; must DM many artists just to learn prices |
| Artists | Answering "price?" repeatedly; orders tracked in chats and notebooks; chasing balance payments; endless revision requests; overwhelmed during Diwali, Rakhi and Valentine's peaks |

## Market research

No dominant Indian platform serves modern custom gifts with artist profiles, structured personalization and held payments; that is the gap Kaivannam targets.

| Type | Examples | Notes |
| --- | --- | --- |
| Global | Etsy, Amazon Handmade, MakerPlace by Michaels | Etsy dominates globally |
| Indian government | India Handmade (Ministry of Textiles) | Zero commission; traditional handloom and crafts |
| Big platforms in India | Amazon.in Saheli and Karigar stores, Etsy | Generic; no custom-order workflow |
| Indian handmade marketplaces | Kreate, Artiztick, Handmade Gifts, AuthIndia, WorldArtCommunity | Mostly small; traditional or ready-made; about 10% commission typical |
| Made-to-order | Haathse (Kerala) | Artisan makes the product after the order |
| Art and commissions | ArtZolo, Exotic India Art | Fine art; not gift-focused |
| Single-artist sellers | Resin studios, Fabus Frames (portraits) | Potential sellers on Kaivannam |
| Failed | Craftsvilla | Wound down around 2019 after drifting from its artisan mission |

## Core features

The structured customization form and held payments are the two features that beat ordering over Instagram.

1. **Artist profiles**: portfolio, bio, city, verified badge, reviews only from real orders.
2. **Structured customization form**: per-product fields (text, image upload, select) with live price updates.
3. **Preview and approval**: artist uploads a mockup; buyer approves or requests changes; revision limit per product.
4. **Held payments**: buyer pays upfront; platform holds funds; released to the artist after delivery.
5. **"Deliver by" filter**: show only artists who can deliver before the buyer's date; artists set making time and can pause orders.
6. **Occasion-based browsing**: birthday, anniversary, wedding, baby, Rakhi, Diwali, Valentine's, Pongal.
7. **Artist order dashboard**: orders, deadlines and statuses, with WhatsApp notifications.
8. **Shipping integration**: one-tap pickup booking and automatic tracking.

## Tech stack

The stack is full-stack TypeScript on Next.js with MongoDB Atlas, chosen because flexible documents suit per-product custom fields.

| Layer | Choice | Phase |
| --- | --- | --- |
| Language | TypeScript | Demo |
| Framework | Next.js (App Router) | Demo |
| Styling | Tailwind CSS + shadcn/ui | Demo |
| Database | MongoDB Atlas (free M0 tier) | Demo |
| ODM | Mongoose | Demo |
| Scripts | tsx (seed scripts) | Demo |
| Hosting | Vercel | Demo |
| Auth | Auth.js or similar; phone OTP preferred in India | MVP |
| Image storage | Cloudinary or similar | MVP |
| Payments | Razorpay; Route for held and split payouts (needs separate activation and KYC, apply early) | MVP |
| Shipping | Shiprocket API | Growth |
| Notifications | WhatsApp Cloud API + email | Growth |
| Mobile | PWA first; React Native (Expo) later | Growth |

Use MongoDB transactions for any operation that touches money.

## Project structure

The repository is named `kaivannam` and follows the Next.js App Router layout.

```text
kaivannam/
  app/
    page.tsx                   home (occasions + featured artists)
    artists/[id]/page.tsx      artist profile
    products/[id]/page.tsx     product + customization form
    orders/[id]/page.tsx       order tracking + preview approval
    dashboard/page.tsx         artist dashboard
    actions/orders.ts          server actions (createOrder, etc.)
  components/
    ArtistCard.tsx
    ProductCard.tsx
    CustomizationForm.tsx      client component, live price
    OrderStatus.tsx
  lib/
    db.ts                      cached Mongoose connection
    pricing.ts                 calculatePrice (shared client + server)
  models/
    Artist.ts
    Product.ts
    Order.ts
  scripts/
    seed.ts                    demo data
  .env.local                   MONGODB_URI (never commit)
```

Create the project with:

```bash
npx create-next-app@latest kaivannam --typescript --tailwind --app
cd kaivannam
npx shadcn@latest init
npm install mongoose
npm install -D tsx
```

## Data model and order flow

Three collections cover the demo: Artist, Product and Order, with custom fields and previews embedded inside documents.

| Collection | Fields |
| --- | --- |
| Artist | name, bio, city, state, avatarUrl, categories\[\], makingTimeDays, isAcceptingOrders, isVerified, timestamps |
| Product | artistId (ref Artist), title, description, basePrice (whole rupees), images\[\], occasionTags\[\], maxRevisions (default 2), customFields\[\], timestamps |
| Order | buyerName, buyerPhone (no login in demo), artistId, productId, productSnapshot { title, basePrice }, inputs (Map of strings), totalPrice, deliverBy, status, previews\[\], timestamps |

Embedded sub-documents:

- **customFields\[\]** (inside Product, no \_id): key, label, type (text, image or select), required, options\[\]
- **options\[\]** (inside a custom field): value, label, priceModifier
- **previews\[\]** (inside Order): imageUrl, round, response (pending, approved or changes\_requested), comment, createdAt

Later additions: payment { gatewayOrderId, status, releasedAt }, shipment { courier, trackingId, status }, a Review collection, and a User collection with roles (buyer, artist, admin).

Order status flow:

```text
PLACED -> PAID (held) -> PREVIEW_SENT -> APPROVED -> IN_PRODUCTION
       -> SHIPPED -> DELIVERED -> PAYOUT_RELEASED (later)

PREVIEW_SENT -> REVISION_REQUESTED -> PREVIEW_SENT
Early stages -> CANCELLED (refund)
```

## Coding rules and lessons

The most important rule: the server always decides the price.

1. **Never trust prices from the browser.** The server recalculates totalPrice from the database using calculatePrice().
2. **Snapshot product data into orders** (title, basePrice) so later edits don't change past orders.
3. **Validate required custom fields on the server**, not only in the form.
4. **Reuse the database connection** through the cached connectDB(); Next.js hot reload otherwise opens many connections.
5. **Use `models.X || model("X", schema)`** to avoid "model already defined" errors.
6. **Serialize Mongo documents before passing them to client components**; ObjectIds and Dates aren't serializable. For the demo, `JSON.parse(JSON.stringify(doc))` is enough.
7. **Validate route IDs** with `isValidObjectId(id)` and call `notFound()` if invalid.
8. **Store prices as whole rupees (integers)**; Razorpay expects paise, so multiply by 100 when integrating.
9. **Keep `.env.local` out of git.**
10. **Atlas network access**: your own IP for development; 0.0.0.0/0 is needed for Vercel, so use a strong database password.

Seed the database with:

```bash
npx tsx --env-file=.env.local scripts/seed.ts
```

## Current phase: demo

The goal is a realistic, mobile-first demo with a real MongoDB database, built in 1 to 2 weeks, to show artists and buyers and collect feedback.

**In scope**

- Home page with occasions and featured artists
- Artist profile page
- Product page with customization form and live price
- Order creation (server action) leading to an order tracking page
- Preview approval UI (placeholder preview images are fine)
- Artist dashboard listing orders, deadlines, statuses, with a pause toggle
- Seed data with realistic Tamil Nadu artist names, real-looking photos and rupee prices

**Out of scope**

Real payments, login, real image uploads, shipping and notifications.

**Feedback plan**

- Show it to 8 to 10 artists and 8 to 10 buyers.
- Give each a task, for example "order a resin keychain with your friend's name for next Friday," and watch silently.
- Ask artists: Would you list here? What would stop you? What's missing compared with Instagram? Would you pay a 5 to 10% commission?
- Ask buyers: Would you trust this more than ordering from Instagram? Why or why not?
- Write down their exact words and look for patterns.

## Progress

All demo pages are built and tested against a local MongoDB (Oct 22, 2026); the next step is creating the Atlas cluster, running the seed script, and deploying to Vercel.

- [x] Market research (global and India)
- [x] Feature plan
- [x] Tech stack decided (Next.js + MongoDB/Mongoose)
- [x] Brand name chosen: Kaivannam
- [x] Database code: lib/db.ts, models (Artist, Product, Order), scripts/seed.ts, lib/pricing.ts, server actions
- [ ] Atlas cluster created and seed script run successfully
- [x] Product page + CustomizationForm with live price
- [x] Order tracking page + preview approval
- [x] Artist profile page
- [x] Home page
- [x] Artist dashboard
- [ ] Deploy to Vercel
- [ ] Collect feedback from artists and buyers

Build notes:

- Next.js 16 with Cache Components (needs Node 20.9+; the repo pins Node 22 in `.nvmrc`). Pages stream database content into a prerendered shell; `next build` doesn't need the database.
- Demo stand-ins: a simulated *Pay* button (PLACED → PAID), *Send preview* reuses a product photo, and photo fields save only the file name.
- The order snapshot also stores `imageUrl` and `maxRevisions`, so the revision limit can't change after ordering.
- Status changes use conditional updates (`updateOne({ _id, status: expected }, …)`) so double-clicks can't skip steps.
- Without `MONGODB_URI` the app runs on in-memory mock data (`lib/store/mock.ts`, data in `lib/demoData.ts`); a dark strip at the top says so. The seed script writes the same data and IDs to Atlas. Mock mode suits local demos only; on Vercel, connect Atlas first.

## Roadmap after the demo

After feedback, the MVP adds real accounts and payments; growth features come only once orders are flowing.

| Phase | What gets built |
| --- | --- |
| MVP (launch-ready) | Auth with buyer and artist roles, real image uploads, Razorpay payments (test then live), held payments via Razorpay Route, reviews, "deliver by" filter, occasion browsing, admin panel for artist verification and disputes, legal pages |
| Growth | Shiprocket, WhatsApp notifications, Instagram portfolio import, better search, Tamil and other regional languages, featured listings, mobile app |

## Company-building notes (India)

The order is: validate, build, then register when taking real money regularly. Confirm all GST, legal and company setup with a CA or lawyer before launch.

**Validation.** Run a manual pilot with 10 artists: an Instagram page or simple site, a Google Form, payment links and WhatsApp coordination. Target 30 to 50 orders.

**Legal entity.** Private Limited if aiming for investors or ESOPs; LLP is cheaper but not investor-friendly; sole proprietorship means personal liability.

**DPIIT Startup India recognition.** Free; the gateway to benefits such as the 80-IAC tax exemption (100% for 3 of 10 years, Pvt Ltd or LLP, separate application). Eligibility rules were updated on 4 February 2026, so check the portal.

**GST (shapes the launch strategy).**

- A marketplace is an e-commerce operator: it must register for GST regardless of turnover, collect 1% TCS and file GSTR-8 monthly.
- Since 1 October 2023, eligible small sellers can sell through e-commerce platforms without GST registration, but only within their own state.
- Many Instagram artists aren't GST-registered, so launch within Tamil Nadu first and help artists register as they grow.

**Consumer Protection (E-Commerce) Rules 2020.**

- Appoint a grievance officer and show their name and contact details on the platform.
- Acknowledge complaints within 48 hours and resolve them within one month.
- Display the legal name, headquarters address and customer care contact.
- The marketplace must ensure sellers comply; fake reviews are prohibited.

**Payments.** Don't hold buyers' money in your own bank account at scale; use the payment gateway's marketplace product.

**Also needed.** Terms of service, a privacy policy under India's data protection law, a refund policy for custom items, the domain, social handles and a trademark.

**Unit economics example.** A Rs 1,200 average order at 10% commission earns Rs 120; after about Rs 24 in gateway fees, roughly Rs 95 per order remains. Earning Rs 1 lakh a month needs over 1,000 orders a month.

**Key metrics.** Repeat buyers, artists bringing their own customers, on-time delivery rate and dispute rate.

**Go-to-market.** One category (resin keepsakes or portraits) in Tamil Nadu; personally recruit 30 to 50 Instagram artists; launch before a gifting season such as Pongal, Diwali or Valentine's; low or zero commission for early artists.

**Team and funding.** If I'm the technical founder, find a co-founder strong in artist relations and marketing. Bootstrap first; later incubators, the Startup India Seed Fund (through incubators) and angels, after traction.

## Open questions

- [ ] Launch category: resin keepsakes or custom portraits?
- [ ] Launch city within Tamil Nadu?
- [ ] Refund policy for custom items that can't be resold
- [ ] Dispute handling process
- [ ] Payout auto-release window after delivery (how many days?)
- [ ] Final English spelling of Kaivannam and domain availability
