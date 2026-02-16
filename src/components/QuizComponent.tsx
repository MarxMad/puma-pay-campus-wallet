import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  quizService,
  type Quiz,
  type QuizAnswer,
  type QuizResult,
} from '@/services/quizService';
import { zkCourseProofService } from '@/services/zkCourseProofService';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { Loader2, CheckCircle2, XCircle, Award, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuizComponentProps {
  courseId: string;
  onComplete?: (result: QuizResult, proofGenerated: boolean) => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({
  courseId,
  onComplete,
}) => {
  const { toast } = useToast();
  const { recordCompletion } = useCourseProgress();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  /** Cronómetro: segundos transcurridos desde que se cargó el cuestionario */
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [courseId]);

  // Iniciar cronómetro al tener el quiz cargado
  useEffect(() => {
    if (!quiz || result) return;
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
    const interval = setInterval(() => {
      if (startTimeRef.current === null) return;
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [quiz, result]);

  const loadQuiz = async () => {
    setIsLoading(true);
    startTimeRef.current = null;
    setElapsedSeconds(0);
    try {
      const loadedQuiz = await quizService.getQuiz(courseId);
      setQuiz(loadedQuiz);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cargar el cuestionario',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null || !quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      selectedAnswer,
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(
        newAnswers[currentQuestionIndex + 1]?.selectedAnswer ?? null
      );
    } else {
      // Última pregunta, mostrar resultados
      handleSubmit(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevAnswer = answers[currentQuestionIndex - 1];
      setSelectedAnswer(prevAnswer?.selectedAnswer ?? null);
    }
  };

  const handleSubmit = async (finalAnswers?: QuizAnswer[]) => {
    if (!quiz) return;

    const timeSpentSeconds =
      startTimeRef.current != null
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : undefined;

    setIsSubmitting(true);
    try {
      const finalAnswersToUse = finalAnswers || answers;
      const quizResult = await quizService.submitQuiz(
        courseId,
        finalAnswersToUse,
        timeSpentSeconds
      );
      setResult(quizResult);

      // Registrar completitud en gamificación (localStorage + Supabase para leaderboard)
      if (quizResult.passed && quizResult.badgeLevel) {
        await recordCompletion(
          courseId,
          quizResult.score,
          quizResult.badgeLevel,
          quizResult.timeSpentSeconds
        );
      }

      // Generar proof ZK
      if (quizResult.passed) {
        await generateProof(quizResult);
      }

      onComplete?.(quizResult, quizResult.passed);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar el cuestionario',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateProof = async (quizResult: QuizResult) => {
    if (!quiz) return;

    setIsGeneratingProof(true);
    try {
      const proof = await zkCourseProofService.generateCompletionProof({
        score: quizResult.correctAnswers,
        passingScore: Math.ceil(quiz.questions.length * 0.7), // 70% mínimo
        questionsAnswered: quizResult.totalQuestions,
        totalQuestions: quizResult.totalQuestions,
      });

      toast({
        title: 'Proof generado',
        description: `Proof ZK generado exitosamente. Badge: ${proof.badgeLevel === 3 ? 'Gold' : proof.badgeLevel === 2 ? 'Silver' : 'Bronze'}`,
      });
    } catch (error: any) {
      console.error('Error generando proof:', error);
      toast({
        title: 'Advertencia',
        description: 'No se pudo generar el proof ZK, pero el cuestionario fue completado.',
        variant: 'default',
      });
    } finally {
      setIsGeneratingProof(false);
    }
  };

  /** Formato cronómetro: "0:00" o "12:34" (min:seg) */
  const formatStopwatch = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /** Formato para resultados: "2 min 15 s" */
  const formatTimeSpent = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} s`;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} s`;
  };

  const cardBase = 'bg-[#0a0a0a] border-2 rounded-2xl shadow-2xl text-white';
  const goldBorder = 'border-gold-500/50';
  const goldGlow = 'shadow-gold-500/20';

  if (isLoading) {
    return (
      <Card className={`${cardBase} ${goldBorder} ${goldGlow} shadow-xl`}>
        <CardContent className="pt-10 pb-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-gold-500/20 border-2 border-gold-500/50 flex items-center justify-center animate-pulse-glow">
            <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
          </div>
          <p className="mt-4 text-gray-200 font-semibold text-lg">Cargando cuestionario...</p>
          <p className="mt-1 text-sm text-gold-400/80">PumaPay</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card className={`${cardBase} border-red-500/50`}>
        <CardContent className="pt-8 pb-8 text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <p className="text-white font-semibold text-lg">No se pudo cargar el cuestionario.</p>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return (
      <Card className={`${cardBase} ${result.passed ? 'border-positive-500/60 shadow-positive-500/10' : 'border-red-500/60'} w-full max-w-full min-w-0 overflow-hidden`}>
        <CardHeader className={`rounded-t-2xl border-b-2 ${result.passed ? 'bg-positive-500/15 border-positive-500/40' : 'bg-red-500/15 border-red-500/40'} px-4 sm:px-6 py-4 sm:py-5 min-w-0`}>
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-bold text-white break-words min-w-0 flex-wrap">
            {result.passed ? (
              <span className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-positive-500/30 border border-positive-500/50 shrink-0">
                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-positive-400" />
              </span>
            ) : (
              <span className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/30 border border-red-500/50 shrink-0">
                <XCircle className="h-6 w-6 sm:h-7 sm:w-7 text-red-400" />
              </span>
            )}
            <span className="min-w-0">Resultados del Cuestionario</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-200 mt-2 break-words min-w-0">
            {result.passed
              ? '¡Felicidades! Has completado el curso exitosamente. 🎉'
              : 'No alcanzaste la puntuación mínima. Intenta de nuevo. 💪'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-6 min-w-0 overflow-hidden">
          <div className="bg-white/5 border-2 border-gold-500/30 rounded-xl p-4 sm:p-5 text-center min-w-0">
            <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text text-transparent break-words">
              {result.score}%
            </p>
            <p className="text-gray-200 font-semibold mt-1 text-sm sm:text-base break-words">
              {result.correctAnswers} de {result.totalQuestions} respuestas correctas
            </p>
            {result.timeSpentSeconds != null && (
              <p className="text-gold-300 font-medium mt-2 text-sm sm:text-base flex items-center justify-center gap-1.5">
                <Clock className="h-4 w-4 text-gold-400" />
                Lo resolviste en {formatTimeSpent(result.timeSpentSeconds)}
              </p>
            )}
          </div>

          {result.passed && result.badgeLevel && (
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-r from-gold-500/15 via-gold-400/10 to-gold-500/15 border-2 border-gold-500/50 rounded-xl animate-pulse-glow min-w-0">
              <Award className="h-8 w-8 sm:h-10 sm:w-10 text-gold-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-gold-300/90 text-xs sm:text-sm font-medium uppercase tracking-wide">Badge obtenido</p>
                <p className="font-bold text-base sm:text-lg text-white break-words">
                  {result.badgeLevel === 3 ? '🥇 Gold' : result.badgeLevel === 2 ? '🥈 Silver' : '🥉 Bronze'}
                </p>
              </div>
            </div>
          )}

          {isGeneratingProof && (
            <div className="flex items-center gap-3 p-4 sm:p-5 bg-gold-500/10 border border-gold-500/40 rounded-xl min-w-0">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-gold-400 shrink-0" />
              <p className="text-sm sm:text-base font-semibold text-gray-200 break-words">Generando proof ZK...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <Card className={`${cardBase} ${goldBorder} ${goldGlow} w-full max-w-full min-w-0 overflow-hidden`}>
      <CardHeader className="bg-gradient-to-r from-gold-500/10 via-gold-400/5 to-gold-500/10 border-b-2 border-gold-500/40 rounded-t-2xl px-3 sm:px-5 py-4 sm:py-5 min-w-0">
        <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base sm:text-xl font-bold text-white break-words min-w-0 flex-1">
            {quiz.title}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-gold-500/20 border-2 border-gold-500/50 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 shrink-0">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gold-400" />
            <span className="font-mono text-gold-200">{formatStopwatch(elapsedSeconds)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 sm:mt-3 text-xs sm:text-sm min-w-0">
          <CardDescription className="text-gold-300/90 font-medium truncate mr-2">
            Pregunta {currentQuestionIndex + 1} de {quiz.questions.length}
          </CardDescription>
          <span className="text-gold-400 font-bold shrink-0">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="mt-2 h-2.5 bg-gray-800 rounded-full overflow-hidden [&>*]:bg-gradient-to-r [&>*]:from-gold-600 [&>*]:to-gold-400 min-w-0" />
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5 p-3 sm:p-5 min-w-0 overflow-hidden">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-white bg-gold-500/10 border-2 border-gold-500/40 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 leading-snug break-words [overflow-wrap:anywhere]">
            {currentQuestion.question}
          </h3>
          <div className="space-y-2 sm:space-y-3 min-w-0">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? 'default' : 'outline'}
                className={`w-full min-w-0 justify-start text-left h-auto py-3 sm:py-3.5 px-3 sm:px-4 text-sm sm:text-base font-semibold transition-all rounded-xl overflow-hidden ${
                  selectedAnswer === index
                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-black border-2 border-gold-400 shadow-lg shadow-gold-500/40'
                    : 'bg-white/5 border-2 border-gray-600 text-white hover:text-white hover:bg-gold-500/10 hover:border-gold-500/50'
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="mr-2 sm:mr-3 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-500/30 border border-gold-500/50 text-gold-200 font-bold text-xs sm:text-sm shrink-0 flex-shrink-0">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 min-w-0 break-words text-left whitespace-normal overflow-hidden">
                  {option}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2 bg-gradient-to-r from-gold-500/10 via-gold-400/5 to-gold-500/10 border-t-2 border-gold-500/40 rounded-b-2xl p-3 sm:p-4 min-w-0">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="border-2 border-gray-600 bg-white/5 text-white hover:text-white hover:bg-gold-500/15 hover:border-gold-500/50 disabled:opacity-40 font-semibold px-3 sm:px-5 rounded-xl text-sm sm:text-base shrink-0"
        >
          ← Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedAnswer === null || isSubmitting}
          className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-bold shadow-lg shadow-gold-500/30 px-4 sm:px-6 rounded-xl text-sm sm:text-base shrink-0"
        >
          {currentQuestionIndex === quiz.questions.length - 1 ? '✓ Finalizar' : 'Siguiente →'}
        </Button>
      </CardFooter>
    </Card>
  );
};

