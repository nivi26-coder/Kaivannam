
# Product Requirements Document (PRD): Custom Gift Marketplace & Order Workflow (India)

## 1. Product Vision & Strategy

* **Long-Term Vision:** Build an Amazon-style pan-India discovery marketplace for bespoke, handmade, and personalized gifts.
* **Phase 1 (MVP) Strategy ("Come for the Tool, Stay for the Network"):** Launch as a **Configure-to-Order + Escrow Deal Room** tool that Instagram/WhatsApp gift creators share via bio links and DMs (`appname.in/creator-handle`). Once creators complete orders and build verified portfolios, aggregate their listings into a public pan-India discovery marketplace.

---

## 2. Target Users

1. **Creators (Gift Makers):** Independent Indian artists, resin makers, portrait illustrators, woodworkers, and custom hamper curators selling via Instagram/WhatsApp who struggle with unpaid drafts, material cash-flow crunch, and manual courier booking.
2. **Buyers:** Shoppers across India ordering custom gifts for birthdays, anniversaries, weddings, and corporate events who want price transparency, design previews before committing, and UPI payment protection.

---

## 3. Core User Flows

### 3.1 Creator Onboarding & Product Setup

* **Account Setup:** Phone OTP authentication, pickup pincode, and bank/UPI payout onboarding via Razorpay Route / Cashfree Easy Split.
* **Dynamic Product Configurator Builder:**
  * Set **Base Price** (e.g., `₹1,200`) and **Base Production Days** (e.g., `4 days`).
  * Add **Customization Option Groups** (`Material`, `Size`, `Effort Level`, `Add-ons`) with price modifiers (`+₹300`, `+₹500`) and extra production days (`+2 days`).
  * Toggle **Paid Design Mockup** (`₹99` – `₹199`) — credited toward final order if the buyer proceeds; retained by creator if buyer cancels after draft upload.
  * Set **Upfront Material Advance %** (e.g., `50%` upfront to buy raw materials, `50%` balance before dispatch).

### 3.2 Buyer Journey (Two Checkout Paths)

* **Live Configuration & Pincode Check:** Buyer selects options, enters custom text/uploads reference photos, and enters delivery pincode to see real-time total price + estimated delivery date (`Production Days + Courier Transit Days`).
* **Path A — Paid Mockup First (Low-Risk Trial):**
  1. Buyer pays small mockup fee (`₹149`) via UPI.
  2. Creator uploads watermarked preview in realtime order chat.
  3. Buyer approves mockup (within revision limit) and proceeds to order; `₹149` is automatically deducted from the total.
* **Path B — Direct Order with Milestone Split:**
  1. **Milestone 1 (Material Advance):** Buyer pays upfront material percentage (e.g., `50%`) via UPI. Settled quickly to creator to fund raw materials.
  2. **Production Updates:** Creator shares progress/finished product photos in chat.
  3. **Milestone 2 (Final Balance + Shipping):** Buyer approves finished gift photo and pays remaining `50%` + Shiprocket shipping fee. Held in escrow until delivery.

### 3.3 Fulfillment & Payouts

* Paying Milestone 2 unlocks one-click **Shiprocket / NimbusPost shipping label** generation.
* Courier picks up parcel from creator's pincode; automated WhatsApp tracking alerts sent to buyer.
* Upon delivery confirmation (+24h dispute window), escrow releases Milestone 2 payout to creator after deducting platform commission, GST, and TCS.

---

## 4. Technical Architecture & Stack

* **Frontend:** Next.js (App Router), Tailwind CSS, shadcn/ui (Mobile-first PWA).
* **Backend, Auth & Realtime:** Supabase (PostgreSQL, Phone Auth, Storage with image compression, Realtime Channels for buyer–creator chat).
* **Payments & Split Escrow:** Razorpay Route or Cashfree Easy Split (UPI Intent + Delayed Settlements; **100% Prepaid only, no COD**).
* **Pan-India Logistics:** Shiprocket API (Serviceability/Rate check + AWB label generation + delivery webhooks).
* **Notifications:** WhatsApp Business API (Interakt / AiSensy / MSG91) for quotes, mockup uploads, payment reminders, and tracking updates.

