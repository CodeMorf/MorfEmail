export type ActiveView =
  | 'dashboard'
  | 'new-search'
  | 'search-progress'
  | 'results'
  | 'history'
  | 'lists'
  | 'verifier'
  | 'duplicates'
  | 'exports'
  | 'morf-ai'
  | 'license'
  | 'plan-usage'
  | 'settings';

export interface Lead {
  id: string;
  companyName: string;
  category: string;
  country: string;
  countryCode: string;
  flag: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  verified: 'verified' | 'risky' | 'unverified';
  confidenceScore: number;
  extractedAt: string;
  source: string;
  listId?: string;
  notes?: string;
}

export interface SearchConfig {
  country: string;
  countryCode: string;
  flag: string;
  state: string;
  city: string;
  businessType: string;
  fieldsToFind: {
    companyName: boolean;
    businessEmail: boolean;
    phone: boolean;
    website: boolean;
    whatsapp: boolean;
    address: boolean;
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
    category: boolean;
    city: boolean;
    postalCode: boolean;
  };
  contactType: 'b2b_recommended' | 'all_business' | 'specific_domain';
  targetDomain?: string;
  quantity: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  country: string;
  flag: string;
  city: string;
  category: string;
  leadsFound: number;
  exportedCount: number;
  duration: string;
  status: 'completed' | 'processing' | 'paused' | 'failed';
  date: string;
  config?: Partial<SearchConfig>;
}

export interface LeadList {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  leadCount: number;
  updatedAt: string;
}

export interface EmailVerificationItem {
  id: string;
  email: string;
  syntax: boolean;
  domain: string;
  mxRecord: boolean;
  smtpCheck: boolean;
  status: 'valid' | 'risky' | 'invalid';
  confidence: number;
  reason?: string;
}

export interface MorfAiMessage {
  id: string;
  sender: 'user' | 'morf-ai';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionType: 'start-search' | 'verify-leads' | 'export-format' | 'view-lead';
    payload?: any;
  };
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}
