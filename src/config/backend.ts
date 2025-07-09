// Configuración del backend de PumaPay
// Este archivo maneja la conexión con las APIs de Juno

export const backendConfig = {
  // URL base del backend (cambiar según entorno)
  baseUrl: import.meta.env.VITE_BACKEND_URL || '',
  
  // Endpoints disponibles
  endpoints: {
    // Issuance (Minteo)
    accountDetails: '/api/account-details',
    mockDeposit: '/api/mock-deposit',
    
    // Balance y Transacciones
    balance: '/api/balance',
    transactions: '/api/transactions',
    
    // Redemption
    bankAccounts: '/api/bank-accounts',
    registerBank: '/api/register-bank',
    redeem: '/api/redeem',
    
    // Utilidades
    health: '/api/health',
    info: '/api/info',
    
    // Webhooks
    webhook: '/api/webhook/juno',
    webhookTest: '/api/webhook/test'
  },
  
  // Configuración de timeout para peticiones
  timeout: 30000,
  
  // Headers por defecto
  defaultHeaders: {
    'Content-Type': 'application/json',
  }
};

/**
 * Construir URL completa para un endpoint
 */
export function buildApiUrl(endpoint: string): string {
  return `${backendConfig.baseUrl}${endpoint}`;
}

/**
 * Configuración de opciones por defecto para fetch
 */
export const defaultFetchOptions: RequestInit = {
  headers: backendConfig.defaultHeaders,
  mode: 'cors',
  credentials: 'omit'
};

/**
 * Tipos para las respuestas de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  payload?: T;
  error?: {
    message: string;
    code?: string | number;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Tipos para los endpoints específicos
 */
export interface MXNBBalance {
  asset: string;
  balance: number;
}

export interface BankAccount {
  id: string;
  tag: string;
  recipient_legal_name: string;
  clabe: string;
  ownership: 'COMPANY_OWNED' | 'THIRD_PARTY';
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  transaction_type: 'ISSUANCE' | 'REDEMPTION' | 'DEPOSIT';
  summary_status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export interface CLABEDetails {
  clabe: string;
  type: 'AUTO_PAYMENT';
  status: 'ENABLED' | 'DISABLED';
  deposit_minimum_amount: number | null;
  deposit_maximum_amounts: {
    operation: number | null;
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  };
  created_at: string;
  updated_at: string | null;
} 