/**
 * Servicio para generar ZK proofs de completitud de cursos
 */

import { zkProofService } from './zkProofService';
import { sorobanService } from './sorobanService';

export interface CourseProofInput {
  score: number;
  passingScore: number;
  questionsAnswered: number;
  totalQuestions: number;
}

export interface CourseProofResult {
  proof: string;
  publicInputs: string[];
  proofId: string;
  badgeLevel: 1 | 2 | 3;
}

export class ZKCourseProofService {
  private courseCompletionContractAddress: string;

  constructor() {
    this.courseCompletionContractAddress =
      import.meta.env.VITE_COURSE_COMPLETION_CONTRACT || '';
  }

  /**
   * Genera un proof de completitud de curso
   */
  async generateCompletionProof(
    input: CourseProofInput
  ): Promise<CourseProofResult> {
    // Validar inputs
    if (input.score < input.passingScore) {
      throw new Error(
        'No se puede generar proof: la puntuación es menor a la mínima requerida'
      );
    }

    if (input.questionsAnswered !== input.totalQuestions) {
      throw new Error(
        'No se puede generar proof: no todas las preguntas fueron respondidas'
      );
    }

    try {
      // Llamar al backend para generar proof usando nargo
      const response = await fetch('/api/zk/generate-course-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: input.score.toString(),
          passing_score: input.passingScore.toString(),
          questions_answered: input.questionsAnswered.toString(),
          total_questions: input.totalQuestions.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error?.message ||
          `Error generando proof: ${response.statusText}`;
        const errorCode = errorData.error?.code;
        throw new Error(
          `${errorMessage}${errorCode ? ` (${errorCode})` : ''}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        const errorMessage = data.error?.message || 'Error generando proof';
        const errorCode = data.error?.code;
        throw new Error(
          `${errorMessage}${errorCode ? ` (${errorCode})` : ''}`
        );
      }

      // Calcular badge level basado en la puntuación
      const badgeLevel = this.calculateBadgeLevel(
        input.score,
        input.passingScore
      );

      return {
        proof: data.proof,
        publicInputs: data.publicInputs,
        proofId: data.proofId,
        badgeLevel,
      };
    } catch (error: any) {
      console.error('Error generando proof de curso:', error);
      throw error;
    }
  }

  /**
   * Verifica un proof on-chain
   */
  async verifyProofOnChain(
    proof: string,
    publicInputs: string[]
  ): Promise<{ verified: boolean; txHash?: string; error?: string }> {
    if (!this.courseCompletionContractAddress) {
      throw new Error('Contrato de course completion no configurado');
    }

    try {
      const result = await sorobanService.verifyProof(
        proof,
        this.courseCompletionContractAddress
      );

      return {
        verified: result.verified,
        txHash: result.txHash,
        error: result.error,
      };
    } catch (error: any) {
      console.error('Error verificando proof on-chain:', error);
      return {
        verified: false,
        error: error.message || 'Error verificando proof',
      };
    }
  }

  /**
   * Calcula el nivel de badge basado en la puntuación
   */
  private calculateBadgeLevel(score: number, passingScore: number): 1 | 2 | 3 {
    const goldThreshold = passingScore * 3;
    const silverThreshold = passingScore * 2;

    if (score >= goldThreshold) {
      return 3; // Gold
    } else if (score >= silverThreshold) {
      return 2; // Silver
    } else {
      return 1; // Bronze
    }
  }
}

export const zkCourseProofService = new ZKCourseProofService();

