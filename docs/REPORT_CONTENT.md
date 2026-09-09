# Academic Project Report Content

**Course:** 5th Semester B.Tech (Computer Science & Engineering)  
**Evaluation:** CIA-3 Project Submission  
**Project Title:** Restaurant Table Reservation & Food Ordering System  

---

## 1. Abstract
Modern hospitality organizations require integrated, fault-tolerant platforms to coordinate table inventory, kitchen fulfillment, and customer ordering. This project presents a full-stack restaurant management platform built with Node.js, Express.js, MongoDB, and Mongoose. Featuring a layered Model-View-Controller (MVC) architecture, the system guarantees conflict-free table reservations through mathematical time-interval overlap detection, enforces a deterministic order workflow state machine, performs authoritative server-side billing calculations (5% tax + 5% service charge), and isolates operations across multi-branch chains. Role-Based Access Control (RBAC) secures transactions across Customers, Kitchen Staff, and Managers. Comprehensive automated testing with 149 assertions demonstrates 100% functional reliability and security compliance.

---

## 2. Introduction
In competitive food service environments, operational bottlenecks often arise from disconnected front-of-house reservations and back-of-house kitchen processing. Manual logbooks cause table double-bookings, verbal kitchen communication leads to lost orders, and unverified client-side pricing exposes establishments to financial exploitation. This system resolves these vulnerabilities by providing a unified RESTful backend API coupled with specialized web portals.

---

## 3. Problem Statement
Traditional restaurant workflows suffer from three critical challenges:
1. **Concurrency and Double-Bookings:** Multiple patrons or staff booking the same physical table across overlapping time intervals.
2. **Unregulated Order States:** Uncontrolled progression of kitchen orders leading to food waste and miscommunication.
3. **Financial Inconsistency:** Insecure client-driven bill calculations vulnerable to tampering and rounding errors.

---

## 4. Objectives
- Implement an autonomous mathematical conflict detection engine for table reservations.
- Formulate a finite state machine governing order progression: `PLACED -> PREPARING -> READY -> SERVED/DELIVERED`.
- Secure monetary calculations via server-side authoritative pricing and tax computation.
- Implement Role-Based Access Control (RBAC) with JWT and bcrypt password encryption.
- Provide real-time operational visibility through a Kitchen Display Queue (FIFO) and Manager Analytics powered by native MongoDB aggregations.

---

## 5. Existing System
Existing dining systems commonly rely on physical pen-and-paper reservation ledgers or fragmented point-of-sale terminals. These setups lack real-time synchronization between table occupancy and food ordering, offer no automated conflict prevention, and fail to generate centralized analytical reports on revenue and dish popularity.

---

## 6. Proposed System
The proposed system introduces an asynchronous, event-driven architecture that unifies table reservation, online menu browsing, order fulfillment, billing, and post-dining reviews. It provides automated conflict checks, strict state transitions, atomic rescheduling, and isolated multi-branch management within a single cloud-native database.

---

## 7. Requirements Specification

### 7.1 Functional Requirements
- Customer registration, login, and JWT-authenticated session management.
- Multi-branch hierarchy supporting independent table inventories and menus.
- Conflict-free table reservations with 2-hour advance cancellation cutoff.
- Dine-In and Takeaway food ordering with server-side price validation.
- FIFO Kitchen Display Queue sorted by timestamp.
- Verified 1–5 star customer feedback linked exclusively to completed orders.
- Executive analytical reporting (Total Sales, Popular Dishes, Peak Hours).

### 7.2 Non-Functional Requirements
- **Security:** bcrypt hashing (10 salt rounds), JWT bearer authorization, sanitized query parsing.
- **Reliability:** 100% test coverage of critical business logic.
- **Maintainability:** Strict MVC layering separating routes, middleware, controllers, services, and models.
- **Performance:** Database indexing on high-frequency query fields ensuring sub-10ms response times.

---

## 8. System Architecture
The application employs a 4-tier layered architecture:
```text
Client (Web UI / Postman)
       ↓ (HTTP / JSON)
Express REST Router & Middleware (Auth, RBAC, Validator)
       ↓
Controllers (HTTP transport)
       ↓
Services (Business logic & calculations)
       ↓
Mongoose ODM & Data Models
       ↓
MongoDB Database
```

---

