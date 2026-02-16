# Codebase Analysis

## 1. Architecture Overview

The **Maakhana App** is a mobile application built using **React Native** with the **Expo** framework. It uses **Supabase** as the backend-as-a-service (BaaS) for database, authentication, and storage.

### Key Technologies:
- **Frontend Framework**: React Native (0.81.5) with Expo (SDK 54).
- **Routing**: Expo Router (file-based routing in `app/`).
- **State Management**: Zustand (stores located in `store/`).
- **Backend**: Supabase (PostgreSQL).
- **Styling**: Likely using inline styles and constants (`constants/Colors.ts`).
- **Icons**: Lucide React Native.

### Folder Structure:
- `app/`: Contains the application screens and navigation logic (Expo Router).
- `components/`: Reusable UI components.
- `store/`: Zustand stores for global state (Cart, Address, Auth).
- `services/`: API interaction logic (Supabase client).
- `assets/`: Static assets like images and fonts.
- `types/`: TypeScript type definitions.

---

## 2. Database Usage

The application uses a **PostgreSQL** database hosted on Supabase.

### Core Tables:
1.  **`users` / `profiles`**: Stores user information. There seems to be a migration from a simple `profiles` table to a more comprehensive `users` table with roles (CUSTOMER, KITCHEN_PARTNER, DELIVERY_PARTNER).
2.  **`kitchens`**: Stores information about home kitchens (partners), including location, rating, and status.
3.  **`menu_items` & `master_menu_items`**:
    -   `master_menu_items`: A standardized catalog of items.
    -   `menu_items`: Specific offerings from kitchens, linked to master items but with custom prices and availability.
4.  **`orders`**: Stores order details (user, kitchen, status, total amount).
5.  **`order_items`**: specific items within an order (linked to `menu_items`).
6.  **`addresses`**: User delivery addresses.
7.  **`coupons`**: Discount codes.
8.  **`service_zones`**: Geofencing for delivery areas.

### Security:
-   **Row Level Security (RLS)** is enabled on all major tables.
-   Policies generally allow public read access for kitchens and menus.
-   Write access is restricted to authenticated users for their own data (orders, addresses, profiles).

---

## 3. Order Flow Logic

The order process is primarily client-driven, which presents some risks.

1.  **Cart Management (`store/cartStore.ts`)**:
    -   Users add items to the cart.
    -   State is managed locally using Zustand.
    -   Price calculations (item total, addons) happen in the store.

2.  **Checkout (`app/cart/index.tsx`)**:
    -   The cart screen calculates the final bill, including:
        -   Delivery fee (hardcoded logic based on order value).
        -   Platform fee (hardcoded).
        -   Taxes (hardcoded).
        -   Coupon discounts (logic in `cartStore`).
    -   **Payment**: Currently simulated with a `setTimeout`.

3.  **Order Creation**:
    -   Once "payment" is successful, the client directly calls Supabase:
        1.  **Insert Order**: Creates a record in the `orders` table.
        2.  **Insert Items**: Iterates through cart items and inserts records into `order_items`.
    -   **Post-Order**:
        -   Cart is cleared.
        -   User is redirected to the success screen.

---

## 4. Scalability Risks

1.  **Client-Side Pricing & Logic**:
    -   **Risk**: Critical business logic (pricing, discounts, delivery fees) resides on the client. A malicious user could modify the code or network requests to alter prices or bypass payment.
    -   **Impact**: Financial loss and data inconsistency.

2.  **Lack of Atomicity**:
    -   **Risk**: The order creation involves two separate network requests (one for `orders`, one for `order_items`). If the second request fails (e.g., network drop), the system is left with an empty order.
    -   **Impact**: "Ghost orders" and operational confusion.

3.  **Inventory Management**:
    -   **Risk**: There is no check for item availability at the moment of purchase. If an item goes out of stock while the user is paying, the order will still proceed.
    -   **Impact**: Customer dissatisfaction and refunds.

4.  **Direct Database Access**:
    -   **Risk**: The app connects directly to the database for every operation.
    -   **Impact**: As the user base grows, the number of active connections could overwhelm the database, leading to performance degradation.

5.  **Search Performance**:
    -   **Risk**: The search functionality uses SQL `ILIKE` and fuzzy matching (`pg_trgm`).
    -   **Impact**: This is computationally expensive and will become slow as the number of menu items and kitchens grows into the thousands.

---

## 5. Suggested Improvements

1.  **Move Business Logic to Backend**:
    -   Use **Supabase Edge Functions** or **PostgreSQL Functions (RPC)** to handle order creation.
    -   The client should send `items` and `coupon_code` to the backend.
    -   The backend should verify prices, calculate totals, check inventory, and create the order and items in a single transaction.

2.  **Implement Transactions**:
    -   Ensure that inserting `orders` and `order_items` happens atomically. If one fails, both should roll back.

3.  **Server-Side Validation**:
    -   Never trust the price sent from the client. Always fetch the latest price from the database during order creation.

4.  **Optimized Search**:
    -   Implement a dedicated search engine (like Typesense or Meilisearch) or optimize Postgres Full Text Search (FTS) with proper indexing instead of simple fuzzy matching.

5.  **Caching Strategy**:
    -   Use a caching layer (e.g., Redis or React Query with aggressive stale times) for static data like Kitchen profiles and Menus to reduce database load.

6.  **Real Payment Integration**:
    -   Replace the simulated payment with a real Payment Gateway (e.g., Razorpay, Stripe) integrated via Edge Functions to ensure secure transaction verification.
