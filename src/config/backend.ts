// Configuración del backend de PumaPay
// Este archivo maneja la conexión con las APIs de Juno

// Función helper para obtener la URL del backend
function getBackendUrl(): string {
  const url = import.meta.env.VITE_BACKEND_URL?.trim() || '';
  
  // En producción, nunca usar localhost
  if (import.meta.env.PROD && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    console.error('❌ VITE_BACKEND_URL no puede ser localhost en producción:', url);
    return '';
  }
  
  // En desarrollo, si no hay URL configurada, usar el proxy de Vite
  if (import.meta.env.DEV && !url) {
    return ''; // El proxy de Vite manejará las rutas /api
  }
  
  return url;
}

export const backendConfig = {
  // URL base del backend (cambiar según entorno)
  baseUrl: getBackendUrl(),
  
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
  const baseUrl = backendConfig.baseUrl;
  
  if (!baseUrl) {
    console.error('❌ Backend URL no está configurado. VITE_BACKEND_URL debe estar definido.');
    throw new Error('Backend URL no está configurado. Configura VITE_BACKEND_URL en Vercel Dashboard.');
  }
  
  // En desarrollo, si no hay baseUrl, usar el proxy de Vite (rutas relativas)
  if (import.meta.env.DEV && !baseUrl) {
    return endpoint;
  }
  
  return `${baseUrl}${endpoint}`;
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