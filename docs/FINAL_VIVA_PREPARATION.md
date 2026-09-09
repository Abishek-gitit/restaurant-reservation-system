# Comprehensive Viva Voce Preparation Guide (35 Core Questions & Authoritative Answers)

**Course:** 5th Semester B.Tech (Computer Science & Engineering) — CIA-3 Evaluation  
**Project:** Restaurant Table Reservation & Food Ordering System  

---

## Category 1: Basic Project Questions

### Q1: What is your project and what does it do?
**Answer:** RestoHub is an enterprise restaurant management platform that coordinates the complete dining lifecycle: online table reservations with automated conflict detection, categorized menu browsing, Dine-In and Takeaway food ordering, server-calculated billing (5% tax + 5% service charge), a First-In, First-Out (FIFO) Kitchen Display System, verified post-dining reviews, and real-time MongoDB aggregation analytics across multi-branch chains.

### Q2: Why did you choose this project for CIA-3?
**Answer:** Because it addresses real-world operational and concurrency bottlenecks in the hospitality industry—specifically table double-bookings, uncoordinated kitchen communications, and insecure client-side billing calculations—while providing an ideal domain to demonstrate enterprise MVC architecture, asynchronous Node.js execution, and complex NoSQL data modeling.

### Q3: What core problem does it solve for restaurant owners?
**Answer:** It eliminates human error in scheduling table bookings through mathematical interval checks, removes lost kitchen tickets via an automated FIFO display queue, prevents revenue leakage through server-authoritative billing, and provides managers with real-time analytics on revenue and peak dining hours.

### Q4: What are the 13 mandatory modules implemented in this project?
**Answer:**
1. Customer Registration & Authentication
2. Branch Menu Management
3. Table Inventory Management
4. Table Reservation Engine
5. Food Order Placement
6. Order Status Workflow State Machine
7. Kitchen Display System (FIFO Queue)
8. Server-Side Automated Billing
9. Reservation Cancellation & Rescheduling
10. Customer Order & Reservation History
11. Feedback & Rating System
12. Multi-Branch Operations & Deactivation
13. Manager Analytics & Aggregation Reports

---

## Category 2: MongoDB & Data Modeling

### Q5: Why did you choose MongoDB over a traditional SQL database?
**Answer:** MongoDB’s document model naturally accommodates hierarchical, document-centric structures like customer orders with embedded line items and immutable status audit trails. It provides high write throughput for rapid order placement, dynamic schema flexibility, and powerful aggregation pipelines that compute real-time sales and peak hour analytics without multi-table relational joins.

### Q6: What is a collection and a document in MongoDB?
**Answer:** A **collection** is analogous to an SQL table; it is a grouping of MongoDB documents. A **document** is a BSON data record (analogous to an SQL row) composed of field-value pairs that can contain nested arrays and embedded subdocuments.

### Q7: Why did you use Mongoose ODM instead of the native MongoDB driver?
**Answer:** Mongoose provides strict schema definitions, type casting, declarative validation (e.g. minimum price $>0$, valid status enums), lifecycle middleware hooks (like pre-validation calculation of `endTime` from `dateTime + duration`), and an intuitive query builder that eliminates boilerplate validation.

### Q8: Why are order items embedded inside the Order document instead of referenced?
**Answer:** For **historical and financial audit integrity**. If a restaurant changes dish prices or renames a menu item tomorrow, past customer bills must never retroactively change. Embedding line items with frozen `name` and `unitPrice` at the moment of order placement guarantees that past financial transactions remain 100% immutable.

### Q9: Why did you use references for Users, Branches, Tables, and Menu Items?
**Answer:** Because these entities have independent lifecycles, maintenance routines, and unbounded one-to-many relationships. Referencing them via Mongoose `ObjectId` prevents data duplication and keeps documents compact.

### Q10: What indexes did you implement and why?
**Answer:** We implemented indexes based on high-frequency query patterns:
1. `users: { email: 1 } UNIQUE`: High-speed authentication lookup and duplicate email prevention.
2. `branches: { name: 1 } UNIQUE`: Unique branch naming.
3. `tables: { branchId: 1, tableNumber: 1 } UNIQUE`: Prevents duplicate table numbers within the same branch.
4. `reservations: { tableId: 1, dateTime: 1 }`: Fast time-interval overlap queries for conflict detection.
5. `orders: { branchId: 1, status: 1, createdAt: 1 }`: Optimizes the Kitchen Display System (FIFO queue).
6. `orders: { customerId: 1, createdAt: -1 }`: Optimizes chronological customer order history.
7. `feedback: { orderId: 1, customerId: 1 } UNIQUE`: Enforces the one-review-per-order business rule at the database level.

