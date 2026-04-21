# Last Piece — Business Operations Guide

**Audience:** Mohamed, Sameh, Asmaa, Islam, any future team member.
**What this is:** Every workflow, every role, every price rule, every approval step. One document. Read end-to-end before your first week.

---

## 1. The Business in One Paragraph

Last Piece is a **Saudi-based luxury sneaker boutique** that sells into **Egypt**. We buy authentic, limited-edition sneakers in Saudi Arabia, ship them to Egypt, and sell them through two channels: **online (the website)** and **offline (the physical boutique in Cairo)**. Every pair is 1-of-1 in our inventory — we don't restock.

---

## 2. The People & Their Roles

| Role | Who | Country | Password |
|---|---|---|---|
| **Super-Admin** | Mohamed Zaher (founder) | Saudi Arabia | `mohamed@lastpiece.com` / `Founder@2026` |
| **Super-Admin** | Sameh Hassan (co-founder) | Saudi Arabia | `sameh@lastpiece.com` / `Founder@2026` |
| **Saudi-Staff** | Asmaa Kutbi (purchasing) | Saudi Arabia | `asmaa@lastpiece.com` / `Asmaa@2026` |
| **Egypt-Staff** | Islam Ahmed (sales / warehouse — placeholder) | Egypt | `islam@lastpiece.com` / `Islam@2026` |
| **Customer** | The public | — | self-register on the site |

> **Hard rule:** Saudi staff must **never** see Egypt selling prices. Egypt staff must **never** see Saudi purchase prices. This is enforced by the backend (field-level masking) so the data literally doesn't leave the server if a role shouldn't see it. Don't try to override this.

---

## 3. The Lifecycle of One Pair

Every pair of shoes goes through 5 stages. The product's `location` field tracks where it is at any moment.

```
  ┌──────────┐   ┌─────────┐   ┌──────────────┐   ┌──────────┐
  │  SAUDI   │──▶│ TRANSIT │──▶│ EGYPT-ONLINE │   │          │
  │ (Asmaa)  │   │         │   │      OR      │──▶│   SOLD   │
  │          │   │         │   │EGYPT-OFFLINE │   │          │
  └──────────┘   └─────────┘   │  OR "BOTH"   │   └──────────┘
       ▲                       └──────────────┘
       └──────────── new purchases always start here
```

