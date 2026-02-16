import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { courseGamificationService, type CourseProgress, type UserPoints, type Badge } from '@/services/courseGamificationService';
import { upsertCourseProgress } from '@/services/supabaseCourseProgress';
import { useAuth } from '@/contexts/AuthContext';

export interface UseCourseProgressReturn {
  userPoints: UserPoints | null;
  isLoading: boolean;
  error: Error | null;
  getCourseProgress: (courseId: string) => CourseProgress | null;
  recordCompletion: (
    courseId: string,
    quizScore: number,
    badgeLevel: 1 | 2 | 3,
    timeSpentSeconds?: number
  ) => Promise<{ points: number; badge: Badge }>;
  getUserBadges: () => Promise<Badge[]>;
  refresh: () => Promise<void>;
}

export const useCourseProgress = (): UseCourseProgressReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.address || user?.email || 'anonymous';

  // Query para obtener puntos del usuario
  const {
    data: userPoints = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['courseProgress', userId],
    queryFn: () => courseGamificationService.getUserPoints(userId),
    enabled: !!user,
  });

  // Mutation para registrar completitud (localStorage + Supabase)
  const recordCompletionMutation = useMutation({
    mutationFn: async ({
      courseId,
      quizScore,
      badgeLevel,
      timeSpentSeconds,
    }: {
      courseId: string;
      quizScore: number;
      badgeLevel: 1 | 2 | 3;
      timeSpentSeconds?: number;
    }) => {
      const result = await courseGamificationService.recordCourseCompletion(
        userId,
        courseId,
        quizScore,
        badgeLevel
      );
      // Persistir en Supabase para leaderboard (user_email = userId: email o address)
      try {
        await upsertCourseProgress({
          userEmail: userId,
          courseId,
          score: quizScore,
          passed: true,
          badgeLevel,
          pointsEarned: result.points,
          timeSpentSeconds,
        });
      } catch (e) {
        console.warn('No se pudo guardar progreso en Supabase:', e);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });
    },
  });

  // Obtener progreso de un curso específico
  const getCourseProgress = useCallback(async (courseId: string): Promise<CourseProgress | null> => {
    if (!user) return null;
    return await courseGamificationService.getCourseProgress(courseId, userId);
  }, [user, userId]);

  // Obtener badges del usuario
  const getUserBadges = async (): Promise<Badge[]> => {
    if (!user) return [];
    return await courseGamificationService.getUserBadges(userId);
  };

  return {
    userPoints,
    isLoading,
    error: error as Error | null,
    getCourseProgress,
    recordCompletion: async (
      courseId: string,
      quizScore: number,
      badgeLevel: 1 | 2 | 3,
      timeSpentSeconds?: number
    ) => {
      return recordCompletionMutation.mutateAsync({
        courseId,
        quizScore,
        badgeLevel,
        timeSpentSeconds,
      });
    },
    getUserBadges,
    refresh: async () => {
      await refetch();
    },
  };
};

