# Verificación de correo con Supabase Auth

La app usa **Supabase Auth** para enviar el correo de verificación al crear una cuenta. El usuario debe hacer clic en el enlace antes de poder iniciar sesión.

## Configuración en Supabase Dashboard

1. **Authentication → Providers → Email**
   - Activa **Confirm email** (Confirmar correo).
   - Así, tras `signUp`, Supabase envía un correo y el usuario no puede hacer `signInWithPassword` hasta confirmar.

2. **Authentication → URL Configuration**
   - **Site URL**: la URL de tu app en producción (ej. `https://tu-dominio.com`). En desarrollo puedes usar `http://localhost:5173`.
   - **Redirect URLs**: añade las URLs a las que Supabase puede redirigir tras confirmar el correo, por ejemplo:
     - `http://localhost:5173/login`
     - `http://localhost:5173/login?verified=1`
     - `https://tu-dominio.com/login`
     - `https://tu-dominio.com/login?verified=1`

3. **(Opcional) Authentication → Email Templates**
   - Puedes personalizar el asunto y el cuerpo del correo de confirmación.

## Flujo en la app

1. **Registro**: El usuario completa el formulario de signup → se crea la wallet Stellar y la fila en `usuarios` con `email_verified = false` → se llama a `supabase.auth.signUp()` → Supabase envía el correo. La app muestra “Revisa tu correo” y redirige a `/login`.
2. **Confirmación**: El usuario abre el enlace del correo → Supabase confirma y puede redirigir a `/login?verified=1`. En la app, `onAuthStateChange` marca `email_verified = true` para ese email en `usuarios`.
3. **Login**: Si el usuario intenta entrar sin haber confirmado, Supabase devuelve error y la app muestra “Verifica tu correo” y el botón “Reenviar correo de verificación”. Tras confirmar, el login con email y contraseña funciona.

## Usuarios antiguos (sin Supabase Auth)

Si el usuario está solo en la tabla `usuarios` (registro anterior sin verificación), el login sigue funcionando: primero se intenta Supabase Auth; si falla, se usa la tabla `usuarios` con bcrypt. A esos usuarios se les marca `email_verified = true` al iniciar sesión.

## Migración

La columna `email_verified` se añade en `supabase/migrations/20250217100000_add_email_verified_to_usuarios.sql`. Los usuarios ya existentes quedan con `email_verified = true` por defecto para no bloquearles el acceso.
