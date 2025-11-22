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
      <Card className="bg-gradient-to-br from-slate-900 to-gray-900 border-2 border-orange-500/40 text-white">
        <CardContent className="pt-8 pb-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-orange-400" />
          <p className="mt-4 text-white font-semibold text-lg">Cargando cuestionario...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-gray-900 border-2 border-red-500/50 text-white">
        <CardContent className="pt-8 pb-8 text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <p className="text-white font-semibold text-lg">No se pudo cargar el cuestionario.</p>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    // Mostrar resultados
    return (
      <Card className={`bg-gradient-to-br from-slate-900 to-gray-900 border-2 ${result.passed ? 'border-green-500/80' : 'border-red-500/80'} text-white shadow-2xl`}>
        <CardHeader className={`${result.passed ? 'bg-green-500/20' : 'bg-red-500/20'} border-b ${result.passed ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-white">
            {result.passed ? (
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            ) : (
              <XCircle className="h-8 w-8 text-red-400" />
            )}
            Resultados del Cuestionario
          </CardTitle>
          <CardDescription className="text-base text-gray-200 mt-2">
            {result.passed
              ? '¡Felicidades! Has completado el curso exitosamente. 🎉'
              : 'No alcanzaste la puntuación mínima. Intenta de nuevo. 💪'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="bg-gray-800/80 border-2 border-white/20 rounded-xl p-5">
            <p className="text-4xl font-bold text-white mb-2">
              {result.score}% 
            </p>
            <p className="text-lg text-gray-200 font-semibold">
              {result.correctAnswers} de {result.totalQuestions} respuestas correctas
            </p>
          </div>

          {result.passed && result.badgeLevel && (
            <div className="flex items-center gap-3 p-5 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/50 rounded-xl">
              <Award className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="font-bold text-lg text-white">
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
            <div className="flex items-center gap-3 p-5 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-2 border-blue-500/50 rounded-xl">
              <Loader2 className="h-6 w-6 animate-spin text-blue-300" />
              <p className="text-base font-semibold text-white">Generando proof ZK...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-gray-900 border-2 border-orange-500/40 text-white shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-b border-orange-500/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-white">{quiz.title}</CardTitle>
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 text-base font-bold bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2">
              <Clock className="h-5 w-5 text-red-400" />
              <span className="font-mono text-red-300">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        <CardDescription className="text-gray-200 text-base mt-2">
          Pregunta {currentQuestionIndex + 1} de {quiz.questions.length}
        </CardDescription>
        <Progress value={progress} className="mt-3 bg-gray-700 h-3" />
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div>
          <h3 className="text-xl font-bold mb-6 text-white bg-gray-800/50 p-4 rounded-lg border border-orange-500/30">
            {currentQuestion.question}
          </h3>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? 'default' : 'outline'}
                className={`w-full justify-start text-left h-auto py-4 text-base font-semibold transition-all ${
                  selectedAnswer === index
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-2 border-orange-400 shadow-lg shadow-orange-500/50'
                    : 'bg-gray-800/80 border-2 border-gray-600 text-white hover:bg-gray-700 hover:border-orange-500/50'
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="mr-3 font-bold text-lg bg-white/20 px-2 py-1 rounded">{String.fromCharCode(65 + index)}</span>
                <span className="flex-1">{option}</span>
              </Button>
              ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-t border-orange-500/30 p-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="border-2 border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-orange-500/50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold px-6"
        >
          ← Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedAnswer === null || isSubmitting}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg px-8 disabled:opacity-50"
        >
          {currentQuestionIndex === quiz.questions.length - 1
            ? '✓ Finalizar'
            : 'Siguiente →'}
        </Button>
      </CardFooter>
    </Card>
  );
};

