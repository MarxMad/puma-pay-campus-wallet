# Medidas de seguridad – PumaPay Campus Wallet

Resumen de lo que ya está implementado y qué más se puede hacer para endurecer la app.

---

## 1. Ya implementado

| Área | Medida | Dónde |
|------|--------|--------|
| **Feed** | Sanitización de contenido (XSS), longitud máxima, validación de UUID en postId | `src/utils/feedSanitize.ts`, `feedService.ts` |
| **Claves** | Clave Stellar/API en variables de entorno, no hardcodeada | `import.meta.env`, `.env` |
| **Wallet** | Clave secreta cifrada en cliente (CryptoJS) antes de guardar | `stellarService.ts`, flujo de CLABE |
| **RLS** | Row Level Security habilitado en todas las tablas sensibles | Migraciones `feed_posts`, `feed_comments`, `user_course_progress`, `user_donations` |
| **HTTPS** | En producción se debe servir siempre por HTTPS | Despliegue / hosting |
| **Navegación** | Rutas protegidas para usuarios no autenticados | `ProtectedRoute.tsx` |

---

## 2. Mejoras recomendadas (por prioridad)

### 2.1 RLS por usuario (alta prioridad)

Hoy las políticas usan `using (true)` y `with check (true)`, es decir: cualquiera con la clave anónima de Supabase puede leer y escribir cualquier fila. Eso permite suplantar a otro usuario (p. ej. escribir en `feed_posts` o `user_course_progress` con un `user_email` ajeno).

**Opciones:**

- **A) Supabase Auth:** Si en el futuro se usa Supabase Auth (magic link, OTP, OAuth), el JWT incluye el usuario. Se pueden definir políticas que restrinjan por `auth.uid()` o por un claim personalizado (p. ej. email).
- **B) Backend / Edge Functions:** La app no envía la anon key al cliente; el cliente llama a una Edge Function (o API propia) con sesión/cookie. El backend verifica la sesión, obtiene el email del usuario y hace el insert/update en Supabase con la service role (o con un token que lleve el email en un claim). Así RLS puede seguir siendo estricto en backend.
- **C) Políticas por columna:** Si el cliente siempre envía el JWT (p. ej. con custom claim `email`), en Supabase se puede usar `auth.jwt() ->> 'email'` en las políticas para restringir que solo se lean/escriban filas donde `user_email = auth.jwt() ->> 'email'`. Eso requiere que el login emita un JWT que Supabase acepte (custom JWT con el mismo secret que Supabase).

**Acción sugerida:** Decidir si se migra a Supabase Auth o se introduce una capa backend/Edge Function; luego añadir una migración que reemplace las políticas actuales por políticas que usen el usuario autenticado (por `auth.uid()` o por claim `email`).

---

### 2.2 Content Security Policy (CSP)

Reduce el impacto de XSS limitando qué scripts, estilos y conexiones puede cargar la página.

**Implementado:** Cabecera CSP en `index.html` (ver sección 4 más abajo). En producción conviene servirla también por cabecera HTTP desde el servidor para tener control más fino (report-uri, nonces, etc.).

---

### 2.3 Límite de tasa (rate limiting)

Evita abuso: muchos posts, comentarios o intentos de envío de XLM desde un mismo cliente o IP.

- **En cliente (implementado):** Throttling en `src/utils/rateLimit.ts`: publicaciones 1 cada 15 s, comentarios 1 cada 5 s, envío XLM 1 cada 10 s. Usado en `Feed.tsx` y `Send.tsx`. Mejora la UX y frena scripts triviales.
- **En servidor:** Rate limit real por IP o por usuario (Supabase Edge Functions, API propia o proxy). Es la única forma de no depender del cliente.

**Acción sugerida:** En producción añadir rate limit en backend/Edge Functions para operaciones sensibles.

---

### 2.4 Operaciones sensibles vía backend

Las operaciones más sensibles (p. ej. registrar donación, actualizar progreso con puntos, enviar XLM por backend si se usa) deberían pasar por una Edge Function o API que:

1. Verifique sesión o token.
2. Obtenga el usuario (email/id) del lado servidor.
3. Escriba en Supabase (o en Stellar) con la identidad correcta.

Así se evita que un cliente manipulado envíe datos con otro `user_email`.

---

### 2.5 No exponer datos sensibles en build

- Asegurar que `.env` y `.env.local` estén en `.gitignore`.
- En Vite, solo las variables con prefijo `VITE_` se exponen al cliente. No usar `VITE_` para la clave secreta de Stellar ni para la service role de Supabase.
- Revisar que en el build no se incluyan claves en el bundle (p. ej. buscando cadenas como `sk_`, `S...` para Stellar).

---

### 2.6 Otras buenas prácticas

- **Auditoría:** En tablas críticas (donaciones, progreso) considerar una columna `created_at` (ya la tienen) y, si hace falta, `ip` o `user_agent` para soporte/auditoría (opcional y según privacidad).
- **Backup:** Configurar backups automáticos de Supabase.
- **CORS:** Dejar restringido en Supabase a los orígenes de la app en producción.
- **Dependencias:** Revisar con `npm audit` / `yarn audit` y actualizar dependencias con vulnerabilidades conocidas.

---

## 3. Resumen de prioridades

| Prioridad | Medida | Esfuerzo |
|-----------|--------|----------|
| Alta | RLS por usuario (con Auth o backend) | Medio/Alto |
| Media | CSP | Hecho en HTML; en servidor bajo |
| Media | Rate limit en cliente (Feed, Send) | Bajo |
| Media | Operaciones sensibles por Edge Function/API | Medio |
| Baja | Revisión env/build y auditoría/backups | Bajo |

---

## 4. Cambios realizados en código (CSP)

En `index.html` se añadió una meta CSP que:

- Restringe scripts a `'self'` y a `'unsafe-inline'` (necesario con Vite en desarrollo; en producción se puede sustituir por nonces).
- Permite conexiones a Supabase, Horizon y dominios necesarios para la app.
- Bloquea `object`, `embed`, `base` para reducir vectores de XSS.

Ajustar dominios según el entorno (staging/producción) y, si es posible, servir CSP por cabecera HTTP con `Content-Security-Policy` para poder usar `report-uri` o `report-to`.
