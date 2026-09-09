# Presentation Slide Deck Content (12 Slides)

**Course:** 5th Semester B.Tech (Computer Science & Engineering)  
**Evaluation:** CIA-3 Project Presentation  
**Project:** Restaurant Table Reservation & Food Ordering System  

---

### Slide 1: Title & Project Identification
* **Title:** RestoHub — Enterprise Table Reservation & Food Ordering System
* **Subtitle:** An Asynchronous, Conflict-Free Multi-Branch Restaurant Management Solution
* **Course:** 5th Semester B.Tech (CSE) — CIA-3
* **Technology Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt
* **Team Members:** [Student Name / Registration Number Placeholder]
* **Guide / Evaluator:** Department of Computer Science & Engineering, Christ University

---

### Slide 2: Problem Statement & Industry Need
* **Manual Table Double-Bookings:** Traditional phone and walk-in reservations suffer from high human error and table collisions.
* **Disconnected Kitchen Communications:** Paper tickets cause lost orders, delayed preparation, and zero timestamp tracking.
* **Vulnerable Client-Side Billing:** Insecure systems trust client-side prices or taxes, introducing financial discrepancies.
* **Lack of Real-Time Multi-Branch Analytics:** Management lacks visibility into dish popularity, peak operating hours, and branch revenue.

---

### Slide 3: Project Objectives
* **Autonomous Conflict Prevention:** Implement a mathematical interval algorithm to eliminate table double-bookings.
* **End-to-End Order Workflow State Machine:** Enforce deterministic transitions: `PLACED -> PREPARING -> READY -> SERVED/DELIVERED`.
* **Server-Side Financial Integrity:** Strict server-side automated computation of Subtotal, 5% Tax, and 5% Service Charge.
* **Role-Based Operational Workspaces:** Specialized portals for Customers, Kitchen Display (FIFO), and Branch Managers.

---

### Slide 4: Proposed Solution & Architecture
* **Layered MVC Architecture:**
  - **Routes & Middleware:** Authentication, Role-Based Access Control, Request Validation.
  - **Controllers:** HTTP transport management and standardized response formatting.
  - **Services:** Pure domain business logic, financial calculators, and state machine transitions.
  - **Data Access:** Mongoose models with compound unique indexing on MongoDB.
* **Secure RESTful API:** 30+ endpoints returning unified JSON response envelopes.

---

### Slide 5: The 13 Core Mandatory Modules
1. **Customer Authentication (JWT + bcrypt)**
2. **Menu Management (Branch-scoped)**
3. **Table Inventory Management**
4. **Table Reservation Engine**
5. **Food Order Placement (Dine-In & Takeaway)**
6. **Order Workflow State Machine**
7. **Kitchen Display System (FIFO Queue)**
8. **Automated Billing Engine (5% Tax + 5% Charge)**
9. **Reservation Cancellation (2-Hour Cutoff) & Rescheduling**
10. **Customer Order & Reservation History**
11. **Feedback & Rating System (1–5 Stars)**
12. **Branch Management & Deactivation**
13. **Manager Analytics & Aggregations**

---

### Slide 6: Database Design & Schema Engineering
* **MongoDB Collections:** `users`, `branches`, `tables`, `menuItems`, `reservations`, `orders`, `feedback`.
* **Embedded vs. Referenced Data Modeling:**
  - **Embedded:** Order line items (frozen name & unit price for audit immutability) and status audit history.
  - **Referenced:** Branches, tables, menus, and customers.
* **Targeted Indexing:**
  - `{ branchId: 1, tableNumber: 1 }` (Unique table numbers per branch)
  - `{ branchId: 1, status: 1, createdAt: 1 }` (High-speed FIFO kitchen queue)
  - `{ orderId: 1, customerId: 1 }` (Strict one-review-per-order rule)

---

### Slide 7: Algorithmic Innovations
* **Mathematical Conflict Detection:**
  $$\max(T_{\text{start}}, R_{\text{start}}) < \min(T_{\text{end}}, R_{\text{end}})$$
  Guarantees zero overlapping reservations on the same table while excluding cancelled bookings.
* **The 2-Hour Cancellation Cutoff:**
  Protects restaurant operations by requiring $\ge 120$ minutes notice; atomic rescheduling checks new slots prior to mutation.
* **Deterministic State Machine:**
  Eliminates illegal shortcuts; terminal states (`SERVED`, `DELIVERED`, `CANCELLED`) remain immutable.

---

### Slide 8: Customer & Kitchen Experience
* **Customer Portal:**
  - Live menu browsing with category filters (Starters, Main, Desserts, Beverages).
  - Instant table booking with dynamic capacity selection.
  - Interactive cart with live bill estimation and order placement.
* **Kitchen Display System (KDS):**
  - Live FIFO order queue showing pending tickets.
  - Single-click state advancements (`PLACED -> PREPARING -> READY`).

---

### Slide 9: Manager Analytics & Operations
* **Executive Performance Metrics:**
  - Real-time Gross Revenue computed from completed transactions.
  - Dynamic Average Customer Rating from verified feedback.
* **Native MongoDB Aggregations:**
  - **Top Selling Dishes:** Ranked by order volume and revenue generation.
  - **Peak Ordering Hours:** Hourly order density visualization for kitchen shift planning.
* **Branch Operational Controls:**
  - Instant branch activation/deactivation with automatic booking rejection.

---

### Slide 10: Security & Quality Assurance
* **Defense-in-Depth Security:**
  - Passwords hashed with bcrypt (10 salt rounds); excluded from JSON responses.
  - Signed JWT tokens with role claims; bearer token verification middleware.
  - Sensitive environment variables externalized into `.env`.
* **Automated Integration Testing:**
  - 149 comprehensive automated test assertions covering positive flows, edge cases, and role restrictions.
  - **149 / 149 Passing (100% Success Rate).**

---

### Slide 11: Live Demonstration Summary
* **Demo Sequence (7–10 Minutes):**
  1. Customer Login -> Branch Selection.
  2. Table Reservation -> Live Conflict Trigger (HTTP 409).
  3. Food Order -> Itemized Billing Breakdown.
  4. Kitchen Queue Transition -> Real-time FIFO processing.
  5. Terminal Status -> Verified 5-Star Customer Feedback.
  6. Manager Dashboard -> Real-time Aggregation Analytics & Branch Deactivation.

---

### Slide 12: Conclusion & Future Scope
* **Key Academic Outcomes:**
  - Successfully demonstrated enterprise MVC separation with robust NoSQL data modeling.
  - Delivered a reliable, conflict-free, role-governed restaurant system.
* **Future Roadmap:**
  - WebSockets (Socket.io) for instantaneous kitchen order chimes.
  - Online payment gateway integration (Razorpay / Stripe).
  - SMS / WhatsApp table booking notifications via Twilio.
