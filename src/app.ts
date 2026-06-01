import type { ViewKey } from './types';
import { state } from './store';
import { renderDashboard } from './screens/dashboard';
import { initLeadsTable, renderLeadsTable } from './screens/leads';
import { initLeadForm, openAddForm, openEditForm } from './screens/leadForm';
import { initDeleteModal, openDeleteModal, closeDeleteModal } from './screens/deleteModal';
import { initSettings, renderSettings, applyTheme, getSavedTheme } from './screens/settings';
import { isLoggedIn, logout, initLogin } from './screens/login';

// ── Core render ───────────────────────────────────────────────────────────────

function renderAll(): void {
  renderDashboard();
  if (state.view === 'leads') renderLeadsTable();
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function closeSidebar(): void {
  document.getElementById('sidebar')!.classList.remove('open');
  document.getElementById('sidebar-overlay')!.classList.remove('active');
}

function toggleSidebar(): void {
  const sidebar = document.getElementById('sidebar')!;
  const overlay = document.getElementById('sidebar-overlay')!;
  const isOpen  = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('active', !isOpen);
}

// ── Profile dropdown ──────────────────────────────────────────────────────────

function closeProfileDropdown(): void {
  document.getElementById('profile-dropdown')!.classList.remove('open');
}

// ── View routing ──────────────────────────────────────────────────────────────

function showView(view: ViewKey, filterProduct = ''): void {
  state.view = view;
  if (filterProduct && view !== 'lead-form' && view !== 'settings') {
    state.filterProduct = filterProduct;
  }

  // form-mode swaps topbar chrome (back button ↔ hamburger + add-lead)
  const useBackButton = view === 'lead-form' || view === 'settings';
  document.body.classList.toggle('form-mode', useBackButton);

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`)!.classList.add('active');

  const titles: Record<ViewKey, string> = {
    dashboard:   'Dashboard',
    leads:       'All Leads',
    'lead-form': state.editingLeadId ? 'Edit Lead' : 'Add Lead',
    settings:    'Settings',
  };
  document.getElementById('page-title')!.textContent = titles[view];

  // Nav active state only applies to sidebar views
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  if (view === 'dashboard' || view === 'leads') {
    const activeNav = document.querySelector(
      `.nav-item[data-view="${view}"]${filterProduct
        ? `[data-filter-product="${filterProduct}"]`
        : ':not([data-filter-product])'}`,
    );
    if (activeNav) activeNav.classList.add('active');
  }

  if (view === 'leads')    { (document.getElementById('filter-product') as HTMLSelectElement).value = state.filterProduct; renderLeadsTable(); }
  if (view === 'dashboard') renderDashboard();
  if (view === 'settings')  renderSettings();

  closeSidebar();
  closeProfileDropdown();
}

// ── Navigation helpers ────────────────────────────────────────────────────────

function goBack(): void {
  showView(state.previousView);
}

function goToAddForm(): void {
  state.previousView  = state.view as 'dashboard' | 'leads';
  state.editingLeadId = null;
  openAddForm();
  showView('lead-form');
  (document.getElementById('form-name') as HTMLInputElement).focus();
}

function goToEditForm(id: string): void {
  state.previousView  = state.view as 'dashboard' | 'leads';
  state.editingLeadId = id;
  openEditForm(id);
  showView('lead-form');
  (document.getElementById('form-name') as HTMLInputElement).focus();
}

function goToSettings(): void {
  if (state.view === 'dashboard' || state.view === 'leads') {
    state.previousView = state.view;
  }
  showView('settings');
}

// ── Auth screen helpers ───────────────────────────────────────────────────────

function showLoginScreen(): void {
  document.getElementById('app')!.style.display          = 'none';
  document.getElementById('login-screen')!.style.display = '';
  (document.getElementById('login-username') as HTMLInputElement).value = '';
  (document.getElementById('login-password') as HTMLInputElement).value = '';
  document.getElementById('login-error')!.textContent = '';
  (document.getElementById('login-username') as HTMLInputElement).focus();
}

function hideLoginScreen(): void {
  document.getElementById('login-screen')!.style.display = 'none';
  document.getElementById('app')!.style.display          = '';
}

// ── Boot ──────────────────────────────────────────────────────────────────────

export function boot(): void {
  // Apply persisted theme before anything renders
  applyTheme(getSavedTheme());

  // Login form — callback fires after successful credential check
  initLogin(() => {
    hideLoginScreen();
    showView('dashboard');
  });

  // App screen modules
  initLeadsTable(goToEditForm, openDeleteModal, renderAll);
  initLeadForm(goBack);
  initDeleteModal(renderAll);
  initSettings();

  // Sidebar nav links
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

  // Hamburger / sidebar overlay (mobile)
  document.getElementById('btn-menu')!.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay')!.addEventListener('click', closeSidebar);

  // Back button (lead-form + settings views)
  document.getElementById('btn-back')!.addEventListener('click', goBack);

  // Add lead button
  document.getElementById('btn-add-lead')!.addEventListener('click', goToAddForm);

  // Profile dropdown
  document.getElementById('btn-profile')!.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('profile-dropdown')!.classList.toggle('open');
  });
  document.addEventListener('click', closeProfileDropdown);

  document.getElementById('btn-settings-nav')!.addEventListener('click', goToSettings);
  document.getElementById('btn-logout')!.addEventListener('click', () => {
    logout();
    showLoginScreen();
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

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (state.view === 'lead-form' || state.view === 'settings') goBack();
      else closeDeleteModal();
    }
  });

  // Auth gate
  if (isLoggedIn()) {
    hideLoginScreen();
    showView('dashboard');
  } else {
    showLoginScreen();
  }
}
