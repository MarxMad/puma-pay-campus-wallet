import CryptoJS from 'crypto-js';

// Bitso Juno API Integration for MXNB operations
class BitsoJunoService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_BITSO_API_KEY || '';
    this.apiSecret = import.meta.env.VITE_BITSO_API_SECRET || '';
    this.baseUrl = import.meta.env.VITE_BITSO_BASE_URL || 'https://api.sandbox.bitso.com';
  }

  // Crear firma HMAC-SHA256 para autenticación según documentación Juno
  private createSignature(httpMethod: string, requestPath: string, nonce: string, body = ''): string {
    const message = nonce + httpMethod + requestPath + body;
    const signature = CryptoJS.HmacSHA256(message, this.apiSecret).toString();
    return signature;
  }

  // Obtener balance MXNB
  async getMXNBBalance(): Promise<{ balance: number; available: number }> {
    try {
      const nonce = Date.now().toString();
      const signature = this.createSignature('GET', '/v3/balance', nonce);
      
      const response = await fetch(`${this.baseUrl}/v3/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bitso ${this.apiKey}:${nonce}:${signature}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const mxnbBalance = data.payload.balances.find((b: any) => b.currency === 'mxnb');
      
      return {
        balance: parseFloat(mxnbBalance?.total || '0'),
        available: parseFloat(mxnbBalance?.available || '0')
      };
    } catch (error) {
      console.error('Error fetching MXNB balance:', error);
      throw error;
    }
  }

  // Trigger token issuance (Depósito MXN → MXNB)
  async depositMXNToMXNB(amount: number): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const nonce = Date.now().toString();
      const body = JSON.stringify({
        amount: amount.toString(),
        currency: 'mxn'
      });
      const signature = this.createSignature('POST', '/v3/stablecoin/issuance', nonce, body);
      
      const response = await fetch(`${this.baseUrl}/v3/stablecoin/issuance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bitso ${this.apiKey}:${nonce}:${signature}`,
          'Content-Type': 'application/json'
        },
        body
      });

      const data = await response.json();
      return {
        success: data.success,
        transactionId: data.payload?.transaction_id
      };
    } catch (error) {
      console.error('Error in MXN to MXNB deposit:', error);
      throw error;
    }
  }

  // Redeem MXNB tokens (Retiro MXNB → MXN)
  async redeemMXNBToMXN(amount: number): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const nonce = Date.now().toString();
      const body = JSON.stringify({
        amount: amount.toString(),
        currency: 'mxnb'
      });
      const signature = this.createSignature('POST', '/v3/stablecoin/redemption', nonce, body);
      
      const response = await fetch(`${this.baseUrl}/v3/stablecoin/redemption`, {
        method: 'POST',
        headers: {
          'Authorization': `Bitso ${this.apiKey}:${nonce}:${signature}`,
          'Content-Type': 'application/json'
        },
        body
      });

      const data = await response.json();
      return {
        success: data.success,
        transactionId: data.payload?.transaction_id
      };
    } catch (error) {
      console.error('Error in MXNB to MXN redemption:', error);
      throw error;
    }
  }

  // Listar transacciones
  async getTransactionHistory(): Promise<any[]> {
    try {
      const nonce = Date.now().toString();
      const signature = this.createSignature('GET', '/v3/user_transactions', nonce);
      
      const response = await fetch(`${this.baseUrl}/v3/user_transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bitso ${this.apiKey}:${nonce}:${signature}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data.payload || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }
}

export const bitsoService = new BitsoJunoService(); 