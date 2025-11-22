/**
 * Servicio para gestionar metas de ahorro con integración ZK
 * 
 * Este servicio maneja la creación, seguimiento y verificación de metas
 * de ahorro usando ZK proofs para mantener la privacidad.
 */

import { zkProofService, type ProofInput, type ProofResult } from './zkProofService';
import { sorobanService, type SavingsGoal as ContractGoal } from './sorobanService';

export interface SavingsGoal {
  id: string;
  targetAmount: number;
  savedAmount: number; // Dinero guardado en esta "cajita" específica
  deadline?: Date;
  achieved: boolean;
  proofId?: string;
  createdAt: Date;
  achievedAt?: Date;
}

export interface GoalProgress {
  goal: SavingsGoal;
  currentBalance: number;
  progress: number; // 0-100
  canGenerateProof: boolean;
  daysRemaining?: number;
}

export class SavingsService {
  private savingsGoalsContractAddress: string;
  private storageKey = 'pumapay_savings_goals';

  constructor() {
    this.savingsGoalsContractAddress = 
      import.meta.env.VITE_SAVINGS_GOALS_CONTRACT || '';
  }

  /**
   * Mapea un Goal del contrato a SavingsGoal local
   */
  private mapContractGoalToLocal(
    contractGoal: ContractGoal,
    userAddress: string
  ): SavingsGoal {
    return {
      id: `contract-${userAddress}`,
      targetAmount: parseInt(contractGoal.target_amount || '0'),
      savedAmount: parseInt(contractGoal.saved_amount || '0'), // Balance guardado en la cajita
      deadline: contractGoal.deadline_ts 
        ? new Date(parseInt(contractGoal.deadline_ts) * 1000)
        : undefined,
      achieved: contractGoal.achieved,
      proofId: contractGoal.proof_id || undefined,
      createdAt: new Date(), // No tenemos esta info del contrato
      achievedAt: contractGoal.achieved ? new Date() : undefined,
    };
  }

  /**
   * Crea una nueva meta de ahorro
   */
  async createSavingsGoal(
    targetAmount: number,
    deadline?: Date,
    userAddress?: string,
    userId?: string,
    email?: string
  ): Promise<SavingsGoal> {
    if (targetAmount <= 0) {
      throw new Error('El monto objetivo debe ser mayor a 0');
    }

    // Si hay contrato configurado y dirección de usuario, guardar on-chain
    console.log('🔍 createSavingsGoal - Verificando condiciones:', {
      hasContract: !!this.savingsGoalsContractAddress,
      contractAddress: this.savingsGoalsContractAddress,
      hasUserAddress: !!userAddress,
      userAddress,
      hasUserId: !!userId,
      userId,
      hasEmail: !!email,
      email,
    });

    if (this.savingsGoalsContractAddress && userAddress) {
      try {
        const deadlineTs = deadline 
          ? Math.floor(deadline.getTime() / 1000)
          : null;

        console.log('📤 Enviando setSavingsGoal al contrato:', {
          userAddress,
          targetAmount,
          deadlineTs,
          userId,
          email,
        });

        const result = await sorobanService.setSavingsGoal({
          userAddress,
          targetAmount,
          deadlineTs,
          userId,
          email,
        });

        console.log('📥 Resultado de setSavingsGoal:', result);

        if (result.success) {
          console.log('✅ Meta creada on-chain, obteniendo detalles...');
          // Obtener la meta recién creada del contrato
          const contractGoal = await sorobanService.getSavingsGoal(
            userAddress,
            this.savingsGoalsContractAddress
          );

          if (contractGoal) {
            const goal = this.mapContractGoalToLocal(contractGoal, userAddress);
            // También guardar localmente como backup
            this.saveGoalLocal(goal);
            // Retornar goal con txHash si está disponible
            console.log('✅ Meta creada con txHash:', result.txHash);
            return { ...goal, txHash: result.txHash } as SavingsGoal & { txHash?: string };
          }
        } else {
          console.error('❌ Error creando meta on-chain:', result.error);
        }
      } catch (error) {
        console.error('❌ Excepción al guardar meta on-chain:', error);
        // Continuar con almacenamiento local
      }
    } else {
      console.warn('⚠️ No se puede guardar on-chain:', {
        reason: !this.savingsGoalsContractAddress ? 'No hay contrato configurado' : 'No hay dirección de usuario',
        contractAddress: this.savingsGoalsContractAddress,
        userAddress,
      });
    }

    // Fallback a almacenamiento local
    const goal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      targetAmount,
      savedAmount: 0, // Inicialmente sin dinero guardado
      deadline,
      achieved: false,
      createdAt: new Date(),
    };

