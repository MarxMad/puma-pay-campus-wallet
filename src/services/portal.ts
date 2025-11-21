/**
 * Portal MPC Service para MXNB en Arbitrum
 * ⚠️ IMPLEMENTACIÓN COMENTADA - Ahora usamos Stellar
 * 
 * Este archivo mantiene solo los tipos e interfaces necesarios para compatibilidad.
 * El código completo está en: portal.ts.backup
 * 
 * Ver: src/services/stellarService.ts para la implementación actual con Stellar
 */

// Tipos e interfaces para compatibilidad
export interface WalletInfo {
  address: string;
  network: string;
}

export interface Balance {
  asset: string;
  amount: string;
  decimals: number;
  contractAddress?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: string;
} 

// Exports vacíos para evitar errores de importación
// En producción, estos deberían ser removidos o reemplazados
export const portalService = null as any;
export default null;
