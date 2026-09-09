# Restaurant Table Reservation & Food Ordering System (Phase 5 — Final Submission)
**Course:** 5th Semester B.Tech (Computer Science & Engineering) — CIA-3  
**Institution:** Christ University  
**Technology Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, HTML5/CSS3/Vanilla JS  

---

## 1. Problem Statement
Traditional restaurant operations rely heavily on manual table assignments and disjointed ordering workflows. This leads to common operational bottlenecks:
* Overbooking or double-booking tables during peak dining hours.
* Inefficient table inventory utilization across physical restaurant branches.
* Inconsistencies between available physical seating and digital reservation records.
* Disorganized menu visibility and pricing updates across multiple locations.
* Security vulnerabilities due to lack of strict role separation between customers, floor managers, kitchen personnel, and administrators.
* Historical billing inaccuracy when future menu prices change after orders are placed.
* Communication gaps between dining tables, servers, and kitchen lines causing delayed food preparation and lost orders.
* Last-minute reservation cancellations leaving vacant tables with no recovery window.
* Lack of customer feedback loops tied specifically to verified completed dining experiences.
* Inability for branch managers to see revenue trends, popular dishes, peak demand hours, and customer satisfaction metrics for their assigned branches.
* Uncontrolled operational branch shutdowns causing lost bookings and unfulfilled orders.

This project delivers a multi-branch, scalable, and high-performance backend system that unifies real-time table inventory management, branch-specific menu administration, conflict-free table reservations, atomic food ordering, real-time FIFO kitchen queue display, strict order state machine workflow, automated multi-rate billing, policy-governed reservation cancellations, verified customer feedback, branch-scoped management with operational deactivation, and real-time MongoDB aggregation analytics under an enterprise-grade MVC architecture.

---

## 2. Project Objectives
* **Phase 1 Foundation**: Complete CRUD capabilities for branches, menus, table inventories, authentication, validation, and error handling.
* **Phase 2 Reservation Engine**: Table reservation conflict engine with end-time exclusivity, cancellation slot release, and customer ownership.
* **Phase 2 Food Ordering**: Atomic food ordering with item availability validation, cross-branch integrity, server-side price calculation, and embedded historical price snapshots.
* **Phase 3 Kitchen Display Queue**: Real-time FIFO active queue display (`createdAt ASC`) filtering for `PLACED` and `PREPARING` orders with customer personal information stripped.
* **Phase 3 Order Status Workflow**: Strict state machine enforcing valid transitions (`PLACED` -> `PREPARING` -> `READY` -> `SERVED`/`DELIVERED` or `PLACED` -> `CANCELLED`) with role-based transition authorization and full audit history.
* **Phase 3 Billing & Order Summary**: Centralized server-side billing calculation with 5% tax and 5% service charge (Dine-In) or 0% (Takeaway), itemized bills, and complete operational order summaries.
* **Phase 3 Reservation Cancellation & Rescheduling**: 2-hour academic cancellation policy (`CANCELLATION_WINDOW_EXPIRED` on $<2$ hours), immediate table slot release, and atomic rescheduling with pre-validation conflict checking.
* **Phase 4 Customer History**: Paginated order and reservation histories with date range, status, and branch filters (`page`, `limit`, `total`, `totalPages`).
* **Phase 4 Feedback & Rating Engine**: Verified 1–5 star ratings and reviews restricted strictly to completed orders (`SERVED` for Dine-In, `DELIVERED` for Takeaway), enforced 1 feedback per order compound uniqueness, and customer ownership.
* **Phase 4 Branch Management & Deactivation**: Operational deactivation flag (`isActive`) preventing new bookings/orders while preserving historical records with HTTP 409 `BRANCH_INACTIVE`.
* **Phase 4 Branch-Scoped Authorization**: Fine-grained RBAC scoping floor managers to assigned branches (`managedBranchIds`) while granting administrators global visibility.
* **Phase 4 Manager Analytics & Reports**: Real-time MongoDB aggregation pipelines for executive summary, sales revenue, popular dishes, order peak hours, reservation peak hours, and rating distributions.
* **Role-Based Access Control (RBAC)**: Enforce security using JWT authentication with distinct roles (`admin`, `manager`, `kitchen`, `customer`).
* **Relational Integrity via MongoDB References**: Link menu items, physical tables, reservations, orders, and feedbacks to their respective branches with compound index constraints.
* **Strict Server-Side Validation**: Validate all inputs using Joi schemas to prevent malformed queries or privilege escalations.
* **Centralized Operational Error Handling**: Guarantee consistent JSON responses across all HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500).
* **Viva & Academic Readiness**: Clear codebase separation adhering to standard software engineering principles for 5th-semester B.Tech CIA-3 evaluation.

---

## 3. Tech Stack
* **Runtime**: Node.js (v20+)
* **Web Framework**: Express.js (v4)
* **Database**: MongoDB with Mongoose ODM (v8)
* **Authentication**: JSON Web Tokens (`jsonwebtoken`)
* **Password Security**: Blowfish-based hashing via `bcryptjs` (salt rounds: 10)
* **Validation**: Declarative schema validation via `joi`
* **Configuration**: `dotenv` for environment isolation
* **Logging & CORS**: `morgan` (dev mode) and `cors`

