# Viva Voce & Technical Examination Preparation Guide

**Project:** Restaurant Table Reservation & Food Ordering System  
**Subject:** 5th Semester B.Tech CIA-3 Project Evaluation  
**Curated Questions:** 28 Core Technical Questions & Authoritative Answers

---

## Category 1: MongoDB & Data Modeling

### Q1: Why did you choose MongoDB over a traditional relational database (RDBMS)?
**Answer:** MongoDB’s document model naturally mirrors hierarchical and nested domain objects such as customer orders with embedded line items and status audit histories. It provides dynamic schema evolution, high write throughput for rapid order placement, native support for nested arrays, and powerful aggregation pipelines for real-time analytical reporting without expensive relational multi-table JOINs.

### Q2: What is Mongoose and what benefits does it bring to this project?
**Answer:** Mongoose is an Object Data Modeling (ODM) library for Node.js. It provides schema definitions, strong type casting, built-in validation (e.g., minimum quantities, valid enums), pre/post lifecycle middleware hooks (such as computing `endTime` from `dateTime + duration`), and an intuitive query builder.

### Q3: When should documents be embedded vs. referenced in MongoDB?
**Answer:**
- **Embedded:** Used for data that is conceptually owned by the parent document and queried together, especially when a frozen snapshot in time is required. Example: `orderItemSchema` inside `Order`.
- **Referenced:** Used when entities have independent lifecycles, are modified independently, or have one-to-many relationships that could grow unboundedly. Example: `Branch`, `Table`, `MenuItem`, and `User`.

### Q4: Why are order items embedded in the Order document instead of just referencing Menu Items?
**Answer:** Historical and financial audit integrity. If a restaurant changes dish prices or renames a menu item tomorrow, past customer bills must never retroactively change. Embedding line items with frozen `name` and `unitPrice` guarantees that past financial records remain 100% immutable.

### Q5: What indexes did you implement and why?
**Answer:** We implemented indexes based on actual query patterns:
1. `users: { email: 1 } UNIQUE`: High-speed login lookup and duplicate prevention.
2. `branches: { name: 1 } UNIQUE`: Uniqueness of branch naming.
3. `tables: { branchId: 1, tableNumber: 1 } UNIQUE`: Prevents duplicate table numbers within the same branch.
4. `reservations: { tableId: 1, dateTime: 1 }`: Speeds up time-interval overlap queries for conflict detection.
5. `orders: { customerId: 1, createdAt: -1 }`: Optimizes customer order history sorting.
6. `orders: { branchId: 1, status: 1, createdAt: 1 }`: Optimizes the Kitchen Display System (FIFO queue).
7. `feedback: { orderId: 1, customerId: 1 } UNIQUE`: Enforces the one-review-per-order business rule at the database level.

### Q6: What is a MongoDB Aggregation Pipeline and where is it used here?
**Answer:** An aggregation pipeline is a multi-stage data processing framework where documents pass through sequential stages (`$match`, `$unwind`, `$group`, `$sort`, `$project`). In this system, it powers the Manager Analytics module to compute total revenue from completed orders, identify top-selling dishes by quantity and revenue, and calculate hourly ordering density (peak hours).

---

## Category 2: Backend Architecture & Node.js

### Q7: Why did you adopt an MVC / Layered architecture?
**Answer:** Layering separates concerns cleanly:
- **Routes:** Pure URI endpoints and HTTP verb declarations.
- **Middleware:** Cross-cutting concerns (authentication, RBAC, request validation).
- **Controllers:** HTTP transport management (extracting requests, returning JSON responses).
- **Services:** Pure domain logic and calculations, independent of HTTP.
- **Models:** Database schemas and persistence rules.  
This makes the codebase testable, modular, and maintainable.

### Q8: How does the Node.js Event Loop handle concurrent reservation requests?
**Answer:** Node.js runs on a single-threaded event loop utilizing asynchronous, non-blocking I/O. When a reservation request comes in, database queries are offloaded to MongoDB through libuv worker threads. When MongoDB responds, the callback/promise resumes on the event loop. Conflict detection queries and document saves run sequentially per connection.

