# REST API Documentation

**Base URL:** `http://localhost:5001/api`  
**Authentication:** HTTP Authorization Header with Bearer Token:  
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Standard Response Formats

### 1.1 Success Response Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### 1.2 Error Response Envelope
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Table 2 is already reserved for the requested time slot",
  "errorCode": "RESERVATION_CONFLICT"
}
```

---

## 2. API Endpoints Reference

### Module 1: Authentication & User Management (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new customer account (`name`, `email`, `password`, `phone`) |
| `POST` | `/auth/login` | Public | Authenticate user & return JWT token (`email`, `password`) |
| `GET` | `/auth/me` | Authenticated | Retrieve authenticated user profile |

---

### Module 2: Branch Management (`/api/branches`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/branches` | Admin / Manager | Create new branch (`name`, `address`, `seatingCapacity`) |
| `GET` | `/branches` | Public | List all branches (supports query `isActive=true`) |
| `GET` | `/branches/:id` | Public | Get branch details by ObjectId |
| `PUT` | `/branches/:id` | Admin / Manager | Update branch details |
| `PATCH` | `/branches/:id/status` | Admin / Manager | Toggle branch operational status (`isActive: true/false`) |

---

### Module 3: Menu Management (`/api/menu`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/menu` | Admin / Manager | Add menu item (`branchId`, `name`, `category`, `price`, `isAvailable`) |
| `GET` | `/menu` | Public | List menu items (supports query `branchId`, `category`) |
| `GET` | `/menu/:id` | Public | Get single menu item |
| `PUT` | `/menu/:id` | Admin / Manager | Update menu item details |
| `DELETE` | `/menu/:id` | Admin / Manager | Delete or deactivate menu item |

---

### Module 4: Table Inventory (`/api/tables`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/tables` | Admin / Manager | Add table (`branchId`, `tableNumber`, `capacity`) |
| `GET` | `/tables` | Public | List tables for a branch (`?branchId=...`) |
| `GET` | `/tables/:id` | Public | Get single table details |
| `PUT` | `/tables/:id` | Admin / Manager | Update table capacity or number |
| `DELETE` | `/tables/:id` | Admin / Manager | Delete table |

---

### Module 5 & 9: Table Reservation Engine (`/api/reservations`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/reservations` | Customer | Book table (`branchId`, `tableId`, `dateTime`, `duration`, `guests`) |
| `GET` | `/reservations` | Staff / Manager | List reservations with branch and date filtering |
| `GET` | `/reservations/:id` | Authenticated | Get reservation by ID |
| `PATCH` | `/reservations/:id/cancel` | Customer / Staff | Cancel booking (enforces **2-hour cancellation cutoff policy**) |
| `PATCH` | `/reservations/:id/reschedule` | Customer / Staff | Reschedule booking (checks conflict on target slot **before** mutating) |

---

### Module 6 & 8: Food Ordering & Billing (`/api/orders`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Customer | Place order (`branchId`, `orderType: DINE_IN/TAKEAWAY`, `tableId`, `items: [{ menuItemId, quantity }]`) |
| `GET` | `/orders` | Authenticated | List orders with filtering (`branchId`, `status`, `orderType`) |
| `GET` | `/orders/:id` | Authenticated | Get order details |
| `PATCH` | `/orders/:id/status` | Staff / Customer | Transition order status (`PLACED`, `PREPARING`, `READY`, `SERVED`, `DELIVERED`, `CANCELLED`) |
| `GET` | `/orders/:id/bill` | Authenticated | Generate finalized itemized bill with 5% tax and 5% service charge |
| `GET` | `/orders/:id/summary` | Authenticated | Get comprehensive order lifecycle summary |

---

### Module 7: Kitchen Display Queue (`/api/kitchen`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/kitchen/queue` | Kitchen / Manager | Retrieve pending orders (`PLACED`, `PREPARING`) in **FIFO** order (oldest first) |
| `PATCH` | `/kitchen/orders/:id/status` | Kitchen / Manager | Quick advance order workflow status (`PREPARING` / `READY`) |

---

### Module 10: Customer History (`/api/customers`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/customers/orders` | Customer | View authenticated customer's own orders (paginated, sorted newest first) |
| `GET` | `/customers/reservations` | Customer | View authenticated customer's own reservations (paginated) |

---

### Module 11: Feedback & Ratings (`/api/feedback`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/feedback` | Customer | Submit 1–5 star rating for completed (`SERVED`/`DELIVERED`) order |
| `GET` | `/feedback/:id` | Authenticated | Get feedback by ID |
| `GET` | `/feedback/order/:orderId`| Authenticated | Get feedback for a specific order |
| `PUT` | `/feedback/:id` | Customer | Update customer's own feedback |
| `DELETE` | `/feedback/:id` | Customer / Admin | Delete feedback |

---

### Module 13: Manager Reports & Analytics (`/api/manager/reports`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/manager/reports/summary` | Manager / Admin | Executive summary (Total revenue, completed orders, average rating) |
| `GET` | `/manager/reports/sales` | Manager / Admin | Revenue breakdown by date and branch using MongoDB aggregation |
| `GET` | `/manager/reports/popular-dishes`| Manager / Admin | Top selling dishes sorted by order frequency and total revenue |
| `GET` | `/manager/reports/peak-hours` | Manager / Admin | Hourly ordering density breakdown for kitchen staffing analysis |

---

## 3. Standard Error Code Glossary

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Request body or parameters failed schema validation |
| `AUTHENTICATION_FAILED` | 401 | Missing, invalid, or expired JWT bearer token |
| `UNAUTHORIZED` | 403 | User role lacks permission for the requested resource |
| `NOT_FOUND` | 404 | Target resource (Branch, Table, Order, etc.) does not exist |
| `RESERVATION_CONFLICT` | 409 | Table is already booked during the requested time window |
| `RESERVATION_CANCEL_CUTOFF` | 400 | Cancellation rejected: bookings cannot be cancelled within 2 hours of start time |
| `INVALID_STATUS_TRANSITION` | 400 | Attempted illegal order status transition (violates state machine) |
| `DUPLICATE_FEEDBACK` | 409 | Customer has already submitted feedback for this order |
| `ORDER_NOT_ELIGIBLE_FEEDBACK` | 400 | Feedback can only be submitted for completed (`SERVED` or `DELIVERED`) orders |
| `BRANCH_INACTIVE` | 400 | Target branch is currently inactive/closed for new reservations and orders |
