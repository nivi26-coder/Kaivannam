# Kaivannam — Project Context

Oct 15, 2026 · @BK · updated Nov 20, 2026 for Phase 1

## Instructions for the AI assistant

Paste this file at the start of a new AI conversation to restore full context, then follow these rules.

- I am building this project for learning AND as a potential real product or company.
- Explain the why behind code and decisions, not just the what.
- `Docs/PRD.md` is the product source of truth. `Docs/Kaivannam — Phase 1 Requirements and Tech Tasks.md` is the build plan (requirements, decisions, task IDs).
- Use TypeScript, Next.js App Router, Tailwind CSS + shadcn/ui, and Supabase (Postgres, Phone Auth, Storage, Realtime), per the PRD.
- Design mobile-first; most Indian buyers and creators use phones.
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

A Tamil name fits a Tamil Nadu-first launch, which also simplifies GST for non-registered artists. The PRD targets pan-India from Phase 1, so add an English tagline early, and see the GST notes for the state restriction on unregistered creators.

Before committing:

- [ ] Pick one English spelling (Kaivannam vs Kaivanam) and secure the common variants
- [ ] Check .com and .in domain availability
- [ ] Check the Instagram handle
- [ ] Search the IP India public trademark database (Class 35 covers online marketplace services)
- [ ] Check MCA name availability when registering the company

## The idea and the problem

Kaivannam is a marketplace where Indian artists create profiles and sell handmade, personalized gifts such as resin art, custom portraits, embroidery hoops, hand-lettering and personalized hampers. Buyers browse artists, customize through structured forms, approve previews, and pay safely. The focus is modern custom gifts, not traditional handloom or ethnic wear.

Today these gifts are mostly sold through Instagram DMs and WhatsApp, which is also the real competition: free, familiar and direct.

**Strategy (from the PRD): "Come for the tool, stay for the network."** Phase 1 is not a marketplace. It's a *Smart Order Link* that creators put in their Instagram bio (`kaivannam.in/<handle>`): buyers configure the gift, pay by UPI in protected milestones, and approve designs in an order room. Once creators have completed orders and verified portfolios, Phase 3 aggregates them into a public pan-India marketplace.

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

Phase 1 features (PRD §3, §7). The configurator and milestone payments are what beat ordering over Instagram.

1. **Creator storefront link**: `kaivannam.in/<handle>` with profile and products, shared from Instagram or WhatsApp.
2. **Dynamic product configurator**: base price and production days, option groups (material, size, effort, add-ons) that change price and days, live total, reference photos.
3. **Pincode delivery check**: serviceability, shipping estimate and delivery date from Shiprocket.
4. **Two checkout paths**: a paid design mockup first (₹99–₹199, credited to the order), or a direct order.
5. **Milestone payments with escrow**: material advance, then balance + shipping after the buyer approves finished photos; held by Razorpay Route and released when non-refundable.
6. **Order room**: realtime chat, watermarked mockups, revision counter, progress photos.
7. **One-tap shipping**: Shiprocket label and pickup, automatic tracking.
8. **WhatsApp notifications** for every step.
9. **Payouts and disputes**: automatic release after the dispute window, minus commission and taxes.

Later phases: verified galleries, creator analytics, GST/TCS ledger export (Phase 2); public homepage, search, occasion and budget filters, reviews (Phase 3).

## Tech stack

Full-stack TypeScript on Next.js with Supabase, per the PRD. The demo used MongoDB; Phase 1 moves to Supabase Postgres behind the existing repository layer (decision D1 in the Phase 1 doc).

| Layer | Choice | Phase |
| --- | --- | --- |
| Language | TypeScript | All |
| Framework | Next.js 16 (App Router), mobile-first PWA | Phase 1 |
| Styling | Tailwind CSS + shadcn/ui | Phase 1 |
| Database | Supabase Postgres (JSONB for option schemas and snapshots), Row Level Security | Phase 1 |
| Auth | Supabase Phone Auth (OTP); SMS needs DLT registration, or WhatsApp OTP | Phase 1 |
| Files | Supabase Storage (private buckets, signed URLs) | Phase 1 |
| Chat | Supabase Realtime | Phase 1 |
| Payments | Razorpay Route (or Cashfree Easy Split): UPI, held transfers, prepaid only; built last, behind a test gateway until then | Phase 1 (final milestone) |
| Shipping | Shiprocket API: serviceability, AWB, labels, tracking webhooks | Phase 1 |
| Notifications | WhatsApp Business API via a BSP (Interakt, AiSensy or MSG91) | Phase 1 |
| Hosting | Vercel Pro + Supabase Pro (paid plans needed for commercial use and backups) | Phase 1 |
| Tests | Vitest (unit), Playwright (end to end) | All |
| Mobile app | React Native (Expo) | Later |

