# Presentation Slide Deck: Final Academic Submission (14 Slides)

**Course:** 5th Semester B.Tech (Computer Science & Engineering)  
**Evaluation:** CIA-3 Project Evaluation & Viva Voce  
**Institution:** Christ University, Department of Computer Science & Engineering  
**Academic Year:** 2026–2027  
**Project Title:** Restaurant Table Reservation & Food Ordering System  
**Team Members:** [Student Name / Register Number Placeholder]  

---

## Slide 1 — Title & Project Identification
* **Project Title:** Restaurant Table Reservation & Food Ordering System (RestoHub)
* **Subtitle:** An Enterprise Multi-Branch Restaurant Management Platform with Real-Time Conflict Prevention and Workflow Automation
* **Institution:** Christ University, School of Engineering & Technology
* **Department:** Department of Computer Science and Engineering
* **Course & Semester:** B.Tech CSE — 5th Semester (CIA-3 Evaluation)
* **Team Members:** [Student 1: Name & Reg. No.] | [Student 2: Name & Reg. No.]
* **Technology Stack:** Node.js, Express.js, MongoDB, Mongoose ODM, JWT, bcrypt, HTML5/CSS3/Vanilla JavaScript

---

## Slide 2 — Problem Statement
* **Manual Table Allocations & Double-Bookings:** Traditional phone and logbook reservation systems suffer from frequent human scheduling errors and overlapping time-slot collisions.
* **Disconnected Kitchen Communications:** Physical paper order slips lead to misplaced tickets, uncoordinated preparation sequences, and zero audit timestamps.
* **Vulnerable Client-Side Billing:** Insecure applications that trust client-supplied totals or taxes expose restaurants to price manipulation and billing discrepancies.
* **Disjointed Multi-Branch Operations:** Branch managers lack centralized visibility into menu availability, active seating inventories, and branch operational statuses.
* **Absence of Unified Analytics:** Lack of automated data aggregation for identifying revenue trends, dish popularity, peak operational hours, and verified customer satisfaction.

---

## Slide 3 — Project Objectives
* **Automate Table Inventory & Reservations:** Provide an online reservation engine that eliminates double-bookings using mathematical time-interval conflict detection.
* **Implement Enforced Order Workflow:** Regulate order progression through a strict, deterministic state machine (`PLACED -> PREPARING -> READY -> SERVED/DELIVERED`).
* **Guarantee Financial Billing Integrity:** Perform 100% of price validations and tax/service charge calculations server-side.
* **Coordinate Kitchen Fulfillment:** Provide a Kitchen Display Queue displaying pending prep tickets in strict First-In, First-Out (**FIFO**) order.
* **Maintain Customer History & Verified Reviews:** Enable paginated tracking of dining history and restrict feedback submission strictly to completed orders.
* **Deliver Multi-Branch Executive Analytics:** Power manager dashboards with real-time MongoDB aggregation pipelines for revenue, top dishes, and peak hours.

---

## Slide 4 — Proposed Solution & Role-Based Architecture
* **Unified Web Platform:** A cohesive single-page application communicating with an enterprise Express REST API.
* **Core End-to-End Workflow:**
  $$\text{Customer Registration} \rightarrow \text{Branch Selection} \rightarrow \text{Menu Browsing} \rightarrow \text{Table Booking} \rightarrow \text{Food Ordering} \rightarrow \text{Kitchen Display} \rightarrow \text{Billing} \rightarrow \text{Feedback} \rightarrow \text{Analytics}$$
* **Role-Based Access Control (RBAC):**
  - **`CUSTOMER`:** Books tables, browses menu, places orders, tracks order progress, views itemized bills, submits verified ratings.
  - **`KITCHEN`:** Monitors FIFO preparation queue, updates prep status (`PLACED -> PREPARING -> READY`), with customer financial details sanitized.
  - **`MANAGER`:** Oversees branch-specific analytics (revenue, popular dishes, peak hours), manages table inventory, and toggles branch operational status.
  - **`ADMIN`:** Possesses global system oversight across all branches, users, inventory, and executive reports.

