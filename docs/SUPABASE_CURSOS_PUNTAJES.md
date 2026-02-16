# Tabla Supabase para cursos y puntaje por usuario

## ¿Hace falta?

**Ahora mismo:** los cursos (guías) están definidos en el frontend (`src/data/guiasEstudio.ts`) y el **puntaje y progreso** se guardan solo en **localStorage** (`pumapay_course_gamification` y `quiz_result_${courseId}`).

**Consecuencias de no tener tabla:**
- Si el usuario borra datos del navegador o usa otro dispositivo, **pierde progreso, puntajes y badges**.
- No hay un registro central para rankings, analytics o “mis cursos completados” desde otro dispositivo.
- No se puede auditar o consultar puntajes por usuario en un solo lugar.

**Con tabla en Supabase:**
- El progreso **persiste** por usuario (identificado por `user_email`).
- Mismo usuario en móvil y desktop ve los mismos cursos completados y puntajes.
- Permite rankings globales, reportes o futuras recompensas (p. ej. quiz en vivo) con datos reales.

**Conclusión:** si quieres que el progreso sea durable y por usuario, **sí conviene** una tabla en Supabase para guardar el puntaje (y progreso) por usuario. Los **cursos** pueden seguir definidos en el front; no es obligatorio tener una tabla de “cursos” en Supabase a menos que quieras editarlos desde el panel.

---

## Tabla creada: `user_course_progress`

Migración: `supabase/migrations/20250216100000_user_course_progress.sql`

| Columna        | Tipo      | Descripción                                      |
|----------------|-----------|--------------------------------------------------|
| id             | uuid      | PK                                               |
| user_email     | text      | Identificador del usuario (mismo que en la app)  |
| course_id      | text      | Id de la guía (ej. `economia-economia-1`)        |
| score          | smallint  | Puntaje 0–100                                    |
| passed         | boolean   | Si aprobó (ej. ≥70%)                             |
| badge_level    | smallint  | 1=Bronce, 2=Plata, 3=Oro                         |
| points_earned  | int       | Puntos sumados por ese cuestionario              |
| completed_at   | timestamptz | Cuándo completó                               |
| created_at / updated_at | timestamptz | Auditoría                    |

**Restricción:** `unique(user_email, course_id)` → un registro por usuario y guía (se puede hacer UPSERT al completar el cuestionario para guardar el último intento o, en el código, solo actualizar si el puntaje es mayor).

---

## Cómo aplicar la migración

En el **SQL Editor** de Supabase (o con `supabase db push` si usas CLI):

1. Abre el contenido de `supabase/migrations/20250216100000_user_course_progress.sql`.
2. Ejecútalo en tu proyecto.

No es necesario crear una tabla aparte de “cursos” solo para listar guías; los cursos pueden seguir viniendo del front. Esta tabla solo guarda **resultados por usuario**.

---

## Integración en la app (opcional)

Para usar esta tabla:

1. **Al completar un cuestionario** (en `courseGamificationService.recordCourseCompletion` o donde se guarde el resultado):
   - Hacer `INSERT` en `user_course_progress` con `user_email`, `course_id`, `score`, `passed`, `badge_level`, `points_earned`.
   - Usar `ON CONFLICT (user_email, course_id) DO UPDATE` si quieres actualizar con el último (o mejor) intento.

2. **Al cargar perfil o “mis cursos”**:
   - Leer de `user_course_progress` donde `user_email = currentUser.email` y, si hay datos, usarlos como fuente de verdad (o combinarlos con localStorage hasta migrar por completo).

3. **Servicio**: crear un `courseProgressSupabaseService` (o extender el actual) que:
   - Guarde en Supabase al completar.
   - Consulte Supabase al cargar progreso y puntos.
   - Opcionalmente mantenga un fallback a localStorage si Supabase falla.

Si quieres, el siguiente paso puede ser implementar ese servicio y engancharlo en `courseGamificationService` y en el flujo del quiz.
