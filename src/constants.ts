import type { ProductKey, StatusKey } from './types';

export const STORAGE_KEY = 'd2d_leads';

export const PRODUCTS: Record<ProductKey, string> = {
  credit_card:   'Credit Card',
  personal_loan: 'Personal Loan',
  home_loan:     'Home Loan',
  savings_fd:    'Savings / FD',
};

export const STATUSES: Record<StatusKey, string> = {
  new:       'New',
  contacted: 'Contacted',
  converted: 'Converted',
};

export const STATUS_COLORS: Record<StatusKey, string> = {
  new:       '#2563eb',
  contacted: '#d97706',
  converted: '#16a34a',
};
