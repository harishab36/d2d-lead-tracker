import { state, saveLeads } from '../store';

let _onConfirm: () => void;

export function initDeleteModal(onConfirm: () => void): void {
  _onConfirm = onConfirm;

  document.getElementById('delete-close')!.addEventListener('click', closeDeleteModal);
  document.getElementById('btn-delete-cancel')!.addEventListener('click', closeDeleteModal);
  document.getElementById('btn-delete-confirm')!.addEventListener('click', confirmDelete);
  document.getElementById('delete-overlay')!.addEventListener('click', e => {
    if (e.target === document.getElementById('delete-overlay')) closeDeleteModal();
  });
}

export function openDeleteModal(id: string): void {
  state.pendingDeleteId = id;
  document.getElementById('delete-overlay')!.classList.remove('hidden');
}

export function closeDeleteModal(): void {
  state.pendingDeleteId = null;
  document.getElementById('delete-overlay')!.classList.add('hidden');
}

function confirmDelete(): void {
  if (state.pendingDeleteId) {
    state.leads = state.leads.filter(l => l.id !== state.pendingDeleteId);
    saveLeads(state.leads);
    closeDeleteModal();
    _onConfirm();
  }
}
