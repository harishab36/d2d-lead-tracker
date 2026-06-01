export type ProductKey = 'credit_card' | 'personal_loan' | 'home_loan' | 'savings_fd';
export type StatusKey  = 'new' | 'contacted' | 'converted';
export type ViewKey    = 'dashboard' | 'leads' | 'lead-form' | 'settings';

export interface Lead {
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

export interface AppState {
  leads: Lead[];
  view: ViewKey;
  filterProduct: string;
  filterStatus: string;
  search: string;
  pendingDeleteId: string | null;
  editingLeadId: string | null;
  previousView: 'dashboard' | 'leads';
}
