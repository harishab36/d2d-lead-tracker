import type { StatusKey } from '../types';
import { STATUSES } from '../constants';
import { state, saveLeads } from '../store';
import { filteredLeads, productBadge, fmt, fmtDate, escHtml, emptyState } from '../utils';

let _onEdit: (id: string) => void;
let _onDelete: (id: string) => void;
let _onRefresh: () => void;

export function initLeadsTable(
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onRefresh: () => void,
): void {
  _onEdit = onEdit;
  _onDelete = onDelete;
  _onRefresh = onRefresh;
}

export function renderLeadsTable(): void {
  const leads = filteredLeads().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
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

  container.querySelectorAll<HTMLSelectElement>('.status-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const target = e.target as HTMLSelectElement;
      const lead = state.leads.find(l => l.id === target.dataset.id);
      if (lead) {
        lead.status = target.value as StatusKey;
        lead.updatedAt = new Date().toISOString();
        saveLeads(state.leads);
        _onRefresh();
      }
    });
  });

  container.querySelectorAll<HTMLElement>('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => _onEdit(btn.dataset.id!));
  });

  container.querySelectorAll<HTMLElement>('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => _onDelete(btn.dataset.id!));
  });
}
