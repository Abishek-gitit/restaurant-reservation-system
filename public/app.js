// RestoHub Frontend Controller
const API_BASE = '/api';

// Global App State
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  branches: [],
  selectedBranchId: null,
  menuItems: [],
  activeCategory: 'ALL',
  tables: [],
  cart: [], // [{ menuItemId, name, price, quantity }]
  isRegisterMode: false
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  updateAuthUI();
  await loadBranches();
  
  // Set default datetime to tomorrow at 19:00 for reservation convenience
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);
  const localISOTime = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const dtInput = document.getElementById('reserveDateTime');
  if (dtInput) dtInput.value = localISOTime;
});

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// --- Navigation & Tab Switching ---
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchMainTab(tabId);
    });
  });
}

function switchMainTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
  
  const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
  const targetPane = document.getElementById(tabId);
  if (targetBtn) targetBtn.classList.add('active');
  if (targetPane) targetPane.classList.add('active');

  // Trigger tab-specific loaders
  if (tabId === 'kitchenTab') {
    loadKitchenQueue();
  } else if (tabId === 'managerTab') {
    loadManagerDashboard();
  }
}

function switchCustomerSubTab(subTabId) {
  document.querySelectorAll('.sub-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.subtab-pane').forEach((p) => p.classList.remove('active'));

  if (typeof event !== 'undefined' && event && event.target && event.target.classList && event.target.classList.contains('sub-btn')) {
    event.target.classList.add('active');
  } else {
    const btn = document.querySelector(`[onclick*="${subTabId}"]`);
    if (btn) btn.classList.add('active');
  }

  const target = document.getElementById(subTabId);
  if (target) target.classList.add('active');

  if (subTabId === 'ordersSubTab') loadCustomerOrders();
  if (subTabId === 'historySubTab') loadCustomerReservations();
}

