# Project Demonstration Runbook (7–10 Minute Viva Script)

**Target Audience:** Project Examiners, Evaluators, and Viva Panelists  
**Duration:** 7 to 10 Minutes  
**Prerequisites:** Backend running on `http://localhost:5001`, browser open at `http://localhost:5001`.

---

## 1. Demo Credentials Quick Reference

| Role | Email | Password | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@example.com` | `Customer@123` | Table booking, cart, ordering, history, feedback |
| **Kitchen Staff** | `kitchen@example.com` | `Kitchen@123` | FIFO queue, preparing orders, state progression |
| **Manager** | `manager@example.com` | `Manager@123` | Real-time analytics, popular dishes, branch toggles |
| **Admin** | `admin@example.com` | `Admin@123` | System-wide configuration & oversight |

---

## 2. Step-by-Step Viva Presentation Sequence

### Step 1: Customer Authentication (0:00 – 1:00)
1. Open `http://localhost:5001` in your browser.
2. Click **"Sign In / Demo"** on the top right.
3. Click the **"Customer"** demo pill to auto-fill `customer@example.com` / `Customer@123`.
4. Click **Sign In**.
5. *Examiner Talking Point:* "Authentication uses bcrypt password hashing (10 rounds) and generates a signed JSON Web Token (JWT) with 7-day expiration. Passwords are never returned in responses."

---

### Step 2: Branch Selection & Menu Exploration (1:00 – 2:00)
1. In the **Customer Portal**, observe the branch selector showing **"Downtown Flagship (Active)"**.
2. Point out the live capacity (120 seats) and operational status badge.
3. Use category filter pills (**Starters**, **Main Course**, **Desserts**, **Beverages**) to browse dishes.
4. *Examiner Talking Point:* "Branches and menu items are dynamically linked via Mongoose ObjectId references. Inactive branches automatically disable new orders and reservations."

---

### Step 3: Table Reservation & Conflict Prevention Engine (2:00 – 3:30)
1. Click the **"Table Reservations"** sub-tab.
2. Select **Table #1 (4 Guests)**.
3. Set the date/time to tomorrow at 19:00 (7:00 PM), Duration: 120 minutes.
4. Click **Confirm Reservation**. Notice the immediate success toast!
5. **Show Conflict Prevention:** Attempt to book the *exact same Table #1* at 19:30 (during the active booking window).
6. Click **Confirm Reservation**. Notice the server cleanly returns HTTP 409: `"Table is already reserved for the requested time slot"`.
7. *Examiner Talking Point:* "Our conflict algorithm evaluates mathematical interval overlap $[T_{\text{start}}, T_{\text{end}}) \cap [R_{\text{start}}, R_{\text{end}}) \ne \emptyset$ in MongoDB, completely preventing double-bookings while excluding cancelled reservations."

---

### Step 4: Food Ordering & Server-Side Billing Engine (3:30 – 4:45)
1. Return to the **"Menu & Food Ordering"** sub-tab.
2. Select **Dine In**, pick **Table #1**, and add 2x Butter Chicken and 2x Garlic Naan to your cart.
3. Highlight the live billing summary on the right:
   - Subtotal: calculated from database unit prices
   - Tax: exactly 5%
   - Service Charge: exactly 5%
   - Grand Total: Subtotal + Tax + Service Charge
4. Click **Place Food Order**.
5. *Examiner Talking Point:* "Clients cannot manipulate bill totals. The server ignores any client-supplied price or tax and calculates everything securely against authoritative database records."

---

### Step 5: Kitchen Display System (KDS) & Order Workflow (4:45 – 6:15)
1. Click the **"Kitchen Display"** button in the top navigation bar.
2. (Optional: Switch login to Kitchen Staff via demo pill, or view in KDS view).
3. Observe the newly placed order displayed in the queue with a **PLACED** badge.
4. Point out the FIFO order sequencing (oldest orders first).
5. Click **"Advance to PREPARING →"**. The status updates to **PREPARING**.
6. Click **"Advance to READY →"**. The status updates to **READY**.
7. *Examiner Talking Point:* "The kitchen workflow enforces a deterministic state machine: `PLACED -> PREPARING -> READY -> SERVED/DELIVERED`. Illegal jumps (like skipping directly to SERVED) or attempts to modify completed orders are rejected with HTTP 400/409."

---

### Step 6: Customer Order History & 5-Star Feedback Submission (6:15 – 7:30)
1. Return to the **Customer Portal** -> **"My Orders & Bills"**.
2. Show the order status updated in real-time.
3. Once marked `SERVED`, click **"Rate Experience"**.
4. Select 5 stars, enter a comment: *"Exceptional food and swift service!"*, and submit.
5. Attempt to submit a second feedback on the same order: show that it is rejected due to the `{ orderId: 1, customerId: 1 }` unique constraint.
6. *Examiner Talking Point:* "Feedback is restricted strictly to completed orders. In-progress or cancelled orders cannot be reviewed, and each customer can only submit one rating per completed order."

---

### Step 7: Manager Analytics Dashboard (7:30 – 9:00)
1. Switch to the **Manager** account using the demo pill or sign in as `manager@example.com`.
2. Click **"Manager Dashboard"** in the top navigation bar.
3. Review the live analytics cards:
   - **Total Revenue:** Computed via MongoDB Aggregation `$group` pipeline on valid completed orders.
   - **Completed Orders:** Real count of SERVED & DELIVERED transactions.
   - **Average Rating:** Dynamically computed from the `feedback` collection.
4. Show the **Top Selling Dishes** breakdown (quantities and revenue).
5. Show the **Peak Ordering Hours** breakdown.
6. **Show Branch Deactivation:** Click **"Deactivate"** on a test branch. Demonstrate that the branch immediately turns red and rejects new bookings.
7. *Examiner Talking Point:* "All analytics utilize native MongoDB aggregation pipelines with `$match`, `$unwind`, and `$group` stages rather than loading unbounded arrays into Node.js memory."