## 9. Database Design
The schema uses a hybrid NoSQL design balancing normalized references with embedded immutable snapshots:
- **`users`:** Customer, Kitchen, Manager, and Admin identities.
- **`branches`:** Physical restaurant locations with operational status toggles.
- **`tables`:** Physical seating assets indexed by branch and table number.
- **`menuItems`:** Categorized dishes with dynamic availability flags.
- **`reservations`:** Scheduled bookings with computed end times.
- **`orders`:** Financial transactions with embedded line items and status audit trails.
- **`feedback`:** Verified customer ratings with compound unique constraints.

---

## 10. Module Description
The project incorporates 13 distinct modules:
1. Customer Registration & Authentication
2. Branch-Scoped Menu Management
3. Table Inventory Management
4. Table Reservation Engine
5. Food Order Placement
6. Order Status Workflow State Machine
7. Kitchen Display System (FIFO Queue)
8. Automated Billing & Order Summary
9. Reservation Cancellation & Atomic Rescheduling
10. Customer Order & Reservation History
11. Feedback & Rating System
12. Multi-Branch Operational Controls
13. Manager Analytics & Aggregation Reports

---

## 11. Implementation Details
The backend is written in Node.js (v18+) utilizing Express.js as the application framework. Database interactions are orchestrated via Mongoose with pre-validation hooks. Centralized error handling catches all exceptions and transforms them into standardized JSON envelopes.

---

## 12. API Design
The REST API encompasses over 30 standardized endpoints adhering to HTTP standards:
- `200 OK` / `201 Created` for successful mutations and retrievals.
- `400 Bad Request` for validation failures and illegal transitions.
- `401 Unauthorized` / `403 Forbidden` for authentication and permission failures.
- `409 Conflict` for reservation overlaps, duplicate tables, and duplicate feedback.

---

## 13. Authentication & Security
- **Passwords:** Encrypted with bcrypt using 10 salt rounds; excluded from JSON responses.
- **JWT:** Digitally signed with HMAC-SHA256, carrying user role and ID claims with a 7-day expiration.
- **Environment Isolation:** Secrets externalized in `.env`, with a sanitized `.env.example` committed to version control.

---

## 14. Testing & Verification
An automated integration test suite (`scripts/test-runner.js`) executes 149 assertions across all modules against an in-memory MongoDB daemon. The suite verifies:
- Positive flows (successful registrations, bookings, order progression, billing).
- Negative edge cases (past bookings, conflict collisions, cancellation after cutoff, illegal state skips).
- Role-based restrictions and branch isolation.

---

## 15. Results & Discussion
All 149 test assertions executed with a **100% pass rate**. Manual end-to-end verification through the web interface confirmed instantaneous conflict rejection, real-time kitchen queue updates, accurate itemized billing calculations, and reliable aggregation reporting.

---

## 16. Screenshots Checklist
- [ ] Screenshot 1: Customer Login & Authentication Screen
- [ ] Screenshot 2: Branch Selector & Menu Categorization View
- [ ] Screenshot 3: Table Reservation Form & Conflict Notification
- [ ] Screenshot 4: Cart Summary & Itemized Bill Calculation
- [ ] Screenshot 5: Kitchen Display Queue (FIFO Cards)
- [ ] Screenshot 6: Order Status Progression (`PLACED` to `SERVED`)
- [ ] Screenshot 7: Customer Order History & 5-Star Feedback Form
- [ ] Screenshot 8: Manager Analytics Dashboard (Revenue, Popular Dishes, Peak Hours)

---

## 17. Limitations
- Current implementation utilizes client-side polling rather than bi-directional WebSockets for real-time kitchen notifications.
- Payment gateway integration is simulated via internal status transitions rather than external bank APIs.

---

## 18. Future Scope
- Integration of Socket.io for instantaneous real-time kitchen ticket printing and popups.
- Integration of payment gateways (Razorpay, Stripe) with webhook verification.
- Interactive drag-and-drop floor plan designer for customized table layouts.
- SMS and WhatsApp reservation alerts via Twilio API.

---

## 19. Conclusion
The Restaurant Table Reservation & Food Ordering System successfully delivers a scalable, conflict-free, and secure web platform. By coupling robust domain logic with defensive programming practices, the system resolves key operational bottlenecks in the hospitality industry, satisfying all requirements for the 5th Semester B.Tech CIA-3 curriculum.

---

## 20. References
1. Express.js Documentation: https://expressjs.com
2. MongoDB Manual & Aggregation Pipeline: https://www.mongodb.com/docs/manual/core/aggregation-pipeline/
3. Mongoose ODM Reference: https://mongoosejs.com/docs/guide.html
4. JSON Web Tokens (RFC 7519): https://jwt.io/introduction
5. OWASP Top 10 API Security Risks: https://owasp.org/www-project-api-security/