---

## Slide 5 — System Architecture
```text
Frontend (HTML5 + Responsive CSS3 + Modern JavaScript SPA)
                           │
                           ▼ (HTTP / JSON REST Calls)
Express.js Application Router (/api)
                           │
 ┌─────────────────────────┴─────────────────────────┐
 │               Middleware Pipeline                 │
 │  • CORS & Body Parsing                            │
 │  • Bearer JWT Authentication (jsonwebtoken)       │
 │  • Role-Based Authorization (RBAC)                │
 │  • Declarative Request Validation (Joi)           │
 └─────────────────────────┬─────────────────────────┘
                           ▼
Controllers Layer (HTTP Transport & Response Envelope Standardization)
                           │
                           ▼
Services Layer (Domain Business Logic, Calculations & Aggregations)
                           │
                           ▼
Data Access Layer (Mongoose ODM Schemas & Compound Indexing)
                           │
                           ▼
MongoDB Database (Document-Oriented Persistence)
```
* **Separation of Concerns:** Business rules reside entirely in isolated service classes, independent of HTTP controllers.
* **Centralized Error Handling:** Transforms all errors, validation faults, and duplicate keys into standardized `{ success: false, message, errorCode }` responses.

---

## Slide 6 — Database Design & Modeling Strategy
* **MongoDB Collections (7 Core Collections):** `users`, `branches`, `tables`, `menuItems`, `reservations`, `orders`, `feedback`.
* **Referenced Relationships (Normalized Entities):**
  - `User`, `Branch`, `Table`, and `MenuItem` are independent entities linked by `ObjectId` references to enable modular maintenance.
* **Embedded Structures (Denormalized Historical Snapshots):**
  - **`orderItemSchema` inside `Order`:** Embeds frozen copies of `name` and `unitPrice` at the exact moment of order placement. If menu prices change tomorrow, past customer bills remain 100% immutable.
  - **`statusHistorySchema` inside `Order`:** Embeds an immutable audit trail (`status`, `changedBy`, `changedAt`, `remarks`).
* **Active Verified Compound Indexes:**
  - `users: { email: 1 } UNIQUE`
  - `branches: { name: 1 } UNIQUE`
  - `tables: { branchId: 1, tableNumber: 1 } UNIQUE` (prevents duplicate tables within a branch)
  - `reservations: { tableId: 1, dateTime: 1 }` & `{ customerId: 1 }` (conflict detection & customer history)
  - `orders: { branchId: 1, status: 1, createdAt: 1 }` (FIFO kitchen queue index)
  - `orders: { customerId: 1, createdAt: -1 }` (chronological order history)
  - `feedback: { orderId: 1, customerId: 1 } UNIQUE` (enforces strictly one review per order)

---

## Slide 7 — Reservation Engine & Conflict Detection
* **Input Parameters:** Branch + Table + Date/Time + Duration (default: 120 mins) + Guest Count.
* **Server-Side Validations:**
  1. Target branch must be operationally active (`isActive: true`).
  2. Reservation timestamp must be strictly in the future ($T_{\text{start}} > \text{Current Time}$).
  3. Physical table capacity must accommodate the requested guest count.
* **Mathematical Interval Conflict Algorithm:**
  A proposed booking $[T_{\text{start}}, T_{\text{end}})$ conflicts with an existing booking $[R_{\text{start}}, R_{\text{end}})$ on the same table if and only if:
  $$T_{\text{start}} < R_{\text{end}} \quad \text{AND} \quad T_{\text{end}} > R_{\text{start}}$$
* **Cancelled Exclusion:** Reservations with `status: 'CANCELLED'` are strictly excluded from the query.
* **2-Hour Cancellation Cutoff Policy:**
  - If $\Delta T = T_{\text{reservation}} - \text{Now} \ge 120\text{ mins}$: Cancellation approved; table immediately re-enters available pool.
  - If $\Delta T < 120\text{ mins}$: Rejected with `409 CANCELLATION_WINDOW_EXPIRED` (Manager override supported).
