/**
 * Servicio para generar y verificar ZK Proofs usando circuitos Noir
 * 
 * Este servicio se conecta con el circuito Noir real para generar proofs
 * y con el contrato Soroban para verificación on-chain.
 */

export interface ProofInput {
  balance: number;
  targetAmount: number;
}

export interface ProofResult {
  proof: string; // Hex string del proof
  publicInputs: string[]; // Inputs públicos del proof
  proofId?: string; // ID del proof (hash)
  verified?: boolean; // Si fue verificado on-chain
  verificationTxHash?: string; // Hash de la transacción de verificación
}

export class ZKProofService {
  /**
   * Genera un proof real usando el circuito Noir
   * 
   * En producción, esto llamaría a un backend que ejecuta `nargo prove`
   * o usaría WASM del compilador Noir en el frontend.
   */
  async generateProof(input: ProofInput): Promise<ProofResult> {
    // Validar inputs
    if (input.balance < input.targetAmount) {
      throw new Error('Balance debe ser mayor o igual a targetAmount para generar proof');
    }

    try {
      // Opción 1: Llamar a backend que ejecuta nargo prove
      const response = await fetch('/api/zk/generate-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          balance: input.balance.toString(),
          targetAmount: input.targetAmount.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Error generando proof: ${response.statusText}`;
        const errorCode = errorData.error?.code;
        throw new Error(`${errorMessage}${errorCode ? ` (${errorCode})` : ''}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        const errorMessage = data.error?.message || 'Error generando proof';
        const errorCode = data.error?.code;
        throw new Error(`${errorMessage}${errorCode ? ` (${errorCode})` : ''}`);
      }

      return {
        proof: data.proof,
        publicInputs: data.publicInputs,
        proofId: data.proofId,
      };
    } catch (error) {
      // En producción, no hay fallback - debe fallar con mensaje claro
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error generando proof: ${String(error)}`);
    }
  }


  /**
   * Verifica un proof en el contrato Soroban
   */
  async verifyProofOnChain(
    proof: string,
    publicInputs: string[],
    contractAddress: string
  ): Promise<{ verified: boolean; txHash?: string; proofId?: string }> {
    try {
      // Llamar al contrato Soroban para verificar
      const response = await fetch('/api/soroban/verify-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof,
          publicInputs,
          contractAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error verificando proof: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        verified: data.verified,
        txHash: data.txHash,
        proofId: data.proofId,
      };
    } catch (error) {
      console.error('Error verificando proof on-chain:', error);
      throw new Error(`Error verificando proof: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Valida que un proof tiene la estructura correcta
   */
  validateProof(proof: string): boolean {
    // Un proof válido debe ser hex y tener al menos 66 caracteres (0x + 64 hex)
    return /^0x[a-fA-F0-9]{64,}$/.test(proof);
  }
}

export const zkProofService = new ZKProofService();

