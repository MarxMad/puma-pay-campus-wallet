# Dónde están implementados los puntos en la app

Resumen de **dónde se ganan**, **dónde se muestran** y **dónde se guardan** los puntos, y **dónde se podría sumar más** en el futuro.

---

## 1. Dónde se GANAN puntos (implementado)

| Parte de la app | Qué hace | Puntos | Archivo / flujo |
|-----------------|----------|--------|------------------|
| **Guías de estudio (cuestionarios)** | Al completar un cuestionario y aprobar, se registra completitud y se suman puntos según badge (Bronce/Plata/Oro). | 50 (Bronce), 75 (Plata), 100 (Oro) | `QuizComponent.tsx` → `recordCompletion()` → `courseGamificationService.recordCourseCompletion()` + `upsertCourseProgress()` en Supabase |
| **Donaciones (Marketplace)** | Por cada **5 donaciones** completadas se otorga un bonus. | +50 puntos por cada 5 donaciones | `Checkout.tsx` → `recordDonation()` → bonus en Supabase (`user_course_progress` con `course_id = 'bonus-donaciones'`) + `courseGamificationService.addDonationBonusPoints()` en localStorage |

---

## 2. Dónde se MUESTRAN los puntos

| Pantalla / componente | Qué muestra | Dato que usa |
|------------------------|-------------|--------------|
| **Home** | Insignias por rangos (cada 500 pts: Primer paso, En camino, etc.) y total de puntos. | `userPoints?.totalPoints` vía `useCourseProgress()` |
| **Home** | Badge "X pts" junto a la sección de insignias. | `totalPoints` |
| **Profile** | Total de puntos y “X guías completadas”. | `userPoints.totalPoints`, `userPoints.coursesCompleted` |
| **Profile** | Lista de badges por curso (Gold/Silver/Bronze por guía). | `getUserBadges()` / `userPoints.badges` |
| **CourseDetail (guía individual)** | Si ya completó: “Completado · 🥇/🥈/🥉 X% · +Y pts”. Si no: “X pts · Y guías”. | `progress.pointsEarned`, `userPoints.totalPoints` |
| **QuizComponent (al terminar)** | Resultado con badge (Gold/Silver/Bronze). | `quizResult.badgeLevel` (no muestra puntos explícitos en el modal, pero se suman al total) |

---

## 3. Dónde se GUARDAN los puntos

| Lugar | Qué guarda | Uso |
|-------|------------|-----|
| **localStorage** (`pumapay_course_gamification`) | `users[userId].totalPoints`, `users[userId].badges`, `courseProgress` por curso. | Lo que usa la UI (Home, Profile, CourseDetail) vía `courseGamificationService.getUserPoints()`. |
| **Supabase – `user_course_progress`** | Una fila por (user_email, course_id): `points_earned`, score, badge_level, time_spent_seconds. Incluye `course_id = 'bonus-donaciones'` para puntos por donaciones. | Leaderboard (si se lee desde Supabase), sincronización entre dispositivos, persistencia real. |
| **Supabase – `user_donations`** | Cada donación: user_email, marketplace_item_id, amount_xlm. | Contar donaciones y aplicar bonus cada 5. |

---

## 4. Servicios y flujo

- **`courseGamificationService`**  
  - Calcula y guarda puntos por curso en localStorage.  
  - `recordCourseCompletion()` → suma puntos por badge.  
  - `addDonationBonusPoints()` → suma puntos bonus por donaciones (solo local).  
  - `getUserPoints()` / `getUserBadges()` → lo que leen Home y Profile.

- **`useCourseProgress`**  
  - Expone `userPoints`, `recordCompletion()`, `getUserBadges()`, `refresh()`.  
  - Al llamar `recordCompletion()` también hace `upsertCourseProgress()` a Supabase.

- **`donationService`**  
  - `recordDonation()` → inserta en `user_donations` y, si toca, escribe el bonus en `user_course_progress` (`bonus-donaciones`).  
  - Checkout además llama a `courseGamificationService.addDonationBonusPoints()` para actualizar el total en localStorage.

- **Leaderboard**  
  - `courseGamificationService.getCampusRankings()` existe pero lee **solo localStorage** (no Supabase). Una página de leaderboard “real” debería leer desde Supabase sumando `points_earned` por usuario (incluyendo la fila `bonus-donaciones`).

---

## 5. Dónde se podría AGREGAR más puntos

Ideas de dónde conectar más lógica de puntos sin tocar lo que ya funciona:

| Lugar / acción | Idea | Cómo (resumen) |
|----------------|------|----------------|
| **Feed** | Puntos por publicar (primera publicación, o por publicaciones que reciben likes/comentarios). | Al crear post (o al recibir interacción), llamar a un “servicio de puntos por actividad” que sume X puntos y persista en Supabase (ej. fila tipo `course_id = 'bonus-feed'`) y en localStorage con algo como `addActivityPoints(userId, points)`. |
| **Comentarios en el feed** | Puntos por comentar (ej. +5 por comentario útil o por N comentarios). | Igual: evento “comentario creado” → servicio de puntos → Supabase + actualización local. |
| **Login / racha** | Puntos por primera vez del día o por racha de días entrando. | Al abrir app / Home, comprobar “último login”; si es nuevo día, sumar puntos y guardar en Supabase (ej. `bonus-racha`) + localStorage. |
| **Completar perfil** | Puntos por completar foto, bio, etc. | Al guardar perfil, si antes estaba incompleto y ahora está completo, sumar puntos (nuevo “logro” en Supabase + local). |
| **Referidos** | Puntos por invitar a otro usuario que se registre. | Tras registro del referido, sumar puntos al referidor (nueva tabla o campo + servicio de puntos). |
| **Envío / recepción XLM** | Puntos por primera transferencia o por cantidad enviada/recibida. | En `Send.tsx` / flujo de receive, tras éxito llamar a servicio de puntos (ej. “bonus-primera-transferencia” o por monto). |
| **Leaderboard** | Página que muestre ranking por puntos. | Nueva ruta que lea de Supabase: `SUM(points_earned) ... GROUP BY user_email ORDER BY total DESC`, mostrando alias o avatar; opcionalmente seguir guardando también en localStorage para coherencia con Home/Profile. |

Para **cualquier nueva fuente de puntos** conviene:

1. **Persistir en Supabase** (ej. una fila en `user_course_progress` con un `course_id` dedicado, como `bonus-feed`, `bonus-racha`, etc., o una tabla específica si prefieres separar “logros” de “cursos”).  
2. **Actualizar el total en localStorage** con algo tipo `courseGamificationService.addDonationBonusPoints()` pero genérico, por ejemplo `addPoints(userId, points, source?)`, para que Home y Profile sigan mostrando el total al instante.  
3. **Invalidar** `queryKey: ['courseProgress']` después de sumar puntos para que la UI se refresque.

---

## 6. Resumen rápido

- **Ganan puntos hoy:** completar cuestionarios (guías) y cada 5 donaciones en el marketplace.  
- **Se muestran en:** Home (insignias + total), Profile (total + badges por curso), CourseDetail (pts por guía y total).  
- **Se guardan en:** localStorage (para la UI) y Supabase `user_course_progress` + `user_donations`.  
- **Para agregar más:** definir la acción (feed, comentarios, racha, perfil, referidos, transferencias, etc.), crear la lógica que sume puntos, persistir en Supabase y actualizar el total en localStorage + invalidar `courseProgress`.

Si quieres, el siguiente paso puede ser elegir **una** de las ideas (por ejemplo “puntos por primera publicación en el feed” o “página de leaderboard desde Supabase”) y bajar eso a pasos concretos de código en tus archivos.