---

## 4. Architecture & Request Pipeline

The project follows the Classic **MVC (Model-View-Controller)** design pattern tailored for RESTful APIs:

```text
Client Request (Postman / Browser / App)
                     │
                     ▼
           Express HTTP Pipeline
                     │
                     ▼
             Global Middleware
      (CORS, Body Parsers, Logger)
                     │
                     ▼
               Express Router
  (/api/auth, /api/branches, /api/feedback, /api/manager/reports, ...)
                     │
                     ▼
          Route-Level Middleware
    ├── validate(schema)          [Input Validation]
    ├── auth                      [JWT Verification]
    ├── authorize('role1', ...)   [RBAC Role Control]
    └── authorizeBranchAccess     [Branch-Scoped Control]
                     │
                     ▼
         Controllers & Services
  (Business Logic, Conflict Engine, Aggregations)
                     │
                     ▼
              Mongoose Models
       (Schema Validation, Indexes)
                     │
                     ▼
               MongoDB Server
```

---

## 5. System Modules

### Phase 1 Modules
1. **Authentication & Identity**:
   * Customer self-registration with automatic role enforcement.
   * Secure credential login returning signed JWT with identity claims.
   * Authenticated `/api/auth/me` profile retrieval.
2. **Branch Management**:
   * Multi-branch configuration with unique branch naming and seating capacities.
   * Cascading inventory cleanup on branch deletion.
3. **Menu Management**:
   * Branch-linked menu catalog across categories (Starters, Main Course, Desserts, Beverages).
   * Query filtering by branch ID and category.
4. **Table Inventory Management**:
   * Seating capacity and table configuration per branch.
   * Compound uniqueness guarantee ensuring table numbers are unique per branch.

### Phase 2 Modules
1. **Table Reservation Engine**:
   * Dynamic reservation creation for valid future time slots.
   * Real-time overlap conflict detection preventing double booking.
   * End-time exclusivity allowing back-to-back bookings.
   * Automatic slot release upon reservation cancellation.
2. **Reservation Ownership & Security**:
   * Customers can view, reschedule, or cancel only their own reservations.
   * Managers and admins can view and coordinate reservations across branches.
   * Reusable status transition engine (`CONFIRMED` -> `COMPLETED`, `CONFIRMED` -> `CANCELLED`).
3. **Food Order Placement**:
   * Support for both `DINE_IN` (linked to table/reservation) and `TAKEAWAY` orders.
   * Atomic menu item validation: checks existence, branch alignment, and item availability (`ITEM_UNAVAILABLE`).
   * Authoritative server-side price calculation (never trusting frontend prices).
   * Embedded item snapshots (`Order.items[]`) to preserve historical purchase prices.
4. **Customer History**:
   * Direct customer reservation history (`/api/customers/:id/reservations` & `/api/customers/reservations`).
   * Direct customer order history (`/api/customers/:id/orders` & `/api/customers/orders`).

### Phase 3 Modules
1. **Kitchen Display Queue (FIFO)**:
   * Dedicated endpoint (`/api/kitchen/orders`) for kitchen personnel and branch managers.
   * Filters active orders strictly in `PLACED` or `PREPARING` status, sorted chronologically (`createdAt ASC`).
   * Strips customer personal information (`customerId`, names, emails) while cleanly presenting table numbers, order types, item names, and quantities.
2. **Order Status Workflow & State Machine**:
   * Strict state progression enforcing restaurant kitchen reality.
   * `PLACED` $\to$ `PREPARING` $\to$ `READY` $\to$ `SERVED` (Dine-In) or `DELIVERED` (Takeaway).
   * Direct cancellation permitted only prior to cooking: `PLACED` $\to$ `CANCELLED`.
   * Complete audit trail with timestamps, acting user ID, and optional remarks recorded in `Order.statusHistory`.
3. **Automated Billing Engine & Order Summary**:
   * Authoritative itemized bill (`/api/orders/:id/bill`) and full operational summary (`/api/orders/:id/summary`).
   * Automatic application of 5% tax and 5% service charge for Dine-In orders (0% service charge for Takeaway).
   * Strict financial privacy preventing kitchen staff and unauthorized customers from viewing financial bills.
4. **Reservation Cancellation Policy & Atomic Rescheduling**:
   * 2-hour cancellation rule preventing last-minute customer cancellations (`CANCELLATION_WINDOW_EXPIRED`).
   * Administrative override allowing managers and admins to cancel reservations at any time.
   * Atomic slot release ensuring cancelled reservations immediately unlock table capacity.
   * Atomic reservation rescheduling (`/api/reservations/:id/reschedule`) validating conflicts on the new target slot *prior* to mutating original records.

### Phase 4 Modules
1. **Customer History & Pagination Module**:
   * Paginated order history (`/api/customers/orders` & `/:id/orders`) supporting page, limit, total, totalPages, and filters (`status`, `orderType`, `branchId`, date range `from` and `to`).
   * Paginated reservation history (`/api/customers/reservations` & `/:id/reservations`) supporting pagination and filters (`status`, `branchId`, `from`, `to`).
