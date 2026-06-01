import type { ViewKey } from './types';
import { state } from './store';
import { renderDashboard } from './screens/dashboard';
import { initLeadsTable, renderLeadsTable } from './screens/leads';
import { initLeadForm, openAddForm, openEditForm } from './screens/leadForm';
import { initDeleteModal, openDeleteModal, closeDeleteModal } from './screens/deleteModal';

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
  const isOpen  = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('active', !isOpen);
}

function showView(view: ViewKey, filterProduct = ''): void {
  state.view = view;
  if (filterProduct && view !== 'lead-form') state.filterProduct = filterProduct;

  // Toggle form-mode on <body> — controls back button, hamburger, add-lead button
  document.body.classList.toggle('form-mode', view === 'lead-form');

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`)!.classList.add('active');

  const titles: Record<ViewKey, string> = {
    dashboard:   'Dashboard',
    leads:       'All Leads',
    'lead-form': state.editingLeadId ? 'Edit Lead' : 'Add Lead',
  };
  document.getElementById('page-title')!.textContent = titles[view];

  if (view !== 'lead-form') {
    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    const activeNav = document.querySelector(
      `.nav-item[data-view="${view}"]${filterProduct
        ? `[data-filter-product="${filterProduct}"]`
        : ':not([data-filter-product])'}`,
    );
    if (activeNav) activeNav.classList.add('active');
  }

  if (view === 'leads') {
    (document.getElementById('filter-product') as HTMLSelectElement).value = state.filterProduct;
    renderLeadsTable();
  }
  if (view === 'dashboard') renderDashboard();

  closeSidebar();
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

function goBack(): void {
  showView(state.previousView);
}

export function boot(): void {
  // Wire up screen modules — no circular imports
  initLeadsTable(goToEditForm, openDeleteModal, renderAll);
  initLeadForm(goBack);
  initDeleteModal(renderAll);

  // Nav items
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

  // Hamburger (mobile)
  document.getElementById('btn-menu')!.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay')!.addEventListener('click', closeSidebar);

  // Back button
  document.getElementById('btn-back')!.addEventListener('click', goBack);

  // Add lead button
  document.getElementById('btn-add-lead')!.addEventListener('click', goToAddForm);

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

  // Escape: go back on form view, close delete modal elsewhere
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (state.view === 'lead-form') goBack();
      else closeDeleteModal();
    }
  });

  showView('dashboard');
}