* **Atomic Rescheduling:** Target time slot is verified for conflicts *before* the existing reservation document is modified.

---

## Slide 8 — Order Workflow State Machine
* **Deterministic Finite State Transitions:**
```text
                  ┌─────────────┐
                  │   PLACED    │
                  └──────┬──────┘
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
     ┌───────────┐               ┌───────────┐
     │ PREPARING │               │ CANCELLED │ (Terminal)
     └─────┬─────┘               └───────────┘
           │
           ▼
     ┌───────────┐
     │   READY   │
     └─────┬─────┘
           │
     ┌─────┴─────────────────────┐
     ▼ (DINE_IN)                 ▼ (TAKEAWAY)
┌──────────┐                ┌───────────┐
│  SERVED  │ (Terminal)     │ DELIVERED │ (Terminal)
└──────────┘                └───────────┘
```
* **State Machine Rules:**
  - Illegal shortcuts (e.g., jumping from `PLACED` directly to `SERVED`) are rejected with HTTP 409 `INVALID_STATUS_TRANSITION`.
  - Terminal states (`SERVED`, `DELIVERED`, `CANCELLED`) are immutable and cannot be updated.
  - Customers can only cancel orders while in the `PLACED` status.
  - Every transition atomically appends an entry to the embedded `statusHistory` array with the acting user's ID and timestamp.

---

## Slide 9 — Food Ordering & Server-Side Billing Engine
* **Order Modes:**
  - **`DINE_IN`:** Requires valid table selection within an active branch.
  - **`TAKEAWAY`:** Independent pickup order requiring no physical table assignment.
* **Server-Side Financial Integrity:**
  - The client submits item IDs and quantities only. Client-submitted prices and totals are completely ignored.
  - Unit prices are fetched directly from authoritative MongoDB `MenuItem` records.
* **Financial Formulation:**
  $$\text{LineTotal}_i = \text{UnitPrice}_i \times \text{Quantity}_i$$
  $$\text{Subtotal} = \sum_{i=1}^{n} \text{LineTotal}_i$$
  $$\text{TaxAmount} = \text{round}_2(\text{Subtotal} \times 0.05)$$
  $$\text{ServiceCharge} = \text{round}_2(\text{Subtotal} \times 0.05)$$
  $$\text{GrandTotal} = \text{Subtotal} + \text{TaxAmount} + \text{ServiceCharge}$$
* **Itemized Billing Endpoint:** `GET /api/orders/:id/bill` generates an itemized invoice. Kitchen personnel and unauthorized customers are denied access (`403 Forbidden`).

---

## Slide 10 — Kitchen Display System (KDS)
* **First-In, First-Out (FIFO) Processing:**
  - The kitchen queue fetches active tickets where `status IN ['PLACED', 'PREPARING']`.
  - Results are sorted strictly ascending by timestamp: `{ createdAt: 1 }`.
  ```text
  [TICKET #1] Order #C42  — 10:02 AM  (PLACED)     → Oldest: Prepare First!
  [TICKET #2] Order #D10  — 10:05 AM  (PREPARING)  → Next in Sequence
  [TICKET #3] Order #E88  — 10:08 AM  (PLACED)     → Queued
  ```
* **Data Sanitization & Privacy:**
  - Financial data (prices, taxes, bill totals) and sensitive customer information are omitted from kitchen payloads.
  - Displays only operational details: Table Number, Order Type, Item Names, Quantities, and Elapsed Time.
* **One-Click Progression:** Kitchen staff advance orders with single-click actions (`PLACED -> PREPARING -> READY`).

---