    this.saveGoalLocal(goal);
    return goal;
  }

  /**
   * Obtiene todas las metas de ahorro del usuario
   */
  async getSavingsGoals(userAddress?: string): Promise<SavingsGoal[]> {
    // Primero intentar obtener del contrato
    if (this.savingsGoalsContractAddress && userAddress) {
      try {
        const contractGoal = await sorobanService.getSavingsGoal(
          userAddress,
          this.savingsGoalsContractAddress
        );

        if (contractGoal) {
          const goal = this.mapContractGoalToLocal(contractGoal, userAddress);
          // Sincronizar con almacenamiento local
          const localGoals = this.getGoalsLocal();
          const existingIndex = localGoals.findIndex(g => g.id === goal.id);
          if (existingIndex >= 0) {
            localGoals[existingIndex] = goal;
          } else {
            localGoals.push(goal);
          }
          this.saveGoalsLocal(localGoals);
          return [goal];
        }
      } catch (error) {
        console.warn('No se pudo obtener meta del contrato:', error);
        // Continuar con almacenamiento local
      }
    }

    // Fallback a almacenamiento local
    return this.getGoalsLocal();
  }

  /**
   * Obtiene el progreso de una meta
   * @param goalId ID de la meta
   * @param currentBalance Parámetro legacy (no se usa, se usa goal.savedAmount)
   */
  async getGoalProgress(
    goalId: string,
    currentBalance?: number // Parámetro legacy, no se usa
  ): Promise<GoalProgress | null> {
    const goals = await this.getSavingsGoals();
    const goal = goals.find((g) => g.id === goalId);

    if (!goal) {
      return null;
    }

    // Usar savedAmount de la meta, no el parámetro currentBalance
    const currentSaved = goal.savedAmount || 0;
    const progress = Math.min(
      (currentSaved / goal.targetAmount) * 100,
      100
    );
    const canGenerateProof = currentSaved >= goal.targetAmount && !goal.achieved;

    let daysRemaining: number | undefined;
    if (goal.deadline) {
      const now = new Date();
      const deadline = new Date(goal.deadline);
      const diff = deadline.getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      goal,
      currentBalance: currentSaved, // Usar savedAmount de la meta
      progress,
      canGenerateProof,
      daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : undefined,
    };
  }

  /**
   * Genera un proof si la meta fue alcanzada y lo envía al contrato
   */
  /**
   * Deposita dinero en una meta específica (en su "cajita")
   */
  async depositToGoal(
    goalId: string,
    amount: number,
    userAddress?: string,
    userId?: string,
    email?: string
  ): Promise<{ success: boolean; savedAmount: number; txHash?: string; error?: string }> {
    if (amount <= 0) {
      throw new Error('El monto a depositar debe ser mayor a 0');
    }

    const goal = (await this.getSavingsGoals(userAddress)).find(g => g.id === goalId);
    if (!goal) {
      throw new Error('Meta no encontrada');
    }

    if (goal.achieved) {
      throw new Error('No se puede depositar en una meta ya lograda');
    }

    // Si hay contrato configurado, depositar on-chain
    if (this.savingsGoalsContractAddress && userAddress) {
      try {
        const result = await sorobanService.depositToGoal(
          userAddress,
          amount,
          this.savingsGoalsContractAddress,
          userId,
          email
        );

        if (result.success) {
          // Actualizar meta local con nuevo savedAmount
          goal.savedAmount = result.savedAmount;
          await this.updateGoalLocal(goal);
          return { success: true, savedAmount: result.savedAmount, txHash: result.txHash };
        } else {
          throw new Error(result.error || 'Error depositando');
        }
      } catch (error) {
        console.error('Error depositando on-chain:', error);
        // Continuar con almacenamiento local
      }
    }

    // Fallback: actualizar localmente
    goal.savedAmount += amount;
    await this.updateGoalLocal(goal);
    return { success: true, savedAmount: goal.savedAmount };
  }

  async generateProofIfAchieved(
    goalId: string,
    currentBalance?: number, // Parámetro legacy, no se usa
    userAddress?: string,
    userId?: string,
    email?: string
  ): Promise<ProofResult | null> {
    // Usamos savedAmount de la meta en lugar del balance total
    const goal = (await this.getSavingsGoals(userAddress)).find(g => g.id === goalId);
    if (!goal) {
      return null;
    }

    // Usar savedAmount de la meta directamente
    const progress = await this.getGoalProgress(goalId);

    if (!progress || !progress.canGenerateProof) {
      return null;
    }

    try {
      // 1. Generar proof ZK usando savedAmount de la cajita
      const proof = await zkProofService.generateProof({
        balance: goal.savedAmount, // Usar savedAmount de la cajita, no balance total
        targetAmount: goal.targetAmount,
      });

      // 2. Usar proofBlob del backend si está disponible, sino crearlo localmente
      const proofBlob = (proof as any).proofBlob || this.createProofBlob(proof);

      // 3. Si hay contrato y dirección de usuario, enviar al contrato
      if (this.savingsGoalsContractAddress && userAddress) {
        try {
          const result = await sorobanService.submitProofToSavingsGoals(
            userAddress,
            proofBlob,
            this.savingsGoalsContractAddress,
            userId,
            email
          );

          if (result.verified && result.proofId) {
            // Actualizar meta con proof_id del contrato
            await this.markGoalAsAchieved(goalId, result.proofId);
            return {
              ...proof,
              proofId: result.proofId,
              verified: true,
              verificationTxHash: result.txHash,
            };
          } else {
            throw new Error(result.error || 'Proof no verificado en el contrato');
          }
        } catch (error) {
          console.error('Error enviando proof al contrato:', error);
          // Continuar con almacenamiento local
        }
      }

      // Fallback: actualizar localmente
      await this.markGoalAsAchieved(goalId, proof.proofId);
      return proof;
    } catch (error) {
      console.error('Error generando proof:', error);
      throw error;
    }
  }

  /**
   * Crea el proof_blob en el formato esperado por el verificador Ultrahonk
   */
  private createProofBlob(proof: ProofResult): string {
    // Formato: [4-byte count][public_inputs][proof_bytes]
    const fields = proof.publicInputs.length;
    const fieldsBytes = Buffer.alloc(4);
    fieldsBytes.writeUInt32BE(fields, 0);

    // Public inputs como bytes (cada uno es 32 bytes)
    const publicInputsBytes = Buffer.concat(
      proof.publicInputs.map(input => {
        const num = BigInt(input);
        const buffer = Buffer.alloc(32);
        buffer.writeBigUInt64BE(num, 24); // Escribir en los últimos 8 bytes
        return buffer;
      })
    );

    // Proof como bytes hex
    const proofHex = proof.proof.startsWith('0x') 
      ? proof.proof.slice(2) 
      : proof.proof;
    const proofBytes = Buffer.from(proofHex, 'hex');

    // Concatenar todo
    const blob = Buffer.concat([fieldsBytes, publicInputsBytes, proofBytes]);
    return '0x' + blob.toString('hex');
  }

  /**
   * Reclama recompensa (ya debería estar verificada si se usó generateProofIfAchieved)
   */
  async claimReward(goalId: string, proof: ProofResult, userAddress?: string): Promise<string> {
    const goal = (await this.getSavingsGoals(userAddress)).find(g => g.id === goalId);
    
    if (!goal) {
      throw new Error('Meta no encontrada');
    }

    if (!goal.achieved || !goal.proofId) {
      throw new Error('La meta debe estar lograda y tener un proof verificado');
    }

    // La recompensa ya fue reclamada cuando se envió el proof al contrato
    // Este método puede usarse para lógica adicional (badges, puntos, etc.)
    return goal.proofId;
  }

  /**
   * Elimina una meta de ahorro
   */
  async deleteSavingsGoal(goalId: string): Promise<void> {
    const goals = await this.getSavingsGoals();
    const filtered = goals.filter((g) => g.id !== goalId);
    this.saveGoalsLocal(filtered);
  }

  /**
   * Actualiza una meta de ahorro
   */
  async updateSavingsGoal(
    goalId: string,
    updates: Partial<Pick<SavingsGoal, 'targetAmount' | 'deadline'>>
  ): Promise<SavingsGoal> {
    const goals = await this.getSavingsGoals();
    const goal = goals.find((g) => g.id === goalId);

    if (!goal) {
      throw new Error('Meta no encontrada');
    }

    if (goal.achieved) {
      throw new Error('No se puede actualizar una meta ya alcanzada');
    }

    const updated: SavingsGoal = {
      ...goal,
      ...updates,
    };

    const updatedGoals = goals.map((g) => (g.id === goalId ? updated : g));
    this.saveGoalsLocal(updatedGoals);

    return updated;
  }

  // Métodos privados para almacenamiento local

  private saveGoalLocal(goal: SavingsGoal): void {
    const goals = this.getGoalsLocal();
    const existingIndex = goals.findIndex(g => g.id === goal.id);
    if (existingIndex >= 0) {
      goals[existingIndex] = goal;
    } else {
      goals.push(goal);
    }
    this.saveGoalsLocal(goals);
  }

  private updateGoalLocal(goal: SavingsGoal): void {
    const goals = this.getGoalsLocal();
    const index = goals.findIndex(g => g.id === goal.id);
    if (index >= 0) {
      goals[index] = goal;
      this.saveGoalsLocal(goals);
    }
  }

  private getGoalsLocal(): SavingsGoal[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.map((g: any) => ({
        ...g,
        createdAt: new Date(g.createdAt),
        deadline: g.deadline ? new Date(g.deadline) : undefined,
        achievedAt: g.achievedAt ? new Date(g.achievedAt) : undefined,
      }));
    } catch (error) {
      console.error('Error leyendo metas locales:', error);
      return [];
    }
  }

  private saveGoalsLocal(goals: SavingsGoal[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(goals));
    } catch (error) {
      console.error('Error guardando metas locales:', error);
    }
  }

  private async markGoalAsAchieved(
    goalId: string,
    proofId?: string
  ): Promise<void> {
    const goals = await this.getSavingsGoals();
    const updated = goals.map((g) =>
      g.id === goalId
        ? {
            ...g,
            achieved: true,
            proofId,
            achievedAt: new Date(),
          }
        : g
    );
    this.saveGoalsLocal(updated);
  }

  private async updateGoalProofId(
    goalId: string,
    proofId: string
  ): Promise<void> {
    const goals = await this.getSavingsGoals();
    const updated = goals.map((g) =>
      g.id === goalId ? { ...g, proofId } : g
    );
    this.saveGoalsLocal(updated);
  }
}

export const savingsService = new SavingsService();