2. **Feedback & Rating Module**:
   * Verified feedback submission (`POST /api/feedback`) requiring order completion (`SERVED` for Dine-In, `DELIVERED` for Takeaway). Unfinished orders rejected with `409 ORDER_NOT_ELIGIBLE_FOR_FEEDBACK`.
   * Exactly 1 feedback per order enforced via MongoDB compound unique index `{ orderId: 1, customerId: 1 }`. Duplicate submissions rejected with `409 FEEDBACK_ALREADY_EXISTS`.
   * Strict 1 to 5 integer rating validation with optional 500-character comment.
   * Full CRUD operations (`GET`, `PUT`, `DELETE`, `GET /api/orders/:id/feedback`) with customer ownership checks.
3. **Branch Operational Management & Deactivation**:
   * Operational status toggle (`PUT /api/branches/:id/status` `{ isActive: Boolean }`).
   * Inactive branches reject new reservations and new food orders with `409 BRANCH_INACTIVE`, protecting staff from accepting bookings at closed branches while leaving all historical reporting intact.
4. **Branch-Scoped Authorization for Floor Managers**:
   * Managers are scoped to their assigned branches via `User.managedBranchIds`.
   * Cross-branch snooping rejected with `403 FORBIDDEN` / `BRANCH_ACCESS_DENIED`.
   * Admins maintain global unconstrained system-wide access.
5. **Manager Reports & Real-Time Analytics (MongoDB Aggregation Pipelines)**:
   * Executive Dashboard Summary (`GET /api/manager/reports/summary`).
   * Sales & Revenue Analytics (`GET /api/manager/reports/sales`).
   * Popular Dishes Ranking (`GET /api/manager/reports/popular-dishes`).
   * Order Peak Hours (`GET /api/manager/reports/peak-hours`).
   * Reservation Peak Hours (`GET /api/manager/reports/reservation-peak-hours`).
   * Customer Ratings & Feedback Distribution (`GET /api/manager/reports/ratings`).

---

## 6. Business Rules & Algorithms

### A. Reservation Overlap Conflict Detection
A table cannot have overlapping active reservations.
Given a new reservation request starting at `newStart` with duration `duration` (in minutes), the system computes:
$$\text{newEnd} = \text{newStart} + (\text{duration} \times 60000)$$

An existing active reservation overlaps with the requested time slot if and only if:
$$\text{existing.dateTime} < \text{newEnd} \quad \text{AND} \quad \text{existing.endTime} > \text{newStart}$$

Cancelled reservations (`status === 'CANCELLED'`) are strictly excluded from conflict queries (`status: { $ne: 'CANCELLED' }`), ensuring cancelled time slots immediately become available for other customers.

#### Postman & Test Suite Evidence (Section 29 Scenario):
1. **Request 1**: Table 1 at `19:00`, duration `90 mins` ($19:00 \to 20:30$) $\to$ **`201 Created`**.
2. **Request 2**: Same Table 1 at `19:30`, duration `60 mins` ($19:30 \to 20:30$) $\to$ **`409 Conflict`** (`RESERVATION_CONFLICT`).
3. **Request 3**: Same Table 1 at `20:30`, duration `60 mins` ($20:30 \to 21:30$) $\to$ **`201 Created`** (accepted due to end-time exclusivity).

### B. Order Validation & Financial Calculations
1. **Menu Item Availability**: Every requested item is checked against the database. If any item has `isAvailable: false`, the entire order is rejected with HTTP `400` and error code `ITEM_UNAVAILABLE`.
2. **Branch Validation**: Every menu item must belong to the requested branch; items from different branches are rejected.
3. **Quantity Bounds**: Each item must have an integer quantity between $1$ and $50$.
4. **Server-Side Calculations**:
   $$\text{lineTotal} = \text{unitPrice} \times \text{quantity}$$
   $$\text{subtotal} = \sum \text{lineTotal}$$

### C. Order Workflow & State Machine
```text
                  ┌───────────────┐
                  │    PLACED     │
                  └───────┬───────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    ┌───────────────┐           ┌───────────────┐
    │   PREPARING   │           │   CANCELLED   │
    └───────┬───────┘           │  (Terminal)   │
            ▼                   └───────────────┘
    ┌───────────────┐
    │     READY     │
    └───────┬───────┘
            │
     ┌──────┴──────┐
     ▼             ▼
┌─────────┐   ┌───────────┐
│ SERVED  │   │ DELIVERED │
│ (Dine-In│   │ (Takeaway │
│Terminal)│   │ Terminal) │
└─────────┘   └───────────┘
```
* **Role Permissions**:
  * Kitchen Staff (`kitchen`): Can advance `PLACED` $\to$ `PREPARING` and `PREPARING` $\to$ `READY`. Cannot mark as `SERVED` or `DELIVERED`.
  * Floor Staff (`manager`, `admin`): Can perform all transitions, including serving and delivery fulfillment.
  * Customers (`customer`): Prohibited from updating staff order status (returns `403 FORBIDDEN`).