Money that moves goes through one Postgres transaction (a database function), and payment events are confirmed only by signed webhooks.

## Project structure

The repository is named `kaivannam`. All code is in `src/`, split into layers so it can grow into a full store (cart, payments, admin) without a rewrite. `AGENTS.md` lists what goes where; `Docs/Kaivannam — Architecture.md` explains why.

```text
kaivannam/
  src/
    app/                       routes only (thin pages)
      (storefront)/            /, /artists/[id], /products/[id], /orders/[id]
      (seller)/dashboard/      artist dashboard
    features/                  UI + Server Actions per business area
      catalog/ checkout/ orders/ seller/
    server/
      services/                use cases: placeOrder, payOrder, sendPreview…
      repositories/            storage: mongo/ and mock/ today; Phase 1 adds supabase/ and drops mongo/
      db/                      connection + Mongoose models (replaced by supabase/migrations in Phase 1)
      queries.ts               reads for pages
      demo-data.ts             demo data (mock mode + seed)
    domain/                    pure business rules: pricing, validation, order status, delivery dates
    components/                shared UI (ui/, layout/, common/)
    lib/                       generic helpers (IST dates, ₹ formatting, phone)
    config/                    site constants, environment variables
  scripts/seed.ts              writes the demo data into Atlas
  .env.local                   secrets and keys (never commit)
```

A change flows form → Server Action (thin) → service (the rules) → repository (the storage). Business rules have unit tests (`npm test`).

Phase 1 adds `supabase/migrations/`, Supabase repositories, `src/server/integrations/` (Razorpay, Shiprocket, WhatsApp), webhook and cron routes, and new feature folders; the layout is in section 7.6 of the Phase 1 doc. Setup steps are in `README.md`.

## Data model and order flow

Phase 1 uses the PostgreSQL schema in PRD §5 (`users`, `creators`, `products`, `orders`, `payment_milestones`, `payout_ledger`, `order_messages`) plus the additions in section 7.3 of the Phase 1 doc: product weight and revision limit, full shipping address, snapshots, Shiprocket and Razorpay ids, `webhook_events`, `audit_log`. Amounts are integer paise.

Order status flow (PRD statuses plus `ADVANCE_PENDING` and `MOCKUP_SENT`):

```text
Path A: MOCKUP_PENDING -> MOCKUP_PAID -> MOCKUP_SENT -> MOCKUP_APPROVED -> ADVANCE_PAID
        (MOCKUP_SENT -> MOCKUP_PAID on each revision request, up to the limit)
Path B: ADVANCE_PENDING -> ADVANCE_PAID

ADVANCE_PAID -> IN_PRODUCTION -> READY_TO_SHIP -> BALANCE_PAID -> SHIPPED -> DELIVERED
READY_TO_SHIP -> IN_PRODUCTION (buyer asks for changes)
DELIVERED -> DISPUTED (within the dispute window)
Before IN_PRODUCTION -> CANCELLED (refund per policy)
```

Each payment is released to the creator when it becomes non-refundable: the mockup fee on first upload, the advance at `IN_PRODUCTION`, the balance after the dispute window.

## Coding rules and lessons

The most important rule: the server always decides the price.

1. **Never trust prices from the browser.** The server recalculates every amount (item total, advance, balance, fees) from the database with the domain money rules.
2. **Snapshot product data into orders** (title, chosen options with prices and days, revision limit, advance %, commission rate) so later edits don't change past orders.
3. **Validate on the server** with the same domain functions the form uses.
4. **Store money as integer paise.** Round half-up to the paisa at each step; the ledger must reconcile exactly.
5. **Make every status change conditional** ("only if still in status X") and put money-moving changes in one Postgres transaction.
6. **Release money only when it becomes non-refundable.**
7. **Trust payments only from signature-verified webhooks**, and make handlers idempotent (`webhook_events`).
8. **Row Level Security on every table.** The service-role key never reaches the browser; services also check who is acting.
9. **Pass plain, serializable data to client components.**
10. **Validate route params** (handles, order numbers) and call `notFound()` when invalid.
11. **Keep secrets in `.env.local`** and the hosting provider's settings, never in git or behind a `NEXT_PUBLIC_` name.

