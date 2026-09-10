# RestoHub — Restaurant Table Reservation & Food Ordering System

> **Academic Project** | Christ University — 5th Semester CIA-3 | Node.js + MongoDB + Vanilla JS

---

## Overview

RestoHub is a full-stack restaurant management platform with a **Node.js/Express REST API** backend and a **Vanilla JS single-page frontend**. It supports three completely separate role-based dashboards — Customer, Kitchen Staff, and Manager — each with its own dedicated interface, navigation, and backend authorization.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose ODM |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | bcryptjs |
| Validation | Joi |
| Frontend | Vanilla HTML + CSS + JavaScript (SPA) |
| Routing | Hash-based (`/#/customer`, `/#/kitchen`, `/#/manager`) |
| Dev Server | Nodemon |

---

## Project Structure

```
restaurant-reservation-system/
├── server.js                  # App entry point, Express setup, auto-seed
├── .env                       # Environment variables (PORT, DB, JWT)
│
├── config/
│   ├── db.js                  # MongoDB connection
│   └── env.js                 # Environment config loader
│
├── models/
│   ├── User.js                # Roles: customer | kitchen | manager | admin
│   ├── Branch.js              # Restaurant branches
│   ├── MenuItem.js            # Menu items per branch
│   ├── Table.js               # Table inventory per branch
│   ├── Order.js               # Food orders with line items & billing
│   ├── Reservation.js         # Table reservations with conflict detection
│   └── Feedback.js            # Customer ratings & comments
│
├── routes/
│   ├── authRoutes.js          # POST /register, POST /login, GET /me
│   ├── branchRoutes.js        # Branch CRUD
│   ├── menuRoutes.js          # Menu item management
│   ├── tableRoutes.js         # Table management
│   ├── orderRoutes.js         # Order creation & status updates
│   ├── reservationRoutes.js   # Reservation booking & cancellation
│   ├── kitchenRoutes.js       # Kitchen queue (PLACED→PREPARING→READY)
│   ├── customerRoutes.js      # Customer's own orders & reservations
│   ├── feedbackRoutes.js      # Post-order ratings
│   └── reportRoutes.js        # Manager analytics
│
├── controllers/               # Business logic handlers
├── middleware/
│   ├── auth.js                # JWT verification
│   ├── authorize.js           # Role-based access control
│   ├── authorizeBranchAccess.js
│   ├── validate.js            # Joi request validation
│   └── errorHandler.js        # Centralized error handling
│
├── validators/                # Joi schemas for all routes
├── services/                  # Business logic services
├── utils/
│   ├── appError.js            # Custom error class
│   ├── asyncHandler.js        # Async error wrapper
│   └── apiResponse.js         # Standardized API response format
│
├── scripts/
│   └── seed.js                # Auto-seeds demo data on first run
│
└── public/                    # Frontend (served as static files)
    ├── index.html             # Shell HTML — single <div id="app"> mount
    ├── style.css              # Role-themed CSS (customer/kitchen/manager)
    └── app.js                 # Hash router + 3 role dashboards
```

---

## Role-Based Dashboard System

After login, the user's **role from the database** determines which dashboard they see. There is no manual role selector — the backend assigns the role at account creation, and the frontend enforces routing.

```
Login → GET /api/auth/me (JWT verify)
      ↓
   user.role
      ↓
customer  ──→  /#/customer   (Customer Portal)
kitchen   ──→  /#/kitchen    (Kitchen Display)
manager   ──→  /#/manager    (Manager Dashboard)
admin     ──→  /#/manager    (Manager Dashboard)
```

URL guards prevent cross-role access. If a customer manually types `/#/kitchen`, they are immediately redirected back to `/#/customer`.

---

### 👤 Customer Dashboard (`/#/customer`)