* **Terminal States**: `SERVED`, `DELIVERED`, and `CANCELLED` cannot transition to any other status (returns `409 INVALID_STATUS_TRANSITION`).

### D. Centralized Multi-Rate Billing Engine
Billing totals are calculated authoritatively on the server side:

```text
Line Total = Unit Price × Quantity

Subtotal = Sum(Line Totals)

Tax = Subtotal × Tax Rate / 100

Service Charge = Subtotal × Service Charge Rate / 100  (DINE_IN only; 0 for TAKEAWAY)

Total = Subtotal + Tax + Service Charge
```

* **Central Tax Rate**: Configured centrally via `TAX_RATE` environment variable (default: `5%`).
* **Service Charge Rate**: Configured centrally via `SERVICE_CHARGE_RATE` environment variable (default: `5%`). Applies exclusively to `DINE_IN` orders to reflect sit-down table service; `TAKEAWAY` orders incur `0%` service charge.
* **Precision**: All financial calculations round to two decimal places (`Math.round(val * 100) / 100`) to avoid floating-point rounding inaccuracies.
* **Authoritative Security**: Client-supplied `totalAmount` or `subtotal` are discarded and computed strictly server-side.

### E. Reservation Lifecycle & Flows

#### 1. Creation Flow
```text
Create Reservation (POST /api/reservations)
       ↓
Validate Branch & Table Existence
       ↓
Verify Table Belongs to Selected Branch
       ↓
Verify Date/Time is in Future
       ↓
Check Conflict Query ({ tableId, dateTime < newEnd, endTime > newStart, status != 'CANCELLED' })
       ↓
Create Reservation Record (status: CONFIRMED, initial statusHistory appended)
       ↓
CONFIRMED
       ↓
COMPLETED (via Staff / Manager update)
```

#### 2. Cancellation Policy & Flow
```text
Customer / Staff calls PUT /api/reservations/:id/cancel
       ↓
Load Reservation (verify existence and ownership)
       ↓
Verify Current Status is not CANCELLED or COMPLETED
       ↓
If Customer: Check (reservation.dateTime - Date.now() >= 2 Hours)
       ├─ If < 2 Hours → Reject with 409 Conflict (CANCELLATION_WINDOW_EXPIRED)
       └─ If >= 2 Hours (or Staff/Manager) → Proceed
       ↓
Update status to CANCELLED and append audit statusHistory
       ↓
Table Slot Immediately Freed (Excluded from conflict query status != 'CANCELLED')
```

#### 3. Atomic Rescheduling Flow
```text
Customer / Staff calls PUT /api/reservations/:id/reschedule ({ dateTime, duration })
       ↓
Load Reservation & Verify Ownership
       ↓
Verify Reservation is not CANCELLED or COMPLETED
       ↓
Validate New Date/Time is in the Future
       ↓
Perform Overlap Conflict Check on New Slot (Excluding current reservation ID)
       ├─ If Overlap Exists → Reject with 409 Conflict (RESERVATION_CONFLICT)
       │                       (Original reservation remains completely unchanged!)
       └─ If Available → Update dateTime, duration, endTime, append statusHistory
       ↓
Reservation Successfully Rescheduled (200 OK)
```

---

## 7. MongoDB Design Decisions: References vs Embedding

### Why References?
* **`User`**, **`Branch`**, **`Table`**, **`MenuItem`**, **`Reservation`**, and **`Feedback`** are stored in separate collections linked by `ObjectId` references.
* **Avoid 16MB BSON Document Limit**: A busy branch accumulates thousands of orders, reservations, feedbacks, and table seatings. Embedding these in a single branch document would quickly breach MongoDB's 16MB size ceiling.
* **Independent Lifecycle**: Tables, menu items, feedbacks, and reservations are managed, updated, and queried independently without writing locks across an entire branch.
* **Indexed Queries**: Enables direct, compound-indexed queries on reservations (`{ tableId: 1, dateTime: 1 }`), orders (`{ branchId: 1, status: 1, createdAt: 1 }`), and feedbacks (`{ orderId: 1, customerId: 1 }`).

### Why Embedding for `Order.items[]` & `statusHistory[]`?
* **Historical Price Preservation**: In restaurants, menu item prices change over time (e.g. inflation, seasonal pricing). If an order only referenced `menuItemId`, changing the item's price next month would corrupt past financial records. Embedding `{ menuItemId, name, unitPrice, quantity, lineTotal }` freezes the exact purchase terms at the moment of order placement.
* **Audit Trail Immutability**: `Order.statusHistory[]` and `Reservation.statusHistory[]` are embedded within their parent records because state transitions are intrinsic properties of that single order or booking, requiring zero `$lookup` joins.

---

## 8. Complete API Documentation

