# Demonstration Backup & Contingency Plan

This document outlines fast, step-by-step recovery procedures for unforeseen technical issues during the live CIA-3 project presentation.

---

## Scenario 1: Local MongoDB Daemon Fails or Is Not Running
* **Symptom:** Terminal or console mentions `ECONNREFUSED 127.0.0.1:27017`.
* **Automatic Safeguard Already Built-In:**  
  Our `config/db.js` file includes an automatic fallback mechanism:
  ```javascript
  if (initialError.message.includes('ECONNREFUSED')) {
    console.warn('[MongoDB] Local daemon not reachable. Starting embedded in-memory MongoDB instance...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
  }
  ```
* **Resolution:**  
  You do not need to install or start a local MongoDB daemon manually. If local MongoDB is offline, the backend automatically spins up an in-memory MongoDB instance and auto-seeds all branches, tables, menu items, users, and orders!

---

## Scenario 2: Server Does Not Start or Port 5001 Is Already in Use
* **Symptom:** Error `EADDRINUSE: address already in use :::5001`.
* **Immediate Terminal Recovery Command:**
  ```bash
  # Identify and kill any orphaned process occupying port 5001
  lsof -ti:5001 | xargs kill -9
  
  # Restart the server cleanly
  node server.js
  ```
* **Verification:** Open `http://localhost:5001/api/health` in your browser. It should return HTTP 200 `healthy`.

---

## Scenario 3: Browser Cache Shows Blank Dropdowns or Outdated Code
* **Symptom:** Dropdowns show `Loading...` or browser serves an old script.
* **Immediate Recovery Steps:**
  1. Perform a hard reload to clear cached assets:
     - **macOS:** `Cmd + Shift + R`
     - **Windows/Linux:** `Ctrl + Shift + R` (or `Ctrl + F5`)
  2. If using Incognito mode: Press `Cmd + Shift + N` (macOS) or `Ctrl + Shift + N` (Windows) and navigate directly to `http://localhost:5001/`.

---

## Scenario 4: User Authentication Fails or Token Expired
* **Symptom:** Red toast: `"The user belonging to this token no longer exists"` or `"Session expired"`.
* **Cause:** The database was re-seeded, creating fresh ObjectIds while the browser retained an old JWT.
* **Immediate Recovery Steps:**
  1. Click the **"Logout"** button in the top right corner of the navbar.
  2. Click **"Sign In / Demo"**.
  3. Click any of the 4 quick demo pills:
     - **Customer:** `customer@example.com` / `Customer@123`
     - **Kitchen Staff:** `kitchen@example.com` / `Kitchen@123`
     - **Manager:** `manager@example.com` / `Manager@123`
     - **Admin:** `admin@example.com` / `Admin@123`
  4. Click **"Sign In"**. A fresh JWT is generated immediately.

---

## Scenario 5: Table Reservation Conflict Does Not Trigger
* **Symptom:** Booking two reservations unexpectedly succeeds instead of throwing HTTP 409.
* **Cause:** The second reservation was booked on a different table or outside the overlapping time interval.
* **Guaranteed Conflict Steps to Demonstrate:**
  1. **Reservation 1:** Select **Table #1**, set Date to **Tomorrow at 19:00 (7:00 PM)**, Duration: **120 minutes** (Booking interval: 19:00 to 21:00). Click Confirm.
  2. **Reservation 2:** Select the **exact same Table #1**, set Date to **Tomorrow at 19:30 (7:30 PM)**, Duration: **60 minutes** (Proposed interval: 19:30 to 20:30).
  3. Click Confirm. The server **will** throw HTTP 409 Conflict: `"Table is already reserved for the requested time slot"`.

---

## Scenario 6: Total Internet / Wi-Fi Network Failure
* **Symptom:** Campus Wi-Fi disconnects or drops during evaluation.
* **Application Safeguard:**  
  The system is **100% self-contained and local**:
  - The Express server runs locally on `127.0.0.1:5001`.
  - The database runs locally in-memory.
  - All fonts and CSS fall back gracefully to local system sans-serif fonts.
  - No external third-party APIs (Stripe, Twilio, Google Maps) are required for core operations.
* **Resolution:** Continue the presentation uninterrupted on `http://localhost:5001/`.

---

## Scenario 7: Web Browser or Display Engine Crashes Completely
* **Symptom:** The browser freezes or refuses to render the frontend.
* **Immediate Backend Verification via Terminal & Postman:**
  1. **Run the Automated Integration Test Suite:**
     ```bash
     npm test
     ```
     This executes **149 assertions across all 13 modules in under 9 seconds**, demonstrating that all controllers, models, validations, and business rules are 100% functional.
  2. **Demonstrate via Postman Collection:**
     - Open Postman.
     - Select the collection: `postman/Restaurant_Reservation_API.postman_collection.json`.
     - Select environment: `Restaurant Reservation System (CIA-3)`.
     - Click **Run Collection** to execute tests sequentially through the REST interface.
