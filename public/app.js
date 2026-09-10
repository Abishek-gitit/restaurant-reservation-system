/* ============================================================
   RestoHub — Role-Based Frontend Controller
   Router + 3 Separate Dashboards (Customer / Kitchen / Manager)
   ============================================================ */

const API_BASE = '/api';

// ============================================================
// GLOBAL STATE
// ============================================================
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  branches: [],
  selectedBranchId: null,
  menuItems: [],
  activeCategory: 'ALL',
  tables: [],
  cart: [],
  isRegisterMode: false,
  kitchenRefreshTimer: null,
  kitchenCountdown: 30,
  managerSubTab: 'analytics'
};

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // If we have a stored token, verify it's still valid
  if (state.token && state.user) {
    try {
      const data = await authFetch(`${API_BASE}/auth/me`);
      state.user = data.data.user;
      localStorage.setItem('user', JSON.stringify(state.user));
    } catch (err) {
      // Token expired or invalid — force re-login
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Load branches (needed by all dashboards)
  await loadBranches();

  // Hash-based routing
  window.addEventListener('hashchange', renderView);
  renderView();
});

// ============================================================
// ROUTER
// ============================================================
const ROLE_HOME = {
  customer: '#/customer',
  kitchen:  '#/kitchen',
  manager:  '#/manager',
  admin:    '#/manager'
};

const ROLE_ALLOWED_PATHS = {
  customer: ['#/customer'],
  kitchen:  ['#/kitchen'],
  manager:  ['#/manager', '#/manager/orders', '#/manager/menu', '#/manager/reservations', '#/manager/branches'],
  admin:    ['#/manager', '#/manager/orders', '#/manager/menu', '#/manager/reservations', '#/manager/branches', '#/manager/staff']
};

function navigate(hash) {
  window.location.hash = hash;
}

function renderView() {
  // Stop any kitchen refresh timer when navigating away
  if (state.kitchenRefreshTimer) {
    clearInterval(state.kitchenRefreshTimer);
    state.kitchenRefreshTimer = null;
  }

  const hash = window.location.hash || '';
  const app = document.getElementById('app');

  // Not logged in — show login
  if (!state.token || !state.user) {
    renderLoginPage();
    return;
  }

  const role = state.user.role; // 'customer' | 'kitchen' | 'manager' | 'admin'
  const home = ROLE_HOME[role] || '#/customer';
  const allowed = ROLE_ALLOWED_PATHS[role] || [];

  // No hash or root → redirect to role home
  if (!hash || hash === '#' || hash === '#/') {
    navigate(home);
    return;
  }

  // Guard: check if current path is allowed for this role
  const pathAllowed = allowed.some(p => hash === p || hash.startsWith(p + '/'));
  if (!pathAllowed) {
    showToast('Access denied. Redirecting to your dashboard.', 'error');
    navigate(home);
    return;
  }

  // Render correct dashboard
  if (role === 'customer') {
    renderCustomerDashboard();
  } else if (role === 'kitchen') {
    renderKitchenDashboard();
  } else if (role === 'manager' || role === 'admin') {
    renderManagerDashboard();
  } else {
    renderLoginPage();
  }
}

// ============================================================
// SHARED UTILITIES
// ============================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function authFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('#/login');
      renderView();
    }
    const err = new Error(data.message || 'Request failed');
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function loadBranches() {
  try {
    const res = await fetch(`${API_BASE}/branches`);
    const data = await res.json();
    if (data.success && data.data.branches) {
      state.branches = data.data.branches;
      if (state.branches.length > 0 && !state.selectedBranchId) {
        state.selectedBranchId = state.branches[0].id || state.branches[0]._id;
      }
    }
  } catch (err) {
    console.error('Failed to load branches', err);
  }
}

function branchOptionsHtml(includeAll = false) {
  const all = includeAll ? `<option value="">All Branches</option>` : '';
  return all + state.branches.map(b =>
    `<option value="${b.id || b._id}" ${(b.id || b._id) === state.selectedBranchId ? 'selected' : ''}>${b.name} (${b.isActive ? 'Active' : 'Inactive'})</option>`
  ).join('');
}

// ============================================================
// ROLE-SPECIFIC NAVBARS
// ============================================================
function renderCustomerNav() {
  return `
    <header class="navbar navbar-customer">
      <div class="nav-container">
        <div class="brand">
          <span class="logo-icon">🍽️</span>
          <div>
            <span class="brand-title">RestoHub</span>
            <span class="brand-subtitle">Customer Portal</span>
          </div>
        </div>
        <nav class="nav-links">
          <button class="nav-btn" id="navMenuBtn" onclick="switchCustomerTab('menu')">🍛 Menu & Order</button>
          <button class="nav-btn" id="navOrdersBtn" onclick="switchCustomerTab('orders')">📋 My Orders</button>
          <button class="nav-btn" id="navReservationsBtn" onclick="switchCustomerTab('reservations')">📅 Reservations</button>
        </nav>
        <div class="user-profile">
          <div class="user-pill">
            <span>👤 ${state.user.name || state.user.email}</span>
            <span class="role-badge">customer</span>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="logout()">Logout</button>
        </div>
      </div>
    </header>`;
}

function renderKitchenNav() {
  return `
    <header class="navbar navbar-kitchen">
      <div class="nav-container">
        <div class="brand">
          <span class="logo-icon">🔥</span>
          <div>
            <span class="brand-title">RestoHub</span>
            <span class="brand-subtitle">Kitchen Display</span>
          </div>
        </div>
        <nav class="nav-links">
          <button class="nav-btn active" onclick="loadKitchenQueue()">🍳 Live Queue</button>
        </nav>
        <div class="user-profile">
          <div class="user-pill">
            <span>👨‍🍳 ${state.user.name || state.user.email}</span>
            <span class="role-badge">kitchen</span>
          </div>
          <button class="btn btn-sm" style="background:#92400e;color:#fed7aa;" onclick="logout()">Logout</button>
        </div>
      </div>
    </header>`;
}

function renderManagerNav(activeTab) {
  const isAdmin = state.user && state.user.role === 'admin';
  const tabs = [
    { id: 'analytics',    icon: '📊', label: 'Analytics' },
    { id: 'orders',       icon: '📋', label: 'Orders' },
    { id: 'menu',         icon: '🍽️', label: 'Menu' },
    { id: 'reservations', icon: '📅', label: 'Reservations' },
    { id: 'branches',     icon: '🏪', label: 'Branches' }
  ];

  if (isAdmin) {
    tabs.push({ id: 'staff', icon: '👥', label: 'Staff' });
  }

  const title = isAdmin ? 'Admin Dashboard' : 'Manager Dashboard';
  const logo = isAdmin ? '⚙️' : '📊';
  const roleBadgeClass = isAdmin ? 'role-badge badge-admin' : 'role-badge';

  return `
    <header class="navbar navbar-manager ${isAdmin ? 'navbar-admin' : ''}">
      <div class="nav-container">
        <div class="brand">
          <span class="logo-icon">${logo}</span>
          <div>
            <span class="brand-title">RestoHub</span>
            <span class="brand-subtitle">${title}</span>
          </div>
        </div>
        <nav class="nav-links">
          ${tabs.map(t => `
            <button class="nav-btn ${activeTab === t.id ? 'active' : ''}"
              onclick="switchManagerTab('${t.id}')">${t.icon} ${t.label}</button>
          `).join('')}
        </nav>
        <div class="user-profile">
          <div class="user-pill">
            <span>🏢 ${state.user.name || state.user.email}</span>
            <span class="${roleBadgeClass}">${state.user.role}</span>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="logout()">Logout</button>
        </div>
      </div>
    </header>`;
}

