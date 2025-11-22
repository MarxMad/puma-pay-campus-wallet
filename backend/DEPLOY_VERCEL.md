# 🚀 Desplegar Backend en Vercel

## ¿Por qué desplegar el backend en Vercel?

- ✅ **No necesitas ngrok** - Todo funciona directamente
- ✅ **URL fija** - No cambia cada vez que reinicias
- ✅ **Más rápido** - Sin latencia adicional del túnel
- ✅ **Más seguro** - HTTPS nativo
- ✅ **Gratis** - Vercel tiene un plan gratuito generoso

## Pasos para Desplegar

### 1. Instalar Vercel CLI (si no lo tienes)

```bash
npm i -g vercel
```

### 2. Iniciar sesión en Vercel

```bash
vercel login
```

### 3. Desplegar el Backend

```bash
cd backend
vercel
```

Sigue las instrucciones:
- **Set up and deploy?** → `Y`
- **Which scope?** → Tu cuenta/organización
- **Link to existing project?** → `N` (o `Y` si ya tienes uno)
- **Project name?** → `pumapay-backend` (o el nombre que prefieras)
- **Directory?** → `./` (enter)
- **Override settings?** → `N`

### 4. Configurar Variables de Entorno

Después del despliegue, Vercel te dará una URL como:
```
https://pumapay-backend.vercel.app
```

Ahora configura las variables de entorno:

#### Opción A: Desde la CLI
```bash
cd backend
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE
vercel env add ENCRYPTION_KEY
vercel env add STELLAR_NETWORK
# ... y todas las demás que necesites
```

#### Opción B: Desde el Dashboard (Recomendado)

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto `pumapay-backend`
3. Ve a **Settings** > **Environment Variables**
4. Agrega todas las variables necesarias:

**Variables Requeridas:**
```
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE=tu_service_role_key
ENCRYPTION_KEY=tu_encryption_key
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

**Variables Opcionales (si las usas):**
```
STELLAR_ASSET_CODE=XLM
STELLAR_ASSET_ISSUER=null
BITSO_APIKEY=tu_api_key
BITSO_SECRET_APIKEY=tu_secret_key
JUNO_BASE_URL=https://stage.buildwithjuno.com
```

5. **IMPORTANTE:** Selecciona los ambientes donde aplicar (Production, Preview, Development)
6. Guarda

### 5. Redesplegar

Después de agregar las variables de entorno:

```bash
cd backend
vercel --prod
```

O desde el Dashboard, haz clic en **Redeploy** en el último deployment.

### 6. Configurar el Frontend

Ahora que el backend está desplegado, actualiza el frontend:

1. Ve a tu proyecto del frontend en Vercel
2. **Settings** > **Environment Variables**
3. Agrega o actualiza:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://pumapay-backend.vercel.app` (la URL de tu backend)
   - **Environment:** Production, Preview, Development
4. Guarda y **redespliega** el frontend

### 7. Verificar que Funciona

1. **Backend Health Check:**
   ```bash
   curl https://pumapay-backend.vercel.app/api/health
   ```

2. **Frontend:**
   - Abre tu app en Vercel
   - Abre la consola del navegador
   - Verifica que las peticiones vayan a `https://pumapay-backend.vercel.app`

## Estructura del Proyecto

Vercel necesita que el `vercel.json` esté en la raíz del proyecto que despliegas. Ya está configurado en `backend/vercel.json`.

## Actualizar el Backend

Cada vez que hagas cambios:

```bash
cd backend
vercel --prod
```

O simplemente haz push a git si tienes integración con GitHub:

```bash
git add .
git commit -m "Actualizar backend"
git push
```

Vercel desplegará automáticamente si tienes la integración configurada.

## Solución de Problemas

### Error: "Cannot find module"
- Verifica que todas las dependencias estén en `package.json`
- Vercel instala automáticamente con `npm install`

### Error: "Function timeout"
- El timeout por defecto es 10s, configurado a 30s en `vercel.json`
- Si necesitas más, aumenta `maxDuration` en `vercel.json`

### Error de CORS
- Verifica que el dominio del frontend esté en la lista de `allowedOrigins` en `index.js`
- Ya está configurado para aceptar `*.vercel.app`

### Variables de entorno no funcionan
- Asegúrate de haber redesplegado después de agregar las variables
- Verifica que las variables estén en el ambiente correcto (Production/Preview/Development)

## URLs Importantes

- **Backend:** `https://pumapay-backend.vercel.app`
- **Frontend:** `https://puma-pay-campus-wallet.vercel.app`
- **Health Check:** `https://pumapay-backend.vercel.app/api/health`
- **API Info:** `https://pumapay-backend.vercel.app/api/info`

## Próximos Pasos

1. ✅ Backend desplegado en Vercel
2. ✅ Frontend configurado para usar el backend de Vercel
3. ✅ Variables de entorno configuradas
4. ✅ Todo funcionando sin ngrok

¡Listo! Ya no necesitas ngrok. 🎉

