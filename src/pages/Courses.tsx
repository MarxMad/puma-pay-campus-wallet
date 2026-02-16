import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Sparkles,
  Star,
  BookOpen,
  TrendingUp,
  Scale,
  Brain,
  Smile,
  HeartPulse,
  FlaskConical,
  Cog,
  Building2,
  Calculator,
  Landmark,
  Dog,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader, headerIconClass } from "@/components/AppHeader";
import { coursesService } from "@/services/coursesService";
import { getCategorySlugFromName } from "@/data/guiasEstudio";
import type { Course } from "@/types/courses";

const CoursesPage = () => {
  const navigate = useNavigate();

  const {
    data: courses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesService.listCourses,
  });

  /** Destacadas: una guía por categoría para que el carrusel muestre variedad (se deslizan a la izquierda) */
  const featuredByCategory = useMemo(() => {
    const featured = courses.filter((c) => c.featured);
    const byCategory = new Map<string, Course>();
    featured.forEach((course) => {
      if (!byCategory.has(course.category)) {
        byCategory.set(course.category, course);
      }
    });
    return Array.from(byCategory.values());
  }, [courses]);

  /** Categorías con conteo para "Explorar por área"; al tocar navegan a la página de la categoría */
  const categoriesWithCount = useMemo(() => {
    const map = new Map<string, number>();
    courses.forEach((c) => map.set(c.category, (map.get(c.category) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  /** Tendencias: solo 3 guías, una por categoría (Economía, Filosofía, Ingeniería) */
  const trendingCourses = useMemo(() => {
    const categories = ["Economía", "Filosofía", "Ingeniería"];
    return categories
      .map((cat) => courses.find((c) => c.category === cat))
      .filter((c): c is Course => c != null);
  }, [courses]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 text-white overflow-x-hidden w-full max-w-full">
      <AppHeader
        leftAction={<ArrowLeft className={headerIconClass} />}
        onLeftAction={() => navigate(-1)}
        subtitle="Guías de estudio"
      />

      <main className="px-4 space-y-8">
        {/* Hero corto: invitación a explorar */}
        <section className="mt-4 rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 to-transparent p-5">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            ¿Qué quieres repasar hoy?
          </h2>
          <p className="text-sm text-zinc-400">
            Elige un área, resuelve el cuestionario y suma puntos.
          </p>
        </section>

        {/* Explorar por área: cards que navegan a la página de cada categoría */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Compass className="h-5 w-5 text-gold-400" />
            Explorar por área
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {categoriesWithCount.map(({ name, count }) => {
              const Icon = getCategoryIcon(name);
              const slug = getCategorySlugFromName(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => navigate(`/courses/category/${slug}`)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-zinc-700 bg-zinc-900/80 hover:border-gold-500/40 hover:bg-zinc-800/80 transition-all text-left min-h-[100px]"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl border-2 bg-zinc-800 border-zinc-600 text-zinc-400">
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-semibold line-clamp-1 w-full text-center text-zinc-300">
                    {name}
                  </span>
                  <span className="text-xs text-zinc-500">{count} guías</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="h-6 w-6 text-gold-400 fill-gold-400" />
              Guías destacadas
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-gold-400 hover:text-gold-400 hover:bg-gold-500/10"
              onClick={() => refetch()}
            >
              Actualizar
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
            {isLoading && (
              <>
                {[0, 1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="min-w-[260px] sm:min-w-[280px] flex-shrink-0 snap-start rounded-2xl bg-gray-800/80 animate-pulse h-40"
                  />
                ))}
              </>
            )}
            {!isLoading &&
              featuredByCategory.map((course) => (
                <div key={course.id} className="min-w-[260px] sm:min-w-[280px] flex-shrink-0 snap-start">
                  <FeaturedSlideCard course={course} />
                </div>
              ))}
            {!isLoading && featuredByCategory.length === 0 && (
              <p className="text-gray-400 text-sm py-4 px-1">
                Pronto añadiremos más guías destacadas.
              </p>
            )}
          </div>
        </section>

        {trendingCourses.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-gold-400" />
              <h3 className="text-2xl font-bold text-white">🔥 Tendencias del Campus</h3>
            </div>
            <div className="space-y-3">
              {trendingCourses.map((course) => (
                <Card
                  key={course.id}
                  className="bg-gradient-to-r from-slate-800 to-gray-900 border-2 border-gold-500/40 p-5 hover:border-gold-500/80 hover:shadow-xl hover:shadow-gold-500/20 transition-all duration-300 text-white w-full cursor-pointer"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-gold-500 text-white text-xs font-bold shadow-lg">
                          🔥 Tendencia
                        </Badge>
                        <Badge className="bg-gold-500/20 border-gold-500/30 text-gold-400 text-xs">
                          {course.category}
                        </Badge>
                      </div>
                      <h4 className="text-xl font-bold text-white break-words">{course.title}</h4>
                      <p className="text-sm text-gray-200 break-words line-clamp-2">{course.description}</p>
                      <p className="text-xs text-gold-400">{course.instructor}</p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course.id}`);
                      }}
                      className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-600 text-white font-bold shadow-lg w-full md:w-auto flex-shrink-0 whitespace-nowrap"
                    >
                      Ver guía →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

/** Icono animado por categoría (tema) de la guía */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Economía: TrendingUp,
  Derecho: Scale,
  Filosofía: Brain,
  Odontología: Smile,
  Medicina: HeartPulse,
  Química: FlaskConical,
  Ingeniería: Cog,
  Arquitectura: Building2,
  Contabilidad: Calculator,
  Veterinaria: Dog,
  "Ciencias Políticas": Landmark,
};

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? BookOpen;
}

const CourseCard = ({ course }: { course: Course }) => {
  const navigate = useNavigate();
  const Icon = getCategoryIcon(course.category);
  return (
    <Card
      className="min-w-[280px] bg-[#0a0a0a] border-2 border-gold-500/20 overflow-hidden hover:border-gold-500/40 hover:shadow-xl hover:shadow-gold-500/20 transition-all duration-300 text-white cursor-pointer"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="relative h-32 flex items-center justify-center bg-gradient-to-b from-gold-500/15 to-transparent border-b border-gold-500/20">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gold-500/20 border-2 border-gold-500/40 text-gold-400 animate-float">
          <Icon className="w-10 h-10" strokeWidth={2} />
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          {course.featured && (
            <Badge className="bg-gold-500 text-black shadow-lg">⭐ Destacado</Badge>
          )}
          <Badge className="bg-black/70 backdrop-blur-sm border border-gold-500/40 text-gold-300">
            {course.category}
          </Badge>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <h4 className="text-lg font-bold line-clamp-2 text-white">{course.title}</h4>
        <p className="text-xs text-gold-400 font-medium">{course.instructor}</p>
        <p className="text-sm text-gray-200 line-clamp-2">{course.description}</p>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/courses/${course.id}`);
          }}
          className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 text-black font-bold shadow-lg"
        >
          Ver guía →
        </Button>
      </div>
    </Card>
  );
};

/** Tarjeta del carrusel de destacadas: icono animado, una por categoría, se desliza a la izquierda */
const FeaturedSlideCard = ({ course }: { course: Course }) => {
  const navigate = useNavigate();
  const Icon = getCategoryIcon(course.category);
  const subtitle = [course.carrera, course.tema].filter(Boolean).join(" · ") || course.category;
  return (
    <Card
      className="h-full bg-[#0a0a0a] border-2 border-gold-500/20 hover:border-gold-500/40 hover:shadow-lg hover:shadow-gold-500/20 transition-all duration-300 text-white cursor-pointer overflow-hidden rounded-2xl"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/20 border-2 border-gold-500/40 text-gold-400 animate-float mx-auto mb-3">
          <Icon className="w-8 h-8" strokeWidth={2} />
        </div>
        <Badge className="w-fit bg-gold-500/20 border border-gold-500/40 text-gold-300 text-xs mb-2">
          {course.category}
        </Badge>
        <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-1">
          {course.tema ?? course.title}
        </h4>
        <p className="text-xs text-zinc-500 line-clamp-1 mb-3">{subtitle}</p>
        <p className="text-xs text-gold-400/90 font-medium mt-auto">Ver guía →</p>
      </div>
    </Card>
  );
};

/** Tarjeta compacta para grid: icono, tema y carrera visibles para explorar mejor. Exportada para CategoryCourses. */
export const CourseGridCard = ({ course }: { course: Course }) => {
  const navigate = useNavigate();
  const Icon = getCategoryIcon(course.category);
  const temaLabel = course.tema ?? course.title;
  const carreraLabel = course.carrera ?? course.category;
  return (
    <Card
      className="h-full min-h-0 flex flex-col bg-[#0a0a0a] border-2 border-gold-500/20 hover:border-gold-500/40 hover:shadow-lg hover:shadow-gold-500/20 transition-all duration-300 text-white cursor-pointer overflow-hidden rounded-2xl"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="relative h-20 sm:h-24 flex-shrink-0 flex items-center justify-center bg-gradient-to-b from-gold-500/15 to-transparent border-b border-gold-500/20">
        <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gold-500/20 border-2 border-gold-500/40 text-gold-400 animate-float">
          <Icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
        </div>
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
          <Badge className="bg-black/70 backdrop-blur-sm border border-gold-500/40 text-gold-300 text-[10px] sm:text-xs px-1.5 py-0 max-w-[70%] truncate">
            {course.category}
          </Badge>
          {course.featured && (
            <Badge className="bg-gold-500 text-black text-[10px] px-1.5 py-0 flex-shrink-0">⭐</Badge>
          )}
        </div>
      </div>
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-h-0">
        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight mb-0.5">
          {temaLabel}
        </h4>
        <p className="text-[10px] sm:text-xs text-zinc-500 line-clamp-1 mb-1">{carreraLabel}</p>
        <p className="text-[10px] text-gold-400/90 mt-auto pt-1 font-medium">Ver guía →</p>
      </div>
    </Card>
  );
};

const CourseRowCard = ({ course }: { course: Course }) => {
  const navigate = useNavigate();
  const Icon = getCategoryIcon(course.category);
  return (
    <Card
      className="bg-[#0a0a0a] border-2 border-gold-500/20 hover:border-gold-500/40 hover:shadow-xl hover:shadow-gold-500/20 transition-all duration-300 text-white w-full cursor-pointer"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="p-5 space-y-4 md:space-y-0 md:flex md:items-center md:gap-5">
        <div className="flex items-center justify-center w-full md:w-32 h-28 flex-shrink-0 rounded-2xl bg-gold-500/10 border-2 border-gold-500/30">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gold-500/20 border border-gold-500/40 text-gold-400 animate-float">
            <Icon className="w-8 h-8" strokeWidth={2} />
          </div>
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-gold-500/20 text-gold-400 border-gold-500/30 text-xs">
              {course.category}
            </Badge>
            {course.trending && (
              <Badge className="bg-gold-500 text-black text-xs">🔥 Trend</Badge>
            )}
          </div>
          <h4 className="text-xl font-bold text-white break-words">{course.title}</h4>
          <p className="text-sm text-gray-400 break-words">{course.instructor}</p>
          <p className="text-sm text-gray-200 line-clamp-2 break-words">{course.description}</p>
          {course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {course.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} className="bg-gold-500/20 text-gold-400 border-gold-500/30 text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/courses/${course.id}`);
          }}
          className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 text-black font-bold shadow-lg w-full md:w-auto"
        >
          Ver guía →
        </Button>
      </div>
    </Card>
  );
};

export default CoursesPage;


