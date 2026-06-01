import type { ProductKey, StatusKey } from '../types';
import { state, saveLeads, genId } from '../store';

let _onDone: () => void;

export function initLeadForm(onDone: () => void): void {
  _onDone = onDone;
  document.getElementById('lead-form')!.addEventListener('submit', handleFormSubmit);
  document.getElementById('btn-cancel')!.addEventListener('click', () => _onDone());
}

export function openAddForm(): void {
  document.getElementById('btn-save')!.textContent = 'Save Lead';
  clearForm();
}

export function openEditForm(id: string): void {
  const lead = state.leads.find(l => l.id === id);
  if (!lead) return;
  document.getElementById('btn-save')!.textContent = 'Update Lead';
  (document.getElementById('form-id') as HTMLInputElement).value       = lead.id;
  (document.getElementById('form-name') as HTMLInputElement).value     = lead.name;
  (document.getElementById('form-phone') as HTMLInputElement).value    = lead.phone;
  (document.getElementById('form-email') as HTMLInputElement).value    = lead.email || '';
  (document.getElementById('form-product') as HTMLSelectElement).value = lead.product;
  (document.getElementById('form-status') as HTMLSelectElement).value  = lead.status;
  (document.getElementById('form-amount') as HTMLInputElement).value   = lead.amount || '';
  (document.getElementById('form-notes') as HTMLTextAreaElement).value = lead.notes || '';
  clearErrors();
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

export function prefillVoiceData(data: { name: string; phone: string; email: string; product: ProductKey | '' }): void {
  if (data.name)    (document.getElementById('form-name')    as HTMLInputElement).value  = data.name;
  if (data.phone)   (document.getElementById('form-phone')   as HTMLInputElement).value  = data.phone;
  if (data.email)   (document.getElementById('form-email')   as HTMLInputElement).value  = data.email;
  if (data.product) (document.getElementById('form-product') as HTMLSelectElement).value = data.product;
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
  _onDone();
}
