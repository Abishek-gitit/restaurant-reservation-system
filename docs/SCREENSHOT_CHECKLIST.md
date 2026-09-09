# Project Screenshots Capture Checklist (25 Verified Scenarios)

This checklist organizes all 25 visual demonstration artifacts required for the academic report, presentation slides, and submission documentation.

> **Note on Academic Integrity:**  
> Do **NOT** fabricate mock screenshots. Capture genuine screenshots from the running application at `http://localhost:5001/` and Postman using the verified demo accounts. Check each item off only after the image file is saved.

---

## Category 1: Authentication & User Access
- [ ] **Screenshot 1 — Customer & Staff Login Modal:**  
  *URL:* `http://localhost:5001/` (Click **Sign In / Demo**)  
  *Details to Capture:* Display quick demo login pills (`Customer`, `Kitchen Staff`, `Manager`, `Admin`), email and password inputs, and role switcher.
- [ ] **Screenshot 2 — Customer Registration Form:**  
  *URL:* `http://localhost:5001/` (Click **Create one here** in auth modal)  
  *Details to Capture:* Name, email, password, and phone number registration fields.

---

## Category 2: Customer Experience & Table Booking
- [ ] **Screenshot 3 — Customer Portal Overview & Branch Selector:**  
  *URL:* `http://localhost:5001/`  
  *Details to Capture:* Header with authenticated customer pill (`Demo Customer (CUSTOMER)`), branch selection dropdown (`Christ Central Campus Branch`), active status badge, seating capacity (120), and address.
- [ ] **Screenshot 4 — Menu Catalog & Category Filtering:**  
  *URL:* `http://localhost:5001/` (Click **Menu & Food Ordering**)  
  *Details to Capture:* Category filter buttons (`All`, `Starters`, `Main Course`, `Desserts`, `Beverages`), dish cards with prices, availability badges, and `+ Add to Order` buttons.
- [ ] **Screenshot 5 — Table Reservation Form:**  
  *URL:* `http://localhost:5001/` (Click **Table Reservations**)  
  *Details to Capture:* Table selection dropdown, date/time picker prefilled for future dining, duration selector (120 mins), guest count, and special requests field.
- [ ] **Screenshot 6 — Branch Table Seating Inventory Grid:**  
  *URL:* `http://localhost:5001/` (Right side of **Table Reservations**)  
  *Details to Capture:* Table cards showing table numbers and seating capacities (`T-1 (2 Guests)`, `T-2 (4 Guests)`, `T-3 (4 Guests)`, `T-4 (6 Guests)`, `T-5 (8 Guests)`).
- [ ] **Screenshot 7 — Successful Table Booking Notification:**  
  *URL:* `http://localhost:5001/`  
  *Details to Capture:* Green toast notification: `"Reservation confirmed successfully!"` and reservation card appearing in history.
- [ ] **Screenshot 8 — Reservation Conflict Engine Rejection:**  
  *URL:* `http://localhost:5001/`  
  *Details to Capture:* Attempting to book the same table during an overlapping time window; red toast displaying HTTP 409 conflict error: `"Table is already reserved for the requested time slot"`.

---

## Category 3: Food Ordering & Automated Billing
- [ ] **Screenshot 9 — Interactive Food Cart:**  
  *URL:* `http://localhost:5001/` (Right side of Menu)  
  *Details to Capture:* Dine-In / Takeaway radio selector, table selection dropdown, line items with quantity decrement/increment buttons (`-` and `+`).
- [ ] **Screenshot 10 — Server-Calculated Bill Preview:**  
  *URL:* `http://localhost:5001/`  
  *Details to Capture:* Financial breakdown showing Subtotal, Tax (5%), Service Charge (5%), and Grand Total.
- [ ] **Screenshot 11 — Order Placement Confirmation:**  
  *URL:* `http://localhost:5001/`  
  *Details to Capture:* Green toast: `"Order placed successfully! Bill generated."` and transition to My Orders view.