// ============================================================
// LOGIN PAGE
// ============================================================
function renderLoginPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <span class="logo-icon">🍽️</span>
          <h1>RestoHub</h1>
          <p>Sign in to access your dashboard</p>
        </div>

        <div class="demo-pills">
          <span class="demo-label">Quick Demo Logins</span>
          <button class="pill-btn" onclick="quickFill('customer@restaurant.com','Password@123')">👤 Customer</button>
          <button class="pill-btn kitchen" onclick="quickFill('kitchen@restaurant.com','Password@123')">👨‍🍳 Kitchen</button>
          <button class="pill-btn" onclick="quickFill('manager@restaurant.com','Password@123')">🏢 Manager</button>
          <button class="pill-btn" onclick="quickFill('admin@restaurant.com','Password@123')">⚙️ Admin</button>
        </div>

        <form id="authForm" onsubmit="handleAuthSubmit(event)">
          <div class="form-group" id="nameGroup" style="display:none">
            <label for="authName">Full Name</label>
            <input type="text" id="authName" class="form-control" placeholder="John Doe">
          </div>
          <div class="form-group">
            <label for="authEmail">Email Address</label>
            <input type="email" id="authEmail" class="form-control" required placeholder="user@restaurant.com">
          </div>
          <div class="form-group">
            <label for="authPassword">Password</label>
            <input type="password" id="authPassword" class="form-control" required placeholder="••••••••">
          </div>
          <div class="form-group" id="phoneGroup" style="display:none">
            <label for="authPhone">Phone Number</label>
            <input type="text" id="authPhone" class="form-control" placeholder="+91 9876543210">
          </div>
          <button type="submit" id="authSubmitBtn" class="btn btn-primary w-100" style="margin-top:0.5rem">Sign In</button>
        </form>

        <div class="auth-toggle">
          <span id="authToggleText">Don't have an account?</span>
          <button type="button" class="link-btn" id="authToggleBtn" onclick="toggleAuthMode()">Create one here</button>
        </div>
      </div>
    </div>`;
}

function quickFill(email, password) {
  const emailEl = document.getElementById('authEmail');
  const passEl = document.getElementById('authPassword');
  if (emailEl) emailEl.value = email;
  if (passEl) passEl.value = password;
  if (state.isRegisterMode) toggleAuthMode();
}

function toggleAuthMode() {
  state.isRegisterMode = !state.isRegisterMode;
  const nameGroup = document.getElementById('nameGroup');
  const phoneGroup = document.getElementById('phoneGroup');
  const authTitle = document.getElementById('authTitle');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authToggleText = document.getElementById('authToggleText');
  const authToggleBtn = document.getElementById('authToggleBtn');

  if (state.isRegisterMode) {
    if (nameGroup) nameGroup.style.display = 'block';
    if (phoneGroup) phoneGroup.style.display = 'block';
    if (authSubmitBtn) authSubmitBtn.innerText = 'Register';
    if (authToggleText) authToggleText.innerText = 'Already have an account?';
    if (authToggleBtn) authToggleBtn.innerText = 'Sign in here';
  } else {
    if (nameGroup) nameGroup.style.display = 'none';
    if (phoneGroup) phoneGroup.style.display = 'none';
    if (authSubmitBtn) authSubmitBtn.innerText = 'Sign In';
    if (authToggleText) authToggleText.innerText = "Don't have an account?";
    if (authToggleBtn) authToggleBtn.innerText = 'Create one here';
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const submitBtn = document.getElementById('authSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  try {
    let res;
    if (state.isRegisterMode) {
      const name = document.getElementById('authName').value.trim();
      const phone = document.getElementById('authPhone').value.trim();
      res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });
    } else {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Authentication failed');

    state.token = data.data.token;
    state.user = data.data.user;
    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));

    showToast(`Welcome, ${state.user.name || state.user.email}! 🎉`, 'success');

    // Navigate to role-specific dashboard
    const home = ROLE_HOME[state.user.role] || '#/customer';
    navigate(home);
  } catch (err) {
    showToast(err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = state.isRegisterMode ? 'Register' : 'Sign In';
  }
}

function logout() {
  if (state.kitchenRefreshTimer) {
    clearInterval(state.kitchenRefreshTimer);
    state.kitchenRefreshTimer = null;
  }
  state.token = null;
  state.user = null;
  state.cart = [];
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.hash = '';
  showToast('Logged out successfully', 'info');
  renderLoginPage();
}

// ============================================================
// ============================================================
// CUSTOMER DASHBOARD
// ============================================================
// ============================================================
let customerActiveTab = 'menu';

function renderCustomerDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderCustomerNav()}
    <main class="main-container">
      <!-- Branch Strip -->
      <div class="branch-strip card mb-4">
        <div class="branch-info">
          <span class="label">Branch:</span>
          <select id="branchSelect" class="form-select" onchange="onBranchChange()" style="width:auto">
            ${branchOptionsHtml()}
          </select>
          <span id="branchStatusBadge" class="badge badge-success">Active</span>
        </div>
        <div class="branch-meta">
          <span>Capacity: <strong id="branchCapacity">—</strong></span>
          <span>📍 <strong id="branchAddress">—</strong></span>
        </div>
      </div>

      <!-- Sub Navigation -->
      <div class="sub-nav">
        <button class="sub-btn ${customerActiveTab==='menu'?'active':''}" onclick="switchCustomerTab('menu')">🍛 Menu & Ordering</button>
        <button class="sub-btn ${customerActiveTab==='orders'?'active':''}" onclick="switchCustomerTab('orders')">📋 My Orders & Bills</button>
        <button class="sub-btn ${customerActiveTab==='reservations'?'active':''}" onclick="switchCustomerTab('reservations')">📅 Table Reservations</button>
        <button class="sub-btn ${customerActiveTab==='history'?'active':''}" onclick="switchCustomerTab('history')">📜 Reservation History</button>
      </div>

      <!-- Menu Tab -->
      <div id="customerTab-menu" class="subtab-pane ${customerActiveTab==='menu'?'active':''}">
        <div class="menu-layout">
          <div class="menu-section card">
            <div class="section-header">
              <h3>Branch Menu</h3>
              <div class="category-filters" id="categoryFilters">
                <button class="filter-btn active" onclick="filterMenu('ALL',event)">All</button>
                <button class="filter-btn" onclick="filterMenu('Starters',event)">Starters</button>
                <button class="filter-btn" onclick="filterMenu('Main Course',event)">Main Course</button>
                <button class="filter-btn" onclick="filterMenu('Desserts',event)">Desserts</button>
                <button class="filter-btn" onclick="filterMenu('Beverages',event)">Beverages</button>
              </div>
            </div>
            <div id="menuGrid" class="menu-grid">
              <div class="empty-state">Select a branch to see the menu.</div>
            </div>
          </div>

          <div class="cart-section card">
            <h3>Your Order</h3>
            <div class="order-type-selector">
              <label class="radio-label">
                <input type="radio" name="orderType" value="DINE_IN" checked onchange="updateCartUI()">
                <span>🍽️ Dine In</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="orderType" value="TAKEAWAY" onchange="updateCartUI()">
                <span>🥡 Takeaway</span>
              </label>
            </div>
            <div id="dineInTableSelectGroup" class="form-group">
              <label for="cartTableSelect">Select Table:</label>
              <select id="cartTableSelect" class="form-select">
                <option value="">Choose a table...</option>
              </select>
            </div>
            <div id="cartItemsList" class="cart-items">
              <div class="empty-cart text-muted">No items in your cart.</div>
            </div>
            <div class="bill-breakdown">
              <div class="bill-row"><span>Subtotal:</span><strong id="billSubtotal">₹0.00</strong></div>
              <div class="bill-row"><span>Tax (5%):</span><span id="billTax">₹0.00</span></div>
              <div class="bill-row"><span>Service Charge (5%):</span><span id="billServiceCharge">₹0.00</span></div>
              <div class="bill-row grand-total"><span>Grand Total:</span><strong id="billTotal">₹0.00</strong></div>
            </div>
            <button id="placeOrderBtn" class="btn btn-primary w-100 mt-3" onclick="handlePlaceOrder()" disabled>
              Place Order
            </button>
          </div>
        </div>
      </div>

      <!-- My Orders Tab -->
      <div id="customerTab-orders" class="subtab-pane ${customerActiveTab==='orders'?'active':''}">
        <div class="card">
          <div class="section-header">
            <h3>My Orders & Bills</h3>
            <button class="btn btn-sm btn-secondary" onclick="loadCustomerOrders()">↻ Refresh</button>
          </div>
          <div id="customerOrdersContainer" class="orders-list">
            <div class="empty-state">Loading orders...</div>
          </div>
        </div>
      </div>

      <!-- Reservations Tab -->
      <div id="customerTab-reservations" class="subtab-pane ${customerActiveTab==='reservations'?'active':''}">
        <div class="grid-2-col">
          <div class="card">
            <h3>Book a Table</h3>
            <p class="text-muted mt-2">Instant confirmation with conflict prevention.</p>
            <form id="reservationForm" onsubmit="handleCreateReservation(event)" style="margin-top:1rem">
              <div class="form-group">
                <label>Select Table</label>
                <select id="reserveTableSelect" class="form-select" required>
                  <option value="">Select table...</option>
                </select>
              </div>
              <div class="form-group">
                <label>Reservation Date & Time</label>
                <input type="datetime-local" id="reserveDateTime" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Duration (Minutes)</label>
                <select id="reserveDuration" class="form-select">
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120" selected>120 minutes (Standard)</option>
                  <option value="180">180 minutes</option>
                </select>
              </div>
              <div class="form-group">
                <label>Number of Guests</label>
                <input type="number" id="reserveGuests" class="form-control" min="1" max="20" value="2" required>
              </div>
              <div class="form-group">
                <label>Special Requests (Optional)</label>
                <input type="text" id="reserveRequests" class="form-control" placeholder="Window view, quiet corner, etc.">
              </div>
              <button type="submit" class="btn btn-primary w-100">Confirm Reservation</button>
            </form>
          </div>
          <div class="card">
            <h3>Tables at This Branch</h3>
            <div id="branchTablesGrid" class="tables-grid">
              <div class="empty-state">Select a branch to see tables.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reservation History Tab -->
      <div id="customerTab-history" class="subtab-pane ${customerActiveTab==='history'?'active':''}">
        <div class="card">
          <div class="section-header">
            <h3>My Reservations</h3>
            <button class="btn btn-sm btn-secondary" onclick="loadCustomerReservations()">↻ Refresh</button>
          </div>
          <div id="customerReservationsContainer" class="reservations-list">
            <div class="empty-state">Loading reservations...</div>
          </div>
        </div>
      </div>
    </main>`;

  // After rendering, update branch info, load menu, tables, and active tab data
  updateBranchInfo();
  loadMenu();
  loadTables();
  updateNavBtns();
  setDefaultDateTime();

  if (customerActiveTab === 'orders') loadCustomerOrders();
  if (customerActiveTab === 'history') loadCustomerReservations();
  updateCartUI();
}

