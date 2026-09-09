# Core Business Rules & Domain Logic

This document specifies the exact domain logic, mathematical formulations, state machines, and constraints implemented across the Restaurant Table Reservation & Food Ordering System.

---

## 1. Reservation Conflict Engine

### 1.1 Mathematical Formulation
A reservation request with time interval $[T_{\text{start}}, T_{\text{end}})$ on a specific table $T_{\text{id}}$ conflicts with an existing reservation $[R_{\text{start}}, R_{\text{end}})$ if and only if:

$$\max(T_{\text{start}}, R_{\text{start}}) < \min(T_{\text{end}}, R_{\text{end}})$$

Equivalently, in MongoDB query logic:
$$R_{\text{start}} < T_{\text{end}} \quad \text{AND} \quad R_{\text{end}} > T_{\text{start}}$$

### 1.2 Status Constraints
1. **Exclusion of Cancelled Bookings:** Reservations with `status: 'CANCELLED'` are strictly excluded from conflict detection queries.
2. **Self-Exclusion on Reschedule:** When rescheduling reservation $R$, $R$'s own `_id` is excluded from the query:
   ```javascript
   const query = {
     _id: { $ne: reservationId },
     tableId,
     status: { $ne: 'CANCELLED' },
     dateTime: { $lt: reqEndTime },
     endTime: { $gt: reqStartTime }
   };
   ```
3. **Past Date Restriction:** Reservations cannot be booked for past timestamps ($T_{\text{start}} \le \text{Current Timestamp}$).

---

## 2. Reservation Cancellation & Rescheduling Policy

### 2.1 The 2-Hour Cutoff Rule
To prevent sudden empty tables and kitchen resource misallocation, customer reservations are subject to a strict 2-hour advance cancellation cutoff:

$$\Delta T = T_{\text{reservation}} - T_{\text{current}}$$

- If $\Delta T \ge 2 \text{ hours}$ (120 minutes): Cancellation is approved (`status -> CANCELLED`). Table immediately returns to available inventory.
- If $\Delta T < 2 \text{ hours}$: Cancellation is rejected with HTTP 400 and error code `RESERVATION_CANCEL_CUTOFF`.

### 2.2 Atomic Rescheduling Principle
Rescheduling follows an all-or-nothing guarantee:
1. Target table, target slot, and guest capacity are verified first.
2. A conflict check is executed against the new proposed slot.
3. Only if the target slot is **100% free** is the original reservation document updated.
4. If a conflict exists, the existing reservation remains completely intact.

---

## 3. Order Workflow State Machine

The order lifecycle strictly enforces a deterministic finite state machine:

```text
                  +-------------+
                  |   PLACED    |
                  +------+------+
                         |
           +-------------+-------------+
           |                           |
           v                           v
     +-----------+             +---------------+
     | PREPARING |             |   CANCELLED   | (Terminal)
     +-----+-----+             +---------------+
           |
           v
     +-----------+
     |   READY   |
     +-----+-----+
           |
     +-----+---------------------+
     |                           |
     v (DINE_IN)                 v (TAKEAWAY)
+----------+              +---------------+
|  SERVED  | (Terminal)   |   DELIVERED   | (Terminal)
+----------+              +---------------+
```

### 3.1 Valid Transitions Table
| Current Status | Allowed Next Status | Triggering Role |
| :--- | :--- | :--- |
| `PLACED` | `PREPARING` | `KITCHEN`, `MANAGER`, `ADMIN` |
| `PLACED` | `CANCELLED` | `CUSTOMER` (Own order), `MANAGER`, `ADMIN` |
| `PREPARING` | `READY` | `KITCHEN`, `MANAGER`, `ADMIN` |
| `READY` | `SERVED` (If `orderType === 'DINE_IN'`) | `KITCHEN`, `MANAGER`, `ADMIN` |
| `READY` | `DELIVERED` (If `orderType === 'TAKEAWAY'`) | `KITCHEN`, `MANAGER`, `ADMIN` |
| `SERVED` | *None* | **Terminal State** (Immutable) |
| `DELIVERED` | *None* | **Terminal State** (Immutable) |
| `CANCELLED` | *None* | **Terminal State** (Immutable) |

*Any attempt to bypass states (e.g. `PLACED` directly to `SERVED`) or mutate terminal states is rejected with HTTP 400 (`INVALID_STATUS_TRANSITION`).*

---

## 4. Kitchen Display Queue (KDS) Rules

1. **Pending Status Only:** The KDS displays orders where `status IN ['PLACED', 'PREPARING']`.
2. **Strict FIFO Ordering:** Orders are sorted ascending by creation timestamp (`createdAt: 1`) so older orders are prioritized first.
3. **Branch Isolation:** Kitchen staff only view orders originating from their authorized branch.

---

## 5. Server-Side Automated Billing Engine

Clients can never dictate financial totals. Prices are pulled directly from the authoritative MongoDB `menuItems` collection:

1. **Line Total Formulation:**
   $$\text{LineTotal}_i = \text{UnitPrice}_i \times \text{Quantity}_i$$
2. **Subtotal Formulation:**
   $$\text{Subtotal} = \sum_{i=1}^{n} \text{LineTotal}_i$$
3. **Tax & Service Charges:**
   $$\text{TaxAmount} = \text{round}_2(\text{Subtotal} \times 0.05)$$
   $$\text{ServiceCharge} = \text{round}_2(\text{Subtotal} \times 0.05)$$
4. **Grand Total Formulation:**
   $$\text{GrandTotal} = \text{round}_2(\text{Subtotal} + \text{TaxAmount} + \text{ServiceCharge})$$

*All monetary numbers are rounded to 2 decimal places to avoid floating-point inaccuracies.*

---

## 6. Feedback & Rating Policy

1. **Eligibility:** Feedback is permitted **only** on orders that reached terminal completion (`SERVED` for Dine-In, `DELIVERED` for Takeaway). Orders in `PLACED`, `PREPARING`, `READY`, or `CANCELLED` are rejected (`ORDER_NOT_ELIGIBLE_FEEDBACK`).
2. **One Feedback Per Order:** Enforced by database unique compound index `{ orderId: 1, customerId: 1 }`.
3. **Ownership Validation:** A customer can only review an order placed by their own account.
4. **Rating Bounds:** Rating must be an integer between 1 and 5 inclusive.

---

## 7. Branch Operational Status Policy

1. **Active Branches:** Accept reservations, accept food orders, serve menu items.
2. **Inactive Branches:**
   - Immediately reject new table reservation requests (`BRANCH_INACTIVE`).
   - Immediately reject new food order placement requests (`BRANCH_INACTIVE`).
   - Existing historical orders, past bills, and reservations remain fully readable for accounting and auditing.