| Method | Endpoint | Authentication | Allowed Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | None | Public | Service health & timestamp status |
| **POST** | `/api/auth/register` | None | Public | Register customer account |
| **POST** | `/api/auth/login` | None | Public | Authenticate user & receive JWT |
| **GET** | `/api/auth/me` | Bearer Token | Any Authenticated | Retrieve current user profile |
| **GET** | `/api/branches` | None | Public | List all restaurant branches |
| **POST** | `/api/branches` | Bearer Token | `admin`, `manager` | Create a new branch |
| **GET** | `/api/branches/:id` | None | Public | Retrieve branch details by ID |
| **PUT** | `/api/branches/:id` | Bearer Token | `admin`, `manager` | Update branch info (branch-scoped for manager) |
| **PUT** | `/api/branches/:id/status` | Bearer Token | `admin`, `manager` | Operational toggle (`isActive: Boolean`) |
| **DELETE**| `/api/branches/:id` | Bearer Token | `admin`, `manager` | Delete branch & cascade its items |
| **GET** | `/api/menu` | None | Public | List menu (supports `?branchId=&category=`) |
| **POST** | `/api/menu` | Bearer Token | `admin`, `manager` | Create new menu item in a branch |
| **GET** | `/api/menu/:id` | None | Public | Get single menu item details |
| **PUT** | `/api/menu/:id` | Bearer Token | `admin`, `manager` | Update menu item pricing/availability |
| **DELETE**| `/api/menu/:id` | Bearer Token | `admin`, `manager` | Delete a menu item |
| **GET** | `/api/tables` | None | Public | List tables (supports `?branchId=`) |
| **POST** | `/api/tables` | Bearer Token | `admin`, `manager` | Add new table to a branch |
| **GET** | `/api/tables/:id` | None | Public | Get table details by ID |
| **PUT** | `/api/tables/:id` | Bearer Token | `admin`, `manager` | Update table capacity |
| **DELETE**| `/api/tables/:id` | Bearer Token | `admin`, `manager` | Delete a table |
| **POST** | `/api/reservations` | Bearer Token | `customer`, `manager`, `admin` | Reserve table with conflict detection |
| **GET** | `/api/reservations` | Bearer Token | Any Authenticated | List reservations (customers see only own) |
| **GET** | `/api/reservations/:id` | Bearer Token | Any Authenticated | Get reservation by ID (ownership enforced) |
| **PUT** | `/api/reservations/:id` | Bearer Token | Any Authenticated | General reservation update |
| **PUT** | `/api/reservations/:id/cancel` | Bearer Token | Any Authenticated | Cancel reservation with 2-hour policy enforcement |
| **PUT** | `/api/reservations/:id/reschedule` | Bearer Token | Any Authenticated | Reschedule reservation with atomic conflict check |
| **DELETE**| `/api/reservations/:id` | Bearer Token | Any Authenticated | Cancel reservation (backward compatible) |
| **GET** | `/api/customers/reservations` | Bearer Token | `customer` | Paginated reservation history for logged-in user |
| **GET** | `/api/customers/:id/reservations`| Bearer Token | Any Authenticated | Customer reservation history (ownership enforced) |
| **GET** | `/api/kitchen/orders` | Bearer Token | `kitchen`, `manager`, `admin` | FIFO kitchen display queue (PLACED & PREPARING) |
| **POST** | `/api/orders` | Bearer Token | `customer`, `manager`, `admin` | Place Dine-in or Takeaway food order |
| **GET** | `/api/orders` | Bearer Token | Any Authenticated | List orders (customers see only own) |
| **GET** | `/api/orders/:id` | Bearer Token | Any Authenticated | Get order by ID (ownership enforced) |
| **PUT** / **PATCH** | `/api/orders/:id/status` | Bearer Token | `manager`, `kitchen`, `admin` | Advance order status along strict state machine |
| **GET** | `/api/orders/:id/bill` | Bearer Token | `customer`, `manager`, `admin` | Itemized bill with tax and service charge |
| **GET** | `/api/orders/:id/summary` | Bearer Token | `customer`, `manager`, `admin` | Operational summary with audit status history |
| **GET** | `/api/orders/:id/feedback` | Bearer Token | Any Authenticated | Retrieve feedback submitted for a specific order |
| **GET** | `/api/customers/orders` | Bearer Token | `customer` | Paginated order history for logged-in customer |
| **GET** | `/api/customers/:id/orders` | Bearer Token | Any Authenticated | Customer order history (ownership enforced) |
| **POST** | `/api/feedback` | Bearer Token | `customer` | Submit rating & review for completed order |
| **GET** | `/api/feedback/:id` | Bearer Token | Any Authenticated | Get feedback details by feedback ID |
| **PUT** | `/api/feedback/:id` | Bearer Token | `customer` | Update rating or comment (own feedback only) |
| **DELETE**| `/api/feedback/:id` | Bearer Token | `customer`, `admin` | Delete feedback (own or admin) |
| **GET** | `/api/manager/reports/summary` | Bearer Token | `manager`, `admin` | Executive dashboard KPI summary |
| **GET** | `/api/manager/reports/sales` | Bearer Token | `manager`, `admin` | Sales, completed orders & realized revenue report |
| **GET** | `/api/manager/reports/popular-dishes`| Bearer Token | `manager`, `admin` | Top selling dishes aggregated via `$unwind` |
| **GET** | `/api/manager/reports/peak-hours` | Bearer Token | `manager`, `admin` | Busiest ordering hours aggregated via `$hour` |
| **GET** | `/api/manager/reports/reservation-peak-hours` | Bearer Token | `manager`, `admin` | Busiest reservation hours aggregated via `$hour` |
| **GET** | `/api/manager/reports/ratings` | Bearer Token | `manager`, `admin` | Average rating & 1-5 star distribution report |

