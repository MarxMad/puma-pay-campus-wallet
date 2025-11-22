import React, { useEffect, useState } from 'react';
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
  BookOpen,
  ListChecks,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QuizComponent } from '@/components/QuizComponent';
import { coursesService } from '@/services/coursesService';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { quizService, type QuizResult } from '@/services/quizService';
import { toast } from '@/hooks/use-toast';
import { BottomNav } from '@/components/BottomNav';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const { userPoints, getCourseProgress, refresh } = useCourseProgress();
  const [progress, setProgress] = useState<Awaited<ReturnType<typeof getCourseProgress>> | null>(null);

  const {
    data: courses = [],
    isLoading,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.listCourses,
  });

  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    if (!courseId) return;
    const load = async () => {
      const data = await getCourseProgress(courseId);
      setProgress(data);
    };
    load();
  }, [courseId, getCourseProgress]);

  const hasHighlights = course?.highlights && course.highlights.length > 0;

  const handleStartQuiz = () => {
    if (!courseId) return;
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
      if (courseId) {
        await refresh();
        const data = await getCourseProgress(courseId);
        setProgress(data);
      }
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
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 border-2 border-blue-400/40 p-2 sm:p-2.5">
              <img src="/PumaPay.png" alt="PumaPay" className="h-full w-full object-contain drop-shadow-lg rounded-2xl" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                PumaPay
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Detalle del Curso</p>
            </div>
          </div>
          <div className="w-8" aria-hidden />
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {!showQuiz ? (
          <>
            <Card className="bg-gradient-to-br from-gray-900 via-gray-900/90 to-gray-800 border border-white/10 shadow-2xl shadow-black/40">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-amber-300">
                      {course.category} • {course.level}
                    </p>
                    <CardTitle className="text-2xl text-white">{course.title}</CardTitle>
                    <CardDescription className="text-gray-200 mt-1">
                      {course.instructor}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-200 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-300" />
                    {course.rating.toFixed(1)} · {course.reviews} reseñas
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-100">
                <p className="text-gray-200">{course.description}</p>
                {hasHighlights && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.highlights!.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 p-3 rounded-xl bg-white/5"
                      >
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        <span className="text-gray-100">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {course.requirements && course.requirements.length > 0 && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <ListChecks className="h-4 w-4 text-gray-400" />
                      Requisitos sugeridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-300">
                    {course.requirements.map((req) => (
                      <div key={req} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {progress && progress.completed && (
                <Card className="bg-green-950/40 border border-green-500/40">
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-400" />
                      <span className="font-semibold text-green-200">
                        Curso completado
                      </span>
                    </div>
                    {progress.badgeLevel && (
                      <p className="text-sm text-gray-200">
                        Badge obtenido:{' '}
                        {progress.badgeLevel === 3
                          ? '🥇 Gold'
                          : progress.badgeLevel === 2
                          ? '🥈 Silver'
                          : '🥉 Bronze'}
                      </p>
                    )}
                    {progress.quizScore !== undefined && (
                      <p className="text-sm text-gray-200">
                        Puntuación: {progress.quizScore}%
                      </p>
                    )}
                    <p className="text-sm text-gray-200">
                      Puntos ganados: {progress.pointsEarned}
                    </p>
                  </CardContent>
                </Card>
              )}

              {userPoints && (
                <Card className="bg-blue-950/30 border border-blue-500/40">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm">Tus puntos</p>
                      <p className="text-3xl font-bold text-white">
                        {userPoints.totalPoints}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {userPoints.coursesCompleted} cursos completados
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-blue-200" />
                  </CardContent>
                </Card>
              )}
            </div>

            {course.syllabus && course.syllabus.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gray-300" />
                  Contenido del curso
                </h2>
                <Accordion type="single" collapsible className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
                  {course.syllabus.map((module, index) => (
                    <AccordionItem key={module.id} value={module.id} className="px-4">
                      <AccordionTrigger className="text-left text-white">
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Módulo {index + 1}</p>
                          <p className="text-base font-semibold">{module.title}</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-gray-400 mb-4">
                          {module.description}
                        </p>
                        <div className="space-y-3">
                          {module.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-800/60">
                              <div>
                                <p className="font-medium text-white">{lesson.title}</p>
                                <p className="text-sm text-gray-400">{lesson.description}</p>
                                {lesson.content && (
                                  <ul className="text-xs text-gray-500 mt-2 list-disc list-inside">
                                    {lesson.content.map((item) => (
                                      <li key={item}>{item}</li>
                                    ))}
                                  </ul>
                                )}
                                {lesson.resources && (
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                    {lesson.resources.map((resource) => (
                                      <a
                                        key={resource.label}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-1 bg-black/30 border border-white/10 rounded-full text-gray-200 hover:text-white"
                                      >
                                        {resource.label}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {lesson.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            <Button
              onClick={handleStartQuiz}
              className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
              size="lg"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              {progress?.completed ? 'Revisar cuestionario' : 'Resolver cuestionario'}
            </Button>
          </>
        ) : (
          <>
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
                Volver al curso
              </Button>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

