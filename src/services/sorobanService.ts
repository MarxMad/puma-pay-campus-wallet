/**
 * Servicio para interactuar con contratos Soroban en Stellar
 * 
 * Este servicio maneja la comunicación con los contratos desplegados
 * en la red Stellar usando Soroban.
 */

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
      
      const response = await fetch('/api/soroban/invoke-contract', {
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
   * Envía un proof al contrato savings-goals
   */
  async submitProofToSavingsGoals(
    proofBlob: string,
    savingsGoalsContractAddress: string
  ): Promise<VerificationResult> {
    try {
      const response = await fetch('/api/soroban/invoke-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: savingsGoalsContractAddress,
          function: 'submit_proof',
          args: [proofBlob],
          network: this.config.network,
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
      console.error('Error enviando proof a savings-goals:', error);
      return {
        verified: false,
        proofId: this.generateProofId(proofBlob),
        error: error.message || 'Error desconocido enviando proof',
      };
    }
  }

  /**
   * Obtiene el estado de una meta de ahorro
   */
  async getSavingsGoal(
    userAddress: string,
    savingsGoalsContractAddress: string
  ): Promise<{
    targetAmount?: number;
    achieved?: boolean;
    proofId?: string;
  }> {
    try {
      const response = await fetch('/api/soroban/invoke-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: savingsGoalsContractAddress,
          function: 'get_savings_goal',
          args: [userAddress],
          network: this.config.network,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo meta: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        targetAmount: data.targetAmount,
        achieved: data.achieved,
        proofId: data.proofId,
      };
    } catch (error: any) {
      console.error('Error obteniendo meta de ahorro:', error);
      return {};
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

