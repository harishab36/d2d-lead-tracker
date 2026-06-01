import './style.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type ProductKey = 'credit_card' | 'personal_loan' | 'home_loan' | 'savings_fd';
type StatusKey = 'new' | 'contacted' | 'converted';
type ViewKey = 'dashboard' | 'leads';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  product: ProductKey;
  status: StatusKey;
  amount: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  leads: Lead[];
  view: ViewKey;
  filterProduct: string;
  filterStatus: string;
  search: string;
  pendingDeleteId: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'd2d_leads';

const PRODUCTS: Record<ProductKey, string> = {
  credit_card:   'Credit Card',
  personal_loan: 'Personal Loan',
  home_loan:     'Home Loan',
  savings_fd:    'Savings / FD',
};

const STATUSES: Record<StatusKey, string> = {
  new:       'New',
  contacted: 'Contacted',
  converted: 'Converted',
};

const STATUS_COLORS: Record<StatusKey, string> = {
  new:       '#2563eb',
  contacted: '#d97706',
  converted: '#16a34a',
};

// ── Storage ───────────────────────────────────────────────────────────────────

function loadLeads(): Lead[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Lead[];
  } catch {
    return [];
  }
}

function saveLeads(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── State ─────────────────────────────────────────────────────────────────────

let state: AppState = {
  leads: loadLeads(),
  view: 'dashboard',
  filterProduct: '',
  filterStatus: '',
  search: '',
  pendingDeleteId: null,
};

// seed demo data if empty
if (state.leads.length === 0) {
  const demos: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'Anita Sharma',  phone: '9876543210', email: 'anita@mail.com', product: 'credit_card',   status: 'new',       amount: '', notes: 'Interested in cashback card' },
    { name: 'Ravi Kumar',    phone: '9123456780', email: 'ravi@mail.com',  product: 'personal_loan', status: 'contacted', amount: '300000', notes: 'Needs funds for wedding' },
    { name: 'Priya Menon',   phone: '9988776655', email: '',               product: 'home_loan',     status: 'converted', amount: '4500000', notes: 'Ready for documentation' },
    { name: 'Arun Reddy',    phone: '9012345678', email: 'arun@mail.com',  product: 'savings_fd',    status: 'new',       amount: '', notes: '' },
    { name: 'Sunita Patel',  phone: '9876001234', email: '',               product: 'personal_loan', status: 'new',       amount: '150000', notes: 'Salary slip pending' },
  ];
  const now = new Date();
  state.leads = demos.map((d, i) => ({
    id: genId(),
    ...d,
    createdAt: new Date(now.getTime() - (5 - i) * 86400000).toISOString(),
    updatedAt: new Date(now.getTime() - (5 - i) * 86400000).toISOString(),
  }));
  saveLeads(state.leads);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: string): string {
  return n === '' ? '—' : '₹' + Number(n).toLocaleString('en-IN');
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function productBadge(p: ProductKey): string {
  return `<span class="badge badge-${p}">${PRODUCTS[p] || p}</span>`;
}

function statusBadge(s: StatusKey): string {
  return `<span class="badge badge-${s}"><span class="status-dot dot-${s}"></span>${STATUSES[s] || s}</span>`;
}

function filteredLeads(): Lead[] {
  return state.leads.filter(l => {
    if (state.filterProduct && l.product !== state.filterProduct) return false;
    if (state.filterStatus && l.status !== state.filterStatus) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      const haystack = `${l.name} ${l.phone} ${l.email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// ── Render: Dashboard ─────────────────────────────────────────────────────────

function renderDashboard(): void {
  const leads = state.leads;
  const total  = leads.length;
  const byStatus: Record<StatusKey, number> = { new: 0, contacted: 0, converted: 0 };
  const byProduct: Record<ProductKey, number> = { credit_card: 0, personal_loan: 0, home_loan: 0, savings_fd: 0 };
  leads.forEach(l => {
    byStatus[l.status]++;
    byProduct[l.product]++;
  });

  // Stats
  const statsGrid = document.getElementById('stats-grid')!;
  statsGrid.innerHTML = [
    { label: 'Total Leads',   value: total,                    bg: '#eff6ff', color: '#2563eb',  icon: '<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>' },
    { label: 'New',            value: byStatus.new,             bg: '#eff6ff', color: '#2563eb',  icon: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>' },
    { label: 'Contacted',      value: byStatus.contacted,       bg: '#fffbeb', color: '#d97706',  icon: '<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>' },
    { label: 'Converted',      value: byStatus.converted,       bg: '#f0fdf4', color: '#16a34a',  icon: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>' },
    { label: 'Credit Cards',   value: byProduct.credit_card,    bg: '#faf5ff', color: '#7c3aed',  icon: '<path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9z" clip-rule="evenodd"/>' },
    { label: 'Personal Loans', value: byProduct.personal_loan,  bg: '#eff6ff', color: '#2563eb',  icon: '<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/>' },
    { label: 'Home Loans',     value: byProduct.home_loan,      bg: '#fff7ed', color: '#c2410c',  icon: '<path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>' },
    { label: 'Savings / FD',   value: byProduct.savings_fd,     bg: '#f0fdf4', color: '#16a34a',  icon: '<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>' },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-icon" style="background:${s.bg}">
        <svg viewBox="0 0 20 20" fill="${s.color}">${s.icon}</svg>
      </div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');

  // Recent leads table (last 5)
  const recent = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  document.getElementById('recent-leads-table')!.innerHTML = recent.length
    ? `<table class="leads-table">
        <thead><tr>
          <th>Customer</th><th>Product</th><th>Status</th><th>Date</th>
        </tr></thead>
        <tbody>${recent.map(l => `
          <tr>
            <td><div class="td-name">${escHtml(l.name)}</div><div class="td-sub">${escHtml(l.phone)}</div></td>
            <td>${productBadge(l.product)}</td>
            <td>${statusBadge(l.status)}</td>
            <td style="color:var(--gray-500);font-size:12.5px">${fmtDate(l.createdAt)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
    : emptyState('No leads yet');

  // Pipeline chart
  const max = Math.max(1, total);
  document.getElementById('pipeline-chart')!.innerHTML = `<div class="pipeline-chart">` +
    (Object.entries(STATUSES) as [StatusKey, string][]).map(([key, label]) => {
      const count = byStatus[key];
      const pct = Math.round((count / max) * 100);
      return `<div class="pipeline-row">
        <div class="pipeline-label">${label}</div>
        <div class="pipeline-bar-wrap">
          <div class="pipeline-bar" style="width:${pct}%;background:${STATUS_COLORS[key]}"></div>
        </div>
        <div class="pipeline-count">${count}</div>
      </div>`;
    }).join('') + `</div>`;
}

// ── Render: Leads table ───────────────────────────────────────────────────────

function emptyState(msg: string): string {
  return `<div class="empty-state">
    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
    <p>${msg}</p>
  </div>`;
}

function escHtml(str: string): string {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderLeadsTable(): void {
  const leads = filteredLeads().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const container = document.getElementById('leads-table-container')!;

  if (leads.length === 0) {
    container.innerHTML = emptyState('No leads match your filters');
    return;
  }

  container.innerHTML = `<div class="table-scroll"><table class="leads-table">
    <thead><tr>
      <th>Customer</th>
      <th>Product</th>
      <th>Status</th>
      <th>Amount</th>
      <th>Added</th>
      <th style="text-align:right">Actions</th>
    </tr></thead>
    <tbody>${leads.map(l => `
      <tr data-id="${l.id}">
        <td>
          <div class="td-name">${escHtml(l.name)}</div>
          <div class="td-sub">${escHtml(l.phone)}${l.email ? ' · ' + escHtml(l.email) : ''}</div>
        </td>
        <td>${productBadge(l.product)}</td>
        <td>
          <select class="status-select" data-id="${l.id}" title="Change status">
            ${(Object.entries(STATUSES) as [StatusKey, string][]).map(([k, v]) =>
              `<option value="${k}"${l.status === k ? ' selected' : ''}>${v}</option>`
            ).join('')}
          </select>
        </td>
        <td style="color:var(--gray-600)">${l.amount ? fmt(l.amount) : '—'}</td>
        <td style="color:var(--gray-500);font-size:12.5px">${fmtDate(l.createdAt)}</td>
        <td>
          <div class="td-actions">
            <button class="btn-icon btn-edit" data-id="${l.id}" title="Edit">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
            </button>
            <button class="btn-icon btn-delete" data-id="${l.id}" title="Delete" style="color:var(--red)">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            </button>
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;

  // Quick status change
  container.querySelectorAll<HTMLSelectElement>('.status-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const target = e.target as HTMLSelectElement;
      const id = target.dataset.id;
      const lead = state.leads.find(l => l.id === id);
      if (lead) {
        lead.status = target.value as StatusKey;
        lead.updatedAt = new Date().toISOString();
        saveLeads(state.leads);
        renderAll();
      }
    });
  });

  container.querySelectorAll<HTMLElement>('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id!));
  });

  container.querySelectorAll<HTMLElement>('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id!));
  });
}

// ── Render: All ───────────────────────────────────────────────────────────────

function renderAll(): void {
  renderDashboard();
  if (state.view === 'leads') renderLeadsTable();
}

function closeSidebar(): void {
  document.getElementById('sidebar')!.classList.remove('open');
  document.getElementById('sidebar-overlay')!.classList.remove('active');
}

function toggleSidebar(): void {
  const sidebar = document.getElementById('sidebar')!;
  const overlay = document.getElementById('sidebar-overlay')!;
  const isOpen = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('active', !isOpen);
}

function showView(view: ViewKey, filterProduct = ''): void {
  state.view = view;
  if (filterProduct) state.filterProduct = filterProduct;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`)!.classList.add('active');

  const titles: Record<ViewKey, string> = { dashboard: 'Dashboard', leads: 'All Leads' };
  document.getElementById('page-title')!.textContent = titles[view] || 'Leads';

  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  const activeNav = document.querySelector(
    `.nav-item[data-view="${view}"]${filterProduct ? `[data-filter-product="${filterProduct}"]` : ':not([data-filter-product])'}`
  );
  if (activeNav) activeNav.classList.add('active');

  if (view === 'leads') {
    (document.getElementById('filter-product') as HTMLSelectElement).value = state.filterProduct;
    renderLeadsTable();
  }
  if (view === 'dashboard') renderDashboard();

  closeSidebar();
}

// ── Modal: Add / Edit ─────────────────────────────────────────────────────────

function openAddModal(): void {
  document.getElementById('modal-title')!.textContent = 'Add Lead';
  document.getElementById('btn-save')!.textContent = 'Save Lead';
  clearForm();
  document.getElementById('modal-overlay')!.classList.remove('hidden');
  (document.getElementById('form-name') as HTMLInputElement).focus();
}

function openEditModal(id: string): void {
  const lead = state.leads.find(l => l.id === id);
  if (!lead) return;
  document.getElementById('modal-title')!.textContent = 'Edit Lead';
  document.getElementById('btn-save')!.textContent = 'Update Lead';
  (document.getElementById('form-id') as HTMLInputElement).value      = lead.id;
  (document.getElementById('form-name') as HTMLInputElement).value    = lead.name;
  (document.getElementById('form-phone') as HTMLInputElement).value   = lead.phone;
  (document.getElementById('form-email') as HTMLInputElement).value   = lead.email || '';
  (document.getElementById('form-product') as HTMLSelectElement).value = lead.product;
  (document.getElementById('form-status') as HTMLSelectElement).value  = lead.status;
  (document.getElementById('form-amount') as HTMLInputElement).value  = lead.amount || '';
  (document.getElementById('form-notes') as HTMLTextAreaElement).value = lead.notes || '';
  clearErrors();
  document.getElementById('modal-overlay')!.classList.remove('hidden');
  (document.getElementById('form-name') as HTMLInputElement).focus();
}

function closeModal(): void {
  document.getElementById('modal-overlay')!.classList.add('hidden');
}

function clearForm(): void {
  ['form-id', 'form-name', 'form-phone', 'form-email', 'form-amount', 'form-notes'].forEach(id => {
    (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement).value = '';
  });
  (document.getElementById('form-product') as HTMLSelectElement).value = '';
  (document.getElementById('form-status') as HTMLSelectElement).value = 'new';
  clearErrors();
}

function clearErrors(): void {
  ['err-name', 'err-phone', 'err-email', 'err-product'].forEach(id => {
    document.getElementById(id)!.textContent = '';
  });
  ['form-name', 'form-phone', 'form-email', 'form-product'].forEach(id => {
    document.getElementById(id)!.classList.remove('invalid');
  });
}

function validateForm(): boolean {
  clearErrors();
  let valid = true;

  const name = (document.getElementById('form-name') as HTMLInputElement).value.trim();
  if (!name) {
    document.getElementById('err-name')!.textContent = 'Name is required';
    document.getElementById('form-name')!.classList.add('invalid');
    valid = false;
  }

  const phone = (document.getElementById('form-phone') as HTMLInputElement).value.trim();
  if (!phone) {
    document.getElementById('err-phone')!.textContent = 'Phone is required';
    document.getElementById('form-phone')!.classList.add('invalid');
    valid = false;
  } else if (!/^\+?[\d\s\-]{7,15}$/.test(phone)) {
    document.getElementById('err-phone')!.textContent = 'Enter a valid phone number';
    document.getElementById('form-phone')!.classList.add('invalid');
    valid = false;
  }

  const email = (document.getElementById('form-email') as HTMLInputElement).value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('err-email')!.textContent = 'Enter a valid email';
    document.getElementById('form-email')!.classList.add('invalid');
    valid = false;
  }

  const product = (document.getElementById('form-product') as HTMLSelectElement).value;
  if (!product) {
    document.getElementById('err-product')!.textContent = 'Select a product';
    document.getElementById('form-product')!.classList.add('invalid');
    valid = false;
  }

  return valid;
}

function handleFormSubmit(e: Event): void {
  e.preventDefault();
  if (!validateForm()) return;

  const id      = (document.getElementById('form-id') as HTMLInputElement).value;
  const name    = (document.getElementById('form-name') as HTMLInputElement).value.trim();
  const phone   = (document.getElementById('form-phone') as HTMLInputElement).value.trim();
  const email   = (document.getElementById('form-email') as HTMLInputElement).value.trim();
  const product = (document.getElementById('form-product') as HTMLSelectElement).value as ProductKey;
  const status  = (document.getElementById('form-status') as HTMLSelectElement).value as StatusKey;
  const amount  = (document.getElementById('form-amount') as HTMLInputElement).value.trim();
  const notes   = (document.getElementById('form-notes') as HTMLTextAreaElement).value.trim();
  const now     = new Date().toISOString();

  if (id) {
    const lead = state.leads.find(l => l.id === id);
    if (lead) Object.assign(lead, { name, phone, email, product, status, amount, notes, updatedAt: now });
  } else {
    state.leads.unshift({ id: genId(), name, phone, email, product, status, amount, notes, createdAt: now, updatedAt: now });
  }

  saveLeads(state.leads);
  closeModal();
  renderAll();
}

// ── Modal: Delete ─────────────────────────────────────────────────────────────

function openDeleteModal(id: string): void {
  state.pendingDeleteId = id;
  document.getElementById('delete-overlay')!.classList.remove('hidden');
}

function closeDeleteModal(): void {
  state.pendingDeleteId = null;
  document.getElementById('delete-overlay')!.classList.add('hidden');
}

function confirmDelete(): void {
  if (state.pendingDeleteId) {
    state.leads = state.leads.filter(l => l.id !== state.pendingDeleteId);
    saveLeads(state.leads);
    closeDeleteModal();
    renderAll();
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────

function boot(): void {
  // Nav
  document.querySelectorAll<HTMLElement>('.nav-item[data-view]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const view = (a.dataset.view || 'dashboard') as ViewKey;
      const fp   = a.dataset.filterProduct || '';
      state.filterProduct = fp;
      state.filterStatus  = '';
      state.search        = '';
      (document.getElementById('search-input') as HTMLInputElement).value = '';
      (document.getElementById('filter-status') as HTMLSelectElement).value = '';
      showView(view, fp);
    });
  });

  // "View all" link on dashboard
  document.querySelector<HTMLElement>('a.link[data-view="leads"]')!.addEventListener('click', e => {
    e.preventDefault();
    state.filterProduct = '';
    state.filterStatus  = '';
    showView('leads');
  });

  // Hamburger menu (mobile)
  document.getElementById('btn-menu')!.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay')!.addEventListener('click', closeSidebar);

  // Add lead button
  document.getElementById('btn-add-lead')!.addEventListener('click', openAddModal);

  // Form
  document.getElementById('lead-form')!.addEventListener('submit', handleFormSubmit);
  document.getElementById('modal-close')!.addEventListener('click', closeModal);
  document.getElementById('btn-cancel')!.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')!.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Delete modal
  document.getElementById('delete-close')!.addEventListener('click', closeDeleteModal);
  document.getElementById('btn-delete-cancel')!.addEventListener('click', closeDeleteModal);
  document.getElementById('btn-delete-confirm')!.addEventListener('click', confirmDelete);
  document.getElementById('delete-overlay')!.addEventListener('click', e => {
    if (e.target === document.getElementById('delete-overlay')) closeDeleteModal();
  });

  // Leads filters
  document.getElementById('search-input')!.addEventListener('input', e => {
    state.search = (e.target as HTMLInputElement).value;
    renderLeadsTable();
  });
  document.getElementById('filter-product')!.addEventListener('change', e => {
    state.filterProduct = (e.target as HTMLSelectElement).value;
    renderLeadsTable();
  });
  document.getElementById('filter-status')!.addEventListener('change', e => {
    state.filterStatus = (e.target as HTMLSelectElement).value;
    renderLeadsTable();
  });

  // Escape key closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeDeleteModal();
    }
  });

  showView('dashboard');
}

boot();
