# Final Live Demonstration Script (7–10 Minute Presentation)

**Target Audience:** Project Evaluator, External Examiner, CIA-3 Review Panel  
**Allocated Time:** Exactly 7 to 10 Minutes  
**Application URL:** `http://localhost:5001/`  
**Prerequisites:** Backend server running (`node server.js` or `npm run dev`) on port 5001 with seeded data.

---

## Presentation Timeline Overview

```text
[0:00 - 1:00]  Introduction & Architectural Overview
[1:00 - 2:00]  Customer Authentication & Branch Navigation
[2:00 - 3:30]  Table Reservation & Real-Time Conflict Detection
[3:30 - 5:00]  Menu Catalog, Food Ordering & Server-Side Billing
[5:00 - 6:30]  Kitchen Display System (KDS) & State Machine Transitions
[6:30 - 7:30]  Customer Order Tracking, Itemized Bill & 5-Star Feedback
[7:30 - 9:00]  Manager Dashboard & MongoDB Aggregation Analytics
[9:00 - 10:00] Technical Defense: Security, NoSQL Modeling & 149/149 Test Suite
```

---

## Detailed Step-by-Step Script & Talking Points

### 0:00 – 1:00 | Introduction & Architectural Overview
* **Action:** Stand by the laptop/projector with the browser displaying the home page at `http://localhost:5001/`.
* **Spoken Script:**  
  > *"Good morning, esteemed examiners. Today we present **RestoHub**, an enterprise-grade Table Reservation and Food Ordering System built for multi-branch restaurant chains.*  
  > *Traditional restaurants suffer from three critical bottlenecks: table double-bookings during peak hours, lost order communications between dining tables and kitchens, and insecure client-side billing calculations.*  
  > *To resolve these challenges, we engineered a layered Model-View-Controller (MVC) architecture on Node.js, Express.js, and MongoDB. The system features a mathematical interval conflict detection engine, an enforced order state machine, authoritative server-side billing, and real-time MongoDB aggregation analytics. Let us walk through the complete live customer-to-kitchen-to-manager workflow."*

---

### 1:00 – 2:00 | Customer Authentication & Branch Navigation
* **Action:**
  1. Click the **"Sign In / Demo"** button on the top right.
  2. Click the **"Customer"** quick demo pill (auto-fills `customer@example.com` / `Customer@123`).
  3. Click **"Sign In"**. Show the welcome toast and the authenticated user pill: `👤 Demo Customer (CUSTOMER)`.
  4. Inspect the **Branch Selector**: switch between `Christ Central Campus Branch` (120 seats) and `Christ Kengeri Campus Branch` (90 seats).
* **Spoken Script:**  
  > *"We begin by authenticating as a customer. Passwords are encrypted using bcrypt with 10 salt rounds and verified against MongoDB. Upon successful login, the server issues a digitally signed JWT bearer token with a 7-day expiration. Notice that passwords are never returned in any response.*  
  > *The system supports multi-branch operations. Each branch maintains independent seating capacities, menus, and table inventories linked via Mongoose ObjectId references."*

---

### 2:00 – 3:30 | Table Reservation Engine & Real-Time Conflict Detection
* **Action:**
  1. Click the **"Table Reservations"** tab.
  2. Point out the physical tables displayed on the right: `T-1 (2 Guests)`, `T-2 (4 Guests)`, etc.
  3. In the booking form, select **Table #1 (2 seats)**. Set Date/Time to tomorrow at 19:00 (7:00 PM), Duration: 120 minutes, Guests: 2.
  4. Click **"Confirm Reservation"**. Show the green success toast: *"Reservation confirmed successfully!"*.
  5. **Demonstrate Conflict Detection:** Immediately select **Table #1** again, but set the start time to 19:30 (during the active booking window).
  6. Click **"Confirm Reservation"**. Point to the red toast error: **"Table is already reserved for the requested time slot"** (HTTP 409).
* **Spoken Script:**  
  > *"Now we demonstrate our autonomous Reservation Engine. When booking, the server verifies that the branch is active, the timestamp is in the future, and table capacity is sufficient.*  
  > *To prevent double-bookings, our backend executes a mathematical time-interval overlap algorithm: a conflict occurs if $T_{\text{start}} < R_{\text{end}}$ and $T_{\text{end}} > R_{\text{start}}$. As you see on screen, booking Table 1 at 19:30 during the 19:00–21:00 window was immediately rejected with HTTP 409 Conflict. Furthermore, cancelled reservations are automatically excluded from conflict checks."*

---

### 3:30 – 5:00 | Menu Browsing, Ordering & Server-Side Billing Engine
* **Action:**
  1. Switch to the **"Menu & Food Ordering"** tab.
  2. Click the category filter pills: `Starters`, `Main Course`, `Desserts`, `Beverages`.
  3. Select **Dine In** and choose **Table #1**.
  4. Add items to cart:
     - 1x Crispy Corn Pepper Salt (₹180.00)
     - 1x Chicken Tikka Biryani (₹340.00)
     - 1x Royal Rasmalai (₹160.00)
     - 1x Fresh Mint Lime Soda (₹90.00)
  5. Point out the live billing breakdown on the right:
     - Subtotal: ₹770.00
     - Tax (5%): ₹38.50
     - Service Charge (5%): ₹38.50
     - **Grand Total: ₹847.00**
  6. Click **"Place Food Order"**. Show the success toast: *"Order placed successfully! Bill generated."*.
