# Testing Documentation & Quality Assurance Matrix

**Test Suite:** Native Automated Integration & Unit Test Runner (`scripts/test-runner.js`)  
**Execution Command:** `npm test`  
**Total Tests:** 149 Assertions  
**Passed:** 149  
**Failed:** 0  
**Status:** 100% PASSING

---

## 1. Test Verification Matrix

| Module | Test Case Description | Test Type | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | Register with valid credentials | Positive | 201 Created + User object (no password) | 201 Created | **PASS** |
| **Auth** | Register with duplicate email | Negative | 409 Conflict (`EMAIL_ALREADY_EXISTS`) | 409 Conflict | **PASS** |
| **Auth** | Register with invalid email format | Negative | 400 Bad Request (`VALIDATION_ERROR`) | 400 Bad Request | **PASS** |
| **Auth** | Login with valid credentials | Positive | 200 OK + JWT Bearer token returned | 200 OK + JWT | **PASS** |
| **Auth** | Login with incorrect password | Negative | 401 Unauthorized (`INVALID_CREDENTIALS`) | 401 Unauthorized | **PASS** |
| **Auth** | Login with non-existent email | Negative | 401 Unauthorized (`INVALID_CREDENTIALS`) | 401 Unauthorized | **PASS** |
| **Auth** | Access protected route with valid JWT | Positive | 200 OK with authenticated user profile | 200 OK | **PASS** |
| **Auth** | Access protected route with missing JWT | Negative | 401 Unauthorized (`AUTHENTICATION_FAILED`) | 401 Unauthorized | **PASS** |
| **Auth** | Access protected route with forged JWT | Negative | 401 Unauthorized (`AUTHENTICATION_FAILED`) | 401 Unauthorized | **PASS** |
| **Branch** | Admin creates valid branch | Positive | 201 Created with branch details | 201 Created | **PASS** |
| **Branch** | Non-admin creates branch | Negative | 403 Forbidden (`UNAUTHORIZED`) | 403 Forbidden | **PASS** |
| **Branch** | Admin deactivates branch | Positive | 200 OK (`isActive: false`) | 200 OK | **PASS** |
| **Branch** | Create reservation on inactive branch | Negative | 409 Conflict (`BRANCH_INACTIVE`) | 409 Conflict | **PASS** |
| **Branch** | Place food order on inactive branch | Negative | 409 Conflict (`BRANCH_INACTIVE`) | 409 Conflict | **PASS** |
| **Tables** | Create table with valid capacity | Positive | 201 Created | 201 Created | **PASS** |
| **Tables** | Duplicate table number in same branch | Negative | 409 Conflict (`DUPLICATE_TABLE_NUMBER`) | 409 Conflict | **PASS** |
| **Menu** | Add menu item to branch | Positive | 201 Created | 201 Created | **PASS** |
| **Menu** | Add item with negative price | Negative | 400 Bad Request (`VALIDATION_ERROR`) | 400 Bad Request | **PASS** |
| **Reservations** | Book available table in future | Positive | 201 Created + endTime auto-calculated | 201 Created | **PASS** |
| **Reservations** | Book overlapping slot (Conflict Engine) | Negative | 409 Conflict (`RESERVATION_CONFLICT`) | 409 Conflict | **PASS** |
| **Reservations** | Book adjacent/consecutive non-overlapping slot | Positive | 201 Created | 201 Created | **PASS** |
| **Reservations** | Book timestamp in the past | Negative | 400 Bad Request (`VALIDATION_ERROR`) | 400 Bad Request | **PASS** |
| **Reservations** | Cancel booking > 2 hours in advance | Positive | 200 OK (`status: CANCELLED`) | 200 OK | **PASS** |
| **Reservations** | Cancel booking < 2 hours cutoff | Negative | 409 Conflict (`CANCELLATION_WINDOW_EXPIRED`) | 409 Conflict | **PASS** |
| **Reservations** | Atomic reschedule to available slot | Positive | 200 OK + updated dateTime | 200 OK | **PASS** |
| **Reservations** | Atomic reschedule to conflicting slot | Negative | 409 Conflict (Original slot retained) | 409 Conflict | **PASS** |
| **Orders** | Place valid Dine-In order | Positive | 201 Created + subtotal/tax/total calculated | 201 Created | **PASS** |
| **Orders** | Place valid Takeaway order | Positive | 201 Created (no table required) | 201 Created | **PASS** |
| **Orders** | Order unavailable menu item | Negative | 400 Bad Request (`ITEM_UNAVAILABLE`) | 400 Bad Request | **PASS** |
| **Orders** | Order with 0 quantity | Negative | 400 Bad Request (`VALIDATION_ERROR`) | 400 Bad Request | **PASS** |
| **Workflow** | Advance `PLACED` -> `PREPARING` | Positive | 200 OK + statusHistory logged | 200 OK | **PASS** |
| **Workflow** | Advance `PREPARING` -> `READY` | Positive | 200 OK | 200 OK | **PASS** |
| **Workflow** | Advance `READY` -> `SERVED` (Dine-In) | Positive | 200 OK | 200 OK | **PASS** |
| **Workflow** | Illegal skip `PLACED` -> `SERVED` | Negative | 409 Conflict (`INVALID_STATUS_TRANSITION`) | 409 Conflict | **PASS** |
| **Workflow** | Mutate terminal state `SERVED` | Negative | 409 Conflict (`INVALID_STATUS_TRANSITION`) | 409 Conflict | **PASS** |
| **Kitchen** | Retrieve pending orders (FIFO) | Positive | 200 OK (sorted oldest `createdAt` first) | 200 OK | **PASS** |
| **Billing** | Calculate bill server-side | Positive | 200 OK (Subtotal + 5% tax + 5% charge) | 200 OK | **PASS** |
| **Billing** | Kitchen staff attempts bill access | Negative | 403 Forbidden | 403 Forbidden | **PASS** |
| **Billing** | Customer 2 attempts to read Customer 1 bill | Negative | 403 Forbidden (`ACCESS_DENIED`) | 403 Forbidden | **PASS** |
| **History** | Customer reads own paginated orders | Positive | 200 OK (page, limit, total matched) | 200 OK | **PASS** |
| **Feedback** | Submit rating on completed order | Positive | 201 Created (Rating 1-5, comment saved) | 201 Created | **PASS** |
| **Feedback** | Submit rating on non-completed order | Negative | 409 Conflict (`ORDER_NOT_ELIGIBLE`) | 409 Conflict | **PASS** |
| **Feedback** | Duplicate feedback on same order | Negative | 409 Conflict (`FEEDBACK_ALREADY_EXISTS`) | 409 Conflict | **PASS** |
| **Feedback** | Rating outside 1-5 (e.g. 6 or 0) | Negative | 400 Bad Request (`VALIDATION_ERROR`) | 400 Bad Request | **PASS** |
| **Reports** | Manager accesses assigned branch summary | Positive | 200 OK (Aggregation metrics returned) | 200 OK | **PASS** |
| **Reports** | Manager accesses unauthorized branch report | Negative | 403 Forbidden (`BRANCH_ACCESS_DENIED`) | 403 Forbidden | **PASS** |
| **Reports** | Customer accesses manager reports | Negative | 403 Forbidden (`UNAUTHORIZED`) | 403 Forbidden | **PASS** |
| **Reports** | Popular dishes aggregation | Positive | 200 OK (Ranked array by quantity) | 200 OK | **PASS** |
| **Reports** | Peak hours aggregation | Positive | 200 OK (Hourly density array) | 200 OK | **PASS** |

---

## 2. Test Execution Log Summary

```text
==================================================
  TEST RESULTS: 149/149 PASSED
  ALL TESTS PASSED PERFECTLY!
==================================================
Execution Time: ~8.4 seconds
Database: In-Memory MongoDB Server (Isolated Sandbox)
All fixtures created, verified, and torn down automatically.
```
