import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader, headerIconClass } from "@/components/AppHeader";
import { coursesService } from "@/services/coursesService";
import { getCategoryNameFromSlug } from "@/data/guiasEstudio";
import { getCategoryIcon, CourseGridCard } from "@/pages/Courses";
import type { Course } from "@/types/courses";

const levelFilters: Array<{ id: "todos" | Course["level"]; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "Principiante", label: "Principiante" },
  { id: "Intermedio", label: "Intermedio" },
  { id: "Avanzado", label: "Avanzado" },
];

const CategoryCoursesPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<(typeof levelFilters)[number]["id"]>("todos");

  const categoryName = useMemo(
    () => (categorySlug ? getCategoryNameFromSlug(categorySlug) : null),
    [categorySlug]
  );

  const { data: courses = [], isLoading, isError } = useQuery({
    queryKey: ["courses"],
    queryFn: coursesService.listCourses,
  });

  const categoryCourses = useMemo(() => {
    if (!categoryName) return [];
    return courses.filter((c) => c.category === categoryName);
  }, [courses, categoryName]);

  const filteredCourses = useMemo(() => {
    return categoryCourses.filter((c) => {
      const matchesLevel = selectedLevel === "todos" || c.level === selectedLevel;
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        (c.tema?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (c.carrera?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesLevel && matchesSearch;
    });
  }, [categoryCourses, selectedLevel, searchTerm]);

  if (!categorySlug || !categoryName) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <p className="text-zinc-400 mb-4">Categoría no encontrada</p>
        <Button onClick={() => navigate("/courses")} className="bg-gold-600 hover:bg-gold-500 text-black">
          Volver a Guías
        </Button>
      </div>
    );
  }

  const Icon = getCategoryIcon(categoryName);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 text-white overflow-x-hidden w-full max-w-full">
      <AppHeader
        leftAction={<ArrowLeft className={headerIconClass} />}
        onLeftAction={() => navigate("/courses")}
        subtitle={categoryName}
        children={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en esta categoría..."
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
        }
      />

      <main className="px-4 pt-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gold-500/20 border-2 border-gold-500/40 text-gold-400">
            <Icon className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{categoryName}</h1>
            <p className="text-sm text-zinc-500">{filteredCourses.length} guías</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {levelFilters.map((level) => (
            <Button
              key={level.id}
              variant={level.id === selectedLevel ? "default" : "secondary"}
              size="sm"
              className={
                level.id === selectedLevel
                  ? "bg-gold-500 hover:bg-gold-600 border-none whitespace-nowrap"
                  : "bg-gray-900 border border-gray-800 text-gray-300 whitespace-nowrap hover:bg-gray-800 hover:text-white"
              }
              onClick={() => setSelectedLevel(level.id)}
            >
              {level.label}
            </Button>
          ))}
        </div>

        {isError && (
          <div className="p-4 bg-gold-500/10 border border-gold-500/40 rounded-xl">
            <p className="text-zinc-300 text-sm">No se pudieron cargar las guías. Intenta más tarde.</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-800/80 animate-pulse h-40" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl text-center text-gray-400 text-sm">
            No hay guías con esos filtros. Prueba otro nivel o búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredCourses.map((course) => (
              <CourseGridCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CategoryCoursesPage;
