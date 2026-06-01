import type { Lead, AppState } from './types';
import { STORAGE_KEY } from './constants';

export function loadLeads(): Lead[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Lead[];
  } catch {
    return [];
  }
}

export function saveLeads(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const state: AppState = {
  leads: loadLeads(),
  view: 'dashboard',
  filterProduct: '',
  filterStatus: '',
  search: '',
  pendingDeleteId: null,
  editingLeadId: null,
  previousView: 'dashboard',
};

if (state.leads.length === 0) {
  const demos: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'Anita Sharma',  phone: '9876543210', email: 'anita@mail.com', product: 'credit_card',   status: 'new',       amount: '',        notes: 'Interested in cashback card' },
    { name: 'Ravi Kumar',    phone: '9123456780', email: 'ravi@mail.com',  product: 'personal_loan', status: 'contacted', amount: '300000',  notes: 'Needs funds for wedding' },
    { name: 'Priya Menon',   phone: '9988776655', email: '',               product: 'home_loan',     status: 'converted', amount: '4500000', notes: 'Ready for documentation' },
    { name: 'Arun Reddy',    phone: '9012345678', email: 'arun@mail.com',  product: 'savings_fd',    status: 'new',       amount: '',        notes: '' },
    { name: 'Sunita Patel',  phone: '9876001234', email: '',               product: 'personal_loan', status: 'new',       amount: '150000',  notes: 'Salary slip pending' },
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
