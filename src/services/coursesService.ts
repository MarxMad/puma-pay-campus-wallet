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
    duration: "8 horas",
    coverImage: "https://images.unsplash.com/photo-1587614382346-4ec892f9aca3",
    rating: 4.8,
    reviews: 124,
    tags: ["UX", "Fintech", "Producto"],
    featured: true,
    trending: true,
    highlight: "Plantillas descargables y brief real de PumaPay.",
    highlights: [
      "Sesiones cortas estilo Platzi",
      "Ejercicios guiados con herramientas reales",
      "Feedback descargable para practicar",
    ],
    requirements: [
      "Laptop o tablet con Figma",
      "Cuenta gratuita en Notion",
      "Conocimientos básicos de research",
    ],
    syllabus: [
      {
        id: "ux101-mod-1",
        title: "Fundamentos de UX financiero",
        description:
          "Contexto de pagos digitales y principios de diseño para wallets.",
        lessons: [
          {
            id: "ux101-1-1",
            title: "Panorama de wallets universitarias",
            duration: "12 min",
            type: "video",
            description:
              "Luis y Ana explican cómo nace PumaPay y qué retos resuelve.",
            content: [
              "Historia de PumaPay",
              "Benchmarks de wallets LATAM",
              "Retos de onboarding",
            ],
          },
          {
            id: "ux101-1-2",
            title: "Research express en campus",
            duration: "18 min",
            type: "lectura",
            description:
              "Guía para levantar insights rápidos en cafeterías y salones.",
            resources: [
              {
                label: "Checklist de entrevistas",
                url: "https://www.notion.so/",
              },
            ],
          },
        ],
      },
      {
        id: "ux101-mod-2",
        title: "Prototipos y handoff",
        description:
          "Construye un flow de registro y wallet listo para desarrollo.",
        lessons: [
          {
            id: "ux101-2-1",
            title: "Microinteracciones clave",
            duration: "9 min",
            type: "video",
            description:
              "Animaciones y estados vacíos que elevan la confianza del usuario.",
          },
          {
            id: "ux101-2-2",
            title: "Checklist de handoff",
            duration: "6 min",
            type: "recurso",
            description:
              "Plantilla para pasar specs a frontend y producto.",
            resources: [
              {
                label: "Template .fig",
                url: "https://www.figma.com/community",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "course-web3-payments",
    title: "Pagos Web3 y Tokenización",
    instructor: "Luis Hernández",
    category: "Blockchain",
    level: "Intermedio",
    description:
      "Explora cómo diseñar pasarelas de pago con tokens respaldados, compliance y experiencias híbridas off/on-chain.",
    duration: "10 horas",
    coverImage: "https://images.unsplash.com/photo-1518544889280-37c5c54ddb05",
    rating: 4.7,
    reviews: 98,
    tags: ["Blockchain", "Pagos", "Stellar"],
    featured: true,
    highlights: [
      "Casos reales con Stellar y Soroban",
      "Laboratorios guiados con Postman",
      "Playbook de compliance para campus",
    ],
    syllabus: [
      {
        id: "payments-mod-1",
        title: "Arquitectura híbrida",
        description: "Cómo conectar sistemas bancarios con Stellar.",
        lessons: [
          {
            id: "payments-1-1",
            title: "Tokenización paso a paso",
            duration: "15 min",
            type: "video",
            description:
              "Demostración de emisión de activos usando el SDK de Stellar.",
          },
          {
            id: "payments-1-2",
            title: "Diagrama de flujo SPEI → USDC",
            duration: "8 min",
            type: "lectura",
            description:
              "Arquitectura usada para fondear wallets PumaPay en testnet.",
          },
        ],
      },
      {
        id: "payments-mod-2",
        title: "Onboarding y riesgos",
        description: "KYC express, límites y auditoría.",
        lessons: [
          {
            id: "payments-2-1",
            title: "Checklist KYB para comercios",
            duration: "10 min",
            type: "recurso",
            description: "Documento editable con los campos clave.",
          },
        ],
      },
    ],
  },
  {
    id: "course-data-storytelling",
    title: "Storytelling con Datos para Universidades",
    instructor: "María Gómez",
    category: "Crecimiento",
    level: "Principiante",
    description:
      "Convierte métricas en historias que conectan con estudiantes, directivos y aliados usando dashboards y presentaciones efectivas.",
    duration: "6 horas",
    coverImage: "https://images.unsplash.com/photo-1553877522-43269d4ea984",
    rating: 4.6,
    reviews: 76,
    tags: ["Data", "Storytelling", "Educación"],
    highlights: [
      "Framework RISE para presentaciones",
      "Plantillas de dashboard listas",
    ],
    syllabus: [
      {
        id: "storytelling-1",
        title: "Narrativa de impacto",
        description: "Define protagonista, conflicto y datos clave.",
        lessons: [
          {
            id: "storytelling-1-1",
            title: "Mapa de historia",
            duration: "11 min",
            type: "video",
            description: "Ejemplo con métricas de adopción de la wallet.",
          },
        ],
      },
    ],
  },
  {
    id: "course-campus-marketing",
    title: "Marketing de Comunidad en Campus",
    instructor: "Jorge Rivera",
    category: "Crecimiento",
    level: "Intermedio",
    description:
      "Estrategias para activar comercios, embajadores estudiantiles y eventos que impulsen la adopción de productos digitales.",
    duration: "9 horas",
    coverImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
    rating: 4.5,
    reviews: 54,
    tags: ["Marketing", "Comunidad", "Eventos"],
    trending: true,
    highlights: [
      "Calendario editable de activaciones",
      "Formatos para medir NPS en cafeterías",
    ],
    syllabus: [
      {
        id: "marketing-1",
        title: "Activaciones relámpago",
        description: "Micro eventos para captar usuarios en 48h.",
        lessons: [
          {
            id: "marketing-1-1",
            title: "Caso Cafetería Islas",
            duration: "7 min",
            type: "video",
            description: "Cómo lograron 300 descargas en 2 días.",
          },
        ],
      },
    ],
  },
  {
    id: "course-smart-contracts",
    title: "Smart Contracts en Stellar para Principiantes",
    instructor: "Elena Suárez",
    category: "Blockchain",
    level: "Principiante",
    description:
      "Curso introductorio para crear, desplegar y probar contratos en Stellar/Soroban utilizando herramientas modernas.",
    duration: "12 horas",
    coverImage: "https://images.unsplash.com/photo-1517430816045-df4b7de1cd0f",
    rating: 4.9,
    reviews: 162,
    tags: ["Soroban", "Stellar", "Smart Contracts"],
    highlights: [
      "Laboratorios con Quickstart",
      "Plantillas de contratos OpenZeppelin",
    ],
    syllabus: [
      {
        id: "smart-1",
        title: "Entorno y fundamentos",
        description: "Configura Scarb y corre tu primer contrato.",
        lessons: [
          {
            id: "smart-1-1",
            title: "Setup de proyecto",
            duration: "14 min",
            type: "video",
            description: "Instalación guiada y comandos clave.",
          },
        ],
      },
    ],
  },
  {
    id: "course-finanzas-personales",
    title: "Finanzas Personales para Estudiantes",
    instructor: "Carla Mendoza",
    category: "Finanzas",
    level: "Principiante",
    description:
      "Crea un plan financiero, administra tus gastos y aprende a invertir desde el campus con casos reales mexicanos.",
    duration: "4 horas",
    coverImage: "https://images.unsplash.com/photo-1454165205744-3b78555e5572",
    rating: 4.4,
    reviews: 210,
    tags: ["Finanzas", "Presupuestos", "Estudiantes"],
    trending: true,
    highlights: [
      "Plantillas de presupuesto semanales",
      "Retos gamificados de ahorro",
    ],
    syllabus: [
      {
        id: "finanzas-1",
        title: "Bases de presupuesto",
        description: "Define metas y buffers de emergencia.",
        lessons: [
          {
            id: "finanzas-1-1",
            title: "Reto 50/30/20 adaptado a campus",
            duration: "8 min",
            type: "lectura",
            description: "Cómo asignar becas, ingresos freelance y gastos.",
          },
        ],
      },
    ],
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


