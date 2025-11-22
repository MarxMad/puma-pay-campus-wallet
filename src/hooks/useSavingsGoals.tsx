import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsService, type SavingsGoal, type GoalProgress } from '@/services/savingsService';
import { useBalance } from './useBalance';
import { useAuth } from '@/contexts/AuthContext';
import { zkProofService } from '@/services/zkProofService';
import { sorobanService } from '@/services/sorobanService';

export interface UseSavingsGoalsReturn {
  goals: SavingsGoal[];
  isLoading: boolean;
  error: Error | null;
  createGoal: (targetAmount: number, deadline?: Date) => Promise<SavingsGoal & { txHash?: string }>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateGoal: (
    goalId: string,
    updates: Partial<Pick<SavingsGoal, 'targetAmount' | 'deadline'>>
  ) => Promise<SavingsGoal>;
  depositToGoal: (goalId: string, amount: number) => Promise<{ success: boolean; savedAmount: number; txHash?: string }>;
  getProgress: (goalId: string) => GoalProgress | null;
  generateProof: (goalId: string) => Promise<{ verificationTxHash?: string } | void>;
  claimReward: (goalId: string) => Promise<void>;
  refreshGoals: () => Promise<void>;
}

export const useSavingsGoals = (): UseSavingsGoalsReturn => {
  const { user } = useAuth();
  const { balance } = useBalance();
  const queryClient = useQueryClient();

  // Query para obtener metas
  const {
    data: goals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['savingsGoals', user?.address || user?.email],
    queryFn: () => savingsService.getSavingsGoals(user?.walletAddress || user?.address),
    enabled: !!user,
  });

  // Mutation para crear meta
  const createMutation = useMutation({
    mutationFn: ({
      targetAmount,
      deadline,
    }: {
      targetAmount: number;
      deadline?: Date;
    }) => savingsService.createSavingsGoal(
      targetAmount, 
      deadline,
      user?.walletAddress || user?.address,
      (user as any)?.id, // userId desde Supabase
      user?.email
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });

  // Mutation para eliminar meta
  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => savingsService.deleteSavingsGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });

  // Mutation para actualizar meta
  const updateMutation = useMutation({
    mutationFn: ({
      goalId,
      updates,
    }: {
      goalId: string;
      updates: Partial<Pick<SavingsGoal, 'targetAmount' | 'deadline'>>;
    }) => savingsService.updateSavingsGoal(goalId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });

  // Mutation para depositar en meta
  const depositMutation = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      return savingsService.depositToGoal(
        goalId,
        amount,
        user?.walletAddress || user?.address,
        (user as any)?.id, // userId desde Supabase
        user?.email
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });

  // Mutation para generar proof
  const generateProofMutation = useMutation({
    mutationFn: async (goalId: string) => {
      // Ya no necesitamos pasar balance, se usa savedAmount de la meta
      const proof = await savingsService.generateProofIfAchieved(
        goalId,
        undefined, // No se usa, se mantiene por compatibilidad
        user?.walletAddress || user?.address,
        (user as any)?.id, // userId desde Supabase
        user?.email
      );

      if (!proof) {
        throw new Error('No se puede generar proof. La meta no ha sido alcanzada.');
      }

      return proof;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });

  // Mutation para reclamar recompensa
  const claimRewardMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal || !goal.proofId) {
        throw new Error('Meta no encontrada o proof no generado');
      }

      // La recompensa ya fue reclamada cuando se generó el proof
      // Este método puede usarse para lógica adicional
      const currentBalance = balance.balance || 0;
      const proof = await zkProofService.generateProof({
        balance: currentBalance,
        targetAmount: goal.targetAmount,
      });

      await savingsService.claimReward(
        goalId, 
        proof,
        user?.walletAddress || user?.address
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });

  // Obtener progreso de una meta usando savedAmount de la cajita
  const getProgress = useCallback(
    (goalId: string): GoalProgress | null => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return null;

      // Usar savedAmount de la cajita en lugar del balance total
      const savedAmount = goal.savedAmount || 0;
      const progress = Math.min((savedAmount / goal.targetAmount) * 100, 100);
      const canGenerateProof =
        savedAmount >= goal.targetAmount && !goal.achieved;

      let daysRemaining: number | undefined;
      if (goal.deadline) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const diff = deadline.getTime() - now.getTime();
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        goal,
        currentBalance: savedAmount, // Usar savedAmount
        progress,
        canGenerateProof,
        daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : undefined,
      };
    },
    [goals] // Ya no depende de balance.balance
  );

  return {
    goals,
    isLoading,
    error: error as Error | null,
    createGoal: async (targetAmount: number, deadline?: Date) => {
      return createMutation.mutateAsync({ targetAmount, deadline });
    },
    deleteGoal: async (goalId: string) => {
      return deleteMutation.mutateAsync(goalId);
    },
    updateGoal: async (
      goalId: string,
      updates: Partial<Pick<SavingsGoal, 'targetAmount' | 'deadline'>>
    ) => {
      return updateMutation.mutateAsync({ goalId, updates });
    },
    depositToGoal: async (goalId: string, amount: number) => {
      return depositMutation.mutateAsync({ goalId, amount });
    },
    getProgress,
    generateProof: async (goalId: string) => {
      return generateProofMutation.mutateAsync(goalId);
    },
    claimReward: async (goalId: string) => {
      await claimRewardMutation.mutateAsync(goalId);
    },
    refreshGoals: async () => {
      await refetch();
    },
  };
};

