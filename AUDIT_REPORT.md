# Maakhana App Audit Report

## 1. Executive Summary
The application is currently in a **Pre-Alpha / Prototype** state. While the core "Customer Order Flow" (Kitchen Selection -> Cart -> Order Creation) is technically functional (with mocked payment), the **Partner** and **Admin** ecosystems are severely broken or non-existent.

**Critical Blockers** exist in:
- **Database Consistency**: The app writes to one table (`profiles`) but reads from another (`users`), guaranteeing failure in production.
- **Security**: There is zero protection for Admin or Partner interfaces. Any logged-in customer can access them.
- **Partner Operations**: Kitchen partners cannot see *what* items are in an order, making fulfillment impossible.

---

## 2. Detailed Findings

### A. Database & Schema (CRITICAL)
**Status: Inconsistent / Mixed**
- **Issue**: The codebase oscillates between two conflicting schema designs:
  - **Design A**: `users` table (from `db_schema.sql`).
  - **Design B**: `profiles` table (from `supabase_schema.sql`).
- **Evidence**:
  - `app/(auth)/signup.tsx` writes new users to the **`profiles`** table.
  - `store/profileStore.ts` attempts to read user data from the **`users`** table.
  - **Result**: Users can sign up, but their profile data will never load.
- **Partner Issue**: `app/partner/dashboard.tsx` queries `profiles` for kitchen data, but `app/(tabs)/home.tsx` correctly queries `kitchens`. The Partner Dashboard will fail to load status or toggle availability.

### B. Security & Roles (CRITICAL)
**Status: Non-Existent**
- **Issue**: No Role-Based Access Control (RBAC) is implemented.
- **Evidence**:
  - `app/_layout.tsx` allows *any* authenticated user to navigate to any route.
  - `app/(tabs)/profile.tsx` explicitly exposes a link to `/admin/dashboard` for every user.
  - Login redirect is hardcoded to `/(tabs)/home` (Customer View), forcing Partners/Admins to manually find their URL.

### C. Frontend & UX
**Status: Fragmented**
- **Two Cart Screens**:
  - `app/cart/index.tsx`: The "Real" cart with coupons, cross-selling, and checkout logic. (Accessed from Kitchen Page).
  - `app/(tabs)/cart.tsx`: A "Basic" cart with limited features and dead links to `app/checkout/`. (Accessed from Bottom Tab Bar).
  - **Result**: Users have a broken experience depending on where they click "Cart".
- **Hardcoded Data**:
  - `app/partner/profile.tsx`: Hardcoded to "Anita Sharma".
  - `app/admin/dashboard.tsx`: All stats and lists are static placeholders.
  - `app/(tabs)/home.tsx`: Food Categories are hardcoded.

### D. Missing Features
- **Payment Gateway**: Payment is mocked in `cart/index.tsx` (`payment_status: 'Paid'`).
- **Partner Order Details**: `app/partner/orders.tsx` fetches orders but **not** the items within them. Partners see an order exists but not what to cook.
- **Admin Functionality**: The Admin Dashboard is purely UI; no backend connection exists.

### E. Code Quality
- **Dead Code**: The `app/checkout/` folder appears to be a legacy implementation superseded by `app/cart/index.tsx`.
- **Performance**: `components/AddAddress.native.tsx` contains massive inline styles which may impact rendering performance.
- **Architecture**: The project structure implies a "Super App" (Customer + Partner + Admin in one), but lacks the role management to support it securely.

---

## 3. Priority Issues List