### Q9: What is the purpose of centralized error handling middleware in Express?
**Answer:** In Express, any middleware with 4 arguments `(err, req, res, next)` acts as an error-handling middleware. Centralizing error handling ensures:
1. Consistent JSON error structure across all endpoints (`{ success: false, message, errorCode }`).
2. No uncaught exceptions crash the Node process.
3. Sensitive internal details (like file system stack traces) are hidden in production while operational errors are cleanly conveyed.

### Q10: What is the difference between a Controller and a Service?
**Answer:** A **Controller** speaks "HTTP" — it inspects headers, parameters, and formats HTTP response codes. A **Service** speaks "Domain Logic" — it calculates subtotals, checks time conflicts, validates state transitions, and interacts with models. Services can be invoked from unit tests or CLI scripts without mocking HTTP request/response objects.

---

## Category 3: Authentication & Security

### Q11: How does JSON Web Token (JWT) authentication work in this project?
**Answer:**
1. Upon successful login with bcrypt password verification, the server generates a digitally signed token using `jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })`.
2. The payload contains the user's `id`, `email`, and `role`.
3. The client includes this token in the `Authorization: Bearer <token>` header for subsequent requests.
4. `authMiddleware` intercepts the request, verifies the cryptographic signature with `jwt.verify()`, and attaches `req.user`.

### Q12: Why bcrypt for password hashing instead of SHA-256 or MD5?
**Answer:** MD5 and SHA-256 are fast cryptographic hashes designed for integrity checks; they are vulnerable to rainbow table attacks and high-speed GPU brute-forcing. **bcrypt** is a slow, computationally expensive, adaptive key derivation algorithm incorporating a random salt and configurable work factor (salt rounds: 10), making brute-force attacks infeasible.

### Q13: What is the difference between Authentication and Role-Based Authorization?
**Answer:**
- **Authentication** verifies *who you are* (e.g., verifying user email and password, issuing a JWT).
- **Authorization** determines *what you are allowed to do* based on assigned roles (e.g., only `MANAGER` or `ADMIN` can view sales reports or deactivate branches, while `KITCHEN` staff can only advance order states).

### Q14: How are passwords protected from leaking in API responses?
**Answer:** In Mongoose's schema options, we configure `toJSON` and `toObject` transforms that explicitly execute `delete ret.password` whenever documents are serialized to JSON. Additionally, user queries default to excluding the password field unless explicitly requested.

### Q15: How do you prevent sensitive configuration from being exposed to version control?
**Answer:** Sensitive credentials (database URIs, JWT secrets) are stored in `.env`, which is strictly ignored in `.gitignore`. A sanitized `.env.example` file is provided with empty placeholder keys for deployment guidance.

---

## Category 4: Core Business Logic & Algorithms

### Q16: Explain your algorithm for preventing table reservation conflicts.
**Answer:** Given a proposed booking $[T_{\text{start}}, T_{\text{end}})$, a conflict exists if any existing reservation $[R_{\text{start}}, R_{\text{end}})$ on the same table satisfies:
$$R_{\text{start}} < T_{\text{end}} \quad \text{AND} \quad R_{\text{end}} > T_{\text{start}}$$
Cancelled reservations (`status === 'CANCELLED'`) are excluded. We run this query against MongoDB; if the result count is $> 0$, the request is rejected with HTTP 409 `RESERVATION_CONFLICT`.

### Q17: How does the 2-Hour Reservation Cancellation Policy work?
**Answer:** When a customer requests cancellation, the server computes:
$$\Delta T = T_{\text{reservation}} - T_{\text{current}}$$
If $\Delta T < 120 \text{ minutes}$, the request is rejected with HTTP 400 `RESERVATION_CANCEL_CUTOFF`. If $\ge 120 \text{ minutes}$, the status updates to `CANCELLED`, freeing the table for other diners. (Managers possess administrative override permissions).