function switchCustomerTab(tabId) {
  customerActiveTab = tabId;
  document.querySelectorAll('[id^="customerTab-"]').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`customerTab-${tabId}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
  const btns = document.querySelectorAll('.sub-btn');
  btns.forEach(b => { if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId)) b.classList.add('active'); });

  updateNavBtns();
  if (tabId === 'orders') loadCustomerOrders();
  if (tabId === 'history') loadCustomerReservations();
}

function updateNavBtns() {
  ['menu','orders','reservations','history'].forEach(t => {
    const btn = document.getElementById(`nav${t.charAt(0).toUpperCase()+t.slice(1)}Btn`);
    if (btn) btn.classList.toggle('active', t === customerActiveTab);
  });
  // Also fix the sub-nav buttons
  document.querySelectorAll('.sub-btn').forEach(b => {
    const onclick = b.getAttribute('onclick') || '';
    const isActive = onclick.includes(`'${customerActiveTab}'`) || onclick.includes(`"${customerActiveTab}"`);
    b.classList.toggle('active', isActive);
  });
}

function setDefaultDateTime() {
  const dtInput = document.getElementById('reserveDateTime');
  if (dtInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    dtInput.value = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
}

// Branch handlers
function onBranchChange() {
  const select = document.getElementById('branchSelect');
  state.selectedBranchId = select.value;
  updateBranchInfo();
  state.cart = [];
  updateCartUI();
  loadMenu();
  loadTables();
}

function updateBranchInfo() {
  const current = state.branches.find(b => (b.id || b._id) === state.selectedBranchId);
  if (!current) return;
  const cap = document.getElementById('branchCapacity');
  const addr = document.getElementById('branchAddress');
  const badge = document.getElementById('branchStatusBadge');
  if (cap) cap.innerText = current.seatingCapacity;
  if (addr) addr.innerText = current.address;
  if (badge) {
    badge.className = `badge badge-${current.isActive ? 'success' : 'danger'}`;
    badge.innerText = current.isActive ? 'Active' : 'Inactive (Closed)';
  }
}

// --- Menu ---
async function loadMenu() {
  if (!state.selectedBranchId) return;
  const grid = document.getElementById('menuGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="text-muted">Loading menu...</div>';
  try {
    const res = await fetch(`${API_BASE}/menu?branchId=${state.selectedBranchId}`);
    const data = await res.json();
    if (data.success) {
      state.menuItems = data.data.menuItems || data.data.items || [];
      renderMenu();
    }
  } catch (err) {
    if (grid) grid.innerHTML = '<div class="text-muted">Error loading menu.</div>';
  }
}

function filterMenu(category, event) {
  state.activeCategory = category;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderMenu();
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;
  let filtered = state.menuItems;
  if (state.activeCategory !== 'ALL') filtered = filtered.filter(i => i.category === state.activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">No items found for this category.</div>';
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const itemId = item.id || item._id;
    return `
      <div class="menu-card">
        <div>
          <span class="menu-category-tag">${item.category}</span>
          <div class="menu-title">${item.name}</div>
          <div class="menu-price">₹${Number(item.price).toFixed(2)}</div>
          ${item.description ? `<div class="text-muted mt-2" style="font-size:0.8rem">${item.description}</div>` : ''}
        </div>
        <button class="btn btn-primary btn-sm mt-3"
          ${!item.isAvailable ? 'disabled' : ''}
          onclick="addToCart('${itemId}')">
          ${item.isAvailable ? '＋ Add to Order' : '✕ Unavailable'}
        </button>
      </div>`;
  }).join('');
}

// --- Cart ---
function addToCart(itemId) {
  if (!state.token) {
    showToast('Please sign in to place an order', 'error');
    return;
  }
  const item = state.menuItems.find(i => (i.id || i._id) === itemId);
  if (!item) return;
  const existing = state.cart.find(c => c.menuItemId === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ menuItemId: itemId, name: item.name, price: item.price, quantity: 1 });
  }
  updateCartUI();
  showToast(`Added ${item.name} to order`, 'info');
}

function updateQuantity(itemId, delta) {
  const idx = state.cart.findIndex(c => c.menuItemId === itemId);
  if (idx > -1) {
    state.cart[idx].quantity += delta;
    if (state.cart[idx].quantity <= 0) state.cart.splice(idx, 1);
  }
  updateCartUI();
}

function updateCartUI() {
  const container = document.getElementById('cartItemsList');
  const btn = document.getElementById('placeOrderBtn');
  const orderType = document.querySelector('input[name="orderType"]:checked')?.value || 'DINE_IN';
  const tableGroup = document.getElementById('dineInTableSelectGroup');
  if (tableGroup) tableGroup.style.display = orderType === 'DINE_IN' ? 'block' : 'none';

  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = '<div class="empty-cart text-muted">No items in your cart.</div>';
    ['billSubtotal','billTax','billServiceCharge','billTotal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = '₹0.00';
    });
    if (btn) btn.disabled = true;
    return;
  }

  container.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <div class="text-muted">₹${Number(item.price).toFixed(2)} each</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="updateQuantity('${item.menuItemId}', -1)">−</button>
        <span>${item.quantity}</span>
        <button class="qty-btn" onclick="updateQuantity('${item.menuItemId}', 1)">+</button>
        <strong class="ml-2">₹${(item.price * item.quantity).toFixed(2)}</strong>
      </div>
    </div>`).join('');

  const subtotal = state.cart.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const tax = Number((subtotal * 0.05).toFixed(2));
  const svc = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + tax + svc).toFixed(2));

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  set('billSubtotal', `₹${subtotal.toFixed(2)}`);
  set('billTax', `₹${tax.toFixed(2)}`);
  set('billServiceCharge', `₹${svc.toFixed(2)}`);
  set('billTotal', `₹${total.toFixed(2)}`);
  if (btn) btn.disabled = false;
}

