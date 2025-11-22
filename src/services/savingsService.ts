/**
 * Servicio para gestionar metas de ahorro con integración ZK
 * 
 * Este servicio maneja la creación, seguimiento y verificación de metas
 * de ahorro usando ZK proofs para mantener la privacidad.
 */

import { zkProofService, type ProofInput, type ProofResult } from './zkProofService';
import { sorobanService, type SavingsGoal as ContractGoal } from './sorobanService';
import { defindexService } from './defindexService';

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
          // Guardar el txHash para retornarlo incluso si getSavingsGoal falla
          const txHash = result.txHash;
          console.log('🔑 txHash recibido:', txHash);
          
          if (!txHash) {
            console.error('❌ No hay txHash en el resultado, esto no debería pasar');
          }
          
          // Crear una meta básica con el txHash primero (para asegurar que siempre se retorne)
          const basicGoal: SavingsGoal = {
            id: `goal-${Date.now()}`,
            targetAmount,
            savedAmount: 0,
            deadline,
            achieved: false,
            createdAt: new Date(),
          };
          
          // Intentar obtener la meta recién creada del contrato
          // Si falla (por ejemplo, por error de parsing), aún retornamos el txHash
          // Usar Promise.race con timeout para no bloquear el retorno del txHash
          try {
            console.log('🔄 Intentando obtener meta del contrato...');
            const getGoalPromise = sorobanService.getSavingsGoal(
              userAddress,
              this.savingsGoalsContractAddress
            );
            
            // Timeout de 5 segundos para no bloquear el retorno del txHash
            const timeoutPromise = new Promise<null>((resolve) => {
              setTimeout(() => {
                console.warn('⏱️ Timeout obteniendo meta del contrato, retornando meta básica con txHash');
                resolve(null);
              }, 5000);
            });
            
            const contractGoal = await Promise.race([getGoalPromise, timeoutPromise]);
            console.log('📥 Resultado de getSavingsGoal:', contractGoal ? 'Meta encontrada' : 'Meta no encontrada o timeout');

            if (contractGoal) {
              const goal = this.mapContractGoalToLocal(contractGoal, userAddress);
              // También guardar localmente como backup
              this.saveGoalLocal(goal);
              // Retornar goal con txHash
              console.log('✅ Meta creada con txHash (desde contrato):', txHash);
              const goalWithTxHash = { ...goal, txHash } as SavingsGoal & { txHash?: string };
              console.log('📤 Retornando goal con txHash:', goalWithTxHash.txHash);
              return goalWithTxHash;
            } else {
              // Si contractGoal es null, retornar la meta básica con txHash
              console.log('⚠️ No se encontró la meta en el contrato, retornando meta básica con txHash');
              this.saveGoalLocal(basicGoal);
              const basicGoalWithTxHash = { ...basicGoal, txHash } as SavingsGoal & { txHash?: string };
              console.log('📤 Retornando meta básica con txHash:', basicGoalWithTxHash.txHash);
              return basicGoalWithTxHash;
            }
          } catch (getGoalError) {
            console.warn('⚠️ No se pudo obtener la meta del contrato después de crearla:', getGoalError);
            // Aún así, retornar una meta básica con el txHash para mostrar la confirmación
            this.saveGoalLocal(basicGoal);
            console.log('✅ Retornando meta básica con txHash (catch):', txHash);
            const basicGoalWithTxHash = { ...basicGoal, txHash } as SavingsGoal & { txHash?: string };
            console.log('📤 Retornando meta básica con txHash:', basicGoalWithTxHash.txHash);
            return basicGoalWithTxHash;
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
    // Obtener metas locales primero
    const localGoals = this.getGoalsLocal();
    
    // Intentar obtener la meta del contrato (el contrato solo soporta una meta por usuario)
    if (this.savingsGoalsContractAddress && userAddress) {
      try {
        console.log('🔄 Obteniendo meta del contrato para:', userAddress);
        const contractGoal = await sorobanService.getSavingsGoal(
          userAddress,
          this.savingsGoalsContractAddress
        );

        if (contractGoal) {
          console.log('✅ Meta encontrada en el contrato:', contractGoal);
          const goal = this.mapContractGoalToLocal(contractGoal, userAddress);
          
          // Sincronizar con almacenamiento local
          // La meta del contrato tiene prioridad sobre las locales
          const existingIndex = localGoals.findIndex(g => g.id === goal.id);
          if (existingIndex >= 0) {
            // Actualizar la meta existente con los datos del contrato
            localGoals[existingIndex] = goal;
          } else {
            // Agregar la meta del contrato
            localGoals.push(goal);
          }
          
          this.saveGoalsLocal(localGoals);
          console.log('📊 Metas sincronizadas. Total:', localGoals.length);
          return localGoals;
        } else {
          console.log('⚠️ No se encontró meta en el contrato para:', userAddress);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener meta del contrato:', error);
        // Continuar con almacenamiento local
      }
    }

    // Retornar metas locales (pueden incluir la del contrato si se sincronizó)
    console.log('📊 Retornando metas locales. Total:', localGoals.length);
    return localGoals;
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

    // Si hay contrato configurado, depositar primero en DeFindex y luego actualizar el contrato
    if (this.savingsGoalsContractAddress && userAddress) {
      try {
        console.log('💰 Iniciando depósito en DeFindex (vault de Pumati)...', { amount, userAddress, userId, email });
        
        // PASO 1: Depositar directamente en DeFindex (vault de Pumati)
        let defindexTxHash: string | undefined;
        if (userId || email) {
          try {
            const defindexResult = await defindexService.deposit(
              amount,
              userAddress,
              userId,
              email
            );

            if (defindexResult.success) {
              defindexTxHash = defindexResult.txHash;
              console.log('✅ Depósito en DeFindex exitoso. txHash:', defindexTxHash);
            } else {
              console.error('❌ Error depositando en DeFindex:', defindexResult.error);
              if (defindexResult.suggestions && defindexResult.suggestions.length > 0) {
                console.log('💡 Sugerencias:', defindexResult.suggestions);
              }
              // Crear un error más descriptivo con sugerencias
              const errorMessage = defindexResult.error || 'Error depositando en DeFindex';
              const error = new Error(errorMessage);
              (error as any).suggestions = defindexResult.suggestions;
              throw error;
            }
          } catch (defindexError: any) {
            console.error('❌ Excepción depositando en DeFindex:', defindexError);
            throw new Error(defindexError.message || 'Error depositando en DeFindex');
          }
        } else {
          throw new Error('No se puede depositar en DeFindex: falta userId o email');
        }

        // PASO 2: Actualizar el savedAmount en el contrato savings-goals
        console.log('📝 Actualizando savedAmount en el contrato savings-goals...');
        const contractResult = await sorobanService.depositToGoal(
          userAddress,
          amount,
          this.savingsGoalsContractAddress,
          userId,
          email
        );

        console.log('📥 Resultado de depositToGoal:', contractResult);

        if (contractResult.success) {
          // Intentar obtener la meta actualizada del contrato para sincronizar
          let finalSavedAmount = contractResult.savedAmount || (goal.savedAmount + amount);
          
          try {
            console.log('🔄 Sincronizando meta del contrato...');
            // Esperar un poco para que la transacción se confirme
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const updatedGoal = await sorobanService.getSavingsGoal(
              userAddress,
              this.savingsGoalsContractAddress
            );
            if (updatedGoal) {
              const syncedGoal = this.mapContractGoalToLocal(updatedGoal, userAddress);
              finalSavedAmount = syncedGoal.savedAmount; // Usar el valor del contrato
              console.log('✅ Meta sincronizada con contrato. savedAmount:', finalSavedAmount);
            } else {
              console.warn('⚠️ No se encontró meta en el contrato después del depósito');
            }
          } catch (syncError) {
            console.warn('⚠️ No se pudo sincronizar meta del contrato:', syncError);
            // Usar el valor calculado o el del backend
            if (!contractResult.savedAmount || contractResult.savedAmount === 0) {
              finalSavedAmount = goal.savedAmount + amount;
              console.log('📊 Usando savedAmount calculado:', finalSavedAmount);
            }
          }
          
          // Actualizar meta local con el savedAmount final
          goal.savedAmount = finalSavedAmount;
          await this.updateGoalLocal(goal);
          console.log('✅ Depósito completo. savedAmount actualizado a:', goal.savedAmount);
          console.log('   - DeFindex txHash:', defindexTxHash);
          console.log('   - Contrato txHash:', contractResult.txHash);

          // Retornar el savedAmount actualizado (usar el txHash de DeFindex como principal)
          return { 
            success: true, 
            savedAmount: goal.savedAmount, 
            txHash: defindexTxHash || contractResult.txHash 
          };
        } else {
          console.error('❌ Error actualizando contrato savings-goals:', contractResult.error);
          // Aunque el contrato falle, el depósito en DeFindex fue exitoso
          // Actualizar localmente
          goal.savedAmount = goal.savedAmount + amount;
          await this.updateGoalLocal(goal);
          console.warn('⚠️ Depósito en DeFindex exitoso, pero falló actualización del contrato. Actualizado localmente.');
          return { 
            success: true, 
            savedAmount: goal.savedAmount, 
            txHash: defindexTxHash 
          };
        }
      } catch (error: any) {
        console.error('❌ Excepción en el flujo de depósito:', error);
        throw error; // Propagar el error para que el frontend lo maneje
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

