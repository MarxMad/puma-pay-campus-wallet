/**
 * Servicio para interactuar con DeFindex API
 * DeFindex es un servicio de yield farming/vaults en Stellar
 * Documentación: https://docs.defindex.io/api-and-sdks-integration-guide/api
 */

import { buildApiUrl } from '@/config/backend';

const DEFINDEX_API_URL = 'https://api.defindex.io';
const DEFINDEX_API_KEY = 'sk_ab28864ac62b63b6b41ffd6650293bbed5f4bd25ff1a3bc0d2e452e1e80dd5a7';

// Vault address de DeFindex para Pumati
const DEFAULT_VAULT_ADDRESS = 'CAOAAJZKK4PT6WO2PFEXMFIGWDTAMS5Z7GDG36SGSC646V3B3HBYBHIE';

// Flag para activar mock temporal (cambiar a false cuando DeFindex esté funcionando)
const USE_MOCK = import.meta.env.VITE_USE_DEFINDEX_MOCK === 'true' || true; // Por defecto activado

// APY simulado (6% anual)
const MOCK_APY = 6.0;

export interface DefindexDepositResponse {
  success: boolean;
  txHash?: string;
  error?: string;
  suggestions?: string[];
}

export interface DefindexWithdrawResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface DefindexBalance {
  underlyingBalance: string[];
}

export interface DefindexAPY {
  apy: number;
}

export class DefindexService {
  private apiKey: string;
  private vaultAddress: string;

  constructor(apiKey?: string, vaultAddress?: string) {
    this.apiKey = apiKey || DEFINDEX_API_KEY;
    this.vaultAddress = vaultAddress || DEFAULT_VAULT_ADDRESS;
  }

  /**
   * Mock de depósito - Simula un depósito exitoso con APY
   */
  private async mockDeposit(
    amount: number,
    userAddress: string
  ): Promise<DefindexDepositResponse> {
    console.log('🎭 [MOCK] Simulando depósito en DeFindex:', { amount, userAddress });
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generar un txHash fake pero realista
    const fakeTxHash = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Guardar información del depósito en localStorage para calcular rendimiento
    const depositKey = `defindex_deposit_${userAddress}`;
    const existingDeposits = JSON.parse(localStorage.getItem(depositKey) || '[]');
    const newDeposit = {
      amount,
      timestamp: Date.now(),
      txHash: fakeTxHash,
    };
    existingDeposits.push(newDeposit);
    localStorage.setItem(depositKey, JSON.stringify(existingDeposits));
    
    console.log('✅ [MOCK] Depósito simulado exitoso. txHash:', fakeTxHash);
    
    return {
      success: true,
      txHash: fakeTxHash,
    };
  }

