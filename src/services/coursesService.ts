import type { Course } from "@/types/courses";
import { getAllGuiasFlat } from "@/data/guiasEstudio";

const COVER_IMAGES: Record<string, string> = {
  Economía: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
  Derecho: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f",
  Filosofía: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d",
  Odontología: "https://images.unsplash.com/photo-1629909613654-28e377c37b09",
  Medicina: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d",
  Química: "https://images.unsplash.com/photo-1603126857599-6e0c2c2862c5",
  Ingeniería: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1",
  Arquitectura: "https://images.unsplash.com/photo-1486325212027-8081e485255e",
  Contabilidad: "https://images.unsplash.com/photo-1554224155-6726b3ff858f",
  Veterinaria: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b",
  "Ciencias Políticas": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620",
};

function guiasToCourses(): Course[] {
  const guias = getAllGuiasFlat();
  return guias.map((g, index) => {
    const isFeatured = index < 6;
    const isTrending = index % 7 === 0;
    return {
      id: g.id,
      title: g.title,
      instructor: "PumaPay Campus",
      category: g.category,
      level: index % 3 === 0 ? "Avanzado" : index % 3 === 1 ? "Intermedio" : "Principiante",
      description: g.description,
      duration: "~30 min",
      coverImage: COVER_IMAGES[g.category] || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
      rating: 4.2 + (index % 8) * 0.1,
      reviews: 20 + (index % 50),
      tags: [g.category, g.carrera, g.tema],
      featured: isFeatured,
      trending: isTrending,
      highlight: `15 preguntas · ${g.tema}`,
      highlights: [`Cuestionario de ${g.tema}`, "Retroalimentación inmediata", "Insignia al aprobar"],
      syllabus: [
        {
          id: `mod-${g.id}`,
          title: g.tema,
          description: g.description,
          lessons: [
            {
              id: `les-${g.id}`,
              title: "Cuestionario",
              duration: "~30 min",
              type: "recurso",
              description: "Responde las 15 preguntas para obtener tu insignia.",
            },
          ],
        },
      ],
    } satisfies Course;
  });
}

const mockCourses: Course[] = guiasToCourses();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const coursesService = {
  async listCourses(): Promise<Course[]> {
    await delay(350);
    return mockCourses;
  },
  async listFeatured(): Promise<Course[]> {
    await delay(250);
    return mockCourses.filter((course) => course.featured);
  },
  async listByCategory(category: string): Promise<Course[]> {
    await delay(300);
    return mockCourses.filter(
      (course) => course.category.toLowerCase() === category.toLowerCase()
    );
  },
};
