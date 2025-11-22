/**
 * Servicio para interactuar con contratos Soroban en Stellar
 * 
 * Este servicio maneja la comunicación con los contratos desplegados
 * en la red Stellar usando Soroban.
 */

import { buildApiUrl } from '@/config/backend';

export interface SorobanConfig {
  network: 'testnet' | 'mainnet' | 'local';
  rpcUrl?: string;
  contractAddress: string;
}

export interface VerificationResult {
  verified: boolean;
  proofId: string;
  txHash?: string;
  error?: string;
}

export interface SavingsGoal {
  target_amount: string; // i128 como string
  saved_amount: string; // i128 como string - dinero guardado en esta "cajita"
  deadline_ts: string | null; // Option<i64> como string o null
  achieved: boolean;
  proof_id: string | null; // Option<BytesN<32>> como hex string o null
}

export interface SetSavingsGoalParams {
  userAddress: string;
  targetAmount: number; // Se convierte a i128
  deadlineTs?: number | null; // Timestamp opcional
  userId?: string; // Para obtener secret key del backend
  email?: string; // Alternativa a userId
}

export class SorobanService {
  private config: SorobanConfig;

  constructor(config: SorobanConfig) {
    this.config = config;
  }

  /**
   * Verifica un proof en el contrato ultrahonk-verifier
   */
  async verifyProof(
    proofBlob: string,
    verifierContractAddress: string
  ): Promise<VerificationResult> {
    try {
      // En producción, esto usaría el SDK de Soroban
      // Por ahora, simulamos la llamada al contrato
      
      const response = await fetch(buildApiUrl('/api/soroban/invoke-contract'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: verifierContractAddress,
          function: 'verify_proof_with_stored_vk',
          args: [proofBlob],
          network: this.config.network,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || `Error verificando proof: ${response.statusText}`;
        const errorCode = errorData.error?.code || errorData.code;
        
        return {
          verified: false,
          proofId: this.generateProofId(proofBlob),
          error: `${errorMessage}${errorCode ? ` (${errorCode})` : ''}`,
        };
      }

      const data = await response.json();
      
      // Si el backend retorna un error aunque el status sea 200
      if (!data.success) {
        const errorMessage = data.error?.message || 'Error verificando proof';
        const errorCode = data.error?.code;
        return {
          verified: false,
          proofId: this.generateProofId(proofBlob),
          error: `${errorMessage}${errorCode ? ` (${errorCode})` : ''}`,
        };
      }

      return {
        verified: data.verified || false,
        proofId: data.proofId || this.generateProofId(proofBlob),
        txHash: data.txHash,
      };
    } catch (error: any) {
      console.error('Error verificando proof en Soroban:', error);
      return {
        verified: false,
        proofId: this.generateProofId(proofBlob),
        error: error.message || 'Error desconocido verificando proof',
      };
    }
  }

  /**
   * Obtiene el estado de una meta de ahorro
   */
  async getSavingsGoal(
    userAddress: string,
    savingsGoalsContractAddress?: string
  ): Promise<SavingsGoal | null> {
    try {
      const contractAddress = savingsGoalsContractAddress || this.config.contractAddress;
      if (!contractAddress) {
        throw new Error('Dirección del contrato savings-goals no configurada');
      }

      const response = await fetch(buildApiUrl('/api/soroban/invoke-contract'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          function: 'get_savings_goal',
          args: [userAddress],
          network: this.config.network,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.code === 'GOAL_NOT_FOUND' || response.status === 404) {
          return null; // Meta no encontrada
        }
        throw new Error(errorData.error?.message || `Error obteniendo meta: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        if (data.error?.code === 'GOAL_NOT_FOUND') {
          return null;
        }
        throw new Error(data.error?.message || 'Error obteniendo meta');
      }

      return data.goal as SavingsGoal;
    } catch (error: any) {
      console.error('Error obteniendo meta de ahorro:', error);
      throw error;
    }
  }

  /**
   * Crea o actualiza una meta de ahorro
   */
  async setSavingsGoal(
    params: SetSavingsGoalParams,
    savingsGoalsContractAddress?: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const contractAddress = savingsGoalsContractAddress || this.config.contractAddress;
      if (!contractAddress) {
        throw new Error('Dirección del contrato savings-goals no configurada');
      }

      const requestBody = {
        contractAddress,
        function: 'set_savings_goal',
        args: [
          params.userAddress,
          params.targetAmount.toString(),
          params.deadlineTs ? params.deadlineTs.toString() : null,
        ],
        network: this.config.network,
        userId: params.userId,
        email: params.email,
      };

      console.log('📤 sorobanService.setSavingsGoal - Enviando request:', requestBody);

      const apiUrl = buildApiUrl('/api/soroban/invoke-contract');
      console.log('🌐 URL del backend:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 sorobanService.setSavingsGoal - Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ sorobanService.setSavingsGoal - Error response:', errorData);
        return {
          success: false,
          error: errorData.error?.message || `Error estableciendo meta: ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log('✅ sorobanService.setSavingsGoal - Success response:', data);
      return {
        success: data.success || false,
        txHash: data.txHash,
        error: data.error?.message,
      };
    } catch (error: any) {
      console.error('Error estableciendo meta de ahorro:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido estableciendo meta',
      };
    }
  }

  /**
   * Envía un proof ZK al contrato savings-goals para marcar la meta como lograda
   * El contrato internamente invoca al verificador Ultrahonk
   */
  async submitProofToSavingsGoals(
    userAddress: string,
    proofBlob: string, // Blob completo del proof (fields + public_inputs + proof)
    savingsGoalsContractAddress?: string,
    userId?: string,
    email?: string
  ): Promise<VerificationResult> {
    try {
      const contractAddress = savingsGoalsContractAddress || this.config.contractAddress;
      if (!contractAddress) {
        throw new Error('Dirección del contrato savings-goals no configurada');
      }

      const response = await fetch(buildApiUrl('/api/soroban/invoke-contract'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          function: 'submit_proof',
          args: [userAddress, proofBlob],
          network: this.config.network,
          userId,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || `Error enviando proof: ${response.statusText}`;
        const errorCode = errorData.error?.code || errorData.code;
        
        return {
          verified: false,
          proofId: this.generateProofId(proofBlob),
          error: `${errorMessage}${errorCode ? ` (${errorCode})` : ''}`,
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        const errorMessage = data.error?.message || 'Error enviando proof';
        const errorCode = data.error?.code;
        return {
          verified: false,
          proofId: data.proofId || this.generateProofId(proofBlob),
          error: `${errorMessage}${errorCode ? ` (${errorCode})` : ''}`,
        };
      }

      return {
        verified: true,
        proofId: data.proofId || this.generateProofId(proofBlob),
        txHash: data.txHash,
      };
    } catch (error: any) {
      console.error('Error enviando proof a savings-goals:', error);
      return {
        verified: false,
        proofId: this.generateProofId(proofBlob),
        error: error.message || 'Error desconocido enviando proof',
      };
    }
  }

  /**
   * Deposita dinero en la "cajita" de ahorro de un usuario
   */
  async depositToGoal(
    userAddress: string,
    amount: number,
    savingsGoalsContractAddress?: string,
    userId?: string,
    email?: string
  ): Promise<{ success: boolean; savedAmount: number; txHash?: string; error?: string }> {
    try {
      const contractAddress = savingsGoalsContractAddress || this.config.contractAddress;
      if (!contractAddress) {
        throw new Error('Dirección del contrato savings-goals no configurada');
      }

      const response = await fetch(buildApiUrl('/api/soroban/invoke-contract'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          function: 'deposit_to_goal',
          args: [userAddress, amount],
          network: this.config.network,
          userId,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || `Error depositando: ${response.statusText}`;
        return {
          success: false,
          savedAmount: 0,
          error: errorMessage,
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          savedAmount: 0,
          error: data.error?.message || 'Error depositando',
        };
      }

      // El backend retorna savedAmount directamente para deposit_to_goal
      const savedAmount = data.savedAmount 
        ? parseInt(data.savedAmount.toString())
        : (data.result ? parseInt(data.result.toString()) : 0);

      console.log('📊 savedAmount recibido del backend:', { savedAmount, data });

      return {
        success: true,
        savedAmount: savedAmount,
        txHash: data.txHash,
      };
    } catch (error: any) {
      console.error('Error depositando a meta:', error);
      return {
        success: false,
        savedAmount: 0,
        error: error.message || 'Error desconocido depositando',
      };
    }
  }

  /**
   * Retira dinero de la "cajita" de ahorro (opcional)
   */
  async withdrawFromGoal(
    userAddress: string,
    amount: number,
    savingsGoalsContractAddress?: string,
    userId?: string,
    email?: string
  ): Promise<{ success: boolean; savedAmount: number; txHash?: string; error?: string }> {
    try {
      const contractAddress = savingsGoalsContractAddress || this.config.contractAddress;
      if (!contractAddress) {
        throw new Error('Dirección del contrato savings-goals no configurada');
      }

      const response = await fetch(buildApiUrl('/api/soroban/invoke-contract'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          function: 'withdraw_from_goal',
          args: [userAddress, amount],
          network: this.config.network,
          userId,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || `Error retirando: ${response.statusText}`;
        return {
          success: false,
          savedAmount: 0,
          error: errorMessage,
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          savedAmount: 0,
          error: data.error?.message || 'Error retirando',
        };
      }

      return {
        success: true,
        savedAmount: parseInt(data.result?.saved_amount || data.savedAmount || '0'),
        txHash: data.txHash,
      };
    } catch (error: any) {
      console.error('Error retirando de meta:', error);
      return {
        success: false,
        savedAmount: 0,
        error: error.message || 'Error desconocido retirando',
      };
    }
  }

  /**
   * Genera un proof ID (hash del proof blob)
   */
  private generateProofId(proofBlob: string): string {
    // En producción, esto usaría Keccak256
    // Por ahora, usamos un hash simple
    let hash = 0;
    for (let i = 0; i < proofBlob.length; i++) {
      const char = proofBlob.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }
}

// Configuración por defecto (puede venir de env vars)
export const sorobanService = new SorobanService({
  network: (import.meta.env.VITE_STELLAR_NETWORK as 'testnet' | 'mainnet' | 'local') || 'testnet',
  contractAddress: import.meta.env.VITE_SAVINGS_GOALS_CONTRACT || '',
});