---

## 9. Database Collections & Index Rationale

```text
User
 ├── email: 1 (unique)

Branch
 ├── name: 1 (unique)

MenuItem
 ├── branchId: 1
 └── { branchId: 1, category: 1 }

Table
 ├── { branchId: 1, tableNumber: 1 } (unique per branch)
 └── branchId: 1

Reservation
 ├── { tableId: 1, dateTime: 1 }
 ├── { customerId: 1, dateTime: -1 }
 ├── { branchId: 1, dateTime: 1 }
 └── status: 1

Order
 ├── { customerId: 1, createdAt: -1 }
 ├── { branchId: 1, status: 1, createdAt: 1 }
 ├── reservationId: 1
 └── status: 1

Feedback
 ├── { orderId: 1, customerId: 1 } (unique)
 ├── { branchId: 1, createdAt: -1 }
 └── { customerId: 1, createdAt: -1 }
```

### Why Each Phase 4 Index Exists:

1. **`Feedback: { orderId: 1, customerId: 1 }` (Unique Constraint)**:
   * **Purpose**: Database-level guarantee that a customer can submit exactly one review per completed order.
   * **Explanation**: Prevents race conditions and double-submitting duplicate reviews for the same dining experience.

2. **`Feedback: { branchId: 1, createdAt: -1 }` (Manager Feedback & Ratings Report)**:
   * **Purpose**: Directly backs branch-scoped rating analytics (`GET /api/manager/reports/ratings`).
   * **Explanation**: Allows instantaneous filtering of reviews by branch and sorting by most recent.

3. **`Feedback: { customerId: 1, createdAt: -1 }` (Customer Review History)**:
   * **Purpose**: Powers customer profile review lookups.
   * **Explanation**: Enables quick reverse-chronological retrieval of a customer's submitted reviews.

1. **`Order: { branchId: 1, status: 1, createdAt: 1 }` (Kitchen Display Queue)**:
   * **Purpose**: This compound index directly backs `GET /api/kitchen/orders`.
   * **Explanation**: The kitchen queue queries orders filtered by `branchId`, filtered by active statuses (`status: { $in: ['PLACED', 'PREPARING'] }`), and sorted chronologically (`createdAt: 1` ASC for FIFO). Without this compound index, MongoDB would perform a collection scan and in-memory sort (`SORT_KEY_GENERATOR`), causing latency spikes under peak restaurant load. With this index, the query is a direct index scan with pre-sorted index order.

2. **`Order: { customerId: 1, createdAt: -1 }` (Customer Order History)**:
   * **Purpose**: Optimizes customer order history queries (`/api/customers/:id/orders`).
   * **Explanation**: Customers view their past orders sorted by newest first (`createdAt: -1`). The index satisfies both the filter (`customerId`) and sorting order without in-memory sort.

3. **`Reservation: { tableId: 1, dateTime: 1 }` (Overlap Conflict Engine)**:
   * **Purpose**: Essential for real-time table reservation conflict checks.
   * **Explanation**: When evaluating new bookings, the conflict engine queries reservations on a specific table (`tableId`) spanning the time range (`dateTime < newEnd` and `endTime > newStart`). This index restricts index bounds to the target table and quickly scans only the relevant date window.

4. **`Reservation: { customerId: 1, dateTime: -1 }` (Customer Reservation History)**:
   * **Purpose**: Powers customer reservation history lookups.
   * **Explanation**: Enables efficient reverse-chronological retrieval of a customer's active and historical reservations.

---

## 10. Installation & Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: Local MongoDB daemon, MongoDB Atlas, or use the automated embedded zero-config fallback.

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Copy the template and verify `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/restaurant_reservation
JWT_SECRET=super_secret_restaurant_jwt_key_2026_academic_project
JWT_EXPIRES_IN=1d
```

### Step 3: Seed Database
Populates users for all roles, branches, menu items, table inventories, sample reservations, and sample food orders:
```bash
npm run seed
```

### Step 4: Run the Application
Development server (with nodemon):
```bash
npm run dev
```
Production start:
```bash
npm start
```

### Step 5: Run Automated Integration Tests (149/149 Tests)
Execute the comprehensive end-to-end verification suite:
```bash
npm test
```

---

## 11. Seed Demo Credentials

