import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  GraduationCap,
  PlayCircle,
  Clock,
  Sparkles,
  Search,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { BottomNav } from "@/components/BottomNav";
import { coursesService } from "@/services/coursesService";
import type { Course } from "@/types/courses";

const levelFilters: Array<{
  id: "todos" | Course["level"];
  label: string;
}> = [
  { id: "todos", label: "Todos los niveles" },
  { id: "Principiante", label: "Principiante" },
  { id: "Intermedio", label: "Intermedio" },
  { id: "Avanzado", label: "Avanzado" },
];

const CoursesPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [selectedLevel, setSelectedLevel] =
    useState<(typeof levelFilters)[number]["id"]>("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: courses = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesService.listCourses,
  });

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    courses.forEach((course) => categorySet.add(course.category));
    return ["todos", ...Array.from(categorySet)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesCategory =
        selectedCategory === "todos" || course.category === selectedCategory;
      const matchesLevel =
        selectedLevel === "todos" || course.level === selectedLevel;
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return matchesCategory && matchesLevel && matchesSearch;
    });
  }, [courses, selectedCategory, selectedLevel, searchTerm]);

  const featuredCourses = useMemo(
    () => courses.filter((course) => course.featured),
    [courses]
  );

  const trendingCourses = useMemo(
    () => courses.filter((course) => course.trending),
    [courses]
  );

  return (
    <div className="min-h-screen bg-gray-950 pb-20 text-white">
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white"
            onClick={() => navigate(-1)}
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
              <p className="text-xs text-gray-400 hidden sm:block">Cursos</p>
            </div>
          </div>
          <div className="w-8" aria-hidden />
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Busca temas, habilidades o instructores"
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
        </div>
      </header>

      <main className="px-4 space-y-8">
        <section className="mt-4 bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-yellow-500/20 border-2 border-blue-500/40 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-12 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -left-10 bottom-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="relative z-10">
            <div className="flex items-center space-x-2 text-blue-200 font-bold text-sm mb-2">
              <Sparkles className="h-5 w-5 text-blue-300" />
              <span>✨ Aprende gratis desde tu móvil</span>
            </div>
            <h2 className="text-3xl font-bold mt-2 mb-3 text-white drop-shadow-lg">
              Conviértete en experto desde el campus
            </h2>
            <p className="text-gray-100 text-base leading-relaxed">
              Contenido premium con módulos cortos, recursos descargables
              y cuestionarios gamificados. ¡Aprende mientras ganas puntos!
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              {featuredCourses.slice(0, 3).map((course) => (
                <Badge
                  key={course.id}
                  className="bg-white/20 backdrop-blur-sm border border-blue-300/50 text-white font-semibold px-4 py-1.5"
                >
                  {course.category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              Cursos Destacados
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
              onClick={() => refetch()}
            >
              Actualizar
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {isLoading && (
              <div className="grid grid-cols-1 gap-4 w-full">
                {[0, 1, 2].map((item) => (
                  <Card
                    key={item}
                    className="min-w-[260px] bg-gray-900 border-gray-800 animate-pulse"
                  >
                    <div className="h-40 rounded-t-2xl bg-gray-800" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-800 rounded" />
                      <div className="h-3 bg-gray-800 rounded w-2/3" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {!isLoading &&
              featuredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                />
              ))}
            {!isLoading && featuredCourses.length === 0 && (
              <p className="text-gray-400 text-sm">
                Pronto añadiremos más cursos destacados.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filtra por categoría</h3>
          </div>
          <Tabs
            value={selectedCategory}
            className="space-y-4"
            onValueChange={setSelectedCategory}
          >
            <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
              <TabsList className="bg-gray-900 border border-gray-800 inline-flex min-w-full sm:min-w-0 sm:w-auto">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="capitalize whitespace-nowrap flex-shrink-0"
                  >
                    {category === "todos" ? "Todas" : category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value={selectedCategory} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {levelFilters.map((level) => (
                  <Button
                    key={level.id}
                    variant={
                      level.id === selectedLevel ? "default" : "secondary"
                    }
                    size="sm"
                    className={
                      level.id === selectedLevel
                        ? "bg-blue-500 hover:bg-blue-600 border-none whitespace-nowrap"
                        : "bg-gray-900 border border-gray-800 text-gray-300 whitespace-nowrap"
                    }
                    onClick={() => setSelectedLevel(level.id)}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>

              <Separator className="bg-gray-800" />

              {isError && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/40 rounded-xl">
                  <p className="text-blue-200 text-sm">
                    No se pudieron cargar los cursos. Intenta nuevamente.
                  </p>
                </div>
              )}

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                {filteredCourses.map((course) => (
                  <CourseRowCard
                    key={course.id}
                    course={course}
                  />
                ))}
              </div>

              {!isLoading && filteredCourses.length === 0 && (
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl text-center text-gray-400 text-sm">
                  No encontramos cursos con esos filtros. Prueba otra categoría
                  o busca por palabra clave.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {trendingCourses.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <h3 className="text-2xl font-bold text-white">🔥 Tendencias del Campus</h3>
            </div>
            <div className="space-y-3">
              {trendingCourses.map((course) => (
                <Card
                  key={course.id}
                  className="bg-gradient-to-r from-slate-800 to-gray-900 border-2 border-yellow-500/40 p-5 hover:border-yellow-500/80 hover:shadow-xl hover:shadow-yellow-500/20 transition-all duration-300 text-white w-full cursor-pointer"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-yellow-500 text-white text-xs font-bold shadow-lg">
                          🔥 Tendencia
                        </Badge>
                        <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-300 text-xs">
                          {course.category}
                        </Badge>
                      </div>
                      <h4 className="text-xl font-bold text-white break-words">{course.title}</h4>
                      <p className="text-sm text-gray-200 break-words line-clamp-2">{course.description}</p>
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <span className="flex items-center gap-1 text-gray-300 bg-gray-800/50 px-3 py-1 rounded-full">
                          <Clock className="h-4 w-4" />
                          {course.duration}
                        </span>
                        <span className="text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full">{course.level}</span>
                        <span className="flex items-center gap-1 text-yellow-400 font-semibold bg-yellow-500/10 px-3 py-1 rounded-full">
                          <Star className="h-4 w-4 fill-yellow-400" />
                          {course.rating.toFixed(1)} · {course.reviews} reseñas
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course.id}`);
                      }}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold shadow-lg w-full md:w-auto flex-shrink-0 whitespace-nowrap"
                    >
                      Ver curso →
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

// Imágenes hardcodeadas para los cursos
const getCourseImage = (category: string, id: string): string => {
  const imageMap: Record<string, string> = {
    'Programación': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop',
    'Diseño': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
    'Marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    'Negocios': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    'Data Science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    'Finanzas': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
  };
  return imageMap[category] || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop';
};

const CourseCard = ({
  course,
}: {
  course: Course;
}) => {
  const navigate = useNavigate();
  
  return (
  <Card className="min-w-[280px] bg-gradient-to-br from-slate-800 to-gray-900 border border-blue-500/30 overflow-hidden hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 text-white cursor-pointer" onClick={() => navigate(`/courses/${course.id}`)}>
    <div className="relative h-48">
      <img
        src={getCourseImage(course.category, course.id)}
        alt={course.title}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
      <div className="absolute top-3 left-3 flex gap-2">
        {course.featured && (
          <Badge className="bg-yellow-500 text-white shadow-lg">⭐ Destacado</Badge>
        )}
        <Badge className="bg-black/70 backdrop-blur-sm border border-white/30 text-white">
          {course.category}
        </Badge>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <h4 className="text-xl font-bold line-clamp-2 text-white drop-shadow-lg">{course.title}</h4>
      </div>
    </div>
    <div className="p-5 space-y-3 bg-gradient-to-b from-gray-900/95 to-gray-900">
      <div className="flex items-center justify-between text-xs">
        <span className="text-blue-300 font-medium">{course.instructor}</span>
        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">{course.level}</span>
      </div>
      <p className="text-sm text-gray-200 line-clamp-2">{course.description}</p>
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1 text-gray-300">
          <PlayCircle className="h-4 w-4" />
          {course.duration}
        </span>
        <span className="flex items-center gap-1 text-yellow-400 font-semibold">
          <Star className="h-4 w-4 fill-yellow-400" />
          {course.rating.toFixed(1)}
        </span>
      </div>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/courses/${course.id}`);
        }}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-lg"
      >
        Ver curso →
      </Button>
    </div>
  </Card>
  );
};

const CourseRowCard = ({
  course,
}: {
  course: Course;
}) => {
  const navigate = useNavigate();
  return (
  <Card className="bg-gradient-to-r from-slate-800 to-gray-900 border border-blue-500/30 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 text-white w-full cursor-pointer" onClick={() => navigate(`/courses/${course.id}`)}>
    <div className="p-5 space-y-4 md:space-y-0 md:flex md:items-center md:gap-5">
      <div className="relative h-36 w-full md:w-48 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg">
        <img
          src={getCourseImage(course.category, course.id)}
          alt={course.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <Badge className="bg-black/70 backdrop-blur-sm border border-white/30 text-white text-xs">
            {course.category}
          </Badge>
          {course.trending && (
            <Badge className="bg-yellow-500 text-white text-xs shadow-lg">🔥 Trend</Badge>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-3 min-w-0">
        <div>
          <h4 className="text-xl font-bold text-white break-words mb-1">{course.title}</h4>
          <p className="text-sm text-blue-300 break-words font-medium">
            {course.instructor} • <span className="text-blue-300">{course.level}</span>
          </p>
        </div>
        <p className="text-sm text-gray-200 line-clamp-2 break-words">{course.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-gray-300 bg-gray-800/50 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1 text-yellow-400 font-semibold bg-yellow-500/10 px-3 py-1 rounded-full">
            <Star className="h-4 w-4 fill-yellow-400" />
            {course.rating.toFixed(1)} ({course.reviews})
          </span>
          {course.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-stretch gap-3 md:w-40 flex-shrink-0">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/courses/${course.id}`);
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-lg w-full"
        >
          Ver curso →
        </Button>
      </div>
    </div>
  </Card>
  );
};

export default CoursesPage;


