import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  PlayCircle,
  Award,
  Sparkles,
  BookOpen,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizComponent } from '@/components/QuizComponent';
import { coursesService } from '@/services/coursesService';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { quizService, type QuizResult } from '@/services/quizService';
import { toast } from '@/hooks/use-toast';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getCategoryIcon } from '@/pages/Courses';

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
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p>Cargando guía...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Guía no encontrada</p>
          <Button onClick={() => navigate('/courses')}>Volver a Guías</Button>
        </div>
      </div>
    );
  }

  const Icon = getCategoryIcon(course.category);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden w-full max-w-full">
      <AppHeader
        leftAction={<ArrowLeft className={headerIconClass} />}
        onLeftAction={() => (showQuiz ? setShowQuiz(false) : navigate('/courses'))}
        subtitle="Guía"
      />

      <main className="px-4 py-5 space-y-6 overflow-x-hidden min-w-0">
        {!showQuiz ? (
          <>
            {/* Hero: icono + título + categoría */}
            <div className="flex flex-col items-center text-center pt-2 pb-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gold-500/15 border-2 border-gold-500/40 text-gold-400 mb-4 animate-float">
                <Icon className="w-10 h-10" strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-gold-400 uppercase tracking-wider mb-1">
                {course.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
                {course.title}
              </h1>
              <p className="text-gray-400 text-sm">{course.instructor}</p>
            </div>

            {/* Descripción corta */}
            <p className="text-gray-300 text-center text-sm leading-relaxed max-w-lg mx-auto">
              {course.description}
            </p>

            {/* Highlights en una fila compacta */}
            {hasHighlights && (
              <div className="flex flex-wrap justify-center gap-2">
                {course.highlights!.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-gold-500/20 text-gray-200 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-gold-400 flex-shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            )}

            {/* Progreso + puntos en una sola barra */}
            <div className="flex flex-wrap gap-3 justify-center">
              {progress?.completed && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-positive-500/15 border border-positive-500/40">
                  <Award className="h-5 w-5 text-positive-400" />
                  <span className="text-sm font-semibold text-positive-200">
                    Completado · {progress.badgeLevel === 3 ? '🥇' : progress.badgeLevel === 2 ? '🥈' : '🥉'} {progress.quizScore}% · +{progress.pointsEarned} pts
                  </span>
                </div>
              )}
              {userPoints && !progress?.completed && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/10 border border-gold-500/30">
                  <span className="text-sm text-gold-300">{userPoints.totalPoints} pts</span>
                  <span className="text-xs text-gray-400">· {userPoints.coursesCompleted} guías</span>
                </div>
              )}
            </div>

            {/* Requisitos: lista mínima */}
            {course.requirements && course.requirements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Requisitos sugeridos</p>
                <ul className="space-y-1.5">
                  {course.requirements.map((req) => (
                    <li key={req} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle className="h-4 w-4 text-positive-500/80 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contenido de la guía */}
            {course.syllabus && course.syllabus.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gold-400" />
                  Contenido
                </h2>
                <Accordion type="single" collapsible className="rounded-2xl border border-gold-500/20 bg-black/30 overflow-hidden">
                  {course.syllabus.map((module, index) => (
                    <AccordionItem key={module.id} value={module.id} className="border-b border-white/5 last:border-0">
                      <AccordionTrigger className="px-4 py-3 text-left text-white hover:bg-white/5 hover:text-white hover:no-underline">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gold-400/80 font-medium">M{index + 1}</span>
                          <span className="font-medium">{module.title}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-500 shrink-0 transition-transform" />
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-0">
                        <p className="text-sm text-gray-400 mb-4">{module.description}</p>
                        <div className="space-y-2">
                          {module.lessons.map((lesson) => (
                            <div key={lesson.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                              <p className="font-medium text-white text-sm">{lesson.title}</p>
                              {lesson.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{lesson.description}</p>
                              )}
                              {lesson.resources && lesson.resources.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {lesson.resources.map((resource) => (
                                    <a
                                      key={resource.label}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs px-2 py-1 rounded-lg bg-gold-500/15 border border-gold-500/30 text-gold-300 hover:text-gold-300 hover:bg-gold-500/25"
                                    >
                                      {resource.label}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {/* CTA principal */}
            <div className="pt-2 pb-4">
              <Button
                onClick={handleStartQuiz}
                className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-bold py-6 rounded-xl shadow-lg shadow-gold-500/20 border-0"
                size="lg"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                {progress?.completed ? 'Ver de nuevo el cuestionario' : 'Resolver cuestionario'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 min-w-0 max-w-full">
              <p className="text-center text-gray-400 text-sm">
                {course.title}
              </p>
              <div className="min-w-0 max-w-full">
                {courseId && (
                  <QuizComponent
                    courseId={courseId}
                    onComplete={handleQuizComplete}
                  />
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowQuiz(false)}
                className="w-full border-gold-500/40 text-gold-300 hover:text-gold-300 hover:bg-gold-500/10 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la guía
              </Button>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