* **Spoken Script:**  
  > *"Next, the customer places a food order. The frontend displays dishes categorized with live availability flags.*  
  > *A critical security requirement is that **all financial calculations are performed exclusively on the server**. The client sends only item IDs and quantities. The backend pulls authoritative prices directly from MongoDB, computes the subtotal, adds exactly 5% tax and 5% service charge, and returns the verified total. Client-side price tampering is impossible."*

---

### 5:00 – 6:30 | Kitchen Display System (KDS) & Order State Machine
* **Action:**
  1. Click **"Kitchen Display"** in the top navigation bar.
  2. (Optional: click **Logout** and use the **Kitchen Staff** pill, or view in KDS mode).
  3. Show the newly created order ticket displayed in the queue with status **`PLACED`**.
  4. Explain that tickets are sequenced in strict **FIFO order (oldest first)** via `createdAt: 1`.
  5. Click **"Advance to PREPARING →"**. Observe the status change to **`PREPARING`**.
  6. Click **"Advance to READY →"**. Observe the status change to **`READY`**.
  7. Advance the order to **`SERVED`**.
* **Spoken Script:**  
  > *"Now we switch to the Kitchen Display System (KDS). Notice that all customer personal information and billing numbers have been stripped to protect privacy.*  
  > *The kitchen queue enforces a strict First-In, First-Out sequence so the oldest orders are prepared first. Furthermore, our backend enforces a deterministic finite state machine: `PLACED -> PREPARING -> READY -> SERVED`. Any illegal jumps, such as jumping directly from `PLACED` to `SERVED`, are rejected by the server, and terminal states cannot be modified."*

---

### 6:30 – 7:30 | Customer Order Tracking, Bill & Verified Feedback
* **Action:**
  1. Return to the **Customer Portal** $\rightarrow$ Click **"My Orders & Bills"**.
  2. Show the order status now displaying **`SERVED`** with the itemized breakdown.
  3. Click **"Rate Experience"** on the served order.
  4. In the modal, select **5 Stars**, enter comment: *"Superb biryani and timely service!"*, and click **Submit Feedback**.
  5. Show the green confirmation toast.
* **Spoken Script:**  
  > *"Back in the Customer Portal under 'My Orders & Bills', the customer sees their completed meal. Because the order reached the terminal `SERVED` state, the 'Rate Experience' button became active.*  
  > *Our business rules permit feedback **only** on completed orders. Furthermore, our MongoDB compound unique index on `orderId` and `customerId` guarantees that a customer can only submit one review per order."*

---

### 7:30 – 9:00 | Manager Dashboard & MongoDB Aggregation Analytics
* **Action:**
  1. Click **Logout** on the top right. Click **Sign In / Demo** $\rightarrow$ Click the **"Manager"** demo pill $\rightarrow$ Click **"Sign In"**.
  2. The view switches to the **Manager Dashboard**. Click **"Refresh Analytics"**.
  3. Point out the 4 Executive Metric Cards:
     - **Total Revenue (₹)**
     - **Completed Orders**
     - **Average Rating (★)**
     - **Active Branches**
  4. Highlight the **Top Selling Dishes** list (shows dishes ranked by quantity and revenue).
  5. Highlight the **Peak Ordering Hours** breakdown (shows hourly distribution).
  6. In the **Branch Management table**, click **"Deactivate"** on Christ Kengeri Campus Branch. Show that its badge turns red (`Inactive`), and explain that it immediately rejects new reservations and orders.
* **Spoken Script:**  
  > *"We now log in as the Branch Manager. The Manager Dashboard provides executive oversight. Every metric here is powered by **native MongoDB aggregation pipelines**, not hardcoded values.*  
  > *Top Selling Dishes uses `$unwind` on the embedded line items and `$group` by dish ID. Peak Ordering Hours uses `$hour` to extract ordering density for kitchen shift planning. In the branch table below, managers can toggle operational status; deactivating a branch immediately rejects any new table bookings while preserving all historical records."*

---

### 9:00 – 10:00 | Technical Defense & Quality Summary
* **Action:**
  1. Display the terminal running `npm test` or highlight the test summary.
  2. Summarize key technical achievements.
* **Spoken Script:**  
  > *"To ensure enterprise robustness, our system includes an automated integration test suite covering all 13 modules. A single execution of `npm test` runs **149 assertions with 149 passing and 0 failures**, validating everything from JWT authentication and interval conflict detection to state machine transitions and branch scoping.*  
  > *In summary, RestoHub delivers an integrated, secure, and fully verified solution for restaurant table reservations and food ordering. We are now ready to take questions from the panel. Thank you."*
