# Plan de implementación: PumaPay Campus Wallet para estudiantes

Objetivo: simplificar la app para que estudiantes reales puedan usarla en **testnet**, con foco en wallet, cursos con insignias y un **feed social** con publicaciones y chats en vivo. Se mantienen **login con Supabase** y **creación de wallets Stellar**.

---

## 1. Estado actual (resumen)

- **Auth**: Supabase (email/contraseña y opcional OAuth). Creación de cuenta crea wallet Stellar (keypair, secret encriptada en Supabase).
- **Wallet**: Stellar testnet/mainnet vía `stellarService` (envío, recepción, balance, Friendbot en testnet).
- **Guías de estudio** (antes “Cursos”): Listado, detalle, cuestionarios; gamificación con badges (bronce/plata/oro) al completar quiz; progreso en `courseGamificationService` (localStorage). En el menú y la UI aparece como “Guías” / “Guías de estudio”.
- **Feed**: Publicaciones en texto y comentarios en vivo (Supabase `feed_posts`, `feed_comments` + Realtime). Implementado en Fase 3.
- **Metas de ahorro**: Código conservado; **ruta y menú ocultos**; sustituidos en la UI por la sección **Feed**.

---

## 2. Funcionalidades recomendadas para estudiantes (testnet)

Para una prueba con estudiantes reales **solo en testnet**:

| Funcionalidad | Prioridad | Estado |
|---------------|-----------|--------|
| Registro / login (Supabase) | Alta | ✅ Listo |
| Crear wallet Stellar al registrarse | Alta | ✅ Listo |
| Fondear cuenta en testnet (Friendbot) | Alta | ✅ Listo |
| Ver balance (XLM/USDC) | Alta | ✅ Listo |
| Enviar / Recibir pagos | Alta | ✅ Listo |
| Guías de estudio y cuestionarios | Alta | ✅ Listo |
| Insignias al completar cuestionarios | Alta | ✅ Listo (bronce/plata/oro) |
| Feed de publicaciones (texto) | Alta | ✅ Listo |
| Chats en vivo (comentarios por post) | Media | ✅ Listo |
| Cuestionario en vivo diario (estilo Kahoot, ganador XLM/puntos) | Alta | 🔲 Plan añadido (ver §9) |
| Perfil (wallet, guías completadas, insignias) | Alta | ✅ Listo (sin metas de ahorro) |

Recomendación: **no exponer mainnet** hasta después de validar con estudiantes en testnet.

---

## 3. Configuración testnet para pilot con estudiantes

- En `.env` (y en el entorno de despliegue) dejar explícito:
  - `VITE_STELLAR_NETWORK=testnet`
- En la UI (por ejemplo en Home o Perfil) se puede mostrar un badge tipo “Red: Testnet” para que quede claro que no es dinero real.
- Friendbot ya se usa para fondear cuentas en testnet; mantener una sola “Fondear en testnet” por usuario/cuenta para no abusar del servicio.

---

## 4. Guías de estudio e insignias (reforzar)

- La sección se llama **Guías de estudio** en la app (menú “Guías”, títulos “Guías destacadas”, etc.). Las rutas siguen siendo `/courses` y `/courses/:courseId`.
- Ya existe: completar cuestionario → `quizService.submitQuiz` → `recordCompletion` en `courseGamificationService` → badge según puntuación (nivel 1/2/3).
- Mejoras opcionales:
  - Mostrar en Perfil y en listado de guías las insignias obtenidas de forma más visible.
  - (Opcional) Persistir badges en Supabase (tabla `user_badges`) para que no dependan solo de localStorage.

---

## 5. Feed de juegos / social (nuevo)

Sustituye la sección “Metas” en la navegación. Objetivo: **feed dinámico** donde los usuarios publican **texto** y hay **chats en vivo**.

### 5.1 ¿Se puede? Sí

- **Feed de publicaciones**: tabla en Supabase (por ejemplo `feed_posts`: `id`, `user_id`, `content`, `created_at`, etc.) y listado en tiempo real con **Supabase Realtime** (suscribirse a cambios en `feed_posts`).
- **Chats en vivo**: dos enfoques posibles:
  - **Comentarios por post**: tabla `feed_comments` con `post_id`, `user_id`, `text`, `created_at`; Realtime sobre esa tabla para que los comentarios aparezcan al instante (chat por publicación).
  - **Chat general (sala única)**: tabla `feed_messages` (canal único); Realtime sobre esa tabla = un solo chat en vivo para todo el feed.