| ID | Priority | Category | Issue | Impact |
|----|----------|----------|-------|--------|
| **1** | **CRITICAL** | **Schema** | Signup writes to `profiles`, Store reads `users`. | **App is unusable.** Profile data will be missing. |
| **2** | **CRITICAL** | **Security** | No Role-Based Access Control. | Customers can access Admin/Partner dashboards. |
| **3** | **CRITICAL** | **Partner** | Partner Orders view missing `order_items`. | Partners cannot fulfill orders. |
| **4** | **CRITICAL** | **Schema** | Partner Dashboard reads `profiles` instead of `kitchens`. | Partners cannot go online/offline. |
| **5** | **HIGH** | **UX** | Dual Cart Implementations (`tabs/cart` vs `cart/index`). | Confusing/Broken user experience. |
| **6** | **HIGH** | **Admin** | Admin Dashboard is fake/static. | Admins cannot manage the platform. |
| **7** | **HIGH** | **Feature** | No Payment Gateway. | Cannot process real money. |
| **8** | **MEDIUM** | **Code** | Dead code in `app/checkout/`. | Maintenance burden. |
| **9** | **MEDIUM** | **Data** | Hardcoded categories and profiles. | Limited dynamic updates. |

---

## 4. Fix Roadmap

### Phase 1: Foundation Fixes (Immediate)
1.  **Schema Consolidation**:
    - Decide on **`users`** or **`profiles`** as the single source of truth.
    - Update `signup.tsx`, `profileStore.ts`, and database tables to match.
2.  **Role Security**:
    - Add `user_type` column to the user table.
    - Create a `useRole()` hook or `ProtectedRoute` component.
    - Update `_layout.tsx` to redirect users based on role (Customer -> Home, Partner -> Dashboard).
3.  **Partner Operational Fix**:
    - Update `app/partner/dashboard.tsx` to query `kitchens` table.
    - Update `app/partner/orders.tsx` to fetch `order_items`.

### Phase 2: User Experience Cleanup
1.  **Cart Unification**:
    - Delete `app/(tabs)/cart.tsx` and `app/checkout/`.
    - Point the Tab Bar "Cart" icon to `app/cart/index.tsx`.
2.  **Hardcoding Removal**:
    - Create `categories` table in DB and fetch dynamically in Home.
    - Connect Partner Profile to real data.

### Phase 3: Launch Readiness
1.  **Payment Integration**: Replace mocked payment with Razorpay/Stripe SDK.
2.  **Admin Implementation**: Connect Admin Dashboard to real backend stats/APIs.
3.  **Deployment Config**: Set up valid Supabase environment variables and build scripts.

---

## 5. Technical Implementation Plans (Critical Issues)

### Plan A: Fix Schema Mismatch
**Objective**: Consolidate User Data to `users` table (Design A).
1.  **Database**: Ensure `users` table exists and matches `db_schema.sql`. (Or rename `profiles` -> `users` if data preservation is key).
2.  **Signup (`app/(auth)/signup.tsx`)**: Change `.from('profiles').insert(...)` to `.from('users').insert(...)`.
3.  **Store (`store/profileStore.ts`)**: Verify it reads `.from('users')`.
4.  **Partner Dashboard (`app/partner/dashboard.tsx`)**: Change `.from('profiles')` to `.from('kitchens')` (using `owner_id` to link).

### Plan B: Fix Role Security
**Objective**: Restrict access to Partner/Admin routes.
1.  **Database**: Ensure `users` table has `user_type` column (ENUM: 'CUSTOMER', 'PARTNER', 'ADMIN').
2.  **Auth Context**: Fetch `user_type` on login and store in session/context.
3.  **Layout (`app/_layout.tsx`)**:
    - Add logic: `if (segment === 'partner' && user.type !== 'PARTNER') router.replace('/')`.
    - Similarly for 'admin'.
4.  **Login Redirect**: Update `login.tsx` to check `user_type` and redirect to `/partner/dashboard` or `/admin/dashboard` accordingly.

### Plan C: Fix Partner Orders
**Objective**: Show items to cook.
1.  **Code (`app/partner/orders.tsx`)**:
    - Modify query: `.select('*, order_items(*, menu_items(name))')`.
    - Update `renderOrder` to map through `item.order_items` and display names/quantities.
