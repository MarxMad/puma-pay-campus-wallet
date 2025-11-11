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
import { toast } from "@/hooks/use-toast";

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

  const handlePurchase = (course: Course) => {
    toast({
      title: "Compra pendiente",
      description: `Pronto podrás comprar "${course.title}" con MXNB desde esta pantalla.`,
    });
  };

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
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-amber-400" />
            <h1 className="text-lg font-semibold">Cursos PumaPay</h1>
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
        <section className="mt-4 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -right-12 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 bottom-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center space-x-2 text-amber-300 font-medium text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Aprende y paga con MXNB</span>
            </div>
            <h2 className="text-2xl font-bold mt-3 mb-2">
              Conviértete en experto desde el campus
            </h2>
            <p className="text-gray-300 text-sm">
              Cursos seleccionados para estudiantes emprendedores, builders y
              líderes de comunidad.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {featuredCourses.slice(0, 3).map((course) => (
                <Badge
                  key={course.id}
                  className="bg-amber-500/20 border-amber-400 text-amber-100"
                >
                  {course.category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Destacados</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-300 hover:text-amber-200"
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
                  onPurchase={handlePurchase}
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
            <TabsList className="bg-gray-900 border border-gray-800 overflow-x-auto max-w-full">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="capitalize"
                >
                  {category === "todos" ? "Todas" : category}
                </TabsTrigger>
              ))}
            </TabsList>
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
                        ? "bg-amber-500 hover:bg-amber-600 border-none"
                        : "bg-gray-900 border border-gray-800 text-gray-300"
                    }
                    onClick={() => setSelectedLevel(level.id)}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>

              <Separator className="bg-gray-800" />

              {isError && (
                <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl">
                  <p className="text-red-200 text-sm">
                    No se pudieron cargar los cursos. Intenta nuevamente.
                  </p>
                </div>
              )}

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                {filteredCourses.map((course) => (
                  <CourseRowCard
                    key={course.id}
                    course={course}
                    onPurchase={handlePurchase}
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
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h3 className="text-lg font-semibold">Tendencias del campus</h3>
            </div>
            <div className="space-y-3">
              {trendingCourses.map((course) => (
                <Card
                  key={course.id}
                  className="bg-gradient-to-r from-gray-900 to-gray-950 border border-gray-800 p-4 hover:border-amber-500/60 transition-colors duration-300 text-white"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/20 border-amber-400 text-amber-100">
                          Tendencia
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-gray-700 text-gray-200"
                        >
                          {course.category}
                        </Badge>
                      </div>
                      <h4 className="text-lg font-semibold text-white">{course.title}</h4>
                      <p className="text-sm text-gray-400">{course.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {course.duration}
                        </span>
                        <span>{course.level}</span>
                        <span className="flex items-center gap-1 text-amber-300">
                          <Star className="h-3.5 w-3.5" />
                          {course.rating.toFixed(1)} · {course.reviews} reseñas
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handlePurchase(course)}
                      className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
                    >
                      Comprar · {course.priceMXNB} MXNB
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

const CourseCard = ({
  course,
  onPurchase,
}: {
  course: Course;
  onPurchase: (course: Course) => void;
}) => (
  <Card className="min-w-[280px] bg-gray-900 border border-gray-800 overflow-hidden hover:border-amber-400/40 transition-colors duration-300 text-white">
    <div className="relative h-40">
      <img
        src={`${course.coverImage}?auto=format&fit=crop&w=600&q=80`}
        alt={course.title}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20" />
      <div className="absolute top-3 left-3 flex gap-2">
        {course.featured && (
          <Badge className="bg-amber-500/80 text-amber-50">Destacado</Badge>
        )}
        <Badge
          variant="outline"
          className="bg-black/40 border-white/20 text-gray-200"
        >
          {course.category}
        </Badge>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <h4 className="text-lg font-semibold line-clamp-2 text-white">{course.title}</h4>
      </div>
    </div>
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{course.instructor}</span>
        <span>{course.level}</span>
      </div>
      <p className="text-sm text-gray-300 line-clamp-2">{course.description}</p>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <PlayCircle className="h-3.5 w-3.5" />
          {course.duration}
        </span>
        <span className="flex items-center gap-1 text-amber-300">
          <Star className="h-3.5 w-3.5" />
          {course.rating.toFixed(1)}
        </span>
      </div>
      <Button
        onClick={() => onPurchase(course)}
        className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
      >
        Comprar · {course.priceMXNB} MXNB
      </Button>
    </div>
  </Card>
);

const CourseRowCard = ({
  course,
  onPurchase,
}: {
  course: Course;
  onPurchase: (course: Course) => void;
}) => (
  <Card className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 transition-colors duration-300 text-white w-full">
    <div className="p-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
      <div className="relative h-32 w-full md:w-40 flex-shrink-0 rounded-xl overflow-hidden">
        <img
          src={`${course.coverImage}?auto=format&fit=crop&w=400&q=80`}
          alt={course.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="bg-black/40 border-white/20 text-gray-200 text-xs"
          >
            {course.category}
          </Badge>
          {course.trending && (
            <Badge className="bg-amber-500/80 text-amber-50 text-xs">Trend</Badge>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-3 min-w-0">
        <div>
          <h4 className="text-lg font-semibold text-white break-words">{course.title}</h4>
          <p className="text-sm text-gray-400 break-words">
            {course.instructor} • {course.level}
          </p>
        </div>
        <p className="text-sm text-gray-300 line-clamp-3 break-words">{course.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <Star className="h-3.5 w-3.5" />
            {course.rating.toFixed(1)} ({course.reviews})
          </span>
          {course.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-gray-700 text-gray-200 text-xs"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-stretch gap-3 md:w-48 flex-shrink-0">
        <div className="text-left md:text-left">
          <span className="text-sm text-gray-400">Precio</span>
          <div className="text-xl font-semibold text-amber-300 break-words">
            {course.priceMXNB} MXNB
          </div>
        </div>
        <Button
          onClick={() => onPurchase(course)}
          className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold w-full"
        >
          Comprar con MXNB
        </Button>
      </div>
    </div>
  </Card>
);

export default CoursesPage;