### Stage 1: **Saudi** (the moment of purchase)
- **Who acts:** Asmaa (saudi-staff) OR Mohamed/Sameh.
- **Action:** Go to `Admin → + Register Product`. Fill in:
  - Product name, description, brand, category (Men / Women / Kids), size, color, condition
  - **Purchase price** (how much she paid)
  - **Currency paid in** (SAR / USD / EGP)
  - **Exchange rate → EGP** (click "Fetch live rate" to pull today's SAR→EGP from the market, OR type what your bank actually charged you)
  - Supplier name, city, contact
  - Batch code (optional — useful later to group items from the same buying trip)
  - Product images
- **Result:** A new product enters `location = saudi`, `status = draft`. It is **not visible to customers**. Saudi inventory count goes up.
- **What Asmaa sees:** the product in `Admin → Saudi Inventory`. No selling prices — because they haven't been set yet, and she's not allowed to set them.

### Stage 2: **Transit** (Saudi → Egypt)
- **Who acts:** Super-admin (Mohamed / Sameh).
- **Action:** Go to `Admin → Saudi Inventory`, select one or more products (checkboxes), click **"Create Shipment → Egypt"** in the bulk bar. Enter:
  - Shipping cost (e.g. 150 SAR for a 20-pair batch)
  - Customs fees (if any)
  - Other fees (if any)
  - Carrier + tracking number (optional)
- **Result:**
  - A new `Shipment` record is created.
  - **The total shipment cost is divided equally across the pairs in that shipment.** If it's a 1200 SAR shipment for 15 pairs, each pair picks up 80 SAR of allocated shipping cost (its `allocatedShippingCost`).
  - Each product's `location` flips to `transit`.
  - Each product's `landedCost` is updated: `landedCost = purchasePrice + allocatedShippingCost`.
- **The rule you insisted on:** "مرة ابعت بتكلفة، مرة من غير" — if a shipment has zero shipping cost, only the products *in that shipment* get zero allocation. Other shipments aren't affected. This is why shipping is tied to shipments, not spread across the whole catalog.
- **What Asmaa sees:** products moved from Saudi Inventory → In Transit. She can still see them, but not the selling side.

### Stage 3: **Delivered to Egypt** (go Online / Offline / Both)
- **Who acts:** Super-admin.
- **Action:** Two sub-steps, in order.
  1. Go to `Admin → Shipments`, find the shipment, click ✓ to mark **Delivered**. This automatically flips every product in it from `transit` → `egypt-online` (default).
  2. Then go to either `Admin → Egypt — Online` or `Admin → Egypt — Boutique`. Select products (checkboxes). Click **"Send to Online"** / **"Send to Boutique"** / **"Online + Boutique"** in the bulk bar. Enter:
     - **Online price** (what appears on the website)
     - **Boutique price** (what the in-store tag shows)
     - **Minimum sell price** (the floor — Egypt-staff can never sell below this number when logging a boutique sale)
- **Result:** Product becomes `active` + shows up on the public website if the location includes online. Customers can now buy it.
- **What Islam sees:** the product in his Egypt inventory list, with online + offline prices visible and the minimum-sell-price floor. He does **not** see the purchase price or landed cost.

### Stage 4: **Sold**
Two flows:

**4A. Online sale** (customer flow)
- Customer finds the product on the site, adds to cart, checks out, pays.
- An `Order` record is created. The product is **not** marked `sold` automatically yet — wait until the order is delivered.
- Once order status = `delivered`: the product's `location` flips to `sold`, `status = inactive`.

**4B. Offline sale** (boutique flow — Islam's daily job)
- Islam goes to `Admin → Boutique Sales → + Log Offline Sale`.
- Picks the product from the available list (only Egypt inventory appears).
- Enters the sell price. **If he enters a price below the minimum sell price, the backend rejects the sale.**
- Optional: customer name/phone, discount, payment method.
- Result: a `Sale` record is created. Product is marked `sold`. Dashboard revenue ticks up immediately (real-time).

### Stage 5: **Accounting reconciles**
Every sale logs:
- Sell price (what the customer paid)
- Landed cost (purchase price + allocated shipping, frozen at purchase-time FX)
- Profit = sell − landed

Super-admin sees this in `Admin → Dashboard` and `Admin → Financial Report`, live.

---

## 4. The Two Types of Money — Keep Them Separate

This is the single most important accounting concept. We deliberately track two different cost buckets, and we do **not** mix them.

### Bucket A — Landed Cost (per-pair)
Tied to a specific product. Includes:
- The purchase price in EGP (using the FX rate the day we bought it)
- That shipment's allocated shipping cost

This tells you the **real cost of goods sold (COGS)** per pair. Margin % is always calculated against landed cost.

### Bucket B — Operating Expenses (overhead)
Doesn't belong to any one pair:
- Staff salaries (Saudi + Egypt)
- Egypt boutique rent + fit-out + utilities
- Marketing / ad spend
- Customs duties (if recurring, not per-shipment)
- Bank fees

These are **not** allocated to individual products. They're tracked in `Admin → Expenses` and shown as a separate line in the dashboard: `Net Profit = Gross Profit − Operating Expenses`.

**Why separate?** If we mixed marketing spend into per-product cost, a pair you bought last month would suddenly "cost more" this month just because we ran an Instagram ad. You'd think it lost money when it didn't. Keep them apart; read the P&L at the right level.

---

## 5. Currency & Exchange Rates — How This Actually Works

You buy in SAR. You sell in EGP. The SAR/EGP rate moves.

**How we handle it:**
- On every product, when Asmaa registers it, we capture the SAR→EGP rate **at that moment** and freeze it on the record (`purchaseExchangeRate` field).
- `purchasePriceEGP` = `purchasePrice × purchaseExchangeRate` is stored on the product.
- Dashboard and P&L reports always use the **frozen EGP cost**, not today's rate.

**Why this matters:**
> *"Asmaa bought a pair for 5,200 SAR when SAR was at 13.08 EGP → we paid 68,016 EGP for it. Months later SAR might be at 14.00 EGP, but we still paid 68,016 EGP that specific day. Our margin is measured against what we actually paid, not what it would cost today."*

**How to get the rate:**
- Click the "Fetch live rate" button in the product form — we pull from a free public FX API (`open.er-api.com`). 2-hour cache so we don't hammer the endpoint.
- Or type the rate your bank quoted. That's often more accurate than the market mid-rate.

**Rules of thumb:**
- **Always fill in the exchange rate** when purchasing in SAR. Without it, the EGP landed cost is zero and P&L will be wrong.
- If you buy directly in EGP (unusual), set currency = EGP, rate auto-disables.

---

## 6. Permissions — What Each Role Can Do & See

### 6.1. Super-Admin (Mohamed / Sameh)
- **Sees:** everything.
- **Can do:** anything.
- **Unique powers:**
  - Create/edit shipments.
  - Set online / offline / minimum-sell prices per product.
  - Register & manage team members (change roles, block, delete).
  - Edit the website CMS (hero, category headings, story copy, images — every word).
  - Delete products.
  - Approve/reject reviews.
  - View Financial Report (full P&L).

### 6.2. Saudi-Staff (Asmaa)
- **Sees:** Saudi inventory + In-Transit inventory. Dashboard shows counts only — no financial numbers.
- **Can do:** register new products; edit the purchase fields (price, supplier, FX rate) of Saudi-side products.
- **Cannot do / see:** any Egypt selling price, minimum sell price, Egypt inventory, expenses, P&L, shipping costs, user management.
- **Typical day:** she goes out buying, picks up pairs, comes back, sits at the laptop, clicks `+ Register Product` for each one, fills in supplier details and photo, saves. Done.

### 6.3. Egypt-Staff (Islam — future hire)
- **Sees:** Egypt-Online + Egypt-Offline inventories. Their sell prices. Boutique Sales list.
- **Can do:** log offline sales (with sell price ≥ minimum floor). Update basic product metadata (descriptions, photos) for Egypt-side products.
- **Cannot do / see:** any purchase price, landed cost, supplier info, FX rate, expenses, shipping costs, Saudi inventory.
- **Typical day:** customer walks in, picks a pair, Islam opens `Admin → Boutique Sales → Log Offline Sale`, picks the product, enters the agreed price, payment method, customer name. One click. Inventory auto-decrements, dashboard updates in real time.

### 6.4. Customer
- **Sees:** the public site only. Products where `location ∈ {egypt-online, egypt-both}` AND `status = active`. Clean marketing prices. No costs, no rates, no internal fields.
- **Can do:** browse, add to cart, checkout, track their own orders, write a review **only after the product is delivered** (backend enforces this), apply promo codes, use referral codes.

---

## 7. Real-Time — What Updates Live Without a Refresh

We run `socket.io` on the backend. Every mutation emits an event to the appropriate room (role-scoped). The admin UI and the public site subscribe to the relevant events. You should **never need to refresh a page** to see new data.

Events currently wired live:
- `product:created`, `product:updated`, `product:deleted` — inventory pages, dashboard counts, public site grid, product detail
- `shipment:created`, `shipment:updated` — shipments list, inventory pages (products flip stage live)
- `expense:created / updated / deleted` — expenses list, dashboard opex, financial report
- `sale:created` — sales list, dashboard revenue, financial report
- `order:created`, `order:status-changed` — orders list + dashboard + customer's own order page
- `review:created` — product detail + homepage + admin reviews
- `site-content:updated` — homepage/about page re-pull the CMS instantly
- `dashboard:refresh` — the dashboard rescans on any mutation

The little green dot in the admin sidebar = you're connected. Red = reconnecting.

---

## 8. Day-One Walkthrough (Example Scenario)

Let's follow one pair end-to-end.

> **Monday — Riyadh.** Asmaa goes to a reseller, finds a pair of Jordan 1 Chicago for 4,500 SAR. She buys it.
> **At the laptop:** opens `Admin → + Register Product`. Fills the name, description, brand (Air Jordan), category (Men), size 42, images. Purchasing section: 4500, currency SAR, click "Fetch live rate" → 13.20. Supplier: "Riyadh Sneaker Authority". Save.
> **System records:** purchase price 4500 SAR, purchaseExchangeRate 13.20, purchasePriceEGP = **59,400 EGP**. location = saudi.
>
> **Friday — Riyadh.** Mohamed bundles 8 pairs into a DHL shipment. Shipping cost 1,200 SAR + 300 SAR customs = 1,500 SAR total. Goes to `Admin → Saudi Inventory`, selects the 8 pairs, hits "Create Shipment → Egypt", enters 1200 + 300. Save.
> **System records:** a Shipment record with total 1,500 SAR, costPerProduct = 187.50 SAR. Each of the 8 products' `allocatedShippingCost = 187.50 SAR`, `location = transit`, `landedCost` updated.
>
> **Next Wednesday — Cairo.** Package arrives. Mohamed opens `Admin → Shipments`, clicks ✓ Delivered. Products flip to `egypt-online`.
>
> **Same day.** Mohamed opens `Admin → Egypt — Online`, selects the Jordan 1 Chicago, clicks "Online + Boutique", enters online price 50,000 EGP, boutique price 47,000 EGP, minimum 42,000 EGP. Save.
> **System records:** location = egypt-both, status = active, prices set. The pair instantly appears on the public site.
>
> **Saturday — A customer walks into the Cairo boutique.** Islam shows her the pair. She negotiates down to 45,000 EGP. Islam opens `Admin → Boutique Sales → + Log Offline Sale`, picks the Jordan, enters 45,000, cash, customer "Nour K." Save.
> **System:** 45,000 ≥ 42,000 (min floor), sale accepted. Product flips to `sold`. Sale record created. Landed cost = 59,400 + (187.50 × 13.20) = ~61,875 EGP. Profit = 45,000 − 61,875 = **-16,875 EGP (loss)**. ⚠
> Dashboard shows the loss live. Mohamed sees it immediately and knows: the minimum-sell-price was set too low or the FX moved against him. Lesson for next time: set minimum ≥ landed cost + target margin.

The system doesn't stop a loss-making sale (you might want to clear old inventory sometimes), but it always tells you the truth.

---

## 9. How to Edit the Website Itself

Everything the public sees is driven by the CMS. Go to `Admin → Site Content`. You'll see a list grouped by section (home, footer, ...). Each entry has an English version and an Arabic version — edit either one, click Save, and the change is live on the public site **within a second** (socket broadcast).

Don't hard-code strings into pages. If you catch yourself copy-pasting English copy directly into JSX, route it through SiteContent instead.

---

## 10. Common "How Do I...?" Scenarios

| Question | Answer |
|---|---|
| "Asmaa forgot to set the FX rate." | Edit the product. Fill in the rate. Save. `purchasePriceEGP` recalculates automatically. |
| "We returned a product to the supplier." | Edit the product, change status to `discontinued`. It disappears from public view but stays in DB for accounting. |
| "A shipment's cost was wrong." | Edit the shipment. `totalCost` and `costPerProduct` recalculate; the products in it will reflect new allocation next time they're re-saved (or you can re-trigger by editing the product). |
| "I want to run a 10%-off launch promo." | `Admin → Promo Codes → + New Code`. Type `LAUNCH10`, 10%, usage limit 0 (unlimited), min-order if you want. Save. |
| "Someone wrote a fake 5-star review without buying." | Impossible — the backend blocks review creation for users who haven't got a `delivered` order containing that product. If one slips through, delete it in `Admin → Reviews`. |
| "The dashboard number looks off." | Refresh once. If still off, check the Financial Report for the breakdown. All live emits go through `dashboard:refresh` — if a specific event is missing, tell me and we wire it in. |

---

## 11. Non-Negotiables

- **Never commit secrets** (MongoDB URI, Stripe keys) to git. `.env` is gitignored; keep it that way.
- **Never sell below `minSellPrice`** — the backend enforces this, but don't disable the check. It's there to protect your margin.
- **Always fill in the exchange rate** when purchasing in SAR/USD. Otherwise landed cost in EGP = 0 and P&L is meaningless.
- **Don't mix landed cost and operating expenses.** Keep them in separate reports. One is per-product (COGS), the other is period overhead.
- **Role visibility is enforced server-side**. Don't try to hide fields only in the UI — always server-side.

---

## 12. Quick Reference — Where Is What

| I want to... | Go to |
|---|---|
| See business health today | `Admin → Dashboard` |
| Full P&L | `Admin → Financial Report` |
| Register a pair I just bought | `Admin → + Register Product` |
| Move pairs to Egypt | Select in `Saudi Inventory` → bulk bar → Create Shipment |
| Mark shipment delivered | `Admin → Shipments` → ✓ button |
| Publish a pair on the website | Select in `Egypt — Online` (or Offline) → bulk bar → Send to Online/Boutique |
| Log a store sale | `Admin → Boutique Sales → + Log Offline Sale` |
| Record this month's rent | `Admin → Expenses → + New Expense` |
| Edit the homepage hero text | `Admin → Site Content → home.hero` |
| Create a discount code | `Admin → Promo Codes → + New Code` |
| See all team logins | `Admin → Team` |
| Change someone's role | `Admin → Team` → click the role badge → pick new role |
