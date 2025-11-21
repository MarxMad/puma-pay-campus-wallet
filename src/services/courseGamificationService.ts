/**
 * Servicio para gestionar gamificación de cursos
 * Incluye puntos, badges, rankings y recompensas
 */

export interface UserPoints {
  userId: string;
  totalPoints: number;
  coursesCompleted: number;
  quizzesPassed: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  level: 1 | 2 | 3; // Bronze, Silver, Gold
  courseId?: string;
  earnedAt: Date;
  icon?: string;
}

export interface CampusRanking {
  position: number;
  userId: string; // Hash anónimo
  totalPoints: number;
  coursesCompleted: number;
  isCurrentUser?: boolean;
}

export interface CourseProgress {
  courseId: string;
  completed: boolean;
  quizCompleted: boolean;
  quizScore?: number;
  badgeLevel?: 1 | 2 | 3;
  pointsEarned: number;
  completedAt?: Date;
}

export class CourseGamificationService {
  private storageKey = 'pumapay_course_gamification';

  /**
   * Obtiene los puntos del usuario
   */
  async getUserPoints(userId: string): Promise<UserPoints> {
    const stored = this.getStoredData();
    const userData = stored.users[userId] || this.createDefaultUserData(userId);

    return {
      userId,
      totalPoints: userData.totalPoints,
      coursesCompleted: userData.coursesCompleted,
      quizzesPassed: userData.quizzesPassed,
      badges: userData.badges.map((b: any) => ({
        ...b,
        earnedAt: new Date(b.earnedAt),
      })),
    };
  }

  /**
   * Obtiene los badges del usuario
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    const points = await this.getUserPoints(userId);
    return points.badges;
  }

  /**
   * Obtiene el progreso de un curso específico
   */
  async getCourseProgress(courseId: string, userId: string): Promise<CourseProgress | null> {
    const stored = this.getStoredData();
    const progress = stored.courseProgress[`${userId}_${courseId}`];

    if (!progress) return null;

    return {
      ...progress,
      completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined,
    };
  }

  /**
   * Registra la completitud de un curso
   */
  async recordCourseCompletion(
    userId: string,
    courseId: string,
    quizScore: number,
    badgeLevel: 1 | 2 | 3
  ): Promise<{ points: number; badge: Badge }> {
    const stored = this.getStoredData();
    const userData = stored.users[userId] || this.createDefaultUserData(userId);

    // Calcular puntos basados en badge level
    const pointsEarned = this.calculatePoints(badgeLevel);

    // Actualizar datos del usuario
    userData.totalPoints += pointsEarned;
    userData.coursesCompleted += 1;
    userData.quizzesPassed += 1;

    // Crear badge
    const badge: Badge = {
      id: `badge-${courseId}-${Date.now()}`,
      name: this.getBadgeName(badgeLevel),
      description: `Completaste el curso con nivel ${this.getBadgeName(badgeLevel)}`,
      level: badgeLevel,
      courseId,
      earnedAt: new Date(),
      icon: this.getBadgeIcon(badgeLevel),
    };

    userData.badges.push(badge);

    // Guardar progreso del curso
    stored.courseProgress[`${userId}_${courseId}`] = {
      courseId,
      completed: true,
      quizCompleted: true,
      quizScore,
      badgeLevel,
      pointsEarned,
      completedAt: new Date().toISOString(),
    };

    // Guardar datos
    stored.users[userId] = userData;
    this.saveStoredData(stored);

    return { points: pointsEarned, badge };
  }

  /**
   * Obtiene rankings del campus (anónimos)
   */
  async getCampusRankings(userId?: string): Promise<CampusRanking[]> {
    const stored = this.getStoredData();
    const rankings: CampusRanking[] = [];

    Object.entries(stored.users).forEach(([uid, userData]: [string, any]) => {
      // Hash del userId para anonimato (en producción usar hash real)
      const anonymousId = this.hashUserId(uid);

      rankings.push({
        position: 0, // Se calculará después
        userId: anonymousId,
        totalPoints: userData.totalPoints,
        coursesCompleted: userData.coursesCompleted,
        isCurrentUser: uid === userId,
      });
    });

    // Ordenar por puntos y asignar posiciones
    rankings.sort((a, b) => b.totalPoints - a.totalPoints);
    rankings.forEach((r, index) => {
      r.position = index + 1;
    });

    return rankings.slice(0, 100); // Top 100
  }

  /**
   * Calcula puntos basados en nivel de badge
   */
  private calculatePoints(badgeLevel: 1 | 2 | 3): number {
    switch (badgeLevel) {
      case 3: // Gold
        return 100;
      case 2: // Silver
        return 75;
      case 1: // Bronze
        return 50;
      default:
        return 50;
    }
  }

  /**
   * Obtiene nombre del badge
   */
  private getBadgeName(level: 1 | 2 | 3): string {
    switch (level) {
      case 3:
        return 'Gold';
      case 2:
        return 'Silver';
      case 1:
        return 'Bronze';
    }
  }

  /**
   * Obtiene icono del badge
   */
  private getBadgeIcon(level: 1 | 2 | 3): string {
    switch (level) {
      case 3:
        return '🥇';
      case 2:
        return '🥈';
      case 1:
        return '🥉';
    }
  }

  /**
   * Hash simple del userId (en producción usar hash criptográfico)
   */
  private hashUserId(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `user_${Math.abs(hash).toString(16).substring(0, 8)}`;
  }

  /**
   * Crea datos por defecto para un usuario
   */
  private createDefaultUserData(userId: string): any {
    return {
      totalPoints: 0,
      coursesCompleted: 0,
      quizzesPassed: 0,
      badges: [],
    };
  }

  /**
   * Obtiene datos almacenados
   */
  private getStoredData(): any {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return { users: {}, courseProgress: {} };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error leyendo datos de gamificación:', error);
      return { users: {}, courseProgress: {} };
    }
  }

  /**
   * Guarda datos almacenados
   */
  private saveStoredData(data: any): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error guardando datos de gamificación:', error);
    }
  }
}

export const courseGamificationService = new CourseGamificationService();