// --- Authentication & Profile ---
function updateAuthUI() {
  const profileContainer = document.getElementById('userProfile');
  const authSection = document.getElementById('authSection');

  if (state.token && state.user) {
    if (authSection) authSection.classList.add('hidden');
    profileContainer.innerHTML = `
      <div class="user-pill">
        <span>👤 ${state.user.name || state.user.email}</span>
        <span class="role-badge">${state.user.role}</span>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
    `;
  } else {
    profileContainer.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="toggleAuthModal()">Sign In / Demo</button>
    `;
  }
}

function toggleAuthModal() {
  const authSection = document.getElementById('authSection');
  authSection.classList.toggle('hidden');
  if (!authSection.classList.contains('hidden')) {
    authSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function quickFill(email, password) {
  document.getElementById('authEmail').value = email;
  document.getElementById('authPassword').value = password;
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
    nameGroup.style.display = 'block';
    phoneGroup.style.display = 'block';
    authTitle.innerText = 'Create Customer Account';
    authSubmitBtn.innerText = 'Register';
    authToggleText.innerText = 'Already have an account?';
    authToggleBtn.innerText = 'Sign in here';
  } else {
    nameGroup.style.display = 'none';
    phoneGroup.style.display = 'none';
    authTitle.innerText = 'Sign In to RestoHub';
    authSubmitBtn.innerText = 'Sign In';
    authToggleText.innerText = "Don't have an account?";
    authToggleBtn.innerText = 'Create one here';
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;

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
    if (!res.ok) {
      throw new Error(data.message || 'Authentication failed');
    }

    state.token = data.data.token;
    state.user = data.data.user;
    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));

    showToast(`Welcome back, ${state.user.name || state.user.email}!`, 'success');
    updateAuthUI();
    document.getElementById('authSection').classList.add('hidden');

    // If manager, auto-switch to manager tab
    if (state.user.role === 'MANAGER' || state.user.role === 'ADMIN') {
      switchMainTab('managerTab');
    } else if (state.user.role === 'KITCHEN') {
      switchMainTab('kitchenTab');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
  showToast('Logged out successfully', 'info');
}

// Helper: authenticated fetch
async function authFetch(url, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  headers['Content-Type'] = 'application/json';
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      updateAuthUI();
      const authSection = document.getElementById('authSection');
      if (authSection) authSection.classList.remove('hidden');
    }
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

// --- Branches ---
async function loadBranches() {
  try {
    const res = await fetch(`${API_BASE}/branches`);
    const data = await res.json();
    if (data.success && data.data.branches) {
      state.branches = data.data.branches;
      renderBranchSelects();
      if (state.branches.length > 0) {
        state.selectedBranchId = state.branches[0].id || state.branches[0]._id;
        onBranchChange();
      }
    }
  } catch (err) {
    showToast('Failed to load branches', 'error');
  }
}

function renderBranchSelects() {
  const select = document.getElementById('branchSelect');
  const kitchenSelect = document.getElementById('kitchenBranchSelect');
  const managerSelect = document.getElementById('managerBranchSelect');

  const optionsHtml = state.branches
    .map((b) => `<option value="${b.id || b._id}">${b.name} (${b.isActive ? 'Active' : 'Inactive'})</option>`)
    .join('');

  if (select) select.innerHTML = optionsHtml;
  if (kitchenSelect) kitchenSelect.innerHTML = `<option value="">All Branches</option>` + optionsHtml;
  if (managerSelect) managerSelect.innerHTML = `<option value="">All Branches</option>` + optionsHtml;
}

function onBranchChange() {
  const select = document.getElementById('branchSelect');
  state.selectedBranchId = select.value;
  const currentBranch = state.branches.find((b) => (b.id || b._id) === state.selectedBranchId);

  if (currentBranch) {
    document.getElementById('branchCapacity').innerText = currentBranch.seatingCapacity;
    document.getElementById('branchAddress').innerText = currentBranch.address;
    const badge = document.getElementById('branchStatusBadge');
    if (currentBranch.isActive) {
      badge.className = 'badge badge-success';
      badge.innerText = 'Active';
    } else {
      badge.className = 'badge badge-danger';
      badge.innerText = 'Inactive (Closed)';
    }
  }

  // Clear cart and reload menu & tables
  state.cart = [];
  updateCartUI();
  loadMenu();
  loadTables();
}

// --- Menu Management ---
async function loadMenu() {
  if (!state.selectedBranchId) return;
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = '<div class="text-muted">Loading menu items...</div>';

  try {
    const res = await fetch(`${API_BASE}/menu?branchId=${state.selectedBranchId}`);
    const data = await res.json();
    if (data.success) {
      state.menuItems = data.data.menuItems || data.data.items || [];
      renderMenu();
    }
  } catch (err) {
    grid.innerHTML = '<div class="text-muted">Error loading menu.</div>';
  }
}

function filterMenu(category) {
  state.activeCategory = category;
  document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
  event.target.classList.add('active');
  renderMenu();
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  let filtered = state.menuItems;
  if (state.activeCategory !== 'ALL') {
    filtered = filtered.filter((i) => i.category === state.activeCategory);
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">No menu items found for this category.</div>';
    return;
  }

  grid.innerHTML = filtered
    .map((item) => {
      const itemId = item.id || item._id;
      return `
        <div class="menu-card">
          <div>
            <span class="menu-category-tag">${item.category}</span>
            <div class="menu-title">${item.name}</div>
            <div class="menu-price">₹${Number(item.price).toFixed(2)}</div>
          </div>
          <button class="btn btn-primary btn-sm mt-3" 
            ${!item.isAvailable ? 'disabled' : ''}
            onclick="addToCart('${itemId}')">
            ${item.isAvailable ? '+ Add to Order' : 'Unavailable'}
          </button>
        </div>
      `;
    })
    .join('');
}

// --- Cart & Live Billing ---
function addToCart(itemId) {
  const item = state.menuItems.find((i) => (i.id || i._id) === itemId);
  if (!item) return;

  const existing = state.cart.find((c) => c.menuItemId === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      menuItemId: itemId,
      name: item.name,
      price: item.price,
      quantity: 1
    });
  }
  updateCartUI();
  showToast(`Added ${item.name} to order`, 'info');
}

function updateQuantity(itemId, delta) {
  const itemIndex = state.cart.findIndex((c) => c.menuItemId === itemId);
  if (itemIndex > -1) {
    state.cart[itemIndex].quantity += delta;
    if (state.cart[itemIndex].quantity <= 0) {
      state.cart.splice(itemIndex, 1);
    }
  }
  updateCartUI();
}

function updateCartUI() {
  const container = document.getElementById('cartItemsList');
  const btn = document.getElementById('placeOrderBtn');
  const orderType = document.querySelector('input[name="orderType"]:checked')?.value || 'DINE_IN';
  const tableGroup = document.getElementById('dineInTableSelectGroup');

  if (tableGroup) {
    tableGroup.style.display = orderType === 'DINE_IN' ? 'block' : 'none';
  }

  if (state.cart.length === 0) {
    container.innerHTML = '<div class="empty-cart text-muted">No items in your cart.</div>';
    document.getElementById('billSubtotal').innerText = '₹0.00';
    document.getElementById('billTax').innerText = '₹0.00';
    document.getElementById('billServiceCharge').innerText = '₹0.00';
    document.getElementById('billTotal').innerText = '₹0.00';
    btn.disabled = true;
    return;
  }

  container.innerHTML = state.cart
    .map(
      (item) => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <div class="text-muted">₹${item.price.toFixed(2)} each</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateQuantity('${item.menuItemId}', -1)">−</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity('${item.menuItemId}', 1)">+</button>
          <strong class="ml-2">₹${(item.price * item.quantity).toFixed(2)}</strong>
        </div>
      </div>
    `
    )
    .join('');

  // Live billing calculation on client for preview
  const subtotal = state.cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const tax = Number((subtotal * 0.05).toFixed(2));
  const serviceCharge = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + tax + serviceCharge).toFixed(2));

  document.getElementById('billSubtotal').innerText = `₹${subtotal.toFixed(2)}`;
  document.getElementById('billTax').innerText = `₹${tax.toFixed(2)}`;
  document.getElementById('billServiceCharge').innerText = `₹${serviceCharge.toFixed(2)}`;
  document.getElementById('billTotal').innerText = `₹${grandTotal.toFixed(2)}`;
  btn.disabled = false;
}