---

## Category 3: Backend Architecture & Node.js

### Q11: Why did you choose Node.js?
**Answer:** Node.js features an asynchronous, event-driven, non-blocking I/O architecture running on the single-threaded V8 engine. It excels at concurrent I/O-heavy workloads—such as handling multiple simultaneous reservation requests and kitchen queue updates—with low memory footprint.

### Q12: Why Express.js?
**Answer:** Express is a fast, unopinionated, minimalist web framework for Node.js. It provides robust routing, a composable middleware pipeline for authentication and validation, and straightforward error-handling mechanics.

### Q13: What is Express middleware and what middleware did you build?
**Answer:** Middleware functions are functions that have access to the request (`req`), response (`res`), and the `next` function in the application's request-response cycle. We implemented:
- `auth.js`: Verifies Bearer JWT tokens and attaches `req.user`.
- `authorize.js`: Enforces Role-Based Access Control (`admin`, `manager`, `kitchen`, `customer`).
- `validate.js`: Validates request bodies, params, and queries against Joi schemas.
- `authorizeBranchAccess.js`: Restricts branch managers strictly to their assigned branches.
- `errorHandler.js`: Centralized 4-argument middleware formatting uniform JSON errors.

### Q14: Explain your Layered MVC architecture.
**Answer:**
- **Routes:** Declare URI paths and map them to middleware and controllers.
- **Controllers:** Manage HTTP transport—extracting parameters and returning standardized JSON envelopes.
- **Services:** Contain pure, reusable domain business logic, independent of HTTP.
- **Models:** Define Mongoose schemas, data types, and database constraints.

### Q15: What is a REST API and why use standardized response envelopes?
**Answer:** REST (Representational State Transfer) is an architectural style utilizing stateless client-server communication and standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). Standardized response envelopes (`{ success, statusCode, message, data }` or `{ success, statusCode, message, errorCode }`) ensure that API consumers always receive predictable structures, simplifying client error handling.

---

## Category 4: Authentication & Security

### Q16: What is a JSON Web Token (JWT)?
**Answer:** A JWT is an open standard (RFC 7519) for securely transmitting information between parties as a compact, digitally signed JSON object. It consists of three base64url-encoded parts separated by dots: Header, Payload (claims like user ID and role), and Signature.

### Q17: How does JWT authentication work in your application?
**Answer:**
1. The user logs in with email and password.
2. The server verifies the password using `bcrypt.compare()`.
3. The server signs a JWT using HMAC-SHA256 with an environment secret (`JWT_SECRET`) and a 7-day expiry, returning it to the client.
4. For protected routes, the client sends the token in the `Authorization: Bearer <token>` header.
5. `auth.js` middleware validates the signature, extracts the user ID, verifies the user still exists, and attaches `req.user`.

### Q18: Why use bcrypt instead of MD5 or SHA-256 for passwords?
**Answer:** MD5 and SHA-256 are fast hash functions designed for data integrity; they can be brute-forced at billions of hashes per second using GPUs. **bcrypt** is an adaptive, slow, Blowfish-based key derivation function incorporating a random salt and configurable work factor (salt rounds: 10). It protects against rainbow table attacks and brute-force cracking.

### Q19: What is the difference between Authentication and Authorization?
**Answer:**
- **Authentication** verifies *identity* ("Who are you?" — verified via email/password and JWT).
- **Authorization** verifies *permissions* ("What are you allowed to do?" — verified via user roles like `KITCHEN` or `MANAGER`).

### Q20: What is Role-Based Access Control (RBAC) and how is it implemented?
**Answer:** RBAC restricts system access to authorized users based on their assigned roles. We created an `authorize(...allowedRoles)` higher-order middleware that inspects `req.user.role`. If the user's role is not in the allowed list, it immediately rejects the request with HTTP 403 Forbidden (`FORBIDDEN`).

---

## Category 5: Reservation Algorithm & Business Rules

### Q21: How do you prevent double-booking of tables?
**Answer:** Through our autonomous Reservation Conflict Engine. When a customer attempts to book a table, the server executes a mathematical time-interval overlap query against existing bookings on that physical table. If any overlapping, non-cancelled reservation exists, the request is rejected with HTTP 409 Conflict (`RESERVATION_CONFLICT`).

### Q22: Explain the exact mathematical interval conflict formula.
**Answer:** A proposed booking $[T_{\text{start}}, T_{\text{end}})$ overlaps with an existing reservation $[R_{\text{start}}, R_{\text{end}})$ on the same table if and only if:
$$T_{\text{start}} < R_{\text{end}} \quad \text{AND} \quad T_{\text{end}} > R_{\text{start}}$$
Equivalently:
$$\max(T_{\text{start}}, R_{\text{start}}) < \min(T_{\text{end}}, R_{\text{end}})$$

