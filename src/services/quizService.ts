/**
 * Servicio para gestionar cuestionarios de cursos
 */

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
  timeLimit?: number; // Tiempo límite en minutos
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
   * Envía las respuestas del cuestionario
   */
  async submitQuiz(
    courseId: string,
    answers: QuizAnswer[]
  ): Promise<QuizResult> {
    const quiz = await this.getQuiz(courseId);
    const result = this.calculateScore(answers, quiz.questions);

    // Guardar resultado localmente
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
   * Obtiene un cuestionario mock para desarrollo
   */
  private getMockQuiz(courseId: string): Quiz {
    return {
      id: `quiz-${courseId}`,
      courseId,
      title: 'Cuestionario Final',
      passingScore: 70,
      timeLimit: 30,
      questions: [
        {
          id: 'q1',
          question: '¿Qué es un presupuesto?',
          options: [
            'Un plan de gastos',
            'Un tipo de cuenta bancaria',
            'Una tarjeta de crédito',
            'Un préstamo',
          ],
          correctAnswer: 0,
          explanation: 'Un presupuesto es un plan que te ayuda a controlar tus gastos.',
        },
        {
          id: 'q2',
          question: '¿Cuál es la regla 50/30/20?',
          options: [
            '50% necesidades, 30% deseos, 20% ahorro',
            '50% ahorro, 30% gastos, 20% inversión',
            '50% ingresos, 30% gastos, 20% ahorro',
            '50% gastos, 30% ahorro, 20% inversión',
          ],
          correctAnswer: 0,
          explanation: 'La regla 50/30/20 divide tus ingresos en necesidades (50%), deseos (30%) y ahorro (20%).',
        },
        {
          id: 'q3',
          question: '¿Qué es el interés compuesto?',
          options: [
            'Interés que se calcula solo sobre el capital inicial',
            'Interés que se calcula sobre el capital y los intereses acumulados',
            'Un tipo de préstamo',
            'Una tarifa bancaria',
          ],
          correctAnswer: 1,
          explanation: 'El interés compuesto es cuando los intereses se calculan sobre el capital inicial más los intereses acumulados.',
        },
        {
          id: 'q4',
          question: '¿Cuál es el beneficio de ahorrar regularmente?',
          options: [
            'Solo acumular dinero',
            'Crear un fondo de emergencia y alcanzar metas financieras',
            'Evitar pagar impuestos',
            'Obtener más tarjetas de crédito',
          ],
          correctAnswer: 1,
          explanation: 'Ahorrar regularmente te ayuda a crear un fondo de emergencia y alcanzar tus metas financieras.',
        },
        {
          id: 'q5',
          question: '¿Qué es un fondo de emergencia?',
          options: [
            'Una inversión de alto riesgo',
            'Dinero reservado para gastos inesperados',
            'Un tipo de préstamo',
            'Una cuenta de ahorro con intereses altos',
          ],
          correctAnswer: 1,
          explanation: 'Un fondo de emergencia es dinero que reservas para cubrir gastos inesperados o situaciones de emergencia.',
        },
      ],
    };
  }
}

export const quizService = new QuizService();

