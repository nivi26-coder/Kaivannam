# Kaivannam (கைவண்ணம்)

*Handmade gifts, made just for you.*

A marketplace where Tamil Nadu artists sell personalised handmade gifts. Buyers customise a gift through a structured form with a live price, approve a preview, and pay safely while Kaivannam holds the money until delivery.

This is the **demo phase**: a realistic, mobile-first app on a real MongoDB database, built to show artists and buyers and collect feedback. There are no real payments, logins, uploads, shipping or notifications yet. See [Docs/Kaivannam — Project Context.md](Docs/Kaivannam%20—%20Project%20Context.md) for the full plan.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 + shadcn/ui · MongoDB Atlas + Mongoose 9 · tsx for scripts.

## Getting started

**1. Node.js 22.** Next.js 16 needs Node 20.9 or newer. With nvm-windows:

```bash
nvm install 22
nvm use 22
```

**2. Install and run.**

```bash
npm install
npm run dev
```

Open http://localhost:3000 and use your browser's mobile view; most buyers and artists will use phones.

With no database configured, the app runs on **mock data**: the 6 demo artists, their gifts and their orders, held in memory. Everything works, including ordering, paying, previews and the pause toggle. Changes reset when the server restarts, and a dark strip at the top says you're on mock data.

### Connecting MongoDB Atlas

Do this when you're ready for data that persists.

**3. Create a MongoDB Atlas cluster** (free M0 tier).

- Create a database user with a strong password.
- Network access: add your current IP for development. Vercel needs `0.0.0.0/0`, which is why the strong password matters.
- Connect → Drivers → copy the connection string.

**4. Add your connection string.**

```bash
cp .env.example .env.local
```

Paste the string into `.env.local` and put a database name before the `?`, for example `...mongodb.net/kaivannam?retryWrites=true&w=majority`. `.env.local` is git-ignored; never commit it.

**5. Seed demo data.** This deletes and recreates all artists, products and orders.

```bash
npm run seed
```

It prints links to try, including an order waiting for preview approval and an artist dashboard. The seed writes the same data and IDs as mock mode, so links keep working.

**6. Restart `npm run dev`.** The mock-data strip disappears once the app is using Atlas.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (doesn't need the database) |
| `npm run start` | Serve the production build |
| `npm run seed` | Reset the database with demo data |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run TypeScript |

## Demo walkthrough

1. **Home**: pick an occasion, open a gift.
2. **Product page**: customise it and watch the price update. Place the order.
3. **Order page**: tap *Pay* (simulated: no money moves).
4. **For artists → pick the artist**: tap *Send preview* on the new order.
5. **Order page**: request changes or approve the preview.
6. **Dashboard**: *Start making → Mark as shipped → Mark as delivered*. Try the *Pause* toggle too.

The dashboard uses `?artist=<id>` instead of a login. Every order page is reachable by its link, so bookmark it.

## Project structure

```text
app/
  page.tsx                  home: occasions, gifts, featured artists
  artists/[id]/page.tsx     artist profile
  products/[id]/page.tsx    product + customization form
  orders/[id]/page.tsx      order tracking + preview approval
  dashboard/page.tsx        artist dashboard (orders, deadlines, pause)
  actions/orders.ts         Server Actions: createOrder, pay, preview, approve…
  actions/artists.ts        Server Action: pause / resume orders
components/
  CustomizationForm.tsx     client component, live price
  OrderStatus.tsx           progress timeline
  ArtistCard.tsx, ProductCard.tsx, …
  ui/                       shadcn/ui components
lib/
  db.ts                     cached Mongoose connection
  data.ts                   read queries for pages (server only)
  store/                    where data lives: mongo.ts (Atlas) or mock.ts (in memory)
  demoData.ts               demo artists, gifts and orders (mock mode + seed)
  pricing.ts                calculatePrice, shared by browser and server
  customFields.ts           validation for customization inputs
  orderStatus.ts            the order lifecycle in one place
  dates.ts                  delivery-date maths in Indian time
models/                     Artist, Product, Order (Mongoose)
scripts/seed.ts             writes demoData.ts into Atlas
```

## Decisions worth knowing

**The server always decides the price.** The form shows a live price using `calculatePrice()`, but it only ever submits the buyer's *choices*. `createOrder` reloads the product from MongoDB, validates every field and recalculates the total. A price sent from the browser is ignored.

**Orders snapshot the product.** Title, base price, image and revision limit are copied into the order, so an artist editing a product later doesn't change past orders.

**Status changes are conditional updates.** For example `updateOne({ _id, status: "PLACED" }, { $set: { status: "PAID" } })`. If the order isn't in the expected state (double-click, two tabs, a hand-made request), nothing happens. Each update is atomic in MongoDB, so no transaction is needed yet. Use transactions when real money moves (Razorpay).

**Pages stream from the database on every request.** With Cache Components, Next.js prerenders a static shell (header, headings, skeletons) and streams database content into it. `lib/data.ts` calls `io()` before each query, so data is always fresh and `next build` never needs a database.

**Mock data or Atlas, same code.** Pages and Server Actions talk to a small `Store` interface (`lib/store/types.ts`), not to Mongoose directly. Without `MONGODB_URI` the in-memory store is used; with it, the MongoDB store. Mock mode works with `npm run dev` and `npm start`, which run as one server process. On Vercel, requests can hit separate serverless instances that don't share memory, so connect Atlas before deploying.

**Dates are in Indian time.** Vercel runs in UTC, so between midnight and 5:30 am IST the server's "today" would be yesterday. Delivery dates are handled as `YYYY-MM-DD` in IST (`lib/dates.ts`). The earliest delivery date is today + making time + 2 shipping days.

**Demo stand-ins.**

| Real feature (MVP) | Demo version |
| --- | --- |
| Razorpay payment, held via Route | *Pay* button that marks the order paid |
| Artist uploads a mockup | *Send preview* reuses a product photo |
| Buyer uploads a photo | Photo is previewed on the phone; only its file name is saved |
| Login | Buyer gives name + phone; artist picked with `?artist=` |

Server Actions are public HTTP endpoints. Before launch, each one must check the signed-in user is the order's buyer or artist.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add `MONGODB_URI` under Project → Settings → Environment Variables.
3. In Atlas Network Access, allow `0.0.0.0/0`.

Photos come from [Unsplash](https://unsplash.com) and are free to use under the Unsplash License.
