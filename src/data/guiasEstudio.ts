/**
 * Guías de estudio por categoría y carrera.
 * Cada categoría tiene 2 carreras; cada carrera tiene 5 cuestionarios (temas).
 * Total: 11 categorías × 2 carreras × 5 temas = 110 guías.
 */

export interface TemaGuia {
  slug: string;
  title: string;
}

export interface CarreraGuia {
  slug: string;
  name: string;
  temas: TemaGuia[];
}

export interface CategoriaGuia {
  slug: string;
  name: string;
  carreras: CarreraGuia[];
}

const TEMAS_POR_CATEGORIA: Record<string, [string, string, string, string, string]> = {
  economia: ['Microeconomía', 'Macroeconomía', 'Econometría', 'Política económica', 'Finanzas corporativas'],
  derecho: ['Derecho civil', 'Derecho penal', 'Derecho constitucional', 'Derecho mercantil', 'Derecho laboral'],
  filosofia: ['Lógica', 'Ética', 'Metafísica', 'Filosofía política', 'Historia de la filosofía'],
  odontologia: ['Anatomía dental', 'Periodoncia', 'Endodoncia', 'Ortodoncia', 'Cirugía bucal'],
  medicina: ['Anatomía humana', 'Fisiología', 'Patología', 'Farmacología', 'Medicina preventiva'],
  quimica: ['Química orgánica', 'Química inorgánica', 'Fisicoquímica', 'Bioquímica', 'Química analítica'],
  ingenieria: ['Cálculo', 'Mecánica', 'Circuitos eléctricos', 'Estructuras', 'Sistemas de control'],
  arquitectura: ['Dibujo arquitectónico', 'Estructuras en arquitectura', 'Urbanismo', 'Historia de la arquitectura', 'Diseño sustentable'],
  contabilidad: ['Contabilidad financiera', 'Costos', 'Auditoría', 'Fiscal', 'Contabilidad administrativa'],
  veterinaria: ['Anatomía veterinaria', 'Farmacología veterinaria', 'Patología animal', 'Nutrición animal', 'Cirugía veterinaria'],
  ciencias_politicas: ['Teoría política', 'Política comparada', 'Relaciones internacionales', 'Administración pública', 'Análisis de políticas'],
};

