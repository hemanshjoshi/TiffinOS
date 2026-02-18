# FINAL LAUNCH READINESS AUDIT - MAAKHANA APP

**Date:** 2024-05-23
**Auditor:** Senior CTO & Product Auditor
**Version:** 1.0.0
**Platform:** Expo (React Native) + Supabase

---

## 🚨 EXECUTIVE SUMMARY

The Maakhana app is currently **NOT PRODUCTION READY**.

While the UI is polished and the core "happy path" for browsing and adding items works, the **Checkout & Order Processing** layers are fundamentally broken due to pricing logic mismatches between client and server. The **Payment Gateway** is non-existent (mocked), and there are critical **Security Gaps** in the database layer that could allow data leaks.

**Launch Status:** 🔴 **NO-GO**
**Estimated Fix Time:** 1-2 Weeks

---

## SECTION 1 — ARCHITECTURE REVIEW

### 1. Strengths
- **Tech Stack:** Expo + Supabase is a solid choice for rapid iteration.
- **State Management:** Zustand is correctly used for `cartStore`, `profileStore`, etc., providing a clean separation of concerns.
- **Performance:** `useCachedData` hook is a great implementation for caching kitchen and menu data, reducing database load.
- **Routing:** Expo Router is used effectively with file-based routing.

### 2. Weaknesses & Technical Debt
- **Pricing Logic Duplication:** The biggest architectural flaw is that pricing logic exists in two places:
  1. **Client (`store/cartStore.ts`):** Calculates totals, discounts, taxes (GST 12.25, Platform 12.50).
  2. **Server (`create_order_rpc.sql`):** Calculates totals, uses different fee structure (Delivery 40.00, Tax 5% of total).
  *Risk:* Users will see one price in the cart and be charged another (or the order validation will fail).
- **Hardcoded Configuration:** `app.json` contains `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the `extra` field, while `babel.config.js` attempts to transform `SUPABASE_ANON_KEY`. This inconsistency can lead to environment variable confusion.
- **Loose Coupling in Orders:** The `orders` table relies on a fallback to `users` table for Kitchen details if the join fails. This suggests potential referential integrity issues or legacy data model confusion.

### 3. Improvements
- **Centralize Pricing:** Move ALL pricing logic to a Supabase Edge Function or a Postgres Function (`calculate_cart_total`). The client should only display values returned by the server.
- **Environment Management:** Standardize on `.env` files and `EXPO_PUBLIC_` prefix, removing hardcoded keys from `app.json` and redundant babel plugins.

---

## SECTION 2 — AUTH & DATA INTEGRITY

### 1. Verification
- **Auth Flow:** Standard OTP flow is implemented (`verifyOtp`).
- **Profile:** Fetched immediately after login.
- **Session:** Managed by `AuthProvider` with a safety timeout, which is good UX.

### 2. Critical Issues
- **Phone Number Formatting:** In `app/(auth)/otp.tsx`, the phone number is constructed as `'+' + phone`. If the user input already includes `+`, this results in `++91...`, causing auth failure.
- **Data Leaks (RLS):**
  - `fix_kitchens_rls.sql` makes `kitchens` table **Publicly Readable (SELECT *)**. This exposes sensitive fields like `commission_rate`, `owner_id`, and `fssai_license` to anyone with the API key.
  - **Risk:** Competitors can scrape your entire partner network and their commission rates.
- **Data Integrity:** `orders` table has a `delivery_address_snapshot` JSONB column. This is good practice (snapshotting address at time of order), but the `delivery_partner_id` is nullable and there is no clear assignment logic in the current code.

---

## SECTION 3 — USER JOURNEY AUDIT

### ❌ Critical Failures
- **Checkout:** The `create_order` RPC has hardcoded fees (`v_delivery_fee := 40.00`) that differ from the UI (`standardDeliveryFee = 37` or Free > 169).
- **Payment:** There is **NO** payment integration. The app uses a `setTimeout` to simulate payment. **You cannot launch with this.**

### ⚠️ UX Friction
- **Cart:** If a user adds items from Kitchen A, then tries to add from Kitchen B, the "Replace Cart" modal works, but the UX is jarring.
- **Order Tracking:** The `OrderDetails` screen is static. While it has a subscription to updates, there is no visual feedback (like a map driver icon) for "OutForDelivery".

---

## SECTION 4 — UI/UX & PRODUCT QUALITY

### 1. Issues
- **Hardcoded Data:**
  - `KitchenDetails`: Menu items show a hardcoded rating "4.5 (120)".
  - `CartScreen`: "You saved ₹37 with Gold" is hardcoded.
  - `CartScreen`: "Restaurant packaging charges ₹10" is hardcoded.
- **Inconsistent Design:**
  - The "Bill Summary" in Cart uses hardcoded values that don't match the database logic.
- **Empty States:**
  - `KitchenDetails`: If menu is empty, it shows a basic text. Could be better.

### 2. Improvements
- **Dynamic Fees:** Fetch all fees (Packaging, Platform, Delivery) from the server (e.g., `global_config` table).
- **Real Ratings:** Compute average rating for menu items from `reviews` table (if exists) or hide the rating if no data.

---

## SECTION 5 — ORDER & PAYMENT STRUCTURE

### 1. Order Creation (Critical)
- **RPC Mismatch:** The `create_order` function validates prices but uses different logic than the frontend. This will cause orders to be created with "wrong" totals compared to what the user accepted.
- **Missing Validations:** The RPC does not check if the kitchen is currently "Open" based on operating hours (only checks `is_open` flag).

### 2. Payment Structure
- **Mocked:** The current implementation (`app/cart/index.tsx`) is a placeholder.
- **Recommendation:** Implement Razorpay or Stripe immediately.
  - Create a `payment_intents` table.
  - Call Payment Gateway -> Get Order ID.
  - Pass PG Order ID to `create_order`.
  - Verify signature on server via Webhook.

---

## SECTION 6 — PERFORMANCE & STABILITY

### 1. Performance
- **Good:** `useCachedData` effectively minimizes reads.
- **Good:** `FlashList` or `FlatList` (implied in standard use) generally performs well.
- **Risk:** The `CartScreen` re-calculates totals on every render. `useMemo` should be used for expensive calculations like `getTotalPrice`.

### 2. Stability
- **Crash Risk:** The `create_order` RPC raises exceptions (`RAISE EXCEPTION`) which are caught by the client, but if the error message is not user-friendly, it looks like a crash.
- **Type Safety:** Extensive use of `any` in `KitchenDetails` and `CartScreen` makes the code fragile to schema changes.

---

## SECTION 7 — SECURITY & PRODUCTION READINESS

### 1. API Exposure
- **Public Tables:** `kitchens` and `menu_items` are fully public. Limit the columns returned by the `SELECT` policy (e.g., only `id`, `name`, `image`, `price`).
- **RPC Security:** `create_order` is `SECURITY DEFINER`. This is correct, but ensure inputs are sanitized (Postgres does this mostly, but logic checks are needed).

### 2. Client-Side Risks
- **Price Manipulation:** A malicious user *could* try to call `create_order` with manipulated JSON items. The RPC *does* re-calculate prices, which saves you from financial loss, but the current RPC implementation of variants/addons logic needs to be rigorously tested against the frontend JSON structure.

---

## SECTION 8 — LAUNCH GAP REPORT

### 🔴 Critical (Must Fix Before Launch)
1.  **Implement Real Payment Gateway:** Replace `setTimeout` with Razorpay/Stripe.
2.  **Fix Pricing Logic:** Unify pricing logic. Make the Server the Source of Truth.
    - *Action:* Create `get_cart_summary` RPC that takes items and returns `{ item_total, tax, delivery, grand_total }`. Call this on Cart load.
3.  **Fix RLS Policies:** Restrict `kitchens` table access. Do not expose `commission_rate`.
4.  **Fix OTP Phone Logic:** Fix the `'+' + phone` concatenation bug.
5.  **Remove Hardcoded Fees:** Stop hardcoding ₹10 packaging, ₹12.50 platform fee in the client.

### 🟡 High Priority (Should Fix)
1.  **Refactor `app.json` vs `.env`:** Clean up environment variable usage.
2.  **Type Safety:** Remove `any` types in critical flows (Cart, Order).
3.  **Hardcoded Ratings:** Remove fake "4.5" ratings from menu items.

### 🟢 Post-Launch Improvements
1.  **Order Tracking Map:** Add live driver tracking.
2.  **Admin Dashboard:** Build the partner portal (out of scope here, but needed).
3.  **Advanced Caching:** Use TanStack Query (React Query) for better cache management than custom hooks.

### Final Verdict
**NOT READY.** Focus on **Payments** and **Pricing Logic** unification immediately.