| Feature | Description |
|---------|-------------|
| Branch Selection | Choose branch, see capacity & address |
| Menu Browsing | Filter by category (Starters, Main Course, Desserts, Beverages) |
| Cart & Billing | Live bill preview with 5% tax + 5% service charge |
| Order Types | Dine In (select table) or Takeaway |
| Place Order | Server-side billing, order stored in DB |
| My Orders | Real-time order status, cancel PLACED orders |
| Table Reservations | Book with date, time, duration, guests |
| Reservation History | View & cancel existing reservations |
| Feedback | Star rating + comment after order is SERVED |

---

### 🍳 Kitchen Dashboard (`/#/kitchen`)

A dark-themed Kanban board optimised for kitchen speed.

| Feature | Description |
|---------|-------------|
| Kanban Columns | 🔴 NEW ORDERS → 🟡 PREPARING → 🟢 READY |
| Order Cards | Order ID, table/takeaway label, time ago, all items + quantities |
| One-Click Advance | Move orders through status pipeline instantly |
| Branch Filter | Filter queue by branch |
| Auto-Refresh | 30-second countdown auto-refresh |

---

### 📊 Manager Dashboard (`/#/manager`)

| Tab | Features |
|-----|---------|
| Analytics | Revenue, completed orders, average rating, active branches; top dishes; peak hours |
| Orders | All orders table with status & branch filters |
| Menu | All menu items with availability status |
| Reservations | All reservations (customer, branch, table, date, status) |
| Branches | Activate / deactivate branches instantly |

---

## Order Data Flow

```
Customer places order
        ↓
POST /api/orders → status: PLACED
        ↓
Kitchen queue auto-refreshes → appears in NEW ORDERS
        ↓
Kitchen: → Start Preparing → status: PREPARING
        ↓
Kitchen: → Mark Ready     → status: READY
        ↓
Kitchen: → Mark Served    → status: SERVED
        ↓
Customer sees update in My Orders
Manager sees everything in Orders tab
```

---

## Key API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| GET | `/api/auth/me` | Any authenticated |
| GET | `/api/branches` | Public |
| GET | `/api/menu` | Public |
| GET | `/api/tables` | Public |
| POST | `/api/orders` | customer |
| PATCH | `/api/orders/:id/status` | kitchen, manager, admin, customer (cancel only) |
| POST | `/api/reservations` | customer |
| PATCH | `/api/reservations/:id/cancel` | customer |
| GET | `/api/customers/orders` | customer |
| GET | `/api/kitchen/queue` | kitchen, manager, admin |
| PATCH | `/api/kitchen/orders/:id/status` | kitchen, manager, admin |
| GET | `/api/manager/reports/summary` | manager, admin |
| GET | `/api/manager/reports/popular-dishes` | manager, admin |
| GET | `/api/manager/reports/peak-hours` | manager, admin |

---

## Running the Project

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017

### Steps

```bash
# Install dependencies
npm install

# Start dev server (auto-seeds DB on first run)
npm run dev
```

### Environment Variables (`.env`)

```
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/restaurant_reservation
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
TAX_RATE=5
SERVICE_CHARGE_RATE=5
```

Open: **http://localhost:5001/**

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@restaurant.com` | `Password@123` |
| Kitchen Staff | `kitchen@restaurant.com` | `Password@123` |
| Manager | `manager@restaurant.com` | `Password@123` |
| Admin | `admin@restaurant.com` | `Password@123` |

---

## Key Design Decisions

1. **Hash-based SPA routing** — No framework. URL hash drives role-based view rendering in pure JS.
2. **Server-side billing** — Tax and charges always calculated on the backend, never trusted from the client.
3. **Conflict prevention** — Reservations check for overlapping bookings on the same table.
4. **Auto-seeding** — Fresh DB is populated with demo users, branches, menu items, and sample orders on first startup.
5. **Two-layer role enforcement** — Frontend guards redirect unauthorized URLs; backend middleware independently rejects unauthorized API calls.
6. **Kanban kitchen display** — Orders grouped into visual status columns with 30s auto-refresh, designed for high-stress kitchen environments.