Se recomienda empezar por **publicaciones + comentarios por post** (más ordenado y escalable); si se desea un “chat general”, añadir después una segunda vista o pestaña con `feed_messages`.

### 5.2 Stack propuesto

- **Backend/DB**: Supabase (Postgres + Realtime).
- **Auth**: mismo usuario de Supabase (email/address); `user_id` = `auth.uid()` o mapeo por email/address según tu modelo actual.
- **Front**: React (página `Feed` ya creada como placeholder); componentes: lista de posts, formulario nuevo post, lista de comentarios por post, suscripciones Realtime.

### 5.3 Esquema Supabase (implementado)

- Migración en `supabase/migrations/20250216000000_feed_posts_and_comments.sql`.
- La app usa autenticación propia (tabla `usuarios`), no Supabase Auth; en el feed se identifica al autor con `user_email` y `user_display_name`.
- Tablas: `feed_posts` (id, user_email, user_display_name, content, created_at), `feed_comments` (id, post_id, user_email, user_display_name, content, created_at). RLS permite SELECT e INSERT con anon (el acceso real lo controla la app con ProtectedRoute).
- **Realtime**: en el dashboard de Supabase, Database → Realtime, añadir `feed_posts` y `feed_comments` a la publicación para que las suscripciones `postgres_changes` funcionen.

**Cómo aplicar la migración**: ejecutar el SQL del archivo en el SQL Editor de Supabase (o con `supabase db push` si usas CLI de Supabase).

### 5.4 Frontend (página Feed) – Implementado

- **Lista de posts**: carga inicial con `feedService.getPosts()` y suscripción `feedService.subscribePosts()` para INSERT/DELETE en tiempo real.
- **Crear post**: formulario en la página Feed; `feedService.createPost({ user_email, user_display_name, content })`.
- **Por cada post**: botón “Comentarios” despliega comentarios; `feedService.getComments(postId)` y `feedService.subscribeComments(postId)` para chat en vivo; formulario “Escribe un comentario” con `feedService.createComment(...)`.

---

## 6. Fases de implementación

### Fase 1 – Listo ✅
- Ocultar ruta y menú de Metas de ahorro (código conservado).
- Sustituir en menú y Home la entrada “Metas” por “Feed”.
- Página `/feed` (ya no placeholder).
- Ocultar en Perfil la tarjeta “Logros de Ahorro” (código conservado).

### Fase 2 – Testnet y claridad para estudiantes
- Asegurar `VITE_STELLAR_NETWORK=testnet` en entorno de pilot.
- Añadir indicador visual “Testnet” en la app (por ejemplo en Home o header).
- Documentar para estudiantes: “Solo testnet; no es dinero real”.

### Fase 3 – Feed y chat en vivo – Listo ✅
- Tablas `feed_posts` y `feed_comments` en Supabase (migración en `supabase/migrations/`).
- Realtime habilitado para ambas tablas (desde el dashboard).
- Página Feed: listar posts, formulario “Nueva publicación”, comentarios por post con chat en vivo (suscripción Realtime).

### Fase 4 – (absorbida en Fase 3)
- Comentarios en vivo implementados junto con el feed.

### Fase 5 – Refinamiento
- Pulir UI del Feed (infinite scroll, límite de caracteres ya aplicado, moderación básica si aplica).
- (Opcional) Persistir insignias en Supabase.
- Pruebas con un grupo piloto de estudiantes en testnet.

### Fase 6 – Guías en vivo (estilo Kahoot) – Ver §9
- Cuestionario en vivo diario; miembros entran y compiten; ganador recibe puntos o XLM.

---

## 9. Guías de estudio en vivo (estilo Kahoot)

Objetivo: que la sección de guías no sea solo contenido estático, sino **cuestionarios en vivo** en los que participan los miembros de la app. Tipo Kahoot en línea: cada día hay un cuestionario en vivo; quien quiera puede entrar; el **ganador se lleva puntos o XLM** (en testnet, por ejemplo XLM de un bote común o puntos canjeables).

### 9.1 Concepto

