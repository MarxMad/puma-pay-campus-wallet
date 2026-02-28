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
              const color = getCategoryColor(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => navigate(`/courses/category/${slug}`)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 bg-zinc-900/80 hover:bg-zinc-800/80 transition-all text-left min-h-[100px] ${color.border} hover:opacity-90`}
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 bg-gradient-to-br ${color.bg} ${color.accent}`}>
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
              {trendingCourses.map((course) => {
                const color = getCategoryColor(course.category);
                const levelStyle = getLevelStyle(course.level);
                return (
                  <Card
                    key={course.id}
                    className={`bg-gradient-to-r from-slate-800 to-gray-900 border-2 p-5 hover:shadow-xl transition-all duration-300 text-white w-full cursor-pointer ${color.border}`}
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-gold-500 text-black text-xs font-bold shadow-lg">
                            🔥 Tendencia
                          </Badge>
                          <Badge className={`border text-xs ${levelStyle.className}`}>
                            {levelStyle.label}
                          </Badge>
                          <Badge className={`bg-black/50 border text-xs ${color.accent} ${color.border}`}>
                            {course.category}
                          </Badge>
                        </div>
                        <h4 className="text-xl font-bold text-white break-words">{course.title}</h4>
                        <p className="text-sm text-gray-200 break-words line-clamp-2">{course.description}</p>
                        <p className={`text-xs ${color.accent}`}>{course.instructor}</p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${course.id}`);
                        }}
                        className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-600 text-black font-bold shadow-lg w-full md:w-auto flex-shrink-0 whitespace-nowrap"
                      >
                        Ver guía →
                      </Button>
                    </div>
                  </Card>
                );
              })}
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

/** Color por categoría: borde, fondo del icono y acento para diferenciar cada área */
const CATEGORY_COLORS: Record<string, { border: string; bg: string; accent: string }> = {
  Economía: { border: "border-emerald-500/50", bg: "from-emerald-500/20 to-transparent", accent: "text-emerald-400" },
  Derecho: { border: "border-blue-500/50", bg: "from-blue-500/20 to-transparent", accent: "text-blue-400" },
  Filosofía: { border: "border-violet-500/50", bg: "from-violet-500/20 to-transparent", accent: "text-violet-400" },
  Odontología: { border: "border-cyan-500/50", bg: "from-cyan-500/20 to-transparent", accent: "text-cyan-400" },
  Medicina: { border: "border-rose-500/50", bg: "from-rose-500/20 to-transparent", accent: "text-rose-400" },
  Química: { border: "border-amber-500/50", bg: "from-amber-500/20 to-transparent", accent: "text-amber-400" },
  Ingeniería: { border: "border-orange-500/50", bg: "from-orange-500/20 to-transparent", accent: "text-orange-400" },
  Arquitectura: { border: "border-stone-400/50", bg: "from-stone-400/20 to-transparent", accent: "text-stone-300" },
  Contabilidad: { border: "border-lime-500/50", bg: "from-lime-500/20 to-transparent", accent: "text-lime-400" },
  Veterinaria: { border: "border-teal-500/50", bg: "from-teal-500/20 to-transparent", accent: "text-teal-400" },
  "Ciencias Políticas": { border: "border-indigo-500/50", bg: "from-indigo-500/20 to-transparent", accent: "text-indigo-400" },
};

/** Estilos por nivel de dificultad */
const LEVEL_STYLE: Record<string, { label: string; className: string }> = {
  Principiante: { label: "Fácil", className: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
  Intermedio: { label: "Intermedio", className: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
  Avanzado: { label: "Avanzado", className: "bg-rose-500/20 border-rose-500/40 text-rose-300" },
};

const defaultCategoryColor = { border: "border-gold-500/30", bg: "from-gold-500/15 to-transparent", accent: "text-gold-400" };

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? BookOpen;
}

export function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? defaultCategoryColor;
}

function getLevelStyle(level: Course["level"]) {
  return LEVEL_STYLE[level] ?? LEVEL_STYLE.Intermedio;
}

const CourseCard = ({ course }: { course: Course }) => {
  const navigate = useNavigate();
  const Icon = getCategoryIcon(course.category);
  const color = getCategoryColor(course.category);
  const levelStyle = getLevelStyle(course.level);
  return (
    <Card
      className={`min-w-[280px] bg-[#0a0a0a] border-2 overflow-hidden hover:shadow-xl transition-all duration-300 text-white cursor-pointer ${color.border}`}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className={`relative h-32 flex items-center justify-center bg-gradient-to-b ${color.bg} to-transparent border-b ${color.border}`}>
        <div className={`flex items-center justify-center w-20 h-20 rounded-2xl border-2 bg-gradient-to-br ${color.bg} ${color.accent} animate-float`}>
          <Icon className="w-10 h-10" strokeWidth={2} />
        </div>
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {course.featured && (
            <Badge className="bg-gold-500 text-black shadow-lg">⭐ Destacado</Badge>
          )}
          <Badge className={`border text-xs ${levelStyle.className}`}>{levelStyle.label}</Badge>
          <Badge className={`bg-black/70 backdrop-blur-sm border ${color.accent} ${color.border}`}>
            {course.category}
          </Badge>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <h4 className="text-lg font-bold line-clamp-2 text-white">{course.title}</h4>
        <p className={`text-xs font-medium ${color.accent}`}>{course.instructor}</p>
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

/** Tarjeta del carrusel de destacadas: color por categoría + nivel de dificultad */
const FeaturedSlideCard = ({ course }: { course: Course }) => {
  const navigate = useNavigate();
  const Icon = getCategoryIcon(course.category);
  const color = getCategoryColor(course.category);
  const levelStyle = getLevelStyle(course.level);
  const subtitle = [course.carrera, course.tema].filter(Boolean).join(" · ") || course.category;
  return (
    <Card
      className={`h-full bg-[#0a0a0a] border-2 hover:shadow-lg transition-all duration-300 text-white cursor-pointer overflow-hidden rounded-2xl ${color.border} hover:opacity-95`}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="p-4 flex flex-col h-full">
        <div className={`flex items-center justify-center w-16 h-16 rounded-2xl border-2 bg-gradient-to-br ${color.bg} ${color.accent} animate-float mx-auto mb-3`}>
          <Icon className="w-8 h-8" strokeWidth={2} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <Badge className={`w-fit border text-xs ${levelStyle.className}`}>
            {levelStyle.label}
          </Badge>
          <Badge className={`w-fit border text-xs bg-black/50 ${color.accent} ${color.border}`}>
            {course.category}
          </Badge>
        </div>
        <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-1">
          {course.tema ?? course.title}
        </h4>
        <p className="text-xs text-zinc-500 line-clamp-1 mb-3">{subtitle}</p>
        <p className={`text-xs font-medium mt-auto ${color.accent}`}>Ver guía →</p>
      </div>
    </Card>
  );
};

/** Tarjeta compacta para grid: color por categoría + nivel para diferenciar cada guía. Exportada para CategoryCourses. */
export const CourseGridCard = ({ course }: { course: Course }) => {
  const navigate = useNavigate();
  const Icon = getCategoryIcon(course.category);
  const color = getCategoryColor(course.category);
  const levelStyle = getLevelStyle(course.level);
  const temaLabel = course.tema ?? course.title;
  const carreraLabel = course.carrera ?? course.category;
  return (
    <Card
      className={`h-full min-h-0 flex flex-col bg-[#0a0a0a] border-2 hover:shadow-lg transition-all duration-300 text-white cursor-pointer overflow-hidden rounded-2xl ${color.border}`}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className={`relative h-20 sm:h-24 flex-shrink-0 flex items-center justify-center bg-gradient-to-b ${color.bg} to-transparent border-b ${color.border}`}>
        <div className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 bg-gradient-to-br ${color.bg} ${color.accent} animate-float`}>
          <Icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
        </div>
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
          <Badge className={`bg-black/70 backdrop-blur-sm border text-[10px] sm:text-xs px-1.5 py-0 max-w-[70%] truncate ${color.accent} ${color.border}`}>
            {course.category}
          </Badge>
          <div className="flex items-center gap-1 flex-shrink-0">
            {course.featured && (
              <Badge className="bg-gold-500 text-black text-[10px] px-1.5 py-0">⭐</Badge>
            )}
            <Badge className={`border text-[10px] px-1.5 py-0 ${levelStyle.className}`}>
              {levelStyle.label}
            </Badge>
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-h-0">
        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight mb-0.5">
          {temaLabel}
        </h4>
        <p className="text-[10px] sm:text-xs text-zinc-500 line-clamp-1 mb-1">{carreraLabel}</p>
        <p className={`text-[10px] mt-auto pt-1 font-medium ${color.accent}`}>Ver guía →</p>
      </div>
    </Card>
  );
};

const CourseRowCard = ({ course }: { course: Course }) => {
  const navigate = useNavigate();
  const Icon = getCategoryIcon(course.category);
  const color = getCategoryColor(course.category);
  const levelStyle = getLevelStyle(course.level);
  return (
    <Card
      className={`bg-[#0a0a0a] border-2 hover:shadow-xl transition-all duration-300 text-white w-full cursor-pointer ${color.border}`}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="p-5 space-y-4 md:space-y-0 md:flex md:items-center md:gap-5">
        <div className={`flex items-center justify-center w-full md:w-32 h-28 flex-shrink-0 rounded-2xl border-2 bg-gradient-to-br ${color.bg} ${color.border}`}>
          <div className={`flex items-center justify-center w-16 h-16 rounded-xl border bg-gradient-to-br ${color.bg} ${color.accent} animate-float`}>
            <Icon className="w-8 h-8" strokeWidth={2} />
          </div>
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`border text-xs ${levelStyle.className}`}>{levelStyle.label}</Badge>
            <Badge className={`bg-black/50 border text-xs ${color.accent} ${color.border}`}>
              {course.category}
            </Badge>
            {course.trending && (
              <Badge className="bg-gold-500 text-black text-xs">🔥 Trend</Badge>
            )}
          </div>
          <h4 className="text-xl font-bold text-white break-words">{course.title}</h4>
          <p className={`text-sm break-words ${color.accent}`}>{course.instructor}</p>
          <p className="text-sm text-gray-200 line-clamp-2 break-words">{course.description}</p>
          {course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {course.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} className={`border text-xs ${color.accent} ${color.border}`}>
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


