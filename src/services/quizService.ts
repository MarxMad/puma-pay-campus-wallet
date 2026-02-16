/**
 * Servicio para gestionar cuestionarios de cursos (guías de estudio).
 * Cada guía tiene un cuestionario de 15 preguntas según su categoría.
 */

import { getQuestionsForCourse } from '@/data/quizBank';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Índice de la respuesta correcta
  explanation?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number; // Puntuación mínima para pasar (0-100)
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  badgeLevel?: 1 | 2 | 3; // Bronze, Silver, Gold
  /** Tiempo en segundos que tardó en completar el cuestionario (cronómetro). Para leaderboard. */
  timeSpentSeconds?: number;
}

export class QuizService {
  /**
   * Obtiene el cuestionario de un curso
   */
  async getQuiz(courseId: string): Promise<Quiz> {
    // TODO: Obtener del backend cuando esté implementado
    // Por ahora, retornamos un cuestionario de ejemplo
    return this.getMockQuiz(courseId);
  }

  /**
   * Envía las respuestas del cuestionario.
   * @param timeSpentSeconds Tiempo en segundos que tardó (cronómetro). Se guarda para leaderboard.
   */
  async submitQuiz(
    courseId: string,
    answers: QuizAnswer[],
    timeSpentSeconds?: number
  ): Promise<QuizResult> {
    const quiz = await this.getQuiz(courseId);
    const result = this.calculateScore(answers, quiz.questions);
    if (timeSpentSeconds != null) {
      result.timeSpentSeconds = timeSpentSeconds;
    }

    // Guardar resultado localmente (incluye tiempo para leaderboard)
    this.saveQuizResult(courseId, result);

    return result;
  }

  /**
   * Calcula la puntuación del cuestionario
   */
  calculateScore(
    answers: QuizAnswer[],
    questions: QuizQuestion[]
  ): QuizResult {
    let correctAnswers = 0;
    const totalQuestions = questions.length;

    answers.forEach((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (question && question.correctAnswer === answer.selectedAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passingScore = questions.length > 0 
      ? Math.ceil(questions.length * 0.7) // 70% mínimo
      : 0;
    const passed = correctAnswers >= passingScore;

    // Determinar nivel de badge
    let badgeLevel: 1 | 2 | 3 = 1; // Bronze por defecto
    if (score >= 90) {
      badgeLevel = 3; // Gold
    } else if (score >= 80) {
      badgeLevel = 2; // Silver
    }

    return {
      score,
      totalQuestions,
      correctAnswers,
      passed,
      badgeLevel,
    };
  }

  /**
   * Obtiene el resultado de un cuestionario guardado
   */
  getQuizResult(courseId: string): QuizResult | null {
    try {
      const stored = localStorage.getItem(`quiz_result_${courseId}`);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error obteniendo resultado de cuestionario:', error);
      return null;
    }
  }

  /**
   * Guarda el resultado de un cuestionario
   */
  private saveQuizResult(courseId: string, result: QuizResult): void {
    try {
      localStorage.setItem(
        `quiz_result_${courseId}`,
        JSON.stringify(result)
      );
    } catch (error) {
      console.error('Error guardando resultado de cuestionario:', error);
    }
  }

  /**
   * Obtiene el cuestionario de una guía por courseId (15 preguntas por tema dentro de la categoría).
   */
  private getMockQuiz(courseId: string): Quiz {
    const questions = getQuestionsForCourse(courseId);
    return {
      id: `quiz-${courseId}`,
      courseId,
      title: 'Cuestionario (15 preguntas)',
      passingScore: 70,
      questions,
    };
  }
}

export const quizService = new QuizService();