## Slide 11 — Customer & Manager Features
### Customer Portal
* **Live Menu Catalog:** Categorized dish browsing with filter pills (Starters, Main Course, Desserts, Beverages) and availability indicators.
* **Interactive Seating Browser:** Visual table cards showing capacities and real-time availability.
* **Order Tracking & Billing:** Real-time status display and detailed itemized receipts.
* **Verified Reviews:** 1–5 star ratings with comments restricted strictly to completed (`SERVED`/`DELIVERED`) meals.

### Manager Dashboard
* **Executive Performance Cards:** Real-time Gross Revenue, Completed Orders, Average Customer Rating, and Active Branches.
* **Operational Branch Control:** 1-Click branch deactivation toggle (`isActive: false`). Inactive branches immediately reject new bookings while preserving historical records.
* **Branch-Scoped Authorization:** Managers are scoped strictly to their assigned branch IDs (`managedBranchIds`), while administrators have system-wide visibility.

---

## Slide 12 — Analytics & MongoDB Aggregations
All reports are computed dynamically using native MongoDB aggregation pipelines with zero hardcoded values:

1. **Top Selling Dishes Report (`$unwind` + `$group`):**
   ```javascript
   Order.aggregate([
     { $match: { status: { $in: ['SERVED', 'DELIVERED'] } } },
     { $unwind: '$items' },
     { $group: { _id: '$items.menuItemId', name: { $first: '$items.name' }, quantitySold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
     { $sort: { quantitySold: -1 } },
     { $limit: 5 }
   ])
   ```
2. **Peak Ordering Hours Report (`$hour` + `$group`):**
   Extracts ordering timestamps grouped by hour of the day (`0–23`) to identify peak kitchen rush windows for shift planning.
3. **Branch Sales & Revenue Report (`$group` + `$sum`):**
   Aggregates subtotal, taxes, service charges, and realized revenue across completed transactions.
4. **Ratings Distribution Report:**
   Aggregates feedback counts and average scores (1 to 5 stars) from verified customer reviews.

---

## Slide 13 — Testing & Quality Assurance
* **Automated Integration Test Runner:** Native test suite executing against an isolated in-memory MongoDB instance.
* **Test Verification Summary:**
  ```text
  ==================================================
    TEST RESULTS: 149 / 149 ASSERTIONS PASSED
    FAILURES: 0 | SUCCESS RATE: 100%
  ==================================================
  ```
* **Coverage Highlights:**
  - **Auth & RBAC:** Password hashing, token generation, role verification, duplicate email rejection.
  - **Reservations:** Time-interval conflicts, adjacent slot availability, 2-hour cancellation cutoff, atomic reschedule.
  - **Orders & Billing:** Server price calculation, Dine-In vs Takeaway constraints, subtotal + 5% tax + 5% charge.
  - **State Machine:** Deterministic workflow validation, invalid transition rejection, terminal state immutability.
  - **Feedback:** Star bounds (1–5), ineligible order rejection, compound uniqueness duplicate rejection.
  - **Branch Deactivation:** Immediate blocking of new reservations and food orders on inactive units.

---

## Slide 14 — Conclusion & Future Scope
* **Conclusion:**
  - Successfully designed, implemented, tested, and documented an enterprise-grade restaurant management solution.
  - Delivers mathematical conflict prevention, server-enforced financial integrity, and FIFO kitchen queue processing.
  - Fully compliant with 5th-semester B.Tech CIA-3 academic requirements.
* **Future Scope (Clearly Distinguished from Current Implementation):**
  - *Payment Gateway Integration:* Real-time Razorpay / Stripe webhooks with transaction IDs.
  - *Bi-directional Real-Time Updates:* WebSocket (Socket.io) integration for instantaneous kitchen ticket chimes.
  - *Table QR Code Scanning:* Tabletop QR codes allowing customers to open their specific table's cart directly.
  - *SMS & WhatsApp Confirmations:* Automated booking alerts via Twilio API integration.
  - *AI Demand Forecasting:* Predictive ordering demand analysis based on historical peak hours.
