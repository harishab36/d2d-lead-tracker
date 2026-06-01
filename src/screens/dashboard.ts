import type { ProductKey, StatusKey } from '../types';
import { STATUSES, STATUS_COLORS } from '../constants';
import { state } from '../store';
import { fmtDate, escHtml, emptyState, productBadge, statusBadge } from '../utils';

export function renderDashboard(): void {
  const leads = state.leads;
  const total = leads.length;
  const byStatus: Record<StatusKey, number>  = { new: 0, contacted: 0, converted: 0 };
  const byProduct: Record<ProductKey, number> = { credit_card: 0, personal_loan: 0, home_loan: 0, savings_fd: 0 };
  leads.forEach(l => {
    byStatus[l.status]++;
    byProduct[l.product]++;
  });

  // Stats grid
  document.getElementById('stats-grid')!.innerHTML = [
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
  const recent = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
  document.getElementById('pipeline-chart')!.innerHTML =
    `<div class="pipeline-chart">` +
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
    }).join('') +
    `</div>`;
}