- **Una guía en vivo al día**: se programa un quiz (por tema, por guía de estudio existente, o genérico de cultura financiera).
- **Horario**: por ejemplo “Quiz de las 12:00” o “Quiz de las 18:00”; los usuarios entran antes de que empiece y esperan en una sala.
- **Durante el quiz**: preguntas una a una, tiempo limitado por pregunta; cada usuario responde desde la app; se ve en vivo el ranking (opcional: solo top 3 o nicknames).
- **Al final**: ganador = quien más puntúe (y/o menos tiempo). Premio: **puntos** (sumados al sistema de gamificación actual) y/o **XLM en testnet** enviados a la wallet del ganador desde una cuenta “bote” o premio.

### 9.2 Funcionalidades a implementar (plan)

| Elemento | Descripción |
|----------|-------------|
| Sala / lobby | Los usuarios entran a “Quiz de hoy”; ven “Empieza en X min” o “¡Empieza ya!”. |
| Cuestionario en vivo | Mismas preguntas para todos; una pregunta por pantalla; cronómetro por pregunta; envío de respuesta; siguiente pregunta cuando el tiempo acaba o todos responden. |
| Sincronización | Backend (Supabase Realtime o servidor) para: abrir pregunta N, cerrar respuestas, mostrar resultado (correcta/incorrecta), pasar a N+1. |
| Ranking | Puntos por respuesta correcta + bonus por velocidad; ranking en tiempo real; al final ranking final. |
| Premio | Ganador único (o top 3): acreditar **puntos** en el sistema de gamificación y/o enviar **XLM** (testnet) a la wallet del ganador. El bote puede ser una cuenta Stellar dedicada que el equipo fondée con Friendbot o XLM de testnet. |

### 9.3 Stack sugerido

- **Backend**: Supabase (tablas para sesiones de quiz en vivo, preguntas del día, respuestas por usuario, ranking). Realtime para sincronizar “pregunta actual”, “tiempo restante”, “ranking”.
- **Lógica de premio**: cron o función que al finalizar el quiz compute el ganador y llame a `stellarService` para enviar XLM desde la cuenta bote a la wallet del ganador (solo testnet en pilot).
- **Front**: Nueva vista “Quiz en vivo” (dentro de Guías o como entrada en Home): listar “Quiz de hoy a las 12:00”, botón “Entrar”; dentro: pantalla de espera → preguntas con opciones y cronómetro → resultado por pregunta → ranking final y ganador.

### 9.4 Fases recomendadas

1. **Diseño de datos**: tablas `live_quiz_sessions`, `live_quiz_questions`, `live_quiz_participants`, `live_quiz_answers`; estado de la sesión (lobby, question_1, question_2, …, finished).
2. **Backend/Realtime**: crear sesión del día; abrir/cerrar preguntas; registrar respuestas; calcular ranking; decidir ganador.
3. **Front**: lobby, flujo de preguntas con timer, ranking en vivo, pantalla de ganador.
4. **Premio**: integración con Stellar (envío de XLM al ganador en testnet) y/o acreditación de puntos en `courseGamificationService` o en una tabla de “puntos de quiz en vivo”.

---

## 7. Lo que se mantiene sin cambios

- **Login y registro con Supabase** (AuthContext, userService, supabaseClient).
- **Creación y almacenamiento de wallets Stellar** (keypair, secret encriptada en Supabase).
- **stellarService**: envío, recepción, balance, Friendbot (testnet).
- **Guías de estudio (rutas /courses)**: coursesService, quizService, courseGamificationService, QuizComponent, CourseDetail, Courses; en la UI todo se muestra como “Guías” / “Guías de estudio”.
- **Código de metas de ahorro**: todo el código permanece; solo oculto en rutas y UI.

---

## 8. Resumen

- **Estudiantes en testnet**: viable con la app actual; solo asegurar red testnet y mensaje claro en UI.
- **Guías de estudio e insignias**: ya funcionan; la sección se llama “Guías” en la app; se pueden reforzar en Perfil y, si se desea, llevar badges a Supabase.
- **Metas de ahorro**: ocultas en menú y rutas; reemplazadas por Feed.
- **Feed + chats en vivo**: implementados (Fase 3); tablas `feed_posts` y `feed_comments` en Supabase + Realtime; página Feed con publicar y comentarios en vivo.
- **Guías en vivo (Kahoot)**: plan añadido en §9; cuestionario diario en vivo, ganador con puntos o XLM; siguiente paso de producto.
