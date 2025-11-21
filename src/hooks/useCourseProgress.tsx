import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { courseGamificationService, type CourseProgress, type UserPoints, type Badge } from '@/services/courseGamificationService';
import { useAuth } from '@/contexts/AuthContext';

export interface UseCourseProgressReturn {
  userPoints: UserPoints | null;
  isLoading: boolean;
  error: Error | null;
  getCourseProgress: (courseId: string) => CourseProgress | null;
  recordCompletion: (
    courseId: string,
    quizScore: number,
    badgeLevel: 1 | 2 | 3
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

  // Mutation para registrar completitud
  const recordCompletionMutation = useMutation({
    mutationFn: ({
      courseId,
      quizScore,
      badgeLevel,
    }: {
      courseId: string;
      quizScore: number;
      badgeLevel: 1 | 2 | 3;
    }) =>
      courseGamificationService.recordCourseCompletion(
        userId,
        courseId,
        quizScore,
        badgeLevel
      ),
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
      badgeLevel: 1 | 2 | 3
    ) => {
      return recordCompletionMutation.mutateAsync({
        courseId,
        quizScore,
        badgeLevel,
      });
    },
    getUserBadges,
    refresh: async () => {
      await refetch();
    },
  };
};