async function handlePlaceOrder() {
  if (!state.token) {
    showToast('Please sign in to place an order', 'error');
    toggleAuthModal();
    return;
  }

  const orderType = document.querySelector('input[name="orderType"]:checked')?.value || 'DINE_IN';
  const tableId = document.getElementById('cartTableSelect')?.value;

  if (orderType === 'DINE_IN' && !tableId) {
    showToast('Please select a table for Dine In order', 'error');
    return;
  }

  const payload = {
    branchId: state.selectedBranchId,
    orderType,
    tableId: orderType === 'DINE_IN' ? tableId : undefined,
    items: state.cart.map((c) => ({
      menuItemId: c.menuItemId,
      quantity: c.quantity
    }))
  };

  try {
    const data = await authFetch(`${API_BASE}/orders`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast('Order placed successfully! Bill generated.', 'success');
    state.cart = [];
    updateCartUI();
    switchCustomerSubTab('ordersSubTab');
    loadCustomerOrders();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Tables & Reservations ---
async function loadTables() {
  if (!state.selectedBranchId) return;

  try {
    const res = await fetch(`${API_BASE}/tables?branchId=${state.selectedBranchId}`);
    const data = await res.json();
    if (data.success) {
      state.tables = data.data.tables || [];
      renderTables();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderTables() {
  const reserveSelect = document.getElementById('reserveTableSelect');
  const cartTableSelect = document.getElementById('cartTableSelect');
  const grid = document.getElementById('branchTablesGrid');

  const options = state.tables
    .map((t) => `<option value="${t.id || t._id}">Table #${t.tableNumber} (${t.capacity} seats)</option>`)
    .join('');

  if (reserveSelect) reserveSelect.innerHTML = '<option value="">Select table...</option>' + options;
  if (cartTableSelect) cartTableSelect.innerHTML = '<option value="">Choose a table...</option>' + options;

  if (grid) {
    if (state.tables.length === 0) {
      grid.innerHTML = '<div class="empty-state">No tables registered for this branch.</div>';
    } else {
      grid.innerHTML = state.tables
        .map(
          (t) => `
        <div class="table-card">
          <div class="table-num">T-${t.tableNumber}</div>
          <div class="table-cap">${t.capacity} Guests</div>
        </div>
      `
        )
        .join('');
    }
  }
}

async function handleCreateReservation(event) {
  event.preventDefault();
  if (!state.token) {
    showToast('Please sign in to reserve a table', 'error');
    toggleAuthModal();
    return;
  }

  const tableId = document.getElementById('reserveTableSelect').value;
  const dateTime = document.getElementById('reserveDateTime').value;
  const duration = Number(document.getElementById('reserveDuration').value);
  const guests = Number(document.getElementById('reserveGuests').value);
  const specialRequests = document.getElementById('reserveRequests').value;

  try {
    const data = await authFetch(`${API_BASE}/reservations`, {
      method: 'POST',
      body: JSON.stringify({
        branchId: state.selectedBranchId,
        tableId,
        dateTime: new Date(dateTime).toISOString(),
        duration,
        guests,
        specialRequests
      })
    });

    showToast('Reservation confirmed successfully!', 'success');
    switchCustomerSubTab('historySubTab');
    loadCustomerReservations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Customer History & Actions ---
async function loadCustomerOrders() {
  if (!state.token) return;
  const container = document.getElementById('customerOrdersContainer');
  container.innerHTML = '<div class="text-muted">Loading orders...</div>';

  try {
    const data = await authFetch(`${API_BASE}/customers/orders`);
    const orders = data.data.orders || [];

    if (orders.length === 0) {
      container.innerHTML = '<div class="empty-state">No orders placed yet.</div>';
      return;
    }

    container.innerHTML = orders
      .map((o) => {
        const orderId = o.id || o._id;
        const branchName = o.branchId?.name || 'Branch';
        const isEligibleFeedback = o.status === 'SERVED' || o.status === 'DELIVERED';
        const isCancellable = o.status === 'PLACED';

        return `
        <div class="card mb-3">
          <div class="kitchen-header">
            <div>
              <strong>Order #${orderId.slice(-6).toUpperCase()}</strong>
              <div class="text-muted">${branchName} • ${new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <span class="badge badge-${o.status}">${o.status}</span>
            </div>
          </div>
          <div class="kitchen-items">
            ${o.items.map((i) => `<div class="kitchen-item"><span>${i.quantity}x ${i.name}</span><span>₹${i.lineTotal.toFixed(2)}</span></div>`).join('')}
          </div>
          <div class="bill-row grand-total">
            <span>Total Bill:</span>
            <strong>₹${o.totalAmount.toFixed(2)}</strong>
          </div>
          <div class="mt-3" style="display:flex; gap:0.5rem; justify-content:flex-end;">
            ${isCancellable ? `<button class="btn btn-danger btn-sm" onclick="cancelCustomerOrder('${orderId}')">Cancel Order</button>` : ''}
            ${isEligibleFeedback ? `<button class="btn btn-primary btn-sm" onclick="openFeedbackModal('${orderId}', '${o.branchId?._id || o.branchId}')">Rate Experience</button>` : ''}
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    container.innerHTML = `<div class="text-muted">Error loading orders: ${err.message}</div>`;
  }
}

async function cancelCustomerOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
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

async function loadCustomerReservations() {
  if (!state.token) return;
  const container = document.getElementById('customerReservationsContainer');
  container.innerHTML = '<div class="text-muted">Loading reservations...</div>';

  try {
    const data = await authFetch(`${API_BASE}/customers/reservations`);
    const reservations = data.data.reservations || [];

    if (reservations.length === 0) {
      container.innerHTML = '<div class="empty-state">No reservations found.</div>';
      return;
    }

    container.innerHTML = reservations
      .map((r) => {
        const resId = r.id || r._id;
        const branchName = r.branchId?.name || 'Branch';
        const tableNum = r.tableId?.tableNumber || '—';
        const isCancellable = r.status === 'CONFIRMED';

        return `
        <div class="card mb-3">
          <div class="kitchen-header">
            <div>
              <strong>Reservation #${resId.slice(-6).toUpperCase()}</strong>
              <div class="text-muted">${branchName} • Table #${tableNum} • ${r.guests} Guests</div>
            </div>
            <div>
              <span class="badge badge-${r.status}">${r.status}</span>
            </div>
          </div>
          <div class="bill-row">
            <span>Date & Time:</span>
            <strong>${new Date(r.dateTime).toLocaleString()} (${r.duration} mins)</strong>
          </div>
          ${r.specialRequests ? `<div class="bill-row"><span>Requests:</span><span>${r.specialRequests}</span></div>` : ''}
          ${
            isCancellable
              ? `<div class="mt-3 text-right" style="display:flex; justify-content:flex-end;">
                  <button class="btn btn-danger btn-sm" onclick="cancelReservation('${resId}')">Cancel Reservation</button>
                 </div>`
              : ''
          }
        </div>
      `;
      })
      .join('');
  } catch (err) {
    container.innerHTML = `<div class="text-muted">Error loading reservations: ${err.message}</div>`;
  }
}

async function cancelReservation(resId) {
  if (!confirm('Are you sure you want to cancel this reservation? (Must be > 2 hours in advance)')) return;
  try {
    await authFetch(`${API_BASE}/reservations/${resId}/cancel`, {
      method: 'PATCH'
    });
    showToast('Reservation cancelled successfully', 'info');
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
    showToast('Thank you! Feedback submitted.', 'success');
    closeFeedbackModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Kitchen Display Queue (KDS) ---
async function loadKitchenQueue() {
  const grid = document.getElementById('kitchenQueueGrid');
  grid.innerHTML = '<div class="text-muted">Loading live orders...</div>';
  const branchFilter = document.getElementById('kitchenBranchSelect')?.value;

  try {
    let url = `${API_BASE}/kitchen/queue`;
    if (branchFilter) url += `?branchId=${branchFilter}`;
    const data = await authFetch(url);
    const orders = data.data.orders || [];

    if (orders.length === 0) {
      grid.innerHTML = '<div class="empty-state">No pending orders in kitchen queue!</div>';
      return;
    }

    grid.innerHTML = orders
      .map((o) => {
        const orderId = o.id || o._id;
        const branchName = o.branch || o.branchId?.name || 'Branch';
        const orderTypeBadge = o.orderType === 'DINE_IN' ? 'Dine-In' : 'Takeaway';
        const nextStatus = o.status === 'PLACED' ? 'PREPARING' : 'READY';

        return `
        <div class="kitchen-card">
          <div>
            <div class="kitchen-header">
              <div>
                <strong>#${orderId.slice(-6).toUpperCase()}</strong>
                <div class="text-muted">${branchName} • ${orderTypeBadge}</div>
              </div>
              <span class="badge badge-${o.status}">${o.status}</span>
            </div>
            <ul class="kitchen-items">
              ${o.items.map((i) => `<li class="kitchen-item"><span><strong>${i.quantity}x</strong> ${i.name}</span></li>`).join('')}
            </ul>
          </div>
          <div class="mt-3">
            <button class="btn btn-primary btn-sm w-100" onclick="advanceOrderStatus('${orderId}', '${nextStatus}')">
              Advance to ${nextStatus} →
            </button>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    grid.innerHTML = `<div class="text-muted">Failed to load kitchen queue: ${err.message}</div>`;
  }
}

async function advanceOrderStatus(orderId, nextStatus) {
  try {
    await authFetch(`${API_BASE}/kitchen/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus, remarks: `Status updated via KDS` })
    });
    showToast(`Order updated to ${nextStatus}`, 'success');
    loadKitchenQueue();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Manager Dashboard & Analytics ---
async function loadManagerDashboard() {
  const branchFilter = document.getElementById('managerBranchSelect')?.value;
  const qStr = branchFilter ? `?branchId=${branchFilter}` : '';

  try {
    // 1. Summary
    const summaryData = await authFetch(`${API_BASE}/manager/reports/summary${qStr}`);
    if (summaryData.success) {
      const s = summaryData.data.summary || summaryData.data || {};
      document.getElementById('metricRevenue').innerText = `₹${Number(s.totalRevenue || s.totalSales || 0).toFixed(2)}`;
      document.getElementById('metricCompleted').innerText = s.completedOrders || 0;
      document.getElementById('metricRating').innerText = `★ ${Number(s.averageRating || 0).toFixed(1)}`;
      document.getElementById('metricFeedbackCount').innerText = `${s.totalFeedback || s.totalReviews || s.totalReservations || 0} reviews/bookings`;
      document.getElementById('metricActiveBranches').innerText = s.activeBranches || state.branches.filter((b) => b.isActive).length;
    }

    // 2. Popular Dishes
    const dishesData = await authFetch(`${API_BASE}/manager/reports/popular-dishes${qStr}`);
    const dishesContainer = document.getElementById('popularDishesContainer');
    const dishes = dishesData.data.dishes || dishesData.data.popularDishes || [];
    if (dishes.length > 0) {
      dishesContainer.innerHTML = dishes
        .map(
          (d, idx) => `
        <div class="bill-row" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
          <span><strong>#${idx + 1} ${d.name}</strong></span>
          <span><strong>${d.quantitySold || d.totalQuantity || 0} sold</strong> (₹${Number(d.revenue || d.totalRevenue || 0).toFixed(2)})</span>
        </div>
      `
        )
        .join('');
    } else {
      dishesContainer.innerHTML = '<div class="empty-state">No dishes data available.</div>';
    }

    // 3. Peak Hours
    const peakData = await authFetch(`${API_BASE}/manager/reports/peak-hours${qStr}`);
    const peakContainer = document.getElementById('peakHoursContainer');
    const peakList = peakData.data.peakHours || peakData.data.hours || [];
    if (peakList.length > 0) {
      peakContainer.innerHTML = peakList
        .map(
          (h) => `
        <div class="bill-row" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
          <span><strong>${String(h.hour).padStart(2, '0')}:00 - ${String((h.hour + 1) % 24).padStart(2, '0')}:00</strong></span>
          <span><strong>${h.orderCount || 0} orders</strong></span>
        </div>
      `
        )
        .join('');
    } else {
      peakContainer.innerHTML = '<div class="empty-state">No hourly orders data yet.</div>';
    }

    // 4. Branch List with Toggle
    loadManagerBranches();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadManagerBranches() {
  const tbody = document.getElementById('managerBranchesTbody');
  try {
    const res = await fetch(`${API_BASE}/branches`);
    const data = await res.json();
    const branches = data.data.branches || [];

    tbody.innerHTML = branches
      .map((b) => {
        const bId = b.id || b._id;
        return `
        <tr>
          <td><strong>${b.name}</strong></td>
          <td>${b.address}</td>
          <td>${b.seatingCapacity} seats</td>
          <td><span class="badge badge-${b.isActive ? 'success' : 'danger'}">${b.isActive ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="btn btn-${b.isActive ? 'danger' : 'primary'} btn-sm" onclick="toggleBranchStatus('${bId}', ${!b.isActive})">
              ${b.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </td>
        </tr>
      `;
      })
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">Error: ${err.message}</td></tr>`;
  }
}

async function toggleBranchStatus(branchId, newStatus) {
  try {
    await authFetch(`${API_BASE}/branches/${branchId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: newStatus })
    });
    showToast(`Branch ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
    await loadBranches();
    loadManagerBranches();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
