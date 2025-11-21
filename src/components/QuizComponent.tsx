import React, { useState, useEffect } from 'react';
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
  type QuizQuestion,
  type QuizAnswer,
  type QuizResult,
} from '@/services/quizService';
import { zkCourseProofService } from '@/services/zkCourseProofService';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { Loader2, CheckCircle2, XCircle, Sparkles, Award, Clock } from 'lucide-react';
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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [courseId]);

  useEffect(() => {
    if (quiz?.timeLimit && !result) {
      setTimeRemaining(quiz.timeLimit * 60); // Convertir minutos a segundos
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            if (prev === 0) {
              handleSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quiz, result]);

  const loadQuiz = async () => {
    setIsLoading(true);
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

    setIsSubmitting(true);
    try {
      const finalAnswersToUse = finalAnswers || answers;
      const quizResult = await quizService.submitQuiz(courseId, finalAnswersToUse);
      setResult(quizResult);

      // Registrar completitud en gamificación
      if (quizResult.passed && quizResult.badgeLevel) {
        await recordCompletion(courseId, quizResult.score, quizResult.badgeLevel);
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando cuestionario...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No se pudo cargar el cuestionario.</p>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    // Mostrar resultados
    return (
      <Card className={result.passed ? 'border-green-500' : 'border-red-500'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.passed ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            Resultados del Cuestionario
          </CardTitle>
          <CardDescription>
            {result.passed
              ? '¡Felicidades! Has completado el curso.'
              : 'No alcanzaste la puntuación mínima. Intenta de nuevo.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-2xl font-bold">
              {result.score}% ({result.correctAnswers}/{result.totalQuestions})
            </p>
            <p className="text-sm text-muted-foreground">
              Respuestas correctas
            </p>
          </div>

          {result.passed && result.badgeLevel && (
            <div className="flex items-center gap-2 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-medium">
                  Badge obtenido:{' '}
                  {result.badgeLevel === 3
                    ? '🥇 Gold'
                    : result.badgeLevel === 2
                    ? '🥈 Silver'
                    : '🥉 Bronze'}
                </p>
              </div>
            </div>
          )}

          {isGeneratingProof && (
            <div className="flex items-center gap-2 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-sm">Generando proof ZK...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{quiz.title}</CardTitle>
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        <CardDescription>
          Pregunta {currentQuestionIndex + 1} de {quiz.questions.length}
        </CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {currentQuestion.question}
          </h3>
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? 'default' : 'outline'}
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="mr-2 font-bold">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedAnswer === null || isSubmitting}
        >
          {currentQuestionIndex === quiz.questions.length - 1
            ? 'Finalizar'
            : 'Siguiente'}
        </Button>
      </CardFooter>
    </Card>
  );
};

