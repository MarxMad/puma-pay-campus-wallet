import type { Course } from "@/types/courses";

const mockCourses: Course[] = [
  {
    id: "course-ux-101",
    title: "Diseño UX para Productos Fintech",
    instructor: "Ana Martínez",
    category: "Tecnología",
    level: "Principiante",
    description:
      "Aprende a diseñar experiencias financieras digitales centradas en el usuario, con casos prácticos de wallets cripto y pagos digitales.",
    priceMXNB: 180,
    duration: "8 horas",
    coverImage: "https://images.unsplash.com/photo-1587614382346-4ec892f9aca3",
    rating: 4.8,
    reviews: 124,
    tags: ["UX", "Fintech", "Producto"],
    featured: true,
    trending: true,
  },
  {
    id: "course-web3-payments",
    title: "Pagos Web3 y Tokenización MXNB",
    instructor: "Luis Hernández",
    category: "Blockchain",
    level: "Intermedio",
    description:
      "Explora cómo diseñar pasarelas de pago con tokens respaldados, compliance y experiencias híbridas off/on-chain.",
    priceMXNB: 250,
    duration: "10 horas",
    coverImage: "https://images.unsplash.com/photo-1518544889280-37c5c54ddb05",
    rating: 4.7,
    reviews: 98,
    tags: ["Blockchain", "Pagos", "Arbitrum"],
    featured: true,
  },
  {
    id: "course-data-storytelling",
    title: "Storytelling con Datos para Universidades",
    instructor: "María Gómez",
    category: "Crecimiento",
    level: "Principiante",
    description:
      "Convierte métricas en historias que conectan con estudiantes, directivos y aliados usando dashboards y presentaciones efectivas.",
    priceMXNB: 140,
    duration: "6 horas",
    coverImage: "https://images.unsplash.com/photo-1553877522-43269d4ea984",
    rating: 4.6,
    reviews: 76,
    tags: ["Data", "Storytelling", "Educación"],
  },
  {
    id: "course-campus-marketing",
    title: "Marketing de Comunidad en Campus",
    instructor: "Jorge Rivera",
    category: "Crecimiento",
    level: "Intermedio",
    description:
      "Estrategias para activar comercios, embajadores estudiantiles y eventos que impulsen la adopción de productos digitales.",
    priceMXNB: 200,
    duration: "9 horas",
    coverImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
    rating: 4.5,
    reviews: 54,
    tags: ["Marketing", "Comunidad", "Eventos"],
    trending: true,
  },
  {
    id: "course-smart-contracts",
    title: "Smart Contracts en Arbitrum para Principiantes",
    instructor: "Elena Suárez",
    category: "Blockchain",
    level: "Principiante",
    description:
      "Curso introductorio para crear, desplegar y probar contratos en Arbitrum utilizando herramientas modernas.",
    priceMXNB: 220,
    duration: "12 horas",
    coverImage: "https://images.unsplash.com/photo-1517430816045-df4b7de1cd0f",
    rating: 4.9,
    reviews: 162,
    tags: ["Solidity", "Arbitrum", "Smart Contracts"],
  },
  {
    id: "course-finanzas-personales",
    title: "Finanzas Personales para Estudiantes",
    instructor: "Carla Mendoza",
    category: "Finanzas",
    level: "Principiante",
    description:
      "Crea un plan financiero, administra tus gastos y aprende a invertir desde el campus con casos reales mexicanos.",
    priceMXNB: 95,
    duration: "4 horas",
    coverImage: "https://images.unsplash.com/photo-1454165205744-3b78555e5572",
    rating: 4.4,
    reviews: 210,
    tags: ["Finanzas", "Presupuestos", "Estudiantes"],
    trending: true,
  },
];

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


