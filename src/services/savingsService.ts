/**
 * Servicio para gestionar metas de ahorro con integración ZK
 * 
 * Este servicio maneja la creación, seguimiento y verificación de metas
 * de ahorro usando ZK proofs para mantener la privacidad.
 */

import { zkProofService, type ProofInput, type ProofResult } from './zkProofService';
import { sorobanService } from './sorobanService';

export interface SavingsGoal {
  id: string;
  targetAmount: number;
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
   * Crea una nueva meta de ahorro
   */
  async createSavingsGoal(
    targetAmount: number,
    deadline?: Date
  ): Promise<SavingsGoal> {
    if (targetAmount <= 0) {
      throw new Error('El monto objetivo debe ser mayor a 0');
    }

    const goal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      targetAmount,
      deadline,
      achieved: false,
      createdAt: new Date(),
    };

    // Guardar localmente
    this.saveGoalLocal(goal);

    // Si hay contrato configurado, guardar on-chain también
    if (this.savingsGoalsContractAddress) {
      try {
        // TODO: Llamar a contrato Soroban set_savings_goal
        // await sorobanService.setSavingsGoal(targetAmount, deadline);
      } catch (error) {
        console.warn('No se pudo guardar meta on-chain:', error);
        // Continuar con almacenamiento local
      }
    }

    return goal;
  }

  /**
   * Obtiene todas las metas de ahorro del usuario
   */
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    // Primero intentar obtener del contrato
    if (this.savingsGoalsContractAddress) {
      try {
        // TODO: Obtener del contrato cuando tengamos user address
        // const contractGoal = await sorobanService.getSavingsGoal(userAddress, ...);
        // if (contractGoal) {
        //   return [this.mapContractGoalToLocal(contractGoal)];
        // }
      } catch (error) {
        console.warn('No se pudo obtener meta del contrato:', error);
      }
    }

    // Fallback a almacenamiento local
    return this.getGoalsLocal();
  }

  /**
   * Obtiene el progreso de una meta
   */
  async getGoalProgress(
    goalId: string,
    currentBalance: number
  ): Promise<GoalProgress | null> {
    const goals = await this.getSavingsGoals();
    const goal = goals.find((g) => g.id === goalId);

    if (!goal) {
      return null;
    }

    const progress = Math.min(
      (currentBalance / goal.targetAmount) * 100,
      100
    );
    const canGenerateProof = currentBalance >= goal.targetAmount && !goal.achieved;

    let daysRemaining: number | undefined;
    if (goal.deadline) {
      const now = new Date();
      const deadline = new Date(goal.deadline);
      const diff = deadline.getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      goal,
      currentBalance,
      progress,
      canGenerateProof,
      daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : undefined,
    };
  }

  /**
   * Genera un proof si la meta fue alcanzada
   */
  async generateProofIfAchieved(
    goalId: string,
    currentBalance: number
  ): Promise<ProofResult | null> {
    const progress = await this.getGoalProgress(goalId, currentBalance);

    if (!progress || !progress.canGenerateProof) {
      return null;
    }

    try {
      const proof = await zkProofService.generateProof({
        balance: currentBalance,
        targetAmount: progress.goal.targetAmount,
      });

      // Actualizar meta como alcanzada
      await this.markGoalAsAchieved(goalId, proof.proofId);

      return proof;
    } catch (error) {
      console.error('Error generando proof:', error);
      throw error;
    }
  }

  /**
   * Envía proof al contrato y reclama recompensa
   */
  async claimReward(goalId: string, proof: ProofResult): Promise<string> {
    if (!this.savingsGoalsContractAddress) {
      throw new Error('Contrato de savings goals no configurado');
    }

    try {
      // Enviar proof al contrato
      const result = await sorobanService.submitProofToSavingsGoals(
        proof.proof,
        this.savingsGoalsContractAddress
      );

      if (!result.verified) {
        throw new Error(result.error || 'Proof no verificado');
      }

      // Actualizar meta con proof_id
      await this.updateGoalProofId(goalId, result.proofId);

      return result.proofId;
    } catch (error) {
      console.error('Error reclamando recompensa:', error);
      throw error;
    }
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
    goals.push(goal);
    this.saveGoalsLocal(goals);
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