### Q23: Why do you store duration instead of just a start time?
**Answer:** A dining reservation is an interval in time, not an instantaneous point. Storing `duration` (e.g. 120 minutes) allows the Mongoose pre-validation hook to compute `endTime = dateTime + duration * 60000`, enabling exact end-time exclusivity and allowing adjacent bookings (e.g., 17:00–19:00 and 19:00–21:00) without false conflicts.

### Q24: How does cancellation affect table availability?
**Answer:** When a reservation is cancelled, its status updates to `CANCELLED`. Because all conflict queries explicitly include `{ status: { $ne: 'CANCELLED' } }`, the table immediately returns to the available inventory pool for other customers.

---

## Category 6: Order Workflow & State Machine

### Q25: Explain the Order Workflow State Machine.
**Answer:** The order lifecycle transitions through:
- `PLACED -> PREPARING -> READY -> SERVED` (for Dine-In)
- `READY -> DELIVERED` (for Takeaway)
- `PLACED -> CANCELLED` (cancellation allowed only while in `PLACED`)  
Terminal states (`SERVED`, `DELIVERED`, `CANCELLED`) cannot be transitioned further.

### Q26: How are invalid status transitions prevented?
**Answer:** The `orderService` defines a strict transition map. Before mutating an order, it checks whether `newStatus` is in the allowed transition array for the current status. If not, it throws an `AppError` with HTTP 409 and error code `INVALID_STATUS_TRANSITION`.

### Q27: Why do you store an embedded status history?
**Answer:** For auditability and operational transparency. Storing an embedded array of `{ status, changedBy, changedAt, remarks }` records exactly who updated the order, at what time, and why, without requiring separate audit tables.

---

## Category 7: Financial Integrity & Billing

### Q28: How is the bill calculated?
**Answer:**
$$\text{LineTotal} = \text{UnitPrice} \times \text{Quantity}$$
$$\text{Subtotal} = \sum \text{LineTotals}$$
$$\text{Tax (5%)} = \text{round}_2(\text{Subtotal} \times 0.05)$$
$$\text{Service Charge (5%)} = \text{round}_2(\text{Subtotal} \times 0.05)$$
$$\text{Grand Total} = \text{Subtotal} + \text{Tax} + \text{Service Charge}$$

### Q29: Why must financial calculations always be performed on the server?
**Answer:** Security and fraud prevention. If client applications calculated prices or totals, a malicious actor could modify HTTP payloads to set dish prices or taxes to ₹0. The server ignores client prices and fetches authoritative prices directly from MongoDB.

### Q30: Can a customer access another customer's bill or orders?
**Answer:** No. Customer ownership is enforced at the service layer: queries for customer orders explicitly include `{ customerId: req.user.id }`. If a customer attempts to query another user's bill by ID, the service verifies that `order.customerId.toString() === req.user.id` and throws HTTP 403 Forbidden if mismatched.

---

## Category 8: Analytics, Security & Code Quality

### Q31: What is a MongoDB Aggregation Pipeline?
**Answer:** An aggregation pipeline is a data processing framework in MongoDB consisting of multi-stage document transformations where the output of each stage becomes the input to the next. Stages include `$match`, `$unwind`, `$group`, `$sort`, `$project`, and `$limit`.

### Q32: How is the Popular Dishes report generated using aggregation?
**Answer:**
1. `$match`: Filters for completed orders (`SERVED` or `DELIVERED`).
2. `$unwind`: Deconstructs the embedded `items` array into individual documents.
3. `$group`: Groups by `menuItemId`, accumulating total `quantitySold` with `$sum` and total revenue.
4. `$sort`: Sorts descending by total quantity sold.
5. `$limit`: Limits to top $N$ dishes.

### Q33: How are Peak Hours calculated?
**Answer:** We use the `$project` stage with the `$hour` aggregation operator on the `createdAt` timestamp, convert to local time (`+05:30`), and `$group` by hour to calculate total order count per hour.

### Q34: How do you prevent sensitive configuration from leaking to GitHub?
**Answer:** Sensitive configuration (database URIs, JWT secrets) is loaded via `dotenv` from `.env`, which is strictly ignored in `.gitignore`. A sanitized `.env.example` with empty placeholder keys is provided in source control.

### Q35: How did you test your application?
**Answer:** We implemented an automated integration test suite (`scripts/test-runner.js`) that boots an in-memory MongoDB daemon, seeds test fixtures, and executes 149 test assertions across all 13 modules covering positive workflows, edge cases, permission checks, and conflict rejections with a 100% pass rate.