## Current phase: Phase 1 MVP, "Smart Order Link"

Goal (PRD §7): a creator can onboard, share their link, and complete a real-money order end to end on both checkout paths, with payouts reconciling to the paisa. The requirements, decisions and the 56-task backlog are in `Docs/Kaivannam — Phase 1 Requirements and Tech Tasks.md`.

**In scope**

- Phone OTP sign-in; creator onboarding with Razorpay Route payout setup and Shiprocket pickup address
- Product configurator builder: option groups with price and production-day modifiers, paid mockup toggle, advance %
- Storefront and configurator at `kaivannam.in/<handle>`, live price, pincode delivery check
- UPI checkout: paid mockup, material advance, balance + shipping; escrow release and refunds (built last, see below)
- Order room: realtime chat, watermarked mockups, revision counter, finished-photo approval
- Shiprocket labels and tracking; WhatsApp notifications
- Payouts, disputes, minimal admin, legal pages

**Out of scope**

Public marketplace homepage, search and filters, reviews, creator analytics, GST ledger export, cart, COD, regional languages, native app.

**Decided (Nov 20, 2026):** build the full Phase 1; Supabase replaces MongoDB; **payments are built last**, as Phase 1's final milestone. Until then checkout runs on a clearly labelled test payment, so everything else can be built and demoed while Razorpay Route approval is pending. Apply for Route on day 1 anyway, and launch publicly only after payments are live.

**Demo phase.** Closed on Nov 20, 2026 before the feedback sessions ran. Run them while the Phase 1 approvals (Razorpay Route, Shiprocket, WhatsApp, OTP) are pending: show the demo to 8 to 10 creators and 8 to 10 buyers, give each a task, watch silently, write down their exact words. Ask creators whether they'd put the link in their bio and pay 5–8%; ask buyers whether they'd trust it more than paying an Instagram account directly.

## Progress

Phase 1 planning is done (Nov 20, 2026); the next step is the E0 approvals (task IDs from the Phase 1 doc).

**Phase 1**

- [ ] E0 Accounts and approvals: CA and entity, Razorpay Route, Shiprocket, WhatsApp BSP, OTP channel, domain, legal documents
- [ ] E1 Foundation: Supabase schema, RLS, repositories (✅ T1.5 and T1.6 done Nov 26: paise, option groups, production days, money module, plus all Phase 1 business rules in `src/domain/` with 111 tests)
- [ ] E2 Phone OTP sign-in and roles
- [ ] E3 Creator onboarding
- [ ] E4 Product configurator builder
- [ ] E5 Storefront, configurator and pincode check
- [ ] E6 Checkout and milestone flow (test gateway)
- [ ] E7 Order room and creator dashboard
- [ ] E8 Shiprocket fulfilment
- [ ] E9 Payouts and disputes
- [ ] E10 WhatsApp notifications
- [ ] E11 Admin and legal pages
- [ ] E12 Tests, PWA, production setup, pilot with 3–5 creators (pilot after E13)
- [ ] E13 Payments go-live (final milestone): Razorpay Route adapter, webhooks, creator payout accounts, releases, refunds, reconciliation

**Demo phase (closed)**

- [x] Market research, feature plan, brand name
- [x] Demo app: home, artist profile, product configurator with live price, order tracking with preview approval, artist dashboard
- [x] Mock-data mode (runs without a database); 49 unit tests; layered `src/` structure
- [ ] ~~Atlas cluster and Vercel deploy~~ (superseded by Supabase in Phase 1)
- [ ] Feedback sessions with creators and buyers (run during E0)

Build notes:

- Next.js 16 with Cache Components (needs Node 22.12+; the repo pins Node 22 in `.nvmrc`). Pages stream data into a prerendered shell; `next build` doesn't need the database.
- Status changes use conditional updates so double-clicks and repeated events can't skip steps; this carries into Phase 1 as Postgres conditional updates.
- Nov 10, 2026: restructured into layers (`src/app`, `features`, `server`, `domain`) with a services layer and 49 unit tests.
- Without a database the app runs on in-memory mock data (`src/server/repositories/mock/`); a dark strip at the top says so. The mock repositories stay in Phase 1 for tests and offline demos.

## Roadmap

From PRD §7.