| Role | Email | Password | Permissions | Assigned Branch |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@restaurant.com` | `Password@123` | Full system control | All Branches (Global) |
| **Manager** | `manager@restaurant.com` | `Password@123` | Branch, Menu, Table, Reports | Christ Central Campus Branch |
| **Kitchen** | `kitchen@restaurant.com` | `Password@123` | Kitchen display & status updates | Branch Kitchens |
| **Customer**| `customer@restaurant.com` | `Password@123` | Reservations, orders, reviews | Self Access |

---

## 12. Standardized Error Handling

All error responses strictly follow a uniform JSON structure:

```json
{
  "success": false,
  "message": "Human readable error description",
  "errorCode": "MACHINE_READABLE_CODE",
  "details": [] 
}
```

### Handled Scenarios:
* `VALIDATION_ERROR` (HTTP 400): Joi or Mongoose schema validation failure (e.g. past reservation date, negative quantity, rating not between 1 and 5).
* `INVALID_ID` (HTTP 400): Malformed MongoDB ObjectId in parameters.
* `ITEM_UNAVAILABLE` (HTTP 400): Attempting to order an unavailable menu item.
* `INVALID_DATE_RANGE` (HTTP 400): Malformed date query or from date later than to date.
* `UNAUTHORIZED` (HTTP 401): Missing, expired, or corrupted JWT token.
* `FORBIDDEN` (HTTP 403): Accessing another user's reservation/order/feedback, kitchen staff accessing billing, or customer modifying order status.
* `BRANCH_ACCESS_DENIED` (HTTP 403): Floor manager attempting to access or modify a branch outside their `managedBranchIds`.
* `NOT_FOUND` (HTTP 404): Resource or route does not exist.
* `CONFLICT` (HTTP 409): Duplicate key violation (e.g. duplicate email, duplicate table number in same branch).
* `BRANCH_INACTIVE` (HTTP 409): Attempting to create a reservation or place an order on an operationally deactivated branch (`isActive: false`).
* `ORDER_NOT_ELIGIBLE_FOR_FEEDBACK` (HTTP 409): Submitting feedback on an uncompleted order (only `SERVED` Dine-In and `DELIVERED` Takeaway orders are eligible).
* `FEEDBACK_ALREADY_EXISTS` (HTTP 409): Customer attempting to submit more than one feedback for the same completed order.
* `INVALID_STATUS_TRANSITION` (HTTP 409): Prohibited status changes (e.g. `PLACED` directly to `SERVED`, or mutating terminal states).
* `RESERVATION_CONFLICT` (HTTP 409): Table double-booking detected during overlapping time slot.
* `CANCELLATION_WINDOW_EXPIRED` (HTTP 409): Customer attempting to cancel within 2 hours of reservation time.
* `RESERVATION_ALREADY_CANCELLED` (HTTP 409): Attempting to cancel an already-cancelled reservation.
* `INTERNAL_SERVER_ERROR` (HTTP 500): Safe fallthrough message with internal logging.

---

## 13. Interactive Frontend Web Dashboard
A sleek, modern, zero-dependency single-page application is served directly by the Express server from the `public/` directory at:
```text
http://localhost:5001/
```

### Dashboard Capabilities:
1. **Authentication Portal:** One-click demo login buttons for Customer, Kitchen Staff, Manager, and Admin accounts; customer registration tab.
2. **Customer Portal:**
   - Active branch selector displaying real-time branch status (Active vs. Inactive) and seating capacities.
   - Categorized menu browser with category filter pills (**Starters**, **Main Course**, **Desserts**, **Beverages**) and dynamic availability indicators.
   - Interactive table reservation engine with automatic date/time pre-fill and live HTTP 409 conflict detection.
   - Live food cart calculating item totals, 5% tax, and 5% service charge with Dine-In (table selection) and Takeaway support.
   - Order history with live order cancellation (if `PLACED`) and 1–5 star experience feedback submission for `SERVED`/`DELIVERED` meals.
   - Reservation history with 2-hour policy cancellation enforcement.
3. **Kitchen Display System (KDS):**
   - Real-time display of active kitchen tickets (`PLACED`, `PREPARING`) sequenced in strict **FIFO order (oldest first)**.
   - Single-click order status advancement (`PLACED -> PREPARING -> READY`).
   - Branch filtering dropdown.
4. **Manager Analytics Dashboard:**
   - Live analytical metric cards: Gross Revenue, Completed Orders, Average Rating, and Active Branches.
   - Top-selling dishes breakdown with volume sold and revenue generated.
   - Peak ordering hours density analysis.
   - Branch administration table with 1-click active/inactive operational toggles.

---

## 14. Postman Collection & Environment
A complete, academic-grade Postman collection and environment are provided in `postman/`:
* **Collection:** [`postman/Restaurant_Reservation_API.postman_collection.json`](file:///Users/abishekks/Desktop/LNT/postman/Restaurant_Reservation_API.postman_collection.json)
* **Environment:** [`postman/Restaurant_Reservation_Environment.postman_environment.json`](file:///Users/abishekks/Desktop/LNT/postman/Restaurant_Reservation_Environment.postman_environment.json)

### Collection Folders (11 Structured Modules):
1. `01 Authentication` (Health Check, Register, Login, Current User)
2. `02 Branches` (Create, List, Get by ID, Status Toggle)
3. `03 Menu` (Create Item, List by Branch & Category)
4. `04 Tables` (Create Table, List by Branch)
5. `05 Reservations` (Create, Conflict Check, Consecutive Booking, List, Cancel, Reschedule)
6. `06 Orders` (Create Dine-In, Create Takeaway, List, Get by ID, Status Update)
7. `07 Kitchen` (FIFO Kitchen Queue, Filtered Queue)
8. `08 Billing` (Itemized Bill Calculation, Lifecycle Summary)
9. `09 Customer History` (Paginated Orders, Paginated Reservations)
10. `10 Feedback` (Submit Rating, Get by ID, Order Feedback, Update, Delete)
11. `11 Manager Reports` (Executive Summary, Sales & Revenue, Popular Dishes, Peak Hours, Ratings)

---

## 15. Comprehensive Documentation Directory (`docs/`)
All technical specifications, evaluation materials, presentation slides, and viva guides are compiled in `docs/`:
* [`docs/architecture.md`](file:///Users/abishekks/Desktop/LNT/docs/architecture.md): MVC design, component diagrams, middleware pipeline, and error handling flow.
* [`docs/database-design.md`](file:///Users/abishekks/Desktop/LNT/docs/database-design.md): Complete ER diagram, schema attributes, indexing matrix, and embedding vs. referencing rationale.
* [`docs/api-documentation.md`](file:///Users/abishekks/Desktop/LNT/docs/api-documentation.md): 30+ REST endpoints, parameters, envelopes, and error code dictionary.
* [`docs/business-rules.md`](file:///Users/abishekks/Desktop/LNT/docs/business-rules.md): Mathematical conflict formula, 2-hour cancellation rule, state machine table, and billing equations.
* [`docs/testing.md`](file:///Users/abishekks/Desktop/LNT/docs/testing.md): Automated testing matrix with 149 verified test assertions.
* [`docs/demo-runbook.md`](file:///Users/abishekks/Desktop/LNT/docs/demo-runbook.md): Step-by-step 7–10 minute live presentation runbook.
* [`docs/viva-questions.md`](file:///Users/abishekks/Desktop/LNT/docs/viva-questions.md): 28 curated viva questions and authoritative answers covering MongoDB, Node.js, and security.
* [`docs/PPT_CONTENT.md`](file:///Users/abishekks/Desktop/LNT/docs/PPT_CONTENT.md): 12 presentation slides tailored for 5th-semester project evaluation.
* [`docs/REPORT_CONTENT.md`](file:///Users/abishekks/Desktop/LNT/docs/REPORT_CONTENT.md): 20-section comprehensive academic project report.

---

## 16. Demo User Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@example.com` | `Customer@123` | Table reservations, food orders, personal history, feedback |
| **Kitchen Staff** | `kitchen@example.com` | `Kitchen@123` | Kitchen display FIFO queue, order status advancement |
| **Manager** | `manager@example.com` | `Manager@123` | Executive analytics, sales summaries, branch operations |
| **Admin** | `admin@example.com` | `Admin@123` | Global system administration & full CRUD oversight |