export const CATEGORIAS_GUIAS: CategoriaGuia[] = [
  {
    slug: 'economia',
    name: 'Economía',
    carreras: [
      { slug: 'economia', name: 'Economía', temas: TEMAS_POR_CATEGORIA.economia.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'finanzas', name: 'Finanzas', temas: TEMAS_POR_CATEGORIA.economia.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'derecho',
    name: 'Derecho',
    carreras: [
      { slug: 'derecho', name: 'Derecho', temas: TEMAS_POR_CATEGORIA.derecho.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'criminologia', name: 'Criminología', temas: TEMAS_POR_CATEGORIA.derecho.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'filosofia',
    name: 'Filosofía',
    carreras: [
      { slug: 'filosofia', name: 'Filosofía', temas: TEMAS_POR_CATEGORIA.filosofia.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'etica', name: 'Ética', temas: TEMAS_POR_CATEGORIA.filosofia.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'odontologia',
    name: 'Odontología',
    carreras: [
      { slug: 'odontologia', name: 'Odontología General', temas: TEMAS_POR_CATEGORIA.odontologia.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'ortodoncia', name: 'Ortodoncia', temas: TEMAS_POR_CATEGORIA.odontologia.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'medicina',
    name: 'Medicina',
    carreras: [
      { slug: 'medicina', name: 'Medicina', temas: TEMAS_POR_CATEGORIA.medicina.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'enfermeria', name: 'Enfermería', temas: TEMAS_POR_CATEGORIA.medicina.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'quimica',
    name: 'Química',
    carreras: [
      { slug: 'quimica', name: 'Química', temas: TEMAS_POR_CATEGORIA.quimica.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'quimico-farmaceutico', name: 'Químico Farmacéutico', temas: TEMAS_POR_CATEGORIA.quimica.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'ingenieria',
    name: 'Ingeniería',
    carreras: [
      { slug: 'civil', name: 'Ingeniería Civil', temas: TEMAS_POR_CATEGORIA.ingenieria.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'sistemas', name: 'Ingeniería en Sistemas', temas: TEMAS_POR_CATEGORIA.ingenieria.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'arquitectura',
    name: 'Arquitectura',
    carreras: [
      { slug: 'arquitectura', name: 'Arquitectura', temas: TEMAS_POR_CATEGORIA.arquitectura.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'urbanismo', name: 'Urbanismo', temas: TEMAS_POR_CATEGORIA.arquitectura.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'contabilidad',
    name: 'Contabilidad',
    carreras: [
      { slug: 'contaduria', name: 'Contaduría', temas: TEMAS_POR_CATEGORIA.contabilidad.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'auditoria', name: 'Auditoría', temas: TEMAS_POR_CATEGORIA.contabilidad.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'veterinaria',
    name: 'Veterinaria',
    carreras: [
      { slug: 'medicina-veterinaria', name: 'Medicina Veterinaria', temas: TEMAS_POR_CATEGORIA.veterinaria.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'zootecnia', name: 'Zootecnia', temas: TEMAS_POR_CATEGORIA.veterinaria.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
  {
    slug: 'ciencias_politicas',
    name: 'Ciencias Políticas',
    carreras: [
      { slug: 'ciencia-politica', name: 'Ciencia Política', temas: TEMAS_POR_CATEGORIA.ciencias_politicas.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
      { slug: 'administracion-publica', name: 'Administración Pública', temas: TEMAS_POR_CATEGORIA.ciencias_politicas.map((t, i) => ({ slug: `tema-${i + 1}`, title: t })) },
    ],
  },
];

export function getCategorySlugFromCourseId(courseId: string): string {
  const part = courseId.split('-')[0];
  return part || 'economia';
}

/** Slug para URL a partir del nombre de categoría (ej. "Economía" → "economia") */
export function getCategorySlugFromName(categoryName: string): string {
  const cat = CATEGORIAS_GUIAS.find((c) => c.name === categoryName);
  return cat?.slug ?? categoryName.toLowerCase().replace(/\s+/g, '_');
}

/** Nombre para mostrar a partir del slug de la URL (ej. "economia" → "Economía") */
export function getCategoryNameFromSlug(slug: string): string | null {
  const cat = CATEGORIAS_GUIAS.find((c) => c.slug === slug);
  return cat?.name ?? null;
}

/** Índice del tema dentro de la categoría (0 a 4). El courseId termina en -1..-5. */
export function getTemaIndexFromCourseId(courseId: string): number {
  const parts = courseId.split('-');
  const last = parts[parts.length - 1];
  const num = parseInt(last, 10);
  if (Number.isNaN(num) || num < 1 || num > 5) return 0;
  return num - 1;
}

export function buildCourseId(categoriaSlug: string, carreraSlug: string, temaIndex: number): string {
  return `${categoriaSlug}-${carreraSlug}-${temaIndex + 1}`;
}

export interface GuiaFlat {
  id: string;
  category: string;
  categorySlug: string;
  carrera: string;
  tema: string;
  title: string;
  description: string;
}

export function getAllGuiasFlat(): GuiaFlat[] {
  const out: GuiaFlat[] = [];
  for (const cat of CATEGORIAS_GUIAS) {
    for (const carrera of cat.carreras) {
      carrera.temas.forEach((tema, i) => {
        out.push({
          id: buildCourseId(cat.slug, carrera.slug, i),
          category: cat.name,
          categorySlug: cat.slug,
          carrera: carrera.name,
          tema: tema.title,
          title: `${tema.title} – ${carrera.name}`,
          description: `Cuestionario de ${tema.title} para la carrera de ${carrera.name}. 15 preguntas para reforzar conceptos clave.`,
        });
      });
    }
  }
  return out;
}