- [ ] **Screenshot 12 — Customer Order History & Tracking:**  
  *URL:* `http://localhost:5001/` (Click **My Orders & Bills**)  
  *Details to Capture:* Order card showing Order ID, timestamp, items, total bill, and active status badge (`PLACED`).
- [ ] **Screenshot 13 — Customer Reservation History & Cancellation:**  
  *URL:* `http://localhost:5001/` (Click **Reservation History**)  
  *Details to Capture:* Scheduled reservations list showing date, time, duration, and `Cancel Reservation` action button.
- [ ] **Screenshot 14 — Verified 5-Star Customer Feedback Modal:**  
  *URL:* `http://localhost:5001/` (Click **Rate Experience** on a completed order)  
  *Details to Capture:* Interactive 1–5 star rating picker, review textarea, and submit button.

---

## Category 4: Kitchen Display System (KDS)
- [ ] **Screenshot 15 — FIFO Kitchen Display Queue:**  
  *URL:* `http://localhost:5001/` (Click **Kitchen Display**)  
  *Details to Capture:* Active prep tickets sequenced with oldest tickets first, displaying Order ID, branch, order type (`Dine-In`), items, quantities, and status badge.
- [ ] **Screenshot 16 — Order Status Advancement Action:**  
  *URL:* `http://localhost:5001/`  
  *Details to Capture:* Button action transitioning status: `Advance to PREPARING →` and `Advance to READY →`.

---

## Category 5: Manager Dashboard & Analytics
- [ ] **Screenshot 17 — Executive Dashboard Metrics:**  
  *URL:* `http://localhost:5001/` (Logged in as Manager, click **Manager Dashboard**)  
  *Details to Capture:* 4 metric cards: Total Revenue (₹), Completed Orders, Average Rating (★), and Active Branches count.
- [ ] **Screenshot 18 — Top Selling Dishes Aggregation Report:**  
  *URL:* `http://localhost:5001/` (Manager Dashboard)  
  *Details to Capture:* Ranked list of dishes generated via MongoDB `$unwind` aggregation showing quantities sold and revenue generated.
- [ ] **Screenshot 19 — Peak Ordering Hours Aggregation Report:**  
  *URL:* `http://localhost:5001/` (Manager Dashboard)  
  *Details to Capture:* Hourly order density breakdown generated via MongoDB `$hour` aggregation for kitchen shift planning.
- [ ] **Screenshot 20 — Branch Operational Status Management:**  
  *URL:* `http://localhost:5001/` (Manager Dashboard)  
  *Details to Capture:* Branch administration table showing Branch Name, Address, Capacity, Status (`Active` / `Inactive`), and 1-click `Deactivate` / `Activate` buttons.

---

## Category 6: REST API & Postman Verification
- [ ] **Screenshot 21 — Postman Authentication Request (`POST /api/auth/login`):**  
  *Details to Capture:* Postman request body with credentials, 200 OK response with signed JWT token, and environment variable auto-set script.
- [ ] **Screenshot 22 — Postman Reservation Conflict Rejection (`POST /api/reservations`):**  
  *Details to Capture:* 409 Conflict response envelope with machine-readable `RESERVATION_CONFLICT` error code.
- [ ] **Screenshot 23 — Postman Order Status State Machine (`PATCH /api/orders/:id/status`):**  
  *Details to Capture:* Status update request with status history appended in the response body.
- [ ] **Screenshot 24 — Postman Itemized Billing Endpoint (`GET /api/orders/:id/bill`):**  
  *Details to Capture:* Itemized bill response showing subtotal, tax amount, service charge, and grand total.
- [ ] **Screenshot 25 — Automated Test Runner Terminal Output (`npm test`):**  
  *Details to Capture:* Terminal screenshot displaying all test modules passing: `TEST RESULTS: 149/149 PASSED (0 FAILURES)`.