---

## 17. Final Project Acceptance Matrix

| Module | Requirement | Implemented | Tested | Documentation | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **1. Authentication** | Registration, bcrypt, JWT, RBAC | Yes | 149 Tests | Complete | **VERIFIED** |
| **2. Menu Management** | Branch scoping, pricing, availability | Yes | 149 Tests | Complete | **VERIFIED** |
| **3. Table Inventory** | Capacities, branch-scoped uniqueness | Yes | 149 Tests | Complete | **VERIFIED** |
| **4. Reservation Engine** | Conflict detection, past date checks | Yes | 149 Tests | Complete | **VERIFIED** |
| **5. Food Ordering** | Dine-In, Takeaway, server-side pricing | Yes | 149 Tests | Complete | **VERIFIED** |
| **6. Order Workflow** | State machine, terminal states, audit | Yes | 149 Tests | Complete | **VERIFIED** |
| **7. Kitchen Queue** | FIFO display, branch filtering | Yes | 149 Tests | Complete | **VERIFIED** |
| **8. Billing Engine** | Subtotal + 5% Tax + 5% Charge | Yes | 149 Tests | Complete | **VERIFIED** |
| **9. Cancellation** | 2-Hour cutoff rule, atomic reschedule | Yes | 149 Tests | Complete | **VERIFIED** |
| **10. Customer History** | Paginated orders & reservations | Yes | 149 Tests | Complete | **VERIFIED** |
| **11. Feedback** | 1–5 stars on completed orders, 1/order | Yes | 149 Tests | Complete | **VERIFIED** |
| **12. Branch Controls** | Operational deactivation, RBAC | Yes | 149 Tests | Complete | **VERIFIED** |
| **13. Analytics** | Native MongoDB aggregation reports | Yes | 149 Tests | Complete | **VERIFIED** |

---

## 18. Project Team Members & Academic Attribution
* **Institution:** Christ University, Department of Computer Science & Engineering
* **Course:** 5th Semester B.Tech (CSE) — Continuous Internal Assessment (CIA-3)
* **Team Members:**
  - *Student 1:* [Name Placeholder] — [Register Number Placeholder]
  - *Student 2:* [Name Placeholder] — [Register Number Placeholder]
* **Project Guide:** Department Faculty, School of Engineering and Technology


