import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  Star,
  PlayCircle,
  Award,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QuizComponent } from '@/components/QuizComponent';
import { coursesService } from '@/services/coursesService';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { quizService, type QuizResult } from '@/services/quizService';
import { toast } from '@/hooks/use-toast';
import { BottomNav } from '@/components/BottomNav';

export const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const { userPoints, getCourseProgress } = useCourseProgress();

  const {
    data: courses = [],
    isLoading,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.listCourses,
  });

  const course = courses.find((c) => c.id === courseId);
  const progress = courseId ? getCourseProgress(courseId) : null;

  const handleStartQuiz = () => {
    if (!courseId) return;

    // Verificar si ya completó el cuestionario
    const existingResult = quizService.getQuizResult(courseId);
    if (existingResult?.passed) {
      toast({
        title: 'Cuestionario ya completado',
        description: 'Ya has completado este cuestionario exitosamente.',
      });
      return;
    }

    setShowQuiz(true);
  };

  const handleQuizComplete = async (result: QuizResult, proofGenerated: boolean) => {
    if (result.passed) {
      toast({
        title: '¡Felicidades!',
        description: `Has completado el curso con un ${result.score}%. ${proofGenerated ? 'Proof ZK generado exitosamente.' : ''}`,
      });
    } else {
      toast({
        title: 'Intenta de nuevo',
        description: `Obtuviste ${result.score}%. Necesitas al menos 70% para pasar.`,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Cargando curso...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Curso no encontrado</p>
          <Button onClick={() => navigate('/courses')}>Volver a Cursos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white"
            onClick={() => navigate('/courses')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Detalle del Curso</h1>
          <div className="w-8" aria-hidden />
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {!showQuiz ? (
          <>
            {/* Información del curso */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {course.instructor} • {course.level}
                    </CardDescription>
                  </div>
                  <Badge className="bg-amber-500/20 border-amber-400 text-amber-100">
                    {course.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{course.description}</p>

                <Separator className="bg-gray-800" />

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span className="text-gray-300">
                      {course.rating.toFixed(1)} ({course.reviews} reseñas)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-400" />
                    <span className="text-gray-300">
                      {course.priceMXNB} MXNB
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-gray-700 text-gray-200"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {/* Progreso del curso */}
                {progress && progress.completed && (
                  <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-green-400" />
                      <span className="font-semibold text-green-300">
                        Curso Completado
                      </span>
                    </div>
                    {progress.badgeLevel && (
                      <p className="text-sm text-gray-300">
                        Badge obtenido:{' '}
                        {progress.badgeLevel === 3
                          ? '🥇 Gold'
                          : progress.badgeLevel === 2
                          ? '🥈 Silver'
                          : '🥉 Bronze'}
                      </p>
                    )}
                    {progress.quizScore !== undefined && (
                      <p className="text-sm text-gray-300">
                        Puntuación: {progress.quizScore}%
                      </p>
                    )}
                    <p className="text-sm text-gray-300">
                      Puntos ganados: {progress.pointsEarned}
                    </p>
                  </div>
                )}

                {/* Puntos del usuario */}
                {userPoints && (
                  <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-400" />
                        <span className="font-semibold text-blue-300">
                          Tus Puntos
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-blue-200">
                        {userPoints.totalPoints}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-2">
                      {userPoints.coursesCompleted} cursos completados
                    </p>
                  </div>
                )}

                {/* Botón para iniciar cuestionario */}
                <Button
                  onClick={handleStartQuiz}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
                  size="lg"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  {progress?.completed
                    ? 'Ver Cuestionario Completado'
                    : 'Iniciar Cuestionario'}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Componente de cuestionario */}
            <div className="space-y-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    Cuestionario: {course.title}
                  </CardTitle>
                  <CardDescription>
                    Completa el cuestionario para obtener tu badge y puntos
                  </CardDescription>
                </CardHeader>
              </Card>

              {courseId && (
                <QuizComponent
                  courseId={courseId}
                  onComplete={handleQuizComplete}
                />
              )}

              <Button
                variant="outline"
                onClick={() => setShowQuiz(false)}
                className="w-full"
              >
                Volver al Curso
              </Button>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

