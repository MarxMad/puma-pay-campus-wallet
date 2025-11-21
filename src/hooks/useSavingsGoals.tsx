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
  createGoal: (targetAmount: number, deadline?: Date) => Promise<SavingsGoal>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateGoal: (
    goalId: string,
    updates: Partial<Pick<SavingsGoal, 'targetAmount' | 'deadline'>>
  ) => Promise<SavingsGoal>;
  getProgress: (goalId: string) => GoalProgress | null;
  generateProof: (goalId: string) => Promise<void>;
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
    queryFn: () => savingsService.getSavingsGoals(),
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
    }) => savingsService.createSavingsGoal(targetAmount, deadline),
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

  // Mutation para generar proof
  const generateProofMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const currentBalance = balance.balance || 0;
      const proof = await savingsService.generateProofIfAchieved(
        goalId,
        currentBalance
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

      // Obtener proof completo (necesitamos guardarlo cuando se genera)
      const currentBalance = balance.balance || 0;
      const proof = await zkProofService.generateProof({
        balance: currentBalance,
        targetAmount: goal.targetAmount,
      });

      await savingsService.claimReward(goalId, proof);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });

  // Obtener progreso de una meta
  const getProgress = useCallback(
    (goalId: string): GoalProgress | null => {
      const currentBalance = balance.balance || 0;
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return null;

      const progress = Math.min((currentBalance / goal.targetAmount) * 100, 100);
      const canGenerateProof =
        currentBalance >= goal.targetAmount && !goal.achieved;

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
    },
    [goals, balance.balance]
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
    getProgress,
    generateProof: async (goalId: string) => {
      await generateProofMutation.mutateAsync(goalId);
    },
    claimReward: async (goalId: string) => {
      await claimRewardMutation.mutateAsync(goalId);
    },
    refreshGoals: async () => {
      await refetch();
    },
  };
};

