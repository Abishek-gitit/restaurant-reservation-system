const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const seedData = require('./seed');

let server;
let baseUrl;

// Test state holders
let adminToken = '';
let managerToken = '';
let customerToken = '';
let kitchenToken = '';
let branchId = '';
let menuItemId = '';
let tableId = '';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assert = (condition, testName, errorDetails = '') => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${errorDetails ? `\n    -> Details: ${errorDetails}` : ''}`);
  }
};

const makeRequest = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  return { status: response.status, data };
};

const runTests = async () => {
  console.log('\n==================================================');
  console.log('  STARTING RESTAURANT API PHASE 1 TEST SUITE      ');
  console.log('==================================================\n');

  try {
    // 1. Connect DB and seed initial state
    await connectDB();
    await seedData(false);

    // Start ephemeral server on random port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    console.log(`[Test Runner] Server listening on ${baseUrl}\n`);

    // ==========================================
    // 1. HEALTH CHECK
    // ==========================================
    console.log('\x1b[36m[1. System Health Check]\x1b[0m');
    {
      const res = await makeRequest('/api/health');
      assert(res.status === 200 && res.data.success === true, 'GET /api/health returns 200 OK');
    }

    // ==========================================
    // 2. AUTHENTICATION & IDENTITY
    // ==========================================
    console.log('\n\x1b[36m[2. Authentication & Identity]\x1b[0m');

    // Register valid customer
    {
      const res = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Rohit Sharma',
          email: 'rohit@example.com',
          password: 'Password@123'
        }
      });
      assert(res.status === 201 && res.data.success === true && res.data.data.token, 'Customer registration (201 Created)');
      assert(res.data.data.user.role === 'customer', 'Customer registered with default "customer" role');
      assert(!res.data.data.user.passwordHash, 'passwordHash is not exposed in registration response');
    }

    // Duplicate email registration
    {
      const res = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Duplicate Rohit',
          email: 'rohit@example.com',
          password: 'Password@123'
        }
      });
      assert(res.status === 409 && res.data.errorCode === 'CONFLICT', 'Duplicate email registration returns 409 Conflict');
    }

    // Registration validation failure (invalid email)
    {
      const res = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Invalid User',
          email: 'invalid-email',
          password: 'Password@123'
        }
      });
      assert(res.status === 400 && res.data.errorCode === 'VALIDATION_ERROR', 'Invalid email format rejected with 400 Validation Error');
    }

    // Login with valid admin credentials
    {
      const res = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'admin@restaurant.com',
          password: 'Password@123'
        }
      });
      assert(res.status === 200 && res.data.success === true && res.data.data.token, 'Admin login (200 OK)');
      adminToken = res.data?.data?.token;
    }

    // Login with manager credentials
    {
      const res = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'manager@restaurant.com',
          password: 'Password@123'
        }
      });
      assert(res.status === 200 && res.data.success === true, 'Manager login (200 OK)');
      managerToken = res.data?.data?.token;
    }

    // Login with customer credentials
    {
      const res = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'customer@restaurant.com',
          password: 'Password@123'
        }
      });
      assert(res.status === 200 && res.data.success === true, 'Customer login (200 OK)');
      customerToken = res.data?.data?.token;
    }

    // Login with kitchen staff credentials
    {
      const res = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'kitchen@restaurant.com',
          password: 'Password@123'
        }
      });
      assert(res.status === 200 && res.data.success === true, 'Kitchen staff login (200 OK)');
      kitchenToken = res.data?.data?.token;
    }

    // Login with wrong password
    {
      const res = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'admin@restaurant.com',
          password: 'WrongPassword@999'
        }
      });
      assert(res.status === 401 && res.data.errorCode === 'UNAUTHORIZED', 'Wrong password returns 401 Unauthorized');
    }

    // Get current user profile (/me) with valid token
    {
      const res = await makeRequest('/api/auth/me', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(res.status === 200 && res.data.data.user.email === 'customer@restaurant.com', 'GET /api/auth/me returns current user profile');
    }

    // Get current user profile with missing token
    {
      const res = await makeRequest('/api/auth/me');
      assert(res.status === 401 && res.data.errorCode === 'UNAUTHORIZED', 'Protected route without token returns 401 Unauthorized');
    }

    // Get current user profile with invalid token
    {
      const res = await makeRequest('/api/auth/me', {
        headers: { Authorization: 'Bearer invalid.token.payload' }
      });
      assert(res.status === 401 && res.data.errorCode === 'UNAUTHORIZED', 'Invalid token returns 401 Unauthorized');
    }

    // ==========================================
    // 3. BRANCH MANAGEMENT
    // ==========================================
    console.log('\n\x1b[36m[3. Branch Management]\x1b[0m');

    // Create branch as Admin
    {
      const res = await makeRequest('/api/branches', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: 'Christ Lavasa Campus Branch',
          address: 'Christ University Road, Dasve Lavasa, Pune, Maharashtra 412112',
          seatingCapacity: 80
        }
      });
      assert(res.status === 201 && res.data.success === true, 'Create branch as Admin (201 Created)');
      branchId = res.data?.data?.branch?.id;
    }

    // Create branch with unauthorized role (Customer)
    {
      const res = await makeRequest('/api/branches', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          name: 'Unauthorized Branch Attempt',
          address: 'Somewhere',
          seatingCapacity: 50
        }
      });
      assert(res.status === 403 && res.data.errorCode === 'FORBIDDEN', 'Customer cannot create branch (403 Forbidden)');
    }

    // Create duplicate branch name
    {
      const res = await makeRequest('/api/branches', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: 'Christ Lavasa Campus Branch',
          address: 'Another address',
          seatingCapacity: 100
        }
      });
      assert(res.status === 409 && res.data.errorCode === 'CONFLICT', 'Duplicate branch name rejected (409 Conflict)');
    }

    // List all branches (Public)
    {
      const res = await makeRequest('/api/branches');
      assert(res.status === 200 && Array.isArray(res.data.data.branches) && res.data.data.branches.length >= 3, 'Get all branches (200 OK)');
    }

    // Get branch by ID
    {
      const res = await makeRequest(`/api/branches/${branchId}`);
      assert(res.status === 200 && res.data.data.branch.name === 'Christ Lavasa Campus Branch', 'Get branch by valid ID (200 OK)');
    }

    // Get branch by invalid ObjectId format
    {
      const res = await makeRequest('/api/branches/123-not-valid-id');
      assert(res.status === 400 && res.data.errorCode === 'VALIDATION_ERROR', 'Invalid ObjectId rejected with 400 Validation Error');
    }

    // Update branch as Manager
    {
      await User.updateOne(
        { email: 'manager@restaurant.com' },
        { $addToSet: { managedBranchIds: branchId } }
      );

      const res = await makeRequest(`/api/branches/${branchId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: {
          seatingCapacity: 110
        }
      });
      assert(res.status === 200 && res.data.data.branch.seatingCapacity === 110, 'Update branch as Manager (200 OK)');
    }

    // ==========================================
    // 4. MENU MANAGEMENT
    // ==========================================
    console.log('\n\x1b[36m[4. Menu Item Management]\x1b[0m');

    // Create menu item as Manager
    {
      const res = await makeRequest('/api/menu', {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: {
          branchId,
          name: 'Signature Veg Platter',
          category: 'Starters',
          price: 350.0,
          isAvailable: true
        }
      });
      assert(res.status === 201 && res.data.success === true, 'Create menu item as Manager (201 Created)');
      menuItemId = res.data?.data?.menuItem?.id;
    }

    // Create menu item with non-existent branch ID
    {
      const fakeBranchId = '507f1f77bcf86cd799439011';
      const res = await makeRequest('/api/menu', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          branchId: fakeBranchId,
          name: 'Phantom Burger',
          category: 'Fast Food',
          price: 150
        }
      });
      assert(res.status === 404 && res.data.errorCode === 'NOT_FOUND', 'Non-existent branch reference rejected with 404');
    }

    // Create menu item with negative price
    {
      const res = await makeRequest('/api/menu', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          branchId,
          name: 'Free Ice Cream',
          category: 'Desserts',
          price: -10
        }
      });
      assert(res.status === 400 && res.data.errorCode === 'VALIDATION_ERROR', 'Negative price rejected with 400 Validation Error');
    }

    // Create menu item as unauthorized role (Customer)
    {
      const res = await makeRequest('/api/menu', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId,
          name: 'Hacked Item',
          category: 'Starters',
          price: 10
        }
      });
      assert(res.status === 403 && res.data.errorCode === 'FORBIDDEN', 'Customer cannot create menu items (403 Forbidden)');
    }

    // Filter menu by branchId
    {
      const res = await makeRequest(`/api/menu?branchId=${branchId}`);
      assert(res.status === 200 && res.data.data.menuItems.length === 1, 'Filter menu by branchId');
    }

    // Filter menu by branchId and category
    {
      const res = await makeRequest(`/api/menu?branchId=${branchId}&category=Starters`);
      assert(res.status === 200 && res.data.data.menuItems.length === 1, 'Filter menu by branchId and category');
    }

    // Update menu item
    {
      const res = await makeRequest(`/api/menu/${menuItemId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          price: 375.0,
          isAvailable: false
        }
      });
      assert(res.status === 200 && res.data.data.menuItem.price === 375 && res.data.data.menuItem.isAvailable === false, 'Update menu item (200 OK)');
    }

    // ==========================================
    // 5. TABLE INVENTORY MANAGEMENT
    // ==========================================
    console.log('\n\x1b[36m[5. Table Inventory Management]\x1b[0m');

    // Create Table as Admin
    {
      const res = await makeRequest('/api/tables', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          branchId,
          tableNumber: 1,
          capacity: 4
        }
      });
      assert(res.status === 201 && res.data.success === true, 'Create table in branch (201 Created)');
      tableId = res.data?.data?.table?.id;
    }

    // Create Table with duplicate table number in SAME branch
    {
      const res = await makeRequest('/api/tables', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          branchId,
          tableNumber: 1,
          capacity: 6
        }
      });
      assert(res.status === 409 && res.data.errorCode === 'CONFLICT', 'Duplicate table number in same branch rejected (409 Conflict)');
    }

    // Create Table with invalid (zero or negative) capacity
    {
      const res = await makeRequest('/api/tables', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          branchId,
          tableNumber: 2,
          capacity: 0
        }
      });
      assert(res.status === 400 && res.data.errorCode === 'VALIDATION_ERROR', 'Zero or negative table capacity rejected (400 Validation Error)');
    }

    // Create Table with non-existent branch ID
    {
      const fakeBranchId = '507f1f77bcf86cd799439011';
      const res = await makeRequest('/api/tables', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          branchId: fakeBranchId,
          tableNumber: 1,
          capacity: 4
        }
      });
      assert(res.status === 404 && res.data.errorCode === 'NOT_FOUND', 'Non-existent branch for table rejected with 404');
    }

    // Create Table with unauthorized role (Customer)
    {
      const res = await makeRequest('/api/tables', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId,
          tableNumber: 2,
          capacity: 4
        }
      });
      assert(res.status === 403 && res.data.errorCode === 'FORBIDDEN', 'Customer cannot create tables (403 Forbidden)');
    }

    // Filter tables by branchId
    {
      const res = await makeRequest(`/api/tables?branchId=${branchId}`);
      assert(res.status === 200 && res.data.data.tables.length === 1, 'Filter tables by branchId (200 OK)');
    }

    // Update table capacity
    {
      const res = await makeRequest(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: {
          capacity: 6
        }
      });
      assert(res.status === 200 && res.data.data.table.capacity === 6, 'Update table capacity (200 OK)');
    }

    // Delete table as Manager
    {
      const res = await makeRequest(`/api/tables/${tableId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      assert(res.status === 200 && res.data.success === true, 'Delete table (200 OK)');
    }

    // Delete menu item as Admin
    {
      const res = await makeRequest(`/api/menu/${menuItemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(res.status === 200 && res.data.success === true, 'Delete menu item (200 OK)');
    }

    // Delete branch as Admin
    {
      const res = await makeRequest(`/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(res.status === 200 && res.data.success === true, 'Delete branch (200 OK)');
    }

    // ==========================================
    // 6. PHASE 2: RESERVATION ENGINE & CONFLICTS
    // ==========================================
    console.log('\n\x1b[36m[6. Phase 2: Table Reservation Engine]\x1b[0m');

    // Register a second customer for cross-account ownership testing
    let customer2Token = '';
    let customer2Id = '';
    let customer1Id = '';
    {
      const res = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Pooja Hegde',
          email: 'pooja@example.com',
          password: 'Password@123'
        }
      });
      assert(res.status === 201, 'Register second customer for ownership tests');
      customer2Token = res.data.data.token;
      customer2Id = res.data.data.user.id;
    }

    // Get Customer 1's ID from /me
    {
      const res = await makeRequest('/api/auth/me', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      customer1Id = res.data.data.user.id;
    }

    // Fetch existing branches and tables from seed
    let seedBranchId = '';
    let seedTable1Id = '';
    let kengeriBranchId = '';
    let kengeriTable1Id = '';
    {
      const bRes = await makeRequest('/api/branches');
      const branches = bRes.data.data.branches;
      const centralBranch = branches.find((b) => b.name.includes('Central'));
      const kengeriBranch = branches.find((b) => b.name.includes('Kengeri'));
      seedBranchId = centralBranch.id;
      kengeriBranchId = kengeriBranch.id;

      const tRes1 = await makeRequest(`/api/tables?branchId=${seedBranchId}`);
      seedTable1Id = tRes1.data.data.tables[0].id;

      const tRes2 = await makeRequest(`/api/tables?branchId=${kengeriBranchId}`);
      kengeriTable1Id = tRes2.data.data.tables[0].id;
    }

    let testReservation1Id = '';
    let testReservation3Id = '';

    // --- SECTION 29 EXACT BUSINESS-RULE TEST SEQUENCE ---
    // Request 1: Table 1, 19:00, 90 min (19:00 -> 20:30) -> 201 Created
    {
      const res = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          tableId: seedTable1Id,
          dateTime: '2026-11-20T19:00:00.000Z',
          duration: 90
        }
      });
      assert(res.status === 201 && res.data.success === true, 'Section 29 Req 1: Table 1 at 19:00 (90 min) -> 201 Created');
      testReservation1Id = res.data.data.reservation.id;
    }

    // Request 2: Same Table 1, 19:30, 60 min (19:30 -> 20:30, overlaps 19:00-20:30) -> 409 Conflict
    {
      const res = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          tableId: seedTable1Id,
          dateTime: '2026-11-20T19:30:00.000Z',
          duration: 60
        }
      });
      assert(
        res.status === 409 && res.data.errorCode === 'RESERVATION_CONFLICT',
        'Section 29 Req 2: Same Table 1 at 19:30 (60 min) -> 409 Conflict (RESERVATION_CONFLICT)'
      );
    }

    // Request 3: Same Table 1, 20:30, 60 min (20:30 -> 21:30, end-time exclusivity) -> 201 Created
    {
      const res = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          tableId: seedTable1Id,
          dateTime: '2026-11-20T20:30:00.000Z',
          duration: 60
        }
      });
      assert(
        res.status === 201 && res.data.success === true,
        'Section 29 Req 3: Same Table 1 at 20:30 (60 min, end-time exclusive) -> 201 Created'
      );
      testReservation3Id = res.data.data.reservation.id;
    }

    // Slot Release on Cancellation:
    // Cancel Request 1 (19:00 -> 20:30)
    {
      const res = await makeRequest(`/api/reservations/${testReservation1Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(res.status === 200 && res.data.data.status === 'CANCELLED', 'Cancel Request 1 reservation (200 OK)');
    }

    // Now Request 2 (19:30 -> 20:30) on the freed slot MUST succeed!
    {
      const res = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          tableId: seedTable1Id,
          dateTime: '2026-11-20T19:30:00.000Z',
          duration: 60
        }
      });
      assert(
        res.status === 201 && res.data.success === true,
        'Booking freed slot after cancellation succeeds (201 Created)'
      );
    }

    // Reservation Table Validation: Table belongs to wrong branch
    {
      const res = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId, // Central branch ID
          tableId: kengeriTable1Id, // Kengeri branch table ID
          dateTime: '2026-11-21T18:00:00.000Z',
          duration: 60
        }
      });
      assert(res.status === 400 && res.data.errorCode === 'BAD_REQUEST', 'Table from different branch rejected with 400');
    }

    // Reservation Date Validation: Past reservation date
    {
      const res = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          tableId: seedTable1Id,
          dateTime: '2020-01-01T12:00:00.000Z',
          duration: 60
        }
      });
      assert(res.status === 400 && res.data.errorCode === 'VALIDATION_ERROR', 'Past reservation date rejected with 400');
    }

    // Reservation Ownership: Customer 2 attempts to view Customer 1's reservation
    {
      const res = await makeRequest(`/api/reservations/${testReservation3Id}`, {
        headers: { Authorization: `Bearer ${customer2Token}` }
      });
      assert(res.status === 403 && res.data.errorCode === 'FORBIDDEN', 'Customer 2 cannot view Customer 1 reservation (403 Forbidden)');
    }

    // Reservation Ownership: Customer 2 attempts to cancel Customer 1's reservation
    {
      const res = await makeRequest(`/api/reservations/${testReservation3Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${customer2Token}` }
      });
      assert(res.status === 403 && res.data.errorCode === 'FORBIDDEN', 'Customer 2 cannot cancel Customer 1 reservation (403 Forbidden)');
    }

    // Customer history: Customer 2 queries Customer 1's reservations -> 403 Forbidden
    {
      const res = await makeRequest(`/api/customers/${customer1Id}/reservations`, {
        headers: { Authorization: `Bearer ${customer2Token}` }
      });
      assert(res.status === 403 && res.data.errorCode === 'FORBIDDEN', 'Customer 2 querying Customer 1 history returns 403');
    }

    // Customer history: Customer 1 queries own history -> 200 OK
    {
      const res = await makeRequest(`/api/customers/${customer1Id}/reservations`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(res.status === 200 && Array.isArray(res.data.data.reservations), 'Customer 1 querying own history returns 200 OK');
    }

    // Invalid status transition: Attempt to transition CANCELLED to CONFIRMED
    {
      const res = await makeRequest(`/api/reservations/${testReservation1Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          status: 'CONFIRMED'
        }
      });
      assert(res.status === 400 && res.data.errorCode === 'INVALID_STATUS_TRANSITION', 'Invalid status transition rejected with 400');
    }

    // ==========================================
    // 7. PHASE 2: FOOD ORDERING SYSTEM
    // ==========================================
    console.log('\n\x1b[36m[7. Phase 2: Food Ordering System]\x1b[0m');

    // Get menu items for order testing
    let item1Id = '';
    let item2Id = '';
    let item1Price = 0;
    let item2Price = 0;
    let kengeriItemId = '';
    {
      const mRes = await makeRequest(`/api/menu?branchId=${seedBranchId}`);
      const centralItems = mRes.data.data.menuItems;
      item1Id = centralItems[0].id;
      item1Price = centralItems[0].price;
      item2Id = centralItems[1].id;
      item2Price = centralItems[1].price;

      const kRes = await makeRequest(`/api/menu?branchId=${kengeriBranchId}`);
      kengeriItemId = kRes.data.data.menuItems[0].id;
    }

    let testOrderId = '';

    // Create valid DINE_IN Order with authoritative server calculation
    {
      const res = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          orderType: 'DINE_IN',
          tableId: seedTable1Id,
          reservationId: testReservation3Id,
          items: [
            { menuItemId: item1Id, quantity: 2 },
            { menuItemId: item2Id, quantity: 1 }
          ]
        }
      });
      assert(res.status === 201 && res.data.success === true, 'Place Dine-In order (201 Created)');
      testOrderId = res.data.data.order.id;

      const expectedSubtotal = item1Price * 2 + item2Price * 1;
      const expectedTax = Math.round(expectedSubtotal * 0.05 * 100) / 100;
      const expectedService = Math.round(expectedSubtotal * 0.05 * 100) / 100;
      const expectedTotal = Math.round((expectedSubtotal + expectedTax + expectedService) * 100) / 100;
      assert(
        res.data.data.order.subtotal === expectedSubtotal &&
        res.data.data.order.taxAmount === expectedTax &&
        res.data.data.order.serviceCharge === expectedService &&
        res.data.data.order.totalAmount === expectedTotal,
        `Server calculates correct subtotal (₹${expectedSubtotal}), tax (₹${expectedTax}), service (₹${expectedService}), and totalAmount (₹${expectedTotal})`
      );
      assert(
        res.data.data.order.items[0].unitPrice === item1Price &&
        res.data.data.order.items[0].lineTotal === item1Price * 2,
        'Order item snapshots correctly store unitPrice and lineTotal'
      );
    }

    // Create valid TAKEAWAY Order
    {
      const res = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          orderType: 'TAKEAWAY',
          items: [
            { menuItemId: item1Id, quantity: 1 }
          ]
        }
      });
      assert(res.status === 201 && res.data.data.order.orderType === 'TAKEAWAY', 'Place Takeaway order (201 Created)');
    }

    // Order with unavailable item
    // Temporarily mark item2 as unavailable
    {
      await makeRequest(`/api/menu/${item2Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { isAvailable: false }
      });

      const res = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          orderType: 'DINE_IN',
          items: [
            { menuItemId: item2Id, quantity: 1 }
          ]
        }
      });
      assert(
        res.status === 400 && res.data.errorCode === 'ITEM_UNAVAILABLE',
        'Order containing unavailable item rejected with 400 ITEM_UNAVAILABLE'
      );

      // Restore item2 availability
      await makeRequest(`/api/menu/${item2Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { isAvailable: true }
      });
    }

    // Order with item belonging to a different branch
    {
      const res = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId, // Central campus
          orderType: 'TAKEAWAY',
          items: [
            { menuItemId: kengeriItemId, quantity: 1 } // Kengeri campus item
          ]
        }
      });
      assert(res.status === 400 && res.data.errorCode === 'BAD_REQUEST', 'Item from different branch rejected with 400');
    }

    // Order with quantity 0 or negative
    {
      const res = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          orderType: 'TAKEAWAY',
          items: [
            { menuItemId: item1Id, quantity: 0 }
          ]
        }
      });
      assert(res.status === 400 && res.data.errorCode === 'VALIDATION_ERROR', 'Zero quantity rejected with 400 Validation Error');
    }

    // Order Ownership: Customer 2 attempts to view Customer 1's order
    {
      const res = await makeRequest(`/api/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customer2Token}` }
      });
      assert(res.status === 403 && res.data.errorCode === 'FORBIDDEN', 'Customer 2 cannot view Customer 1 order (403 Forbidden)');
    }

    // Order Ownership: Customer 2 queries Customer 1's order history -> 403
    {
      const res = await makeRequest(`/api/customers/${customer1Id}/orders`, {
        headers: { Authorization: `Bearer ${customer2Token}` }
      });
      assert(res.status === 403 && res.data.errorCode === 'FORBIDDEN', 'Customer 2 querying Customer 1 orders returns 403');
    }

    // Customer 1 queries own order history -> 200 OK
    {
      const res = await makeRequest(`/api/customers/${customer1Id}/orders`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(res.status === 200 && Array.isArray(res.data.data.orders), 'Customer 1 querying own order history returns 200 OK');
    }

    // Order Status Update: Manager updates status to PREPARING
    {
      const res = await makeRequest(`/api/orders/${testOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: { status: 'PREPARING' }
      });
      assert(res.status === 200 && res.data.data.order.status === 'PREPARING', 'Manager updates order status to PREPARING (200 OK)');
    }

    // Order Status Update: Customer attempts to update status -> 403 Forbidden
    {
      const res = await makeRequest(`/api/orders/${testOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: { status: 'DELIVERED' }
      });
      assert(res.status === 403 && res.data.errorCode === 'FORBIDDEN', 'Customer cannot update order status (403 Forbidden)');
    }

    // ==========================================
    // 8. PHASE 3: KITCHEN QUEUE, WORKFLOW, BILLING & CANCELLATIONS
    // ==========================================
    console.log('\n\x1b[36m[8. Phase 3: Kitchen Display Queue, Workflow, Billing & Cancellation]\x1b[0m');

    // 8.1 Kitchen Display Queue (FIFO & Data Sanitization)
    {
      const res = await makeRequest('/api/kitchen/orders', {
        headers: { Authorization: `Bearer ${kitchenToken}` }
      });
      assert(res.status === 200 && res.data.success === true, 'Kitchen staff retrieves kitchen queue (200 OK)');
      assert(Array.isArray(res.data.data.orders), 'Kitchen queue returns array of orders');

      // Verify all orders in kitchen display are PLACED or PREPARING
      const allActive = res.data.data.orders.every((o) => ['PLACED', 'PREPARING'].includes(o.status));
      assert(allActive, 'Kitchen queue only contains orders in PLACED or PREPARING status');

      // Verify FIFO ordering (createdAt ascending)
      let isFifo = true;
      for (let i = 0; i < res.data.data.orders.length - 1; i++) {
        if (new Date(res.data.data.orders[i].createdAt) > new Date(res.data.data.orders[i + 1].createdAt)) {
          isFifo = false;
          break;
        }
      }
      assert(isFifo, 'Kitchen queue is sorted in FIFO order (createdAt ascending)');

      // Verify customer personal data is stripped
      if (res.data.data.orders.length > 0) {
        const first = res.data.data.orders[0];
        assert(!first.customerId && !first.customer, 'Customer personal information is excluded from kitchen queue');
        assert(first.items && first.items.length > 0, 'Kitchen queue displays food items and quantities');
      }

      // Customer role blocked from kitchen queue -> 403 Forbidden
      const custRes = await makeRequest('/api/kitchen/orders', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(custRes.status === 403 && custRes.data.errorCode === 'FORBIDDEN', 'Customer cannot access kitchen queue (403 Forbidden)');
    }

    // 8.2 Order Workflow & State Machine
    {
      // Kitchen advances PREPARING -> READY
      const res1 = await makeRequest(`/api/orders/${testOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${kitchenToken}` },
        body: { status: 'READY', remarks: 'Food cooked and plated' }
      });
      assert(res1.status === 200 && res1.data.data.order.status === 'READY', 'Kitchen advances order from PREPARING to READY (200 OK)');

      // Kitchen attempts to mark READY -> SERVED (Forbidden for kitchen role)
      const res2 = await makeRequest(`/api/orders/${testOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${kitchenToken}` },
        body: { status: 'SERVED' }
      });
      assert(res2.status === 403 && res2.data.errorCode === 'FORBIDDEN', 'Kitchen staff cannot mark order as SERVED (403 Forbidden)');

      // Manager attempts invalid fulfillment type (READY -> DELIVERED on a DINE_IN order)
      const res3 = await makeRequest(`/api/orders/${testOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: { status: 'DELIVERED' }
      });
      assert(res3.status === 409 && res3.data.errorCode === 'INVALID_STATUS_TRANSITION', 'Dine-In order cannot be marked as DELIVERED (409 Conflict)');

      // Manager advances READY -> SERVED
      const res4 = await makeRequest(`/api/orders/${testOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: { status: 'SERVED', remarks: 'Served to table 1' }
      });
      assert(res4.status === 200 && res4.data.data.order.status === 'SERVED', 'Manager advances Dine-In order from READY to SERVED (200 OK)');

      // Attempt to modify terminal SERVED status
      const res5 = await makeRequest(`/api/orders/${testOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: { status: 'CANCELLED' }
      });
      assert(res5.status === 409 && res5.data.errorCode === 'INVALID_STATUS_TRANSITION', 'Terminal SERVED order cannot transition to CANCELLED (409 Conflict)');

      // Test PLACED -> CANCELLED transition on a fresh order
      const newOrderRes = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          orderType: 'TAKEAWAY',
          items: [{ menuItemId: item1Id, quantity: 1 }]
        }
      });
      const freshOrderId = newOrderRes.data.data.order.id;

      // Attempt illegal jump from PLACED -> SERVED
      const jumpRes = await makeRequest(`/api/orders/${freshOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: { status: 'SERVED' }
      });
      assert(jumpRes.status === 409 && jumpRes.data.errorCode === 'INVALID_STATUS_TRANSITION', 'Direct jump from PLACED to SERVED rejected (409 Conflict)');

      // Cancel the fresh order: PLACED -> CANCELLED
      const cancelOrderRes = await makeRequest(`/api/orders/${freshOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: { status: 'CANCELLED', remarks: 'Customer changed mind' }
      });
      assert(cancelOrderRes.status === 200 && cancelOrderRes.data.data.order.status === 'CANCELLED', 'Manager cancels order from PLACED to CANCELLED (200 OK)');

      // Verify statusHistory audit log
      const historyRes = await makeRequest(`/api/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      const history = historyRes.data.data.order.statusHistory;
      assert(Array.isArray(history) && history.length >= 3, 'Order contains audit statusHistory log');
    }

    // 8.3 Billing Calculations & Order Summary
    {
      // GET Dine-In Bill
      const billRes = await makeRequest(`/api/orders/${testOrderId}/bill`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(billRes.status === 200 && billRes.data.success === true, 'Get Dine-In bill (200 OK)');
      const bill = billRes.data.data.bill;
      assert(bill.taxRate === 5 && bill.serviceChargeRate === 5, 'Dine-In bill applies 5% tax and 5% service charge');
      const calculatedExpectedTotal = Math.round((bill.subtotal + bill.taxAmount + bill.serviceCharge) * 100) / 100;
      assert(bill.totalAmount === calculatedExpectedTotal, 'Dine-In total matches subtotal + tax + service charge');
      assert(Array.isArray(bill.items) && bill.items.length > 0, 'Bill contains itemized list');

      // GET Order Summary
      const summaryRes = await makeRequest(`/api/orders/${testOrderId}/summary`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(summaryRes.status === 200 && summaryRes.data.data.summary.status === 'SERVED', 'Get order summary (200 OK)');
      assert(summaryRes.data.data.summary.statusHistory.length >= 3, 'Order summary contains status history');

      // Kitchen staff blocked from viewing bill -> 403 Forbidden
      const kitchenBillRes = await makeRequest(`/api/orders/${testOrderId}/bill`, {
        headers: { Authorization: `Bearer ${kitchenToken}` }
      });
      assert(kitchenBillRes.status === 403 && kitchenBillRes.data.errorCode === 'FORBIDDEN', 'Kitchen staff cannot access financial billing (403 Forbidden)');

      // Customer 2 blocked from viewing Customer 1's bill -> 403 Forbidden
      const cust2BillRes = await makeRequest(`/api/orders/${testOrderId}/bill`, {
        headers: { Authorization: `Bearer ${customer2Token}` }
      });
      assert(cust2BillRes.status === 403 && cust2BillRes.data.errorCode === 'FORBIDDEN', 'Customer 2 cannot view Customer 1 bill (403 Forbidden)');
    }

    // 8.4 2-Hour Reservation Cancellation Policy
    {
      // Create a reservation 4 hours from now
      const fourHoursLater = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const res4h = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          tableId: seedTable1Id,
          dateTime: fourHoursLater.toISOString(),
          duration: 60
        }
      });
      assert(res4h.status === 201, 'Create reservation 4 hours in the future');
      const res4hId = res4h.data.data.reservation.id;

      // Customer cancels > 2 hours in advance -> 200 OK
      const cancelOkRes = await makeRequest(`/api/reservations/${res4hId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: { remarks: 'Change of schedule' }
      });
      assert(cancelOkRes.status === 200 && cancelOkRes.data.data.status === 'CANCELLED', 'Customer cancels reservation >2 hours in advance (200 OK)');

      // Attempt to cancel already cancelled reservation -> 409
      const cancelAgainRes = await makeRequest(`/api/reservations/${res4hId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(cancelAgainRes.status === 409 && cancelAgainRes.data.errorCode === 'RESERVATION_ALREADY_CANCELLED', 'Cancelling already-cancelled reservation returns 409');

      // Create a reservation 1 hour from now (within the 2-hour cancellation window)
      const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
      const res1h = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          tableId: seedTable1Id,
          dateTime: oneHourLater.toISOString(),
          duration: 45
        }
      });
      assert(res1h.status === 201, 'Create reservation 1 hour in the future');
      const res1hId = res1h.data.data.reservation.id;

      // Customer attempts to cancel < 2 hours in advance -> 409 CANCELLATION_WINDOW_EXPIRED
      const cancelFailRes = await makeRequest(`/api/reservations/${res1hId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(
        cancelFailRes.status === 409 && cancelFailRes.data.errorCode === 'CANCELLATION_WINDOW_EXPIRED',
        'Customer cancellation within 2 hours rejected (409 CANCELLATION_WINDOW_EXPIRED)'
      );

      // Manager performs administrative cancellation on < 2 hour reservation -> 200 OK
      const managerCancelRes = await makeRequest(`/api/reservations/${res1hId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: { remarks: 'Emergency closure override' }
      });
      assert(managerCancelRes.status === 200 && managerCancelRes.data.data.status === 'CANCELLED', 'Manager overrides 2-hour rule for administrative cancellation (200 OK)');
    }

    // 8.5 Atomic Reservation Rescheduling
    {
      // Create a base reservation for 3 days later at 15:00
      const futureDate15 = new Date();
      futureDate15.setDate(futureDate15.getDate() + 3);
      futureDate15.setHours(15, 0, 0, 0);

      const createRes = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          tableId: seedTable1Id,
          dateTime: futureDate15.toISOString(),
          duration: 60
        }
      });
      assert(createRes.status === 201, 'Create base reservation for reschedule test');
      const baseResId = createRes.data.data.reservation.id;

      // Reschedule to 17:00 on the same day (free slot) -> 200 OK
      const futureDate17 = new Date(futureDate15);
      futureDate17.setHours(17, 0, 0, 0);

      const rescheduleOkRes = await makeRequest(`/api/reservations/${baseResId}/reschedule`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          dateTime: futureDate17.toISOString(),
          duration: 60,
          remarks: 'Moving to evening time'
        }
      });
      assert(rescheduleOkRes.status === 200 && rescheduleOkRes.data.success === true, 'Reschedule reservation to available time slot (200 OK)');
      assert(
        new Date(rescheduleOkRes.data.data.reservation.dateTime).getTime() === futureDate17.getTime(),
        'Reservation dateTime updated to new time'
      );

      // Book an occupying reservation at 19:00 on the same day (60 min)
      const futureDate19 = new Date(futureDate15);
      futureDate19.setHours(19, 0, 0, 0);

      const occupyRes = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer2Token}` },
        body: {
          branchId: seedBranchId,
          tableId: seedTable1Id,
          dateTime: futureDate19.toISOString(),
          duration: 60
        }
      });
      assert(occupyRes.status === 201, 'Book occupying reservation at 19:00');

      // Attempt to reschedule base reservation into occupied 19:00 slot -> 409 RESERVATION_CONFLICT
      const conflictRes = await makeRequest(`/api/reservations/${baseResId}/reschedule`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          dateTime: futureDate19.toISOString(),
          duration: 60
        }
      });
      assert(
        conflictRes.status === 409 && conflictRes.data.errorCode === 'RESERVATION_CONFLICT',
        'Rescheduling to conflicting slot rejected (409 RESERVATION_CONFLICT)'
      );

      // Verify original reservation time slot (17:00) is unchanged!
      const verifyRes = await makeRequest(`/api/reservations/${baseResId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(
        new Date(verifyRes.data.data.reservation.dateTime).getTime() === futureDate17.getTime(),
        'Original reservation retains previous valid time slot upon conflict failure'
      );
    }

    // ==========================================
    // 9. PHASE 4: CUSTOMER HISTORY, FEEDBACK, BRANCH MANAGEMENT & ANALYTICS
    // ==========================================
    console.log('\n\x1b[36m[9. Phase 4: Customer History, Feedback, Branch Scoping & Reports]\x1b[0m');

    // 9.1 Customer Order History with Pagination & Filtering
    {
      // Default / paginated order history
      const ordHistoryRes = await makeRequest('/api/customers/orders?page=1&limit=2', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(ordHistoryRes.status === 200 && ordHistoryRes.data.success === true, 'Customer fetches paginated order history (200 OK)');
      assert(ordHistoryRes.data.data.pagination.page === 1, 'Pagination page matches query');
      assert(ordHistoryRes.data.data.pagination.limit === 2, 'Pagination limit matches query');
      assert(Array.isArray(ordHistoryRes.data.data.orders) && ordHistoryRes.data.data.orders.length <= 2, 'Orders count respects limit');

      // Filter by status SERVED
      const servedRes = await makeRequest('/api/customers/orders?status=SERVED', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(servedRes.status === 200, 'Customer filters orders by status=SERVED');
      const allServed = servedRes.data.data.orders.every((o) => o.status === 'SERVED');
      assert(allServed, 'All returned orders have status SERVED');

      // Filter by orderType DINE_IN
      const dineInRes = await makeRequest('/api/customers/orders?orderType=DINE_IN', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(dineInRes.status === 200, 'Customer filters orders by orderType=DINE_IN');
      const allDineIn = dineInRes.data.data.orders.every((o) => o.orderType === 'DINE_IN');
      assert(allDineIn, 'All returned orders have orderType DINE_IN');
    }

    // 9.2 Customer Reservation History with Pagination & Filtering
    {
      const resHistory = await makeRequest('/api/customers/reservations?page=1&limit=5', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(resHistory.status === 200 && resHistory.data.success === true, 'Customer fetches paginated reservation history (200 OK)');
      assert(resHistory.data.data.pagination.page === 1, 'Reservation pagination page is 1');
      assert(Array.isArray(resHistory.data.data.reservations), 'Reservations returned as array');

      // Filter reservations by status CONFIRMED
      const confirmedRes = await makeRequest('/api/customers/reservations?status=CONFIRMED', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(confirmedRes.status === 200, 'Customer filters reservations by status=CONFIRMED');
      const allConfirmed = confirmedRes.data.data.reservations.every((r) => r.status === 'CONFIRMED');
      assert(allConfirmed, 'All filtered reservations have status CONFIRMED');
    }

    // 9.3 Feedback & Rating Module (Submission, Validation, Ownership & Duplicate checks)
    let createdFeedbackId = '';
    let completedOrderIdForFeedback = '';
    {
      // Find a completed SERVED order belonging to customer
      const ordsRes = await makeRequest('/api/customers/orders?status=SERVED', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      const servedOrders = ordsRes.data.data.orders;
      assert(servedOrders.length > 0, 'Found at least one SERVED order for customer');

      // Fetch active menu items for seed branch
      const mRes = await makeRequest(`/api/menu?branchId=${seedBranchId}`);
      const validItemId = mRes.data.data.menuItems[0].id;

      // Create a fresh order and advance it to DELIVERED for clean feedback testing
      const newOrderRes = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: seedBranchId,
          orderType: 'TAKEAWAY',
          items: [{ menuItemId: validItemId, quantity: 1 }]
        }
      });
      assert(newOrderRes.status === 201 && newOrderRes.data.success === true, 'Place takeaway order for feedback test (201 Created)');
      const activeOrderId = newOrderRes.data.data.order.id;

      // Attempt feedback on non-completed order (status: PLACED) -> 409 ORDER_NOT_ELIGIBLE_FOR_FEEDBACK
      const earlyFeedbackRes = await makeRequest('/api/feedback', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          orderId: activeOrderId,
          rating: 4,
          comment: 'Too early!'
        }
      });
      assert(
        earlyFeedbackRes.status === 409 && earlyFeedbackRes.data.errorCode === 'ORDER_NOT_ELIGIBLE_FOR_FEEDBACK',
        'Feedback on non-completed order rejected with 409 ORDER_NOT_ELIGIBLE_FOR_FEEDBACK'
      );

      // Advance order to PREPARING -> READY -> DELIVERED (for TAKEAWAY)
      await makeRequest(`/api/orders/${activeOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${kitchenToken}` },
        body: { status: 'PREPARING' }
      });
      await makeRequest(`/api/orders/${activeOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${kitchenToken}` },
        body: { status: 'READY' }
      });
      await makeRequest(`/api/orders/${activeOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: { status: 'DELIVERED' }
      });

      completedOrderIdForFeedback = activeOrderId;

      // Customer 2 attempts feedback on Customer 1's order -> 403 FORBIDDEN / FEEDBACK_NOT_ALLOWED
      const unauthorizedFeedbackRes = await makeRequest('/api/feedback', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer2Token}` },
        body: {
          orderId: completedOrderIdForFeedback,
          rating: 5,
          comment: 'Not my order'
        }
      });
      assert(
        unauthorizedFeedbackRes.status === 403 &&
          ['FORBIDDEN', 'FEEDBACK_NOT_ALLOWED'].includes(unauthorizedFeedbackRes.data.errorCode),
        'Submitting feedback on another customer order rejected with 403 FORBIDDEN'
      );

      // Validation check: rating out of bounds (0 or 6) -> 400 VALIDATION_ERROR
      const invalidRatingRes = await makeRequest('/api/feedback', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          orderId: completedOrderIdForFeedback,
          rating: 6,
          comment: 'Out of range rating'
        }
      });
      assert(
        invalidRatingRes.status === 400 && invalidRatingRes.data.errorCode === 'VALIDATION_ERROR',
        'Rating outside 1-5 rejected with 400 VALIDATION_ERROR'
      );

      // Submit valid feedback -> 201 Created
      const validFeedbackRes = await makeRequest('/api/feedback', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          orderId: completedOrderIdForFeedback,
          rating: 5,
          comment: 'Sensational meal, packed fresh and hot!'
        }
      });
      assert(validFeedbackRes.status === 201 && validFeedbackRes.data.success === true, 'Customer creates feedback on delivered order (201 Created)');
      createdFeedbackId = validFeedbackRes.data.data.feedback.id;

      // Attempt duplicate feedback on same order -> 409 FEEDBACK_ALREADY_EXISTS
      const duplicateFeedbackRes = await makeRequest('/api/feedback', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          orderId: completedOrderIdForFeedback,
          rating: 4,
          comment: 'Trying duplicate feedback'
        }
      });
      assert(
        duplicateFeedbackRes.status === 409 && duplicateFeedbackRes.data.errorCode === 'FEEDBACK_ALREADY_EXISTS',
        'Duplicate feedback on same order rejected with 409 FEEDBACK_ALREADY_EXISTS'
      );

      // Get feedback by ID
      const getFbRes = await makeRequest(`/api/feedback/${createdFeedbackId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(getFbRes.status === 200 && getFbRes.data.data.feedback.rating === 5, 'GET /api/feedback/:id returns feedback (200 OK)');

      // Get feedback by order ID
      const getByOrderRes = await makeRequest(`/api/orders/${completedOrderIdForFeedback}/feedback`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(getByOrderRes.status === 200 && getByOrderRes.data.data.feedback.id === createdFeedbackId, 'GET /api/orders/:id/feedback returns order feedback');

      // Customer 2 attempts to update Customer 1's feedback -> 403 Forbidden
      const unauthorizedUpdateRes = await makeRequest(`/api/feedback/${createdFeedbackId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customer2Token}` },
        body: { rating: 1, comment: 'Hacked comment' }
      });
      assert(unauthorizedUpdateRes.status === 403, 'Customer 2 cannot update Customer 1 feedback (403 Forbidden)');

      // Customer 1 updates own feedback -> 200 OK
      const updateFbRes = await makeRequest(`/api/feedback/${createdFeedbackId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: { rating: 4, comment: 'Updated comment: Excellent overall.' }
      });
      assert(updateFbRes.status === 200 && updateFbRes.data.data.feedback.rating === 4, 'Customer updates own feedback (200 OK)');

      // Delete feedback -> 200 OK
      const deleteFbRes = await makeRequest(`/api/feedback/${createdFeedbackId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(deleteFbRes.status === 200 && deleteFbRes.data.success === true, 'Customer deletes own feedback (200 OK)');
    }

    // 9.4 Branch Management, Operational Deactivation & Business Rules
    let testBranchId = '';
    {
      // Admin creates test branch
      const createBRes = await makeRequest('/api/branches', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: 'Deactivation Test Branch',
          address: 'Test Location Road, Bengaluru',
          seatingCapacity: 40
        }
      });
      testBranchId = createBRes.data.data.branch.id;

      // Add a table to this test branch
      const createTRes = await makeRequest('/api/tables', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          branchId: testBranchId,
          tableNumber: 1,
          capacity: 4
        }
      });
      const testTableId = createTRes.data.data.table.id;

      // Manager (unassigned to testBranchId) attempts to update branch status -> 403 FORBIDDEN / BRANCH_ACCESS_DENIED
      const unauthManagerStatusRes = await makeRequest(`/api/branches/${testBranchId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${managerToken}` },
        body: { isActive: false }
      });
      assert(
        unauthManagerStatusRes.status === 403 &&
          ['FORBIDDEN', 'BRANCH_ACCESS_DENIED'].includes(unauthManagerStatusRes.data.errorCode),
        'Unassigned manager cannot change branch status (403 FORBIDDEN / BRANCH_ACCESS_DENIED)'
      );

      // Admin deactivates test branch -> 200 OK
      const deactRes = await makeRequest(`/api/branches/${testBranchId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { isActive: false }
      });
      assert(deactRes.status === 200 && deactRes.data.data.branch.isActive === false, 'Admin deactivates branch (200 OK)');

      // Attempt reservation on deactivated branch -> 409 BRANCH_INACTIVE
      const tomorrowTest = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const resvDeactRes = await makeRequest('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: testBranchId,
          tableId: testTableId,
          dateTime: tomorrowTest.toISOString(),
          duration: 60
        }
      });
      assert(
        resvDeactRes.status === 409 && resvDeactRes.data.errorCode === 'BRANCH_INACTIVE',
        'Reservation on inactive branch rejected with 409 BRANCH_INACTIVE'
      );

      // Add a menu item to test branch
      const createMRes = await makeRequest('/api/menu', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          branchId: testBranchId,
          name: 'Deactivation Special Dish',
          category: 'Main Course',
          price: 199,
          isAvailable: true
        }
      });
      const testBranchItemId = createMRes.data.data.menuItem.id;

      // Attempt food order on deactivated branch -> 409 BRANCH_INACTIVE
      const orderDeactRes = await makeRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          branchId: testBranchId,
          orderType: 'TAKEAWAY',
          items: [{ menuItemId: testBranchItemId, quantity: 1 }]
        }
      });
      assert(
        orderDeactRes.status === 409 && orderDeactRes.data.errorCode === 'BRANCH_INACTIVE',
        'Order placement on inactive branch rejected with 409 BRANCH_INACTIVE'
      );

      // Reactivate branch -> 200 OK
      const reactRes = await makeRequest(`/api/branches/${testBranchId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { isActive: true }
      });
      assert(reactRes.status === 200 && reactRes.data.data.branch.isActive === true, 'Admin reactivates branch (200 OK)');
    }

    // 9.5 Branch-Scoped Authorization & Manager Reports / Analytics
    {
      // Customer blocked from manager reports -> 403 FORBIDDEN
      const custReportRes = await makeRequest('/api/manager/reports/summary', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(
        custReportRes.status === 403 && custReportRes.data.errorCode === 'FORBIDDEN',
        'Customer accessing manager reports rejected with 403 FORBIDDEN'
      );

      // Manager accesses unauthorized branch (Kengeri) report -> 403 FORBIDDEN / BRANCH_ACCESS_DENIED
      const managerUnauthorizedRes = await makeRequest(`/api/manager/reports/summary?branchId=${kengeriBranchId}`, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      assert(
        managerUnauthorizedRes.status === 403 &&
          ['FORBIDDEN', 'BRANCH_ACCESS_DENIED'].includes(managerUnauthorizedRes.data.errorCode),
        'Manager accessing unmanaged branch report rejected with 403 FORBIDDEN / BRANCH_ACCESS_DENIED'
      );

      // Manager accesses assigned branch (Central) report -> 200 OK
      const managerSummaryRes = await makeRequest(`/api/manager/reports/summary?branchId=${seedBranchId}`, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      assert(managerSummaryRes.status === 200 && managerSummaryRes.data.success === true, 'Manager accesses assigned branch summary report (200 OK)');
      assert(typeof managerSummaryRes.data.data.totalSales === 'number', 'Summary contains totalSales number');
      assert(typeof managerSummaryRes.data.data.totalOrders === 'number', 'Summary contains totalOrders number');
      assert(typeof managerSummaryRes.data.data.totalReservations === 'number', 'Summary contains totalReservations number');

      // Admin accesses any branch report -> 200 OK
      const adminSummaryRes = await makeRequest(`/api/manager/reports/summary?branchId=${kengeriBranchId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(adminSummaryRes.status === 200, 'Admin has system-wide access to any branch report (200 OK)');

      // Sales Report
      const salesRes = await makeRequest('/api/manager/reports/sales', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(salesRes.status === 200 && salesRes.data.success === true, 'GET /api/manager/reports/sales (200 OK)');
      assert(typeof salesRes.data.data.totalRevenue === 'number', 'Sales report contains totalRevenue');
      assert(typeof salesRes.data.data.totalOrders === 'number', 'Sales report contains totalOrders');

      // Popular Dishes Report
      const dishesRes = await makeRequest('/api/manager/reports/popular-dishes?limit=5', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(dishesRes.status === 200 && dishesRes.data.success === true, 'GET /api/manager/reports/popular-dishes (200 OK)');
      assert(Array.isArray(dishesRes.data.data.dishes), 'Popular dishes returned as array');

      // Peak Hours Report (Orders)
      const peakHoursRes = await makeRequest('/api/manager/reports/peak-hours', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(peakHoursRes.status === 200 && peakHoursRes.data.success === true, 'GET /api/manager/reports/peak-hours (200 OK)');
      assert(Array.isArray(peakHoursRes.data.data.peakHours), 'Peak hours returned as array');

      // Reservation Peak Hours Report
      const resvPeakRes = await makeRequest('/api/manager/reports/reservation-peak-hours', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resvPeakRes.status === 200 && resvPeakRes.data.success === true, 'GET /api/manager/reports/reservation-peak-hours (200 OK)');
      assert(Array.isArray(resvPeakRes.data.data.reservationPeakHours), 'Reservation peak hours returned as array');

      // Ratings & Feedback Analytics Report
      const ratingsRes = await makeRequest('/api/manager/reports/ratings', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(ratingsRes.status === 200 && ratingsRes.data.success === true, 'GET /api/manager/reports/ratings (200 OK)');
      assert(typeof ratingsRes.data.data.averageRating === 'number', 'Ratings report contains averageRating');
      assert(typeof ratingsRes.data.data.totalFeedbacks === 'number', 'Ratings report contains totalFeedbacks');
      assert(Array.isArray(ratingsRes.data.data.distribution), 'Ratings report contains distribution array');
    }

    // ==========================================
    // 10. 404 UNKNOWN ROUTE HANDLER
    // ==========================================
    console.log('\n\x1b[36m[10. Unknown Route Handling]\x1b[0m');
    {
      const res = await makeRequest('/api/unknown/endpoint');
      assert(res.status === 404 && res.data.errorCode === 'NOT_FOUND', 'Unknown endpoint returns standardized 404 NOT_FOUND');
    }

    // ==========================================
    // TEST SUMMARY
    // ==========================================
    console.log('\n==================================================');
    console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
    if (failedTests > 0) {
      console.log(`  \x1b[31m${failedTests} TESTS FAILED\x1b[0m`);
      console.log('==================================================\n');
      process.exit(1);
    } else {
      console.log('  \x1b[32mALL TESTS PASSED PERFECTLY!\x1b[0m');
      console.log('==================================================\n');
    }
  } catch (error) {
    console.error('[Test Runner] Unexpected Error:', error);
    process.exit(1);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
};

runTests();