async function handlePlaceOrder() {
  if (!state.token) {
    showToast('Please sign in to place an order', 'error');
    return;
  }
  const orderType = document.querySelector('input[name="orderType"]:checked')?.value || 'DINE_IN';
  const tableId = document.getElementById('cartTableSelect')?.value;
  if (orderType === 'DINE_IN' && !tableId) {
    showToast('Please select a table for Dine In', 'error');
    return;
  }

  try {
    await authFetch(`${API_BASE}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        branchId: state.selectedBranchId,
        orderType,
        tableId: orderType === 'DINE_IN' ? tableId : undefined,
        items: state.cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity }))
      })
    });
    showToast('Order placed successfully! 🎉', 'success');
    state.cart = [];
    updateCartUI();
    switchCustomerTab('orders');
    loadCustomerOrders();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Tables ---
async function loadTables() {
  if (!state.selectedBranchId) return;
  try {
    const res = await fetch(`${API_BASE}/tables?branchId=${state.selectedBranchId}`);
    const data = await res.json();
    if (data.success) {
      state.tables = data.data.tables || [];
      renderTables();
    }
  } catch (err) { console.error(err); }
}

function renderTables() {
  const reserveSelect = document.getElementById('reserveTableSelect');
  const cartTableSelect = document.getElementById('cartTableSelect');
  const grid = document.getElementById('branchTablesGrid');
  const options = state.tables.map(t => `<option value="${t.id || t._id}">Table #${t.tableNumber} (${t.capacity} seats)</option>`).join('');
  if (reserveSelect) reserveSelect.innerHTML = '<option value="">Select table...</option>' + options;
  if (cartTableSelect) cartTableSelect.innerHTML = '<option value="">Choose a table...</option>' + options;
  if (grid) {
    grid.innerHTML = state.tables.length === 0
      ? '<div class="empty-state">No tables registered for this branch.</div>'
      : state.tables.map(t => `
          <div class="table-card">
            <div class="table-num">T-${t.tableNumber}</div>
            <div class="table-cap">${t.capacity} Guests</div>
          </div>`).join('');
  }
}

// --- Reservations ---
async function handleCreateReservation(event) {
  event.preventDefault();
  if (!state.token) { showToast('Please sign in to reserve a table', 'error'); return; }
  const tableId = document.getElementById('reserveTableSelect').value;
  const dateTime = document.getElementById('reserveDateTime').value;
  const duration = Number(document.getElementById('reserveDuration').value);
  const guests = Number(document.getElementById('reserveGuests').value);
  const specialRequests = document.getElementById('reserveRequests').value;
  try {
    await authFetch(`${API_BASE}/reservations`, {
      method: 'POST',
      body: JSON.stringify({
        branchId: state.selectedBranchId,
        tableId, guests, duration, specialRequests,
        dateTime: new Date(dateTime).toISOString()
      })
    });
    showToast('Reservation confirmed! ✅', 'success');
    switchCustomerTab('history');
    loadCustomerReservations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Customer Orders ---
async function loadCustomerOrders() {
  if (!state.token) return;
  const container = document.getElementById('customerOrdersContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-muted">Loading orders...</div>';
  try {
    const data = await authFetch(`${API_BASE}/customers/orders`);
    const orders = data.data.orders || [];
    if (orders.length === 0) {
      container.innerHTML = '<div class="empty-state">No orders placed yet.</div>';
      return;
    }
    container.innerHTML = orders.map(o => {
      const orderId = o.id || o._id;
      const branchName = o.branchId?.name || 'Branch';
      const isEligibleFeedback = o.status === 'SERVED' || o.status === 'DELIVERED';
      const isCancellable = o.status === 'PLACED';
      return `
        <div class="card mb-3">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
            <div>
              <strong>Order #${orderId.slice(-6).toUpperCase()}</strong>
              <div class="text-muted">${branchName} • ${new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <span class="badge badge-${o.status}">${o.status}</span>
          </div>
          <div style="margin:0.75rem 0">
            ${o.items.map(i => `
              <div class="bill-row">
                <span>${i.quantity}× ${i.name}</span>
                <span>₹${Number(i.lineTotal).toFixed(2)}</span>
              </div>`).join('')}
          </div>
          <div class="bill-row grand-total"><span>Total Bill:</span><strong>₹${Number(o.totalAmount).toFixed(2)}</strong></div>
          <div class="mt-3" style="display:flex;gap:0.5rem;justify-content:flex-end">
            ${isCancellable ? `<button class="btn btn-danger btn-sm" onclick="cancelCustomerOrder('${orderId}')">Cancel Order</button>` : ''}
            ${isEligibleFeedback ? `<button class="btn btn-primary btn-sm" onclick="openFeedbackModal('${orderId}','${o.branchId?._id || o.branchId}')">Rate Experience ⭐</button>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    if (container) container.innerHTML = `<div class="text-muted">Error: ${err.message}</div>`;
  }
}

async function cancelCustomerOrder(orderId) {
  if (!confirm('Cancel this order?')) return;
  try {
    await authFetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED', remarks: 'Cancelled by customer' })
    });
    showToast('Order cancelled', 'info');
    loadCustomerOrders();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Customer Reservations ---
async function loadCustomerReservations() {
  if (!state.token) return;
  const container = document.getElementById('customerReservationsContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-muted">Loading reservations...</div>';
  try {
    const data = await authFetch(`${API_BASE}/customers/reservations`);
    const reservations = data.data.reservations || [];
    if (reservations.length === 0) {
      container.innerHTML = '<div class="empty-state">No reservations found.</div>';
      return;
    }
    container.innerHTML = reservations.map(r => {
      const resId = r.id || r._id;
      const branchName = r.branchId?.name || 'Branch';
      const tableNum = r.tableId?.tableNumber || '—';
      const isCancellable = r.status === 'CONFIRMED';
      return `
        <div class="card mb-3">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
            <div>
              <strong>Reservation #${resId.slice(-6).toUpperCase()}</strong>
              <div class="text-muted">${branchName} • Table #${tableNum} • ${r.guests} Guests</div>
            </div>
            <span class="badge badge-${r.status}">${r.status}</span>
          </div>
          <div class="bill-row mt-3"><span>Date & Time:</span><strong>${new Date(r.dateTime).toLocaleString()} (${r.duration} min)</strong></div>
          ${r.specialRequests ? `<div class="bill-row"><span>Requests:</span><span>${r.specialRequests}</span></div>` : ''}
          ${isCancellable ? `
            <div class="mt-3" style="display:flex;justify-content:flex-end">
              <button class="btn btn-danger btn-sm" onclick="cancelReservation('${resId}')">Cancel Reservation</button>
            </div>` : ''}
        </div>`;
    }).join('');
  } catch (err) {
    if (container) container.innerHTML = `<div class="text-muted">Error: ${err.message}</div>`;
  }
}

async function cancelReservation(resId) {
  if (!confirm('Cancel this reservation? (Must be > 2 hours in advance)')) return;
  try {
    await authFetch(`${API_BASE}/reservations/${resId}/cancel`, { method: 'PATCH' });
    showToast('Reservation cancelled', 'info');
    loadCustomerReservations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Feedback Modal ---
function openFeedbackModal(orderId, branchId) {
  document.getElementById('feedbackOrderId').value = orderId;
  document.getElementById('feedbackBranchId').value = branchId;
  document.getElementById('feedbackComment').value = '';
  document.getElementById('feedbackModal').classList.remove('hidden');
}

function closeFeedbackModal() {
  document.getElementById('feedbackModal').classList.add('hidden');
}

async function handleFeedbackSubmit(event) {
  event.preventDefault();
  const orderId = document.getElementById('feedbackOrderId').value;
  const branchId = document.getElementById('feedbackBranchId').value;
  const rating = Number(document.querySelector('input[name="rating"]:checked')?.value || 5);
  const comment = document.getElementById('feedbackComment').value.trim();
  try {
    await authFetch(`${API_BASE}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ orderId, branchId, rating, comment })
    });
    showToast('Thank you! Feedback submitted. ⭐', 'success');
    closeFeedbackModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// ============================================================
// KITCHEN DASHBOARD
// ============================================================
// ============================================================
function renderKitchenDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderKitchenNav()}
    <div class="kitchen-page">
      <div class="main-container">
        <div class="kitchen-header-bar">
          <div>
            <h2>🔥 Kitchen Display System</h2>
            <p>Live order queue — PLACED → PREPARING → READY → SERVED</p>
          </div>
          <div class="kitchen-controls">
            <select id="kitchenBranchSelect" class="form-select kitchen-input" onchange="loadKitchenQueue()" style="width:auto">
              ${branchOptionsHtml(true)}
            </select>
            <button class="btn btn-kitchen btn-sm" onclick="loadKitchenQueue()">↻ Refresh</button>
            <span class="refresh-timer" id="refreshTimer">Auto-refresh: 30s</span>
          </div>
        </div>

        <div id="kitchenBoard">
          <div class="kitchen-empty" style="padding:3rem;text-align:center;color:#4b5563">Loading orders...</div>
        </div>
      </div>
    </div>`;

  loadKitchenQueue();
  startKitchenAutoRefresh();
}

function startKitchenAutoRefresh() {
  if (state.kitchenRefreshTimer) clearInterval(state.kitchenRefreshTimer);
  state.kitchenCountdown = 30;
  state.kitchenRefreshTimer = setInterval(() => {
    state.kitchenCountdown--;
    const timerEl = document.getElementById('refreshTimer');
    if (timerEl) timerEl.textContent = `Auto-refresh: ${state.kitchenCountdown}s`;
    if (state.kitchenCountdown <= 0) {
      state.kitchenCountdown = 30;
      loadKitchenQueue();
    }
  }, 1000);
}

async function loadKitchenQueue() {
  state.kitchenCountdown = 30;
  const timerEl = document.getElementById('refreshTimer');
  if (timerEl) timerEl.textContent = `Auto-refresh: 30s`;

  const board = document.getElementById('kitchenBoard');
  if (!board) return;

  const branchFilter = document.getElementById('kitchenBranchSelect')?.value;

  try {
    let url = `${API_BASE}/kitchen/queue`;
    if (branchFilter) url += `?branchId=${branchFilter}`;
    const data = await authFetch(url);
    const orders = data.data.orders || [];

    // Group by status
    const groups = {
      PLACED:    orders.filter(o => o.status === 'PLACED'),
      PREPARING: orders.filter(o => o.status === 'PREPARING'),
      READY:     orders.filter(o => o.status === 'READY')
    };

    board.innerHTML = `
      <div class="kanban-board">
        ${renderKanbanCol('PLACED',    '🔴 New Orders',   groups.PLACED,    'kanban-col-new')}
        ${renderKanbanCol('PREPARING', '🟡 Preparing',    groups.PREPARING, 'kanban-col-prep')}
        ${renderKanbanCol('READY',     '🟢 Ready',        groups.READY,     'kanban-col-ready')}
      </div>`;
  } catch (err) {
    if (board) board.innerHTML = `
      <div class="kitchen-empty" style="color:#ef4444;padding:3rem;text-align:center">
        Failed to load queue: ${err.message}
      </div>`;
  }
}

function renderKanbanCol(status, title, orders, colClass) {
  const nextStatusMap = { PLACED: 'PREPARING', PREPARING: 'READY', READY: 'SERVED' };
  const nextBtnLabel  = { PLACED: '→ Start Preparing', PREPARING: '→ Mark Ready', READY: '✓ Mark Served' };
  const cardClass     = { PLACED: 'kitchen-card-new', PREPARING: 'kitchen-card-prep', READY: 'kitchen-card-ready' };

  const cards = orders.length === 0
    ? `<div class="kitchen-empty">${status === 'PLACED' ? '✅ No new orders!' : 'Nothing here yet'}</div>`
    : orders.map(o => {
        const orderId = o.id || o._id;
        const tableLabel = o.orderType === 'DINE_IN' ? `🪑 Table ${o.tableId?.tableNumber || '?'}` : '🥡 Takeaway';
        const timeAgo = formatTimeAgo(o.createdAt);
        const branchName = o.branch || o.branchId?.name || '';
        const nextStatus = nextStatusMap[status];
        return `
          <div class="kitchen-card ${cardClass[status]}">
            <div class="kitchen-card-header">
              <div>
                <div class="kitchen-order-id">#${orderId.slice(-6).toUpperCase()}</div>
                <div class="kitchen-order-meta">${tableLabel}${branchName ? ' · ' + branchName : ''}</div>
              </div>
              <span class="kitchen-order-time">${timeAgo}</span>
            </div>
            <ul class="kitchen-items-list">
              ${o.items.map(i => `
                <li class="kitchen-item-row">
                  <span style="display:flex;align-items:center;gap:0.5rem">
                    <span class="kitchen-item-qty">${i.quantity}</span>
                    ${i.name}
                  </span>
                </li>`).join('')}
            </ul>
            ${nextStatus ? `
              <button class="kitchen-advance-btn" onclick="advanceOrderStatus('${orderId}','${nextStatus}')">
                ${nextBtnLabel[status]}
              </button>` : ''}
          </div>`;
      }).join('');

  return `
    <div class="kanban-col ${colClass}">
      <div class="kanban-col-header">
        <span>${title}</span>
        <span class="kanban-count">${orders.length}</span>
      </div>
      <div class="kanban-col-body">${cards}</div>
    </div>`;
}

function formatTimeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  return `${Math.floor(diff/3600)}h ago`;
}

async function advanceOrderStatus(orderId, nextStatus) {
  try {
    await authFetch(`${API_BASE}/kitchen/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus, remarks: `Updated via KDS` })
    });
    showToast(`Order → ${nextStatus} ✓`, 'success');
    loadKitchenQueue();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// ============================================================
// MANAGER DASHBOARD
// ============================================================
// ============================================================
function renderManagerDashboard() {
  state.managerSubTab = state.managerSubTab || 'analytics';
  const isAdmin = state.user && state.user.role === 'admin';
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderManagerNav(state.managerSubTab)}
    <div class="manager-page">
      <div class="main-container">

        <!-- Branch Filter Bar -->
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <label style="font-size:0.825rem;font-weight:600;color:var(--text-muted)">Branch Filter:</label>
            <select id="managerBranchSelect" class="form-select" style="width:auto" onchange="reloadManagerTab()">
              <option value="" selected>All Branches</option>
              ${state.branches.map(b => `<option value="${b.id || b._id}">${b.name}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary btn-sm" onclick="reloadManagerTab()">↻ Refresh</button>
        </div>

        <!-- Analytics Tab -->
        <div id="managerTab-analytics" class="subtab-pane ${state.managerSubTab==='analytics'?'active':''}">
          <div class="metrics-grid">
            <div class="metric-card metric-card-revenue">
              <div class="metric-icon">💰</div>
              <div class="metric-title">Total Revenue</div>
              <div class="metric-value" id="metricRevenue">₹0.00</div>
              <div class="metric-subtitle">From completed orders</div>
            </div>
            <div class="metric-card metric-card-orders">
              <div class="metric-icon">✅</div>
              <div class="metric-title">Completed Orders</div>
              <div class="metric-value" id="metricCompleted">0</div>
              <div class="metric-subtitle">SERVED & DELIVERED</div>
            </div>
            <div class="metric-card metric-card-rating">
              <div class="metric-icon">⭐</div>
              <div class="metric-title">Average Rating</div>
              <div class="metric-value" id="metricRating">★ 0.0</div>
              <div class="metric-subtitle" id="metricFeedbackCount">0 reviews</div>
            </div>
            <div class="metric-card metric-card-branches">
              <div class="metric-icon">🏪</div>
              <div class="metric-title">Active Branches</div>
              <div class="metric-value" id="metricActiveBranches">0</div>
              <div class="metric-subtitle">Operational units</div>
            </div>
          </div>

          <div class="grid-2-col mt-4">
            <div class="card">
              <h3>🏆 Top Selling Dishes</h3>
              <div id="popularDishesContainer" class="report-list mt-3">
                <div class="text-muted">Loading...</div>
              </div>
            </div>
            <div class="card">
              <h3>⏰ Peak Ordering Hours</h3>
              <div id="peakHoursContainer" class="report-list mt-3">
                <div class="text-muted">Loading...</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Orders Tab -->
        <div id="managerTab-orders" class="subtab-pane ${state.managerSubTab==='orders'?'active':''}">
          <div class="card">
            <div class="section-header">
              <h3>All Orders</h3>
              <div style="display:flex;gap:0.5rem;align-items:center">
                <select id="managerOrderStatusFilter" class="form-select" style="width:auto" onchange="loadManagerOrders()">
                  <option value="">All Statuses</option>
                  <option value="PLACED">PLACED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="READY">READY</option>
                  <option value="SERVED">SERVED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <button class="btn btn-sm btn-secondary" onclick="loadManagerOrders()">↻ Refresh</button>
              </div>
            </div>
            <div id="managerOrdersContainer">
              <div class="text-muted">Loading orders...</div>
            </div>
          </div>
        </div>

        <!-- Menu Management Tab -->
        <div id="managerTab-menu" class="subtab-pane ${state.managerSubTab==='menu'?'active':''}">
          <div class="card">
            <div class="section-header">
              <h3>Menu Items</h3>
              <div style="display:flex;gap:0.5rem;align-items:center">
                ${isAdmin ? `<button class="btn btn-sm btn-primary" onclick="openAddMenuModal()">＋ Add Menu Item</button>` : ''}
                <button class="btn btn-sm btn-secondary" onclick="loadManagerMenu()">↻ Refresh</button>
              </div>
            </div>
            <div id="managerMenuContainer">
              <div class="text-muted">Loading menu...</div>
            </div>
          </div>
        </div>

        <!-- Reservations Tab -->
        <div id="managerTab-reservations" class="subtab-pane ${state.managerSubTab==='reservations'?'active':''}">
          <div class="card">
            <div class="section-header">
              <h3>All Reservations</h3>
              <button class="btn btn-sm btn-secondary" onclick="loadManagerReservations()">↻ Refresh</button>
            </div>
            <div id="managerReservationsContainer">
              <div class="text-muted">Loading reservations...</div>
            </div>
          </div>
        </div>

        <!-- Branches Tab -->
        <div id="managerTab-branches" class="subtab-pane ${state.managerSubTab==='branches'?'active':''}">
          <div class="card">
            <div class="section-header">
              <div>
                <h3>Branch Management</h3>
                <p class="text-muted mt-1">Deactivated branches immediately reject new reservations and orders.</p>
              </div>
              ${isAdmin ? `<button class="btn btn-sm btn-primary" onclick="openAddBranchModal()">＋ Add New Branch</button>` : ''}
            </div>
            <div class="branches-table-container mt-3">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Address</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="managerBranchesTbody">
                  <tr><td colspan="5" class="text-center">Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Staff Management Tab (Admin Only) -->
        ${isAdmin ? `
        <div id="managerTab-staff" class="subtab-pane ${state.managerSubTab==='staff'?'active':''}">
          <div class="card">
            <div class="section-header">
              <div>
                <h3>👥 Staff & User Accounts</h3>
                <p class="text-muted mt-1">Manage system administrators, managers, and kitchen staff.</p>
              </div>
              <div style="display:flex;gap:0.5rem">
                <button class="btn btn-sm btn-primary" onclick="openAddUserModal()">＋ Add Staff Member</button>
                <button class="btn btn-sm btn-secondary" onclick="loadManagerUsers()">↻ Refresh</button>
              </div>
            </div>
            <div id="managerUsersContainer" class="mt-3">
              <div class="text-muted">Loading staff accounts...</div>
            </div>
          </div>
        </div>
        ` : ''}

      </div>
    </div>

    <!-- Admin Modals -->
    <div id="adminModalOverlay" class="modal-overlay" style="display:none">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="adminModalTitle">Admin Action</h3>
          <button class="close-btn" onclick="closeAdminModal()">✕</button>
        </div>
        <div id="adminModalBody" class="modal-body"></div>
      </div>
    </div>`;

  reloadManagerTab();
}

function switchManagerTab(tabId) {
  state.managerSubTab = tabId;
  document.querySelectorAll('[id^="managerTab-"]').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`managerTab-${tabId}`);
  if (target) target.classList.add('active');
  document.querySelectorAll('.navbar-manager .nav-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${tabId}'`));
  });
  reloadManagerTab();
}

function reloadManagerTab() {
  const tab = state.managerSubTab;
  if (tab === 'analytics')    loadManagerDashboard();
  if (tab === 'orders')       loadManagerOrders();
  if (tab === 'menu')         loadManagerMenu();
  if (tab === 'reservations') loadManagerReservations();
  if (tab === 'branches')     loadManagerBranches();
  if (tab === 'staff')        loadManagerUsers();
}

async function loadManagerDashboard() {
  const branchFilter = document.getElementById('managerBranchSelect')?.value;
  const qStr = branchFilter ? `?branchId=${branchFilter}` : '';

  try {
    const summaryData = await authFetch(`${API_BASE}/manager/reports/summary${qStr}`);
    if (summaryData.success) {
      const s = summaryData.data.summary || summaryData.data || {};
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
      set('metricRevenue', `₹${Number(s.totalRevenue || s.totalSales || 0).toFixed(2)}`);
      set('metricCompleted', s.completedOrders || 0);
      set('metricRating', `★ ${Number(s.averageRating || 0).toFixed(1)}`);
      set('metricFeedbackCount', `${s.totalFeedback || s.totalReviews || 0} reviews`);
      set('metricActiveBranches', s.activeBranches || state.branches.filter(b => b.isActive).length);
    }

    const dishesData = await authFetch(`${API_BASE}/manager/reports/popular-dishes${qStr}`);
    const dishesContainer = document.getElementById('popularDishesContainer');
    const dishes = dishesData.data.dishes || dishesData.data.popularDishes || [];
    if (dishesContainer) {
      dishesContainer.innerHTML = dishes.length === 0
        ? '<div class="empty-state">No sales data available.</div>'
        : dishes.map((d, idx) => `
          <div class="bill-row" style="padding:0.5rem 0;border-bottom:1px solid var(--border)">
            <span><strong>#${idx+1} ${d.name}</strong></span>
            <span><strong>${d.quantitySold || d.totalQuantity || 0} sold</strong> (₹${Number(d.revenue || d.totalRevenue || 0).toFixed(2)})</span>
          </div>`).join('');
    }

    const peakData = await authFetch(`${API_BASE}/manager/reports/peak-hours${qStr}`);
    const peakContainer = document.getElementById('peakHoursContainer');
    const peakList = peakData.data.peakHours || peakData.data.hours || [];
    if (peakContainer) {
      peakContainer.innerHTML = peakList.length === 0
        ? '<div class="empty-state">No hourly data yet.</div>'
        : peakList.map(h => `
          <div class="bill-row" style="padding:0.5rem 0;border-bottom:1px solid var(--border)">
            <span><strong>${String(h.hour).padStart(2,'0')}:00 – ${String((h.hour+1)%24).padStart(2,'0')}:00</strong></span>
            <span><strong>${h.orderCount || 0} orders</strong></span>
          </div>`).join('');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadManagerOrders() {
  const container = document.getElementById('managerOrdersContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-muted">Loading...</div>';
  const branchFilter = document.getElementById('managerBranchSelect')?.value;
  const statusFilter = document.getElementById('managerOrderStatusFilter')?.value;
  let url = `${API_BASE}/orders?`;
  if (branchFilter) url += `branchId=${branchFilter}&`;
  if (statusFilter) url += `status=${statusFilter}&`;
  try {
    const data = await authFetch(url);
    const orders = data.data.orders || data.data || [];
    if (orders.length === 0) {
      container.innerHTML = '<div class="empty-state">No orders found.</div>';
      return;
    }
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>Order ID</th><th>Customer</th><th>Branch</th><th>Type</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th></tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td><strong>#${(o.id || o._id).slice(-6).toUpperCase()}</strong></td>
              <td>${o.customerId?.name || o.customerId?.email || '—'}</td>
              <td>${o.branchId?.name || '—'}</td>
              <td>${o.orderType === 'DINE_IN' ? '🪑 Dine-In' : '🥡 Takeaway'}</td>
              <td>${(o.items || []).length} items</td>
              <td>₹${Number(o.totalAmount || 0).toFixed(2)}</td>
              <td><span class="badge badge-${o.status}">${o.status}</span></td>
              <td>${new Date(o.createdAt).toLocaleString()}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    if (container) container.innerHTML = `<div class="text-muted">Error: ${err.message}</div>`;
  }
}

async function loadManagerMenu() {
  const container = document.getElementById('managerMenuContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-muted">Loading menu items...</div>';
  const branchFilter = document.getElementById('managerBranchSelect')?.value;
  let url = `${API_BASE}/menu?`;
  if (branchFilter) url += `branchId=${branchFilter}&`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const items = data.data.menuItems || data.data.items || [];
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state">No menu items found.</div>';
      return;
    }
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th></tr>
        </thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td><strong>${i.name}</strong>${i.description ? `<div class="text-muted" style="font-size:0.8rem">${i.description}</div>` : ''}</td>
              <td><span class="badge badge-info">${i.category}</span></td>
              <td>₹${Number(i.price).toFixed(2)}</td>
              <td>${i.isAvailable ? '<span class="badge badge-success">Available</span>' : '<span class="badge badge-danger">Unavailable</span>'}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    if (container) container.innerHTML = `<div class="text-muted">Error: ${err.message}</div>`;
  }
}

async function loadManagerReservations() {
  const container = document.getElementById('managerReservationsContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-muted">Loading reservations...</div>';
  const branchFilter = document.getElementById('managerBranchSelect')?.value;
  let url = `${API_BASE}/reservations?`;
  if (branchFilter) url += `branchId=${branchFilter}&`;
  try {
    const data = await authFetch(url);
    const reservations = data.data.reservations || data.data || [];
    if (reservations.length === 0) {
      container.innerHTML = '<div class="empty-state">No reservations found.</div>';
      return;
    }
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>ID</th><th>Customer</th><th>Branch</th><th>Table</th><th>Date & Time</th><th>Guests</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${reservations.map(r => `
            <tr>
              <td><strong>#${(r.id || r._id).slice(-6).toUpperCase()}</strong></td>
              <td>${r.customerId?.name || r.customerId?.email || '—'}</td>
              <td>${r.branchId?.name || '—'}</td>
              <td>Table #${r.tableId?.tableNumber || '—'}</td>
              <td>${new Date(r.dateTime).toLocaleString()}</td>
              <td>${r.guests}</td>
              <td><span class="badge badge-${r.status}">${r.status}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    if (container) container.innerHTML = `<div class="text-muted">Error: ${err.message}</div>`;
  }
}

async function loadManagerBranches() {
  const tbody = document.getElementById('managerBranchesTbody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/branches`);
    const data = await res.json();
    const branches = data.data.branches || [];
    tbody.innerHTML = branches.map(b => {
      const bId = b.id || b._id;
      return `
        <tr>
          <td><strong>${b.name}</strong></td>
          <td>${b.address}</td>
          <td>${b.seatingCapacity} seats</td>
          <td><span class="badge badge-${b.isActive ? 'success' : 'danger'}">${b.isActive ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="btn btn-${b.isActive ? 'danger' : 'success'} btn-sm" onclick="toggleBranchStatus('${bId}',${!b.isActive})">
              ${b.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </td>
        </tr>`;
    }).join('');
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="5">Error: ${err.message}</td></tr>`;
  }
}

async function toggleBranchStatus(branchId, newStatus) {
  try {
    await authFetch(`${API_BASE}/branches/${branchId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: newStatus })
    });
    showToast(`Branch ${newStatus ? 'activated' : 'deactivated'} ✓`, 'success');
    await loadBranches();
    loadManagerBranches();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// ADMIN MANAGEMENT (STAFF, BRANCHES, MENU MODALS)
// ============================================================

async function loadManagerUsers() {
  const container = document.getElementById('managerUsersContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-muted">Loading staff accounts...</div>';
  try {
    const data = await authFetch(`${API_BASE}/users`);
    const users = data.data.users || [];
    if (users.length === 0) {
      container.innerHTML = '<div class="empty-state">No staff accounts found.</div>';
      return;
    }
    const roleBadges = {
      admin: '<span class="badge badge-admin">admin</span>',
      manager: '<span class="badge badge-info">manager</span>',
      kitchen: '<span class="badge badge-warning">kitchen</span>',
      customer: '<span class="badge badge-secondary">customer</span>'
    };
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Registered</th></tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td><strong>${u.name}</strong></td>
              <td>${u.email}</td>
              <td>${roleBadges[u.role] || u.role}</td>
              <td>${new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    if (container) container.innerHTML = `<div class="text-muted">Error: ${err.message}</div>`;
  }
}

function closeAdminModal() {
  const overlay = document.getElementById('adminModalOverlay');
  if (overlay) overlay.style.display = 'none';
}

function openAddUserModal() {
  const overlay = document.getElementById('adminModalOverlay');
  const title = document.getElementById('adminModalTitle');
  const body = document.getElementById('adminModalBody');
  if (!overlay || !body) return;

  title.innerText = '👥 Register Staff Member';
  body.innerHTML = `
    <form onsubmit="handleCreateUser(event)">
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="newUserName" class="form-control" required placeholder="e.g. Alex Smith">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="newUserEmail" class="form-control" required placeholder="e.g. alex@restaurant.com">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="newUserPassword" class="form-control" required placeholder="••••••••">
      </div>
      <div class="form-group">
        <label>Role</label>
        <select id="newUserRole" class="form-select" required>
          <option value="manager">Manager</option>
          <option value="kitchen">Kitchen Staff</option>
          <option value="admin">System Admin</option>
        </select>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:1.5rem">
        <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Account</button>
      </div>
    </form>`;

  overlay.style.display = 'flex';
}

async function handleCreateUser(e) {
  e.preventDefault();
  const name = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim();
  const password = document.getElementById('newUserPassword').value;
  const role = document.getElementById('newUserRole').value;

  try {
    await authFetch(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    showToast(`Created ${role} account for ${name} 🎉`, 'success');
    closeAdminModal();
    loadManagerUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAddBranchModal() {
  const overlay = document.getElementById('adminModalOverlay');
  const title = document.getElementById('adminModalTitle');
  const body = document.getElementById('adminModalBody');
  if (!overlay || !body) return;

  title.innerText = '🏪 Add New Branch';
  body.innerHTML = `
    <form onsubmit="handleCreateBranch(event)">
      <div class="form-group">
        <label>Branch Name</label>
        <input type="text" id="newBranchName" class="form-control" required placeholder="e.g. Indiranagar Outlet">
      </div>
      <div class="form-group">
        <label>Address</label>
        <input type="text" id="newBranchAddress" class="form-control" required placeholder="e.g. 12th Main Road, Indiranagar">
      </div>
      <div class="form-group">
        <label>Seating Capacity</label>
        <input type="number" id="newBranchCapacity" class="form-control" min="1" max="500" value="50" required>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:1.5rem">
        <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Branch</button>
      </div>
    </form>`;

  overlay.style.display = 'flex';
}

async function handleCreateBranch(e) {
  e.preventDefault();
  const name = document.getElementById('newBranchName').value.trim();
  const address = document.getElementById('newBranchAddress').value.trim();
  const seatingCapacity = Number(document.getElementById('newBranchCapacity').value);

  try {
    await authFetch(`${API_BASE}/branches`, {
      method: 'POST',
      body: JSON.stringify({ name, address, seatingCapacity })
    });
    showToast(`Branch "${name}" created successfully 🎉`, 'success');
    closeAdminModal();
    await loadBranches();
    loadManagerBranches();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAddMenuModal() {
  const overlay = document.getElementById('adminModalOverlay');
  const title = document.getElementById('adminModalTitle');
  const body = document.getElementById('adminModalBody');
  if (!overlay || !body) return;

  title.innerText = '🍽️ Add New Menu Item';
  body.innerHTML = `
    <form onsubmit="handleCreateMenu(event)">
      <div class="form-group">
        <label>Select Branch</label>
        <select id="newMenuBranch" class="form-select" required>
          ${state.branches.map(b => `<option value="${b.id || b._id}">${b.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Item Name</label>
        <input type="text" id="newMenuName" class="form-control" required placeholder="e.g. Paneer Butter Masala">
      </div>
      <div class="form-group">
        <label>Category</label>
        <select id="newMenuCategory" class="form-select" required>
          <option value="Starters">Starters</option>
          <option value="Main Course" selected>Main Course</option>
          <option value="Desserts">Desserts</option>
          <option value="Beverages">Beverages</option>
        </select>
      </div>
      <div class="form-group">
        <label>Price (₹)</label>
        <input type="number" id="newMenuPrice" class="form-control" min="0" step="0.01" value="250.00" required>
      </div>
      <div class="form-group">
        <label>Description (Optional)</label>
        <input type="text" id="newMenuDescription" class="form-control" placeholder="Short description of dish...">
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:1.5rem">
        <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Menu Item</button>
      </div>
    </form>`;

  overlay.style.display = 'flex';
}

async function handleCreateMenu(e) {
  e.preventDefault();
  const branchId = document.getElementById('newMenuBranch').value;
  const name = document.getElementById('newMenuName').value.trim();
  const category = document.getElementById('newMenuCategory').value;
  const price = Number(document.getElementById('newMenuPrice').value);
  const description = document.getElementById('newMenuDescription').value.trim();

  try {
    await authFetch(`${API_BASE}/menu`, {
      method: 'POST',
      body: JSON.stringify({ branchId, name, category, price, description })
    });
    showToast(`Menu item "${name}" added 🎉`, 'success');
    closeAdminModal();
    loadManagerMenu();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