### Q18: What is "Atomic Rescheduling"?
**Answer:** When a customer requests a time or table change, the system checks whether the *new* slot is free **before** modifying the existing reservation. If the target slot has a conflict, the request is rejected and the original reservation remains completely intact with no data loss.

### Q19: Explain the Order Workflow State Machine.
**Answer:** The order lifecycle transitions through:
- `PLACED` -> `PREPARING`
- `PREPARING` -> `READY`
- `READY` -> `SERVED` (for Dine-In) or `DELIVERED` (for Takeaway)
- `PLACED` -> `CANCELLED`  
Terminal states (`SERVED`, `DELIVERED`, `CANCELLED`) cannot transition further. Illegal shortcuts (e.g., `PLACED` directly to `SERVED`) are rejected with HTTP 400 `INVALID_STATUS_TRANSITION`.

### Q20: Why must billing calculations always be executed server-side?
**Answer:** Security and fraud prevention. Clients cannot be trusted with monetary calculations. If the client computed the bill, a malicious actor could intercept the request and set prices or tax to ₹0. The server fetches authoritative prices from MongoDB, multiplies by quantities, computes 5% tax and 5% service charge, and saves the verified total.

### Q21: What are the business rules governing customer feedback?
**Answer:**
1. Only completed orders (`SERVED` or `DELIVERED`) can be reviewed.
2. Orders in `PLACED`, `PREPARING`, or `CANCELLED` are ineligible.
3. Rating must be an integer between 1 and 5.
4. Each order can only receive feedback once per customer, enforced by the compound unique index `{ orderId: 1, customerId: 1 }`.

### Q22: What happens when a branch is deactivated?
**Answer:** When `isActive` is set to `false`, the branch immediately rejects new table reservations and new food orders with HTTP 409 `BRANCH_INACTIVE`. However, historical orders, existing bookings, and financial reports remain completely accessible for auditing.

---

## Category 5: REST APIs & Code Quality

### Q23: What HTTP status codes does your API return and when?
**Answer:**
- `200 OK`: Successful retrieval or state update.
- `201 Created`: Successful resource creation (user, reservation, order).
- `400 Bad Request`: Input validation failure or illegal state transition.
- `401 Unauthorized`: Missing, expired, or invalid JWT.
- `403 Forbidden`: Authenticated user lacks required role/permissions.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Business rule collision (table double-booking, duplicate email/review).
- `500 Internal Server Error`: Unhandled server exception.

### Q24: What is the FIFO ordering queue in the Kitchen Display System?
**Answer:** The kitchen queue queries orders where `status IN ['PLACED', 'PREPARING']` sorted by `createdAt: 1` (ascending). This guarantees First-In, First-Out (FIFO) kitchen fulfillment, ensuring orders placed earliest are prepped first.

### Q25: How do you prevent Cross-Site Scripting (XSS) and SQL/NoSQL Injection?
**Answer:**
1. Mongoose schema definitions strictly enforce data types, rejecting non-object or non-string inputs.
2. User strings are trimmed and validated against whitelist regular expressions.
3. Password hashing prevents plaintext data breaches.
4. CORS middleware restricts cross-origin abuse.

### Q26: What testing methodology did you adopt?
**Answer:** We implemented automated integration testing via an automated test runner executing 149 test assertions across all 13 modules against an in-memory MongoDB daemon. Tests verify positive flows, negative constraints, role permissions, conflict detection, and state machine transitions.

### Q27: How does your frontend interact with the backend?
**Answer:** The frontend is a responsive single-page dashboard built with Vanilla JavaScript, HTML5, and CSS3, served directly as static assets from Express (`public/`). It communicates via asynchronous `fetch()` calls to RESTful `/api/*` endpoints, storing JWT tokens in `localStorage` and updating DOM states dynamically.

### Q28: What is the future scope of this project?
**Answer:** Future improvements could include:
1. Real-time WebSocket updates via Socket.io for instant kitchen order popups.
2. Payment gateway integration (Razorpay / Stripe) with webhooks.
3. SMS / WhatsApp booking confirmations via Twilio.
4. Multi-tenant support with custom branch theming and floor map drag-and-drop table layouts.