| Phase | What gets built |
| --- | --- |
| Phase 1: Smart Order Link (MVP) | Creator onboarding and configurator builder, shareable storefront, live price and pincode check, paid mockup + milestone payments with escrow, order room with watermarked mockups, Shiprocket labels, WhatsApp notifications |
| Phase 2: Trust and growth | Auto-publish completed gift photos (with buyer consent) to a verified gallery, GST/TCS monthly ledger export, creator analytics |
| Phase 3: Public marketplace | Public homepage with search, occasion and budget filters, pincode-based fast-delivery sorting, verified reviews, turnaround badges, featured collections |

## Company-building notes (India)

The order is: validate, build, then register when taking real money regularly. Confirm all GST, legal and company setup with a CA or lawyer before launch.

**Validation.** Run a manual pilot with 10 artists: an Instagram page or simple site, a Google Form, payment links and WhatsApp coordination. Target 30 to 50 orders.

**Legal entity.** Private Limited if aiming for investors or ESOPs; LLP is cheaper but not investor-friendly; sole proprietorship means personal liability.

**DPIIT Startup India recognition.** Free; the gateway to benefits such as the 80-IAC tax exemption (100% for 3 of 10 years, Pvt Ltd or LLP, separate application). Eligibility rules were updated on 4 February 2026, so check the portal.

**GST (shapes the launch strategy).**

- Collecting buyers' payments makes Kaivannam an e-commerce operator: it must register for GST regardless of turnover, collect TCS (0.5% since July 2024, as in the PRD), file GSTR-8 monthly, and charge 18% GST on its commission.
- Since 1 October 2023, eligible small sellers can sell through e-commerce platforms without GST registration, but only within their own state.
- The PRD is pan-India, but many Instagram creators aren't GST-registered. The Phase 1 plan lets creators without a GSTIN ship only within their own state (decision D4) and helps them register as they grow.
- Income-tax TDS under Section 194-O (0.1% since October 2024, with a small-seller exemption) isn't in the PRD; ask the CA whether it applies.

**Consumer Protection (E-Commerce) Rules 2020.**

- Appoint a grievance officer and show their name and contact details on the platform.
- Acknowledge complaints within 48 hours and resolve them within one month.
- Display the legal name, headquarters address and customer care contact.
- The marketplace must ensure sellers comply; fake reviews are prohibited.

**Payments.** Don't hold buyers' money in your own bank account at scale; use the payment gateway's marketplace product.

**Also needed.** Terms of service, a privacy policy under India's data protection law, a refund policy for custom items, the domain, social handles and a trademark.

**Unit economics example.** At the PRD's 5–8% bio-link commission, a Rs 1,200 order earns Rs 60–96. If the platform also paid about Rs 24 in gateway fees, only Rs 36–72 would remain, so who bears gateway fees (open question Q7) matters. Earning Rs 1 lakh a month at Rs 75 per order needs about 1,350 orders a month; marketplace orders at 12–15% (Phase 3) improve this.

**Key metrics.** Repeat buyers, artists bringing their own customers, on-time delivery rate and dispute rate.

**Go-to-market.** Creators bring their own buyers through the bio link, so recruit 30 to 50 Instagram creators personally (start with one category such as resin keepsakes or portraits); 0% commission for their first 30 days (PRD); launch before a gifting season such as Pongal, Valentine's or Rakhi.

**Team and funding.** If I'm the technical founder, find a co-founder strong in artist relations and marketing. Bootstrap first; later incubators, the Startup India Seed Fund (through incubators) and angels, after traction.

## Open questions

The full list with defaults is in section 11 of the Phase 1 doc. The ones that change the most:

- [x] Full Phase 1 (Q1, Nov 20): about 67.5 developer-days, roughly 14 weeks solo
- [x] Supabase replaces MongoDB (Q2, Nov 20)
- [x] Payments built last, as Phase 1's final milestone (D20, Nov 20)
- [ ] Pan-India with the state rule for creators without a GSTIN; TCS base and Section 194-O TDS (Q3, Q12, CA)
- [ ] Who pays gateway fees on advance and balance? (Q7; decide before the payments milestone)
- [ ] Dispute window: 24h or 48–72h, since gifts often go to someone else (Q10)
- [ ] OTP channel: SMS with DLT registration, or WhatsApp OTP (Q13)
- [ ] Refund policy wording for custom items (lawyer)
- [ ] Final English spelling of Kaivannam and domain availability (Q14)