  /**
   * Deposita fondos en el vault de DeFindex
   * @param amount Cantidad a depositar (en stroops o unidades mínimas)
   * @param userAddress Dirección del usuario
   * @param userId ID del usuario (para obtener la secret key)
   * @param email Email del usuario (alternativa a userId)
   */
  async deposit(
    amount: number,
    userAddress: string,
    userId?: string,
    email?: string
  ): Promise<DefindexDepositResponse> {
    // Usar mock si está activado
    if (USE_MOCK) {
      return this.mockDeposit(amount, userAddress);
    }

    try {
      console.log('💰 DeFindex - Iniciando depósito:', { amount, userAddress });

      // El backend maneja la firma de transacciones
      const response = await fetch(buildApiUrl('/api/defindex/deposit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          userAddress,
          vaultAddress: this.vaultAddress,
          userId,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // El error puede venir como string, array, o objeto
        let errorMessage = 'Error depositando en DeFindex';
        let suggestions: string[] | undefined;
        
        if (errorData.error) {
          if (typeof errorData.error.message === 'string') {
            errorMessage = errorData.error.message;
          } else if (Array.isArray(errorData.error.message)) {
            errorMessage = errorData.error.message.join(', ');
          } else if (errorData.error.message) {
            errorMessage = String(errorData.error.message);
          }
          // Incluir sugerencias si están disponibles
          if (errorData.error.suggestions && Array.isArray(errorData.error.suggestions)) {
            suggestions = errorData.error.suggestions;
          }
        } else if (errorData.message) {
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else {
            errorMessage = String(errorData.message);
          }
        }
        
        // Log de sugerencias si están disponibles
        if (suggestions && suggestions.length > 0) {
          console.log('💡 Sugerencias para resolver el error:', suggestions);
        }
        
        return {
          success: false,
          error: errorMessage,
          suggestions,
        };
      }

      const data = await response.json();
      return {
        success: data.success || false,
        txHash: data.txHash,
        error: data.error,
      };
    } catch (error: any) {
      console.error('Error depositando en DeFindex:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido depositando en DeFindex',
      };
    }
  }

  /**
   * Retira fondos del vault de DeFindex
   * @param amount Cantidad a retirar
   * @param userAddress Dirección del usuario
   * @param userId ID del usuario
   * @param email Email del usuario
   */
  async withdraw(
    amount: number,
    userAddress: string,
    userId?: string,
    email?: string
  ): Promise<DefindexWithdrawResponse> {
    try {
      console.log('💸 DeFindex - Iniciando retiro:', { amount, userAddress });

      const response = await fetch(buildApiUrl('/api/defindex/withdraw'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          userAddress,
          vaultAddress: this.vaultAddress,
          userId,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || errorData.message || 'Error retirando de DeFindex',
        };
      }

      const data = await response.json();
      return {
        success: data.success || false,
        txHash: data.txHash,
        error: data.error,
      };
    } catch (error: any) {
      console.error('Error retirando de DeFindex:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido retirando de DeFindex',
      };
    }
  }


  /**
   * Calcula el rendimiento acumulado basado en los depósitos mock
   */
  private calculateMockEarnings(userAddress: string): { totalDeposited: number; earnings: number; totalBalance: number } {
    const depositKey = `defindex_deposit_${userAddress}`;
    const deposits = JSON.parse(localStorage.getItem(depositKey) || '[]');
    
    const now = Date.now();
    const secondsPerYear = 365 * 24 * 60 * 60;
    let totalDeposited = 0;
    let totalEarnings = 0;
    
    deposits.forEach((deposit: { amount: number; timestamp: number }) => {
      totalDeposited += deposit.amount;
      // Calcular interés acumulado: principal * APY * tiempo_transcurrido / segundos_por_año
      const timeElapsed = (now - deposit.timestamp) / 1000; // en segundos
      const earnings = (deposit.amount * MOCK_APY * timeElapsed) / (100 * secondsPerYear);
      totalEarnings += earnings;
    });
    
    return {
      totalDeposited,
      earnings: totalEarnings,
      totalBalance: totalDeposited + totalEarnings,
    };
  }

  /**
   * Obtiene el APY actual del vault
   */
  async getAPY(): Promise<{ apy: number; error?: string }> {
    // Retornar APY mock si está activado
    if (USE_MOCK) {
      return {
        apy: MOCK_APY,
      };
    }

    try {
      const response = await fetch(
        buildApiUrl(`/api/defindex/apy?vaultAddress=${this.vaultAddress}`)
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          apy: 0,
          error: errorData.error?.message || errorData.message || 'Error obteniendo APY de DeFindex',
        };
      }

      const data = await response.json();
      return {
        apy: data.apy || 0,
      };
    } catch (error: any) {
      console.error('Error obteniendo APY de DeFindex:', error);
      return {
        apy: 0,
        error: error.message || 'Error desconocido obteniendo APY',
      };
    }
  }

  /**
   * Obtiene el balance del usuario en el vault (con cálculo de rendimiento mock)
   */
  async getBalance(userAddress: string): Promise<{ balance: bigint; error?: string; earnings?: number }> {
    // Si está en modo mock, calcular balance con rendimiento
    if (USE_MOCK) {
      const mockData = this.calculateMockEarnings(userAddress);
      return {
        balance: BigInt(Math.floor(mockData.totalBalance * 10000000)), // Convertir a stroops
        earnings: mockData.earnings,
      };
    }

    try {
      const response = await fetch(
        buildApiUrl(`/api/defindex/balance?userAddress=${userAddress}&vaultAddress=${this.vaultAddress}`)
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          balance: 0n,
          error: errorData.error?.message || errorData.message || 'Error obteniendo balance de DeFindex',
        };
      }

      const data = await response.json();
      return {
        balance: BigInt(data.balance || '0'),
      };
    } catch (error: any) {
      console.error('Error obteniendo balance de DeFindex:', error);
      return {
        balance: 0n,
        error: error.message || 'Error desconocido obteniendo balance',
      };
    }
  }
}

// Exportar instancia singleton
export const defindexService = new DefindexService();

