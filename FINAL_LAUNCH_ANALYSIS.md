# Maakhana Customer App - Final Launch Analysis

**Date:** 2025-05-20
**Auditor:** Jules (Senior CTO)
**Status:** **NOT LAUNCH READY** (Critical Blockers Identified)

---

## SECTION 1 — ARCHITECTURE REVIEW

### 1.1 Structural Integrity
- **Status:** **WEAK** due to major duplication.
- **Issue:** The codebase contains a duplicated directory structure. Root-level folders (`components`, `hooks`, `services`, `store`) are mirrored in the `src/` directory.
- **Evidence:** `tsconfig.json` points `@/*` to `src/*`, and `app/_layout.tsx` imports from `@/store`. This confirms `src/` is the intended source of truth, but root-level folders create confusion and potential for split-brain logic.
- **Recommendation:** **IMMEDIATE CLEANUP.** Delete all root-level directories that have counterparts in `src/`. Enforce `src/` usage strictly.

### 1.2 Code Quality
- **Status:** **GOOD**.
- **Observation:** The code within `src/` and `app/` is well-structured.
  - **State Management:** Zustand stores (`src/store/`) are clean and focused.
  - **Networking:** Supabase client is centralized in `src/services/supabase.ts`.
  - **Navigation:** Expo Router file-based routing is used correctly.

---

## SECTION 2 — AUTH & DATA INTEGRITY

### 2.1 Authentication Flow
- **Status:** **READY**.
- **Observation:** The `app/(auth)` directory implements a complete flow: Welcome -> Login -> OTP -> Signup -> Profile Setup.
- **Data Integrity:** The `users` table is correctly used for customer profiles. `fix_users_full_permissions.sql` ensures proper RLS policies for user data (Select/Insert/Update own profile).

### 2.2 Database Schema Alignment
- **Status:** **CRITICAL FAIL**.
- **Issue:** There is a schema mismatch between the frontend and backend logic.
  - **Frontend:** Fetches restaurants from the `kitchens` table (`app/kitchen/[id].tsx`, `app/(tabs)/home.tsx`).
  - **Backend (RPC):** The `create_order` function in `create_order_rpc.sql` verifies kitchen existence against a `profiles` table:
    ```sql
    SELECT 1 FROM profiles WHERE id = p_kitchen_id ...
    ```
  - **Impact:** Order creation **WILL FAIL** because the RPC checks the wrong table (`profiles` instead of `kitchens`). The `profiles` table appears to be a legacy artifact or a different entity type.

### 2.3 RLS Policies
- **Status:** **UNSAFE**.
- **Issue:** `db_schema.sql` contains "Demo" policies that are highly insecure for production:
  ```sql
  CREATE POLICY "Demo Update Orders" ON orders FOR UPDATE USING (true);
  ```
  This allows **ANY** authenticated user to update **ANY** order.
- **Recommendation:** Replace all "Demo" policies with strict RLS:
  - Users can only view/create their own orders.
  - Kitchens/Drivers (not in this app scope, but generally) should only access their relevant orders.

---

## SECTION 3 — USER JOURNEY AUDIT

### 3.1 Critical Paths
| Step | Status | Risk | Notes |
| :--- | :--- | :--- | :--- |
| **Signup/Login** | ✅ Pass | Low | Flow is standard and secure. |
| **Browse Kitchens** | ✅ Pass | Low | Correctly fetches from `kitchens` table with location support. |
| **View Menu** | ✅ Pass | Low | Uses `useCachedData` for performance. Good. |
| **Add to Cart** | ✅ Pass | Low | Local state management via Zustand works well. |
| **Checkout** | ⚠️ Risky | Medium | Razorpay integration is good, but relies on `create_order` RPC. |
| **Place Order** | ❌ **FAIL** | **High** | **BLOCKED** by `create_order` schema mismatch (`profiles` vs `kitchens`). |
| **Order History** | ⚠️ Risky | Medium | RLS allows arbitrary updates (security risk). |

---

## SECTION 4 — UI/UX & PRODUCT QUALITY

### 4.1 Visual Polish
- **Status:** **HIGH QUALITY**.
- **Strengths:**
  - Uses `expo-image` for optimized caching.
  - `lucide-react-native` for consistent icons.
  - Custom animations (Reanimated) in Cart and Splash screen.
  - Good use of Skeleton loaders (`SkeletonCard.tsx`).
- **Weaknesses:**
  - **Hardcoded Data:** `app/(tabs)/home.tsx` has hardcoded categories (Snacks, Meal, etc.) which might not match actual inventory.
  - **Empty States:** Cart has a good empty state, but Kitchen list empty state could be more actionable.

---

## SECTION 5 — ORDER & PAYMENT STRUCTURE

### 5.1 Order Logic
- **Status:** **BROKEN**.
- **Issue:** The `create_order` RPC is the single point of failure. It references `profiles` instead of `kitchens`.
- **Fix:** Update `create_order` RPC to:
  ```sql
  SELECT 1 FROM kitchens WHERE id = p_kitchen_id AND is_active = TRUE
  ```

### 5.2 Payment Integration
- **Status:** **PRODUCTION READY (Structure-wise)**.
- **Observation:** `app/cart/index.tsx` uses `react-native-razorpay` correctly.
  - It handles the payment success callback.
  - It triggers the `create_order` RPC only after successful payment.
  - **Note:** Ensure `EXPO_PUBLIC_RAZORPAY_KEY_ID` is set in the production build environment.

---

## SECTION 6 — PERFORMANCE & STABILITY

### 6.1 Optimization
- **Status:** **GOOD**.
- **Observation:**
  - **Caching:** `useCachedData` hook prevents unnecessary network requests for Kitchen details and Menu.
  - **Images:** `expo-image` is used throughout, which is best practice.
  - **Lists:** `FlatList` is used. For very large menus, `FlashList` (Shopify) would be better, but `FlatList` is acceptable for MVP.
- **Stability:**
  - `AuthProvider` has a safety timeout to prevent infinite loading screens.
  - Error boundaries are not explicitly seen but standard Expo handling applies.

---

## SECTION 7 — SECURITY & PRODUCTION READINESS

### 7.1 Security Audit
- **Status:** **FAIL**.
- **Critical Vulnerabilities:**
  1.  **Insecure RLS:** "Demo" policies must be removed immediately.
  2.  **Schema Confusion:** `create_order` RPC logic is flawed.
- **API Exposure:** Supabase anonymous key is safe to expose if RLS is strict. Currently, RLS is NOT strict enough.

---

## SECTION 8 — LAUNCH GAP REPORT

### 8.1 Executive Summary
The Maakhana Customer App is visually polished and architecturally sound in its frontend implementation (`src/`). However, it is **NOT READY FOR LAUNCH** due to a critical backend bug in the order creation logic and severe security vulnerabilities in the database policies.

### 8.2 Prioritized Action Roadmap

#### 🚨 CRITICAL (MUST FIX BEFORE LAUNCH)
1.  **Fix `create_order` RPC:** Update the SQL function to check the `kitchens` table instead of `profiles`.
2.  **Secure Database:** Remove all "Demo" RLS policies from `db_schema.sql` / Supabase. Apply strict ownership-based policies.
3.  **Clean Architecture:** Delete root-level `components`, `hooks`, `services`, `store` directories to prevent development confusion.
4.  **Verify Environment:** Ensure `EXPO_PUBLIC_RAZORPAY_KEY_ID` and Supabase keys are correctly set in EAS/Production environment.

#### 🟠 HIGH (Fix Immediately Post-Launch or Pre-Launch if time permits)
1.  **Dynamic Categories:** Replace hardcoded categories in `HomeScreen` with a database-driven fetch.
2.  **Error Reporting:** Integrate Sentry or similar for crash reporting.

#### 🟡 MEDIUM (Improvement)
1.  **List Performance:** Migrate `FlatList` to `FlashList` for smoother scrolling on older devices.
2.  **Empty States:** Improve empty state for "No Kitchens Found" with a retry button or radius adjustment.

---
**Verdict:** **NO GO**. Fix Critical items 1 & 2 to achieve **GO** status.
