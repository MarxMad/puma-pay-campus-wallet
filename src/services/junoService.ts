// Servicio para interactuar con las APIs de Juno a través del backend de PumaPay

import { 
  backendConfig, 
  buildApiUrl, 
  defaultFetchOptions, 
  type ApiResponse,
  type MXNBBalance,
  type BankAccount,
  type Transaction,
  type CLABEDetails
} from '../config/backend';

/**
 * Clase principal para interactuar con las APIs de Juno
 */
export class JunoService {
  
  /**
   * Realizar petición HTTP genérica
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        ...defaultFetchOptions,
        ...options,
        headers: {
          ...defaultFetchOptions.headers,
          ...options.headers
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error en petición a ${endpoint}:`, error);
      throw error;
    }
  }

  // ================================
  // MÉTODOS DE ISSUANCE (MINTEO)
  // ================================

  /**
   * Obtener detalles de cuenta (CLABEs) para depósitos
   */
  async getAccountDetails(): Promise<CLABEDetails[]> {
    const response = await this.makeRequest<{ response: CLABEDetails[] }>(
      backendConfig.endpoints.accountDetails
    );
    
    return response.payload?.response || [];
  }

  /**
   * Crear depósito mock para testing
   */
  async createMockDeposit(params: {
    amount: number | string;
    receiver_clabe: string;
    receiver_name: string;
    sender_name: string;
  }): Promise<any> {
    const response = await this.makeRequest(
      '/api/mock-deposit',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: String(params.amount),
          receiver_clabe: params.receiver_clabe,
          receiver_name: params.receiver_name,
          sender_name: params.sender_name
        })
      }
    );
    return response.payload;
  }

  // ================================
  // MÉTODOS DE BALANCE Y TRANSACCIONES
  // ================================

  /**
   * Obtener balance actual de MXNB
   */
  async getBalance(): Promise<MXNBBalance[]> {
    const response = await this.makeRequest<{ balances: MXNBBalance[] }>(
      backendConfig.endpoints.balance
    );
    
    return response.payload?.balances || [];
  }

  /**
   * Obtener balance de MXNB (solo el primer balance)
   */
  async getMXNBBalance(): Promise<number> {
    const balances = await this.getBalance();
    const mxnbBalance = balances.find(b => b.asset === 'mxnbj' || b.asset === 'mxnb');
    return mxnbBalance?.balance || 0;
  }

  /**
   * Obtener historial de transacciones
   */
  async getTransactions(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    type?: string;
  }): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    
    const endpoint = params && Object.keys(params).length > 0 
      ? `${backendConfig.endpoints.transactions}?${queryParams.toString()}`
      : backendConfig.endpoints.transactions;
    
    const response = await this.makeRequest<Transaction[]>(endpoint);
    
    return response.payload || [];
  }

  // ================================
  // MÉTODOS DE REDEMPTION
  // ================================

  /**
   * Obtener cuentas bancarias registradas
   */
  async getBankAccounts(): Promise<BankAccount[]> {
    const response = await this.makeRequest<BankAccount[]>(
      backendConfig.endpoints.bankAccounts
    );
    
    return response.payload || [];
  }

  /**
   * Registrar nueva cuenta bancaria
   */
  async registerBankAccount(params: {
    tag: string;
    recipient_legal_name: string;
    clabe: string;
    ownership: 'COMPANY_OWNED' | 'THIRD_PARTY';
  }): Promise<BankAccount> {
    const response = await this.makeRequest<BankAccount>(
      backendConfig.endpoints.registerBank,
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
    
    return response.payload!;
  }

  /**
   * Redimir tokens MXNB
   */
  async redeemMXNB(params: {
    amount: number;
    destination_bank_account_id: string;
  }): Promise<Transaction> {
    const response = await this.makeRequest<Transaction>(
      backendConfig.endpoints.redeem,
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
    
    return response.payload!;
  }

  /**
   * Crear una CLABE única para el usuario
   */
  async createUserClabe(): Promise<{ clabe: string; type: string }> {
    const response = await this.makeRequest<{ clabe: string; type: string }>(
      '/api/create-clabe',
      { method: 'POST' }
    );
    return response.payload!;
  }

  /**
   * Enviar MXNB a una wallet usando la API de Juno (on-chain withdrawal)
   */
  async sendOnchainWithdrawal(params: {
    address: string;
    amount: string | number;
    asset: string;
    blockchain: string;
    compliance: object;
  }): Promise<any> {
    const response = await this.makeRequest(
      '/api/withdrawal',
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
    return response.payload;
  }

  // ================================
  // MÉTODOS DE UTILIDADES
  // ================================

  /**
   * Health check del backend
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest(backendConfig.endpoints.health);
      return response.success;
    } catch (error) {
      console.error('Health check falló:', error);
      return false;
    }
  }

  /**
   * Obtener información de endpoints disponibles
   */
  async getApiInfo(): Promise<any> {
    const response = await this.makeRequest(backendConfig.endpoints.info);
    return response.payload;
  }

  // ================================
  // MÉTODOS DE CONVENIENCIA
  // ================================

  /**
   * Verificar si el backend está disponible
   */
  async isBackendAvailable(): Promise<boolean> {
    return await this.healthCheck();
  }

  /**
   * Obtener resumen completo de la cuenta
   */
  async getAccountSummary(): Promise<{
    balance: number;
    recentTransactions: Transaction[];
    bankAccounts: BankAccount[];
    clabes: CLABEDetails[];
  }> {
    try {
      const [balance, transactions, bankAccounts, clabes] = await Promise.all([
        this.getMXNBBalance(),
        this.getTransactions({ limit: 10 }),
        this.getBankAccounts(),
        this.getAccountDetails()
      ]);

      return {
        balance,
        recentTransactions: transactions,
        bankAccounts,
        clabes
      };
    } catch (error) {
      console.error('Error obteniendo resumen de cuenta:', error);
      throw error;
    }
  }

  /**
   * Validar CLABE mexicana
   */
  static validateCLABE(clabe: string): boolean {
    // Verificar que tenga exactamente 18 dígitos
    if (!/^\d{18}$/.test(clabe)) {
      return false;
    }

    // Algoritmo de validación de CLABE
    const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
    let sum = 0;

    for (let i = 0; i < 17; i++) {
      sum += parseInt(clabe[i]) * weights[i];
    }

    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;

    return checkDigit === parseInt(clabe[17]);
  }

  /**
   * Formatear cantidad de MXNB
   */
  static formatMXNB(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Formatear CLABE para mostrar
   */
  static formatCLABE(clabe: string): string {
    if (clabe.length !== 18) return clabe;
    
    // Formato: XXXX XXXX XXXX XXXXXX
    return clabe.replace(/(\d{4})(\d{4})(\d{4})(\d{6})/, '$1 $2 $3 $4');
  }
}

// Instancia singleton del servicio
export const junoService = new JunoService(); 