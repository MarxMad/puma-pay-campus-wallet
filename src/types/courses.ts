export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "lectura" | "recurso";
  description: string;
  content?: string[];
  resources?: Array<{
    label: string;
    url: string;
  }>;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  /** Carrera dentro de la categoría (ej. Economía, Finanzas) */
  carrera?: string;
  /** Tema del cuestionario (ej. Microeconomía, Derecho penal) */
  tema?: string;
  level: "Principiante" | "Intermedio" | "Avanzado";
  description: string;
  duration: string;
  coverImage: string;
  rating: number;
  reviews: number;
  tags: string[];
  featured?: boolean;
  trending?: boolean;
  highlight?: string;
  previewVideo?: string;
  highlights?: string[];
  requirements?: string[];
  syllabus?: CourseModule[];
}


