import type { Lead, ProductKey, StatusKey } from './types';
import { PRODUCTS, STATUSES } from './constants';
import { state } from './store';

export function fmt(n: string): string {
  return n === '' ? '—' : '₹' + Number(n).toLocaleString('en-IN');
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function escHtml(str: string): string {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function emptyState(msg: string): string {
  return `<div class="empty-state">
    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
    <p>${msg}</p>
  </div>`;
}

export function productBadge(p: ProductKey): string {
  return `<span class="badge badge-${p}">${PRODUCTS[p] || p}</span>`;
}

export function statusBadge(s: StatusKey): string {
  return `<span class="badge badge-${s}"><span class="status-dot dot-${s}"></span>${STATUSES[s] || s}</span>`;
}

export function filteredLeads(): Lead[] {
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