---

## 5. Database Schema Overview (PostgreSQL + JSONB)

* `users`: `id`, `phone`, `name`, `role` (`BUYER` | `CREATOR` | `ADMIN`), `created_at`
* `creators`: `user_id`, `handle` (unique slug), `bio`, `pickup_pincode`, `razorpay_account_id`, `gstin` (optional), `kyc_verified`
* `products`: `id`, `creator_id`, `title`, `description`, `base_price`, `mockup_fee`, `advance_percentage`, `base_production_days`, `option_schema` (`JSONB`), `is_public`
* `orders`:
  * `id`, `order_number`, `buyer_id`, `creator_id`, `product_id`
  * `selected_options` (`JSONB` price snapshot at order time)
  * `custom_notes`, `reference_urls` (`TEXT[]`), `delivery_pincode`
  * `item_total`, `shipping_fee`, `mockup_fee_paid`, `advance_amount`, `balance_amount`
  * `status`: `MOCKUP_PENDING` | `MOCKUP_PAID` | `MOCKUP_APPROVED` | `ADVANCE_PAID` | `IN_PRODUCTION` | `READY_TO_SHIP` | `BALANCE_PAID` | `SHIPPED` | `DELIVERED` | `CANCELLED` | `DISPUTED`
* `payment_milestones`: `id`, `order_id`, `milestone_type` (`MOCKUP` | `ADVANCE` | `BALANCE`), `amount`, `razorpay_order_id`, `razorpay_payment_id`, `status`, `paid_at`
* `payout_ledger`: `id`, `order_id`, `milestone_id`, `gross_amount`, `platform_commission`, `gst_on_commission`, `tcs_deducted`, `net_creator_payout`, `settlement_status`
* `order_messages`: `id`, `order_id`, `sender_id`, `message_text`, `attachment_url`, `is_watermarked`, `message_type` (`TEXT` | `MOCKUP_PROOF` | `PROGRESS_PHOTO` | `SYSTEM_EVENT`), `created_at`

---

## 6. Unit Economics & Compliance Rules (India)

* **Commission Structure:**
  * *Creator Bio-Link Orders (BYO Buyer):* `5% – 8%` platform fee (`0%` promo for first 30 days).
  * *Marketplace Discovery Orders (Phase 2):* `12% – 15%` platform fee.
  * *Mockup Fee:* `0%` platform commission (passed directly to creator minus gateway charges).
* **Tax & Compliance:**
  * Collect `18% GST` on platform commission.
  * Deduct `0.5% TCS` (Section 52) on net taxable value for monthly GSTR-8 filing.
* **Cancellation & Dispute Policy:**
  * Mockup fee is non-refundable once watermarked draft is uploaded.
  * Material advance is non-refundable once order enters `IN_PRODUCTION`.

---

## 7. Phased Roadmap

### Phase 1: MVP — "Smart Order Link" (Weeks 1–3)

* [ ] Creator onboarding + Dynamic Product Configurator builder.
* [ ] Shareable creator storefront & product configurator page (`appname.in/handle`).
* [ ] Live price & Shiprocket pincode delivery calculator.
* [ ] UPI checkout for Paid Mockup + 2-stage Milestone Payments (Razorpay Route).
* [ ] Order chat room with watermarked mockup approval & revision counter.
* [ ] Shiprocket AWB generation + WhatsApp status notifications.

### Phase 2: Trust & Growth Loop (Weeks 4–8)

* [ ] Auto-publish completed gift photos (with buyer consent) to creator's verified gallery.
* [ ] Automated GST/TCS monthly ledger export for creators and platform CA.
* [ ] Creator analytics dashboard (conversion rate, repeat buyers, payout history).

### Phase 3: Public Pan-India Marketplace (Month 3+)

* [ ] Public homepage with search, occasion filters (*Birthday, Anniversary, Wedding*), budget filters, and pincode-based fast-delivery sorting.
* [ ] Verified buyer reviews, creator turnaround badges, and featured collections.
