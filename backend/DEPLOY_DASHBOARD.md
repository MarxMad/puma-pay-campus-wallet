# 🚀 Desplegar Backend desde el Dashboard de Vercel

## Pasos desde el Dashboard

### 1. Preparar el Repositorio

Asegúrate de que tu código esté en GitHub (o GitLab/Bitbucket):

```bash
git add .
git commit -m "Backend listo para Vercel"
git push origin main
```

### 2. Crear Nuevo Proyecto en Vercel

1. Ve a: https://vercel.com/dashboard
2. Haz clic en **"Add New..."** > **"Project"**
3. Si es la primera vez, conecta tu repositorio de GitHub
4. Selecciona el repositorio `puma-pay-campus-wallet`

### 3. Configurar el Proyecto

En la pantalla de configuración:

**Framework Preset:** 
- Selecciona **"Other"** o **"Node.js"**

**Root Directory:**
- Haz clic en **"Edit"** y cambia a: `backend`
- Esto le dice a Vercel que el proyecto está en la carpeta `backend`

**Build Command:**
- Déjalo vacío o pon: `npm install` (Vercel lo hace automáticamente)

**Output Directory:**
- Déjalo vacío (no aplica para backend)

**Install Command:**
- Déjalo vacío (Vercel usa `npm install` por defecto)

### 4. Configurar Variables de Entorno

**ANTES de hacer clic en "Deploy"**, haz clic en **"Environment Variables"**:

Agrega estas variables (las mismas que tienes en tu `.env` local):

#### Variables Requeridas:
```
SUPABASE_URL = tu_supabase_url
SUPABASE_SERVICE_ROLE = tu_service_role_key
ENCRYPTION_KEY = tu_encryption_key
STELLAR_NETWORK = testnet
STELLAR_HORIZON_URL = https://horizon-testnet.stellar.org
SOROBAN_RPC_URL = https://soroban-testnet.stellar.org
```

#### Variables Opcionales (si las usas):
```
STELLAR_ASSET_CODE = XLM
STELLAR_ASSET_ISSUER = (déjalo vacío o null)
BITSO_APIKEY = tu_api_key
BITSO_SECRET_APIKEY = tu_secret_key
JUNO_BASE_URL = https://stage.buildwithjuno.com
```

**IMPORTANTE:** 
- Selecciona los ambientes: ✅ Production, ✅ Preview, ✅ Development
- Haz clic en **"Add"** para cada variable

### 5. Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que termine el despliegue (1-2 minutos)
3. Vercel te dará una URL como: `https://pumapay-backend-xxx.vercel.app`

### 6. Configurar el Frontend

Ahora que tienes la URL del backend:

1. Ve a tu proyecto del **frontend** en Vercel Dashboard
2. Ve a **Settings** > **Environment Variables**
3. Agrega o actualiza:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://tu-backend-url.vercel.app` (la URL que te dio Vercel)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development
4. Haz clic en **"Save"**
5. Ve a **Deployments** y haz clic en **"..."** > **"Redeploy"** en el último deployment

### 7. Verificar

1. **Backend Health Check:**
   - Abre: `https://tu-backend-url.vercel.app/api/health`
   - Deberías ver: `{"success":true,"status":"ok"}`

2. **Frontend:**
   - Abre tu app: `https://puma-pay-campus-wallet.vercel.app`
   - Abre la consola del navegador (F12)
   - Verifica que las peticiones vayan a tu backend de Vercel

## Actualizar el Backend

Cada vez que hagas cambios:

1. Haz commit y push a GitHub:
   ```bash
   git add backend/
   git commit -m "Actualizar backend"
   git push
   ```

2. Vercel detectará automáticamente el cambio y desplegará
3. O ve a Vercel Dashboard > Deployments > "Redeploy"

## Cambiar Variables de Entorno

1. Ve a tu proyecto en Vercel Dashboard
2. **Settings** > **Environment Variables**
3. Edita o agrega las variables que necesites
4. **IMPORTANTE:** Haz clic en **"Redeploy"** para aplicar los cambios

## Solución de Problemas

### Error: "Cannot find module"
- Verifica que `package.json` esté en la carpeta `backend`
- Vercel debería instalar las dependencias automáticamente

### Error: "Build failed"
- Revisa los logs en Vercel Dashboard > Deployments
- Verifica que el **Root Directory** esté configurado como `backend`

### Variables de entorno no funcionan
- Asegúrate de haber redesplegado después de agregar las variables
- Verifica que las variables estén en el ambiente correcto

### CORS Error
- Ya está configurado para aceptar `*.vercel.app`
- Si tienes un dominio personalizado, agrégalo a `allowedOrigins` en `index.js`

## URLs Importantes

- **Backend:** `https://tu-backend-url.vercel.app`
- **Frontend:** `https://puma-pay-campus-wallet.vercel.app`
- **Health Check:** `https://tu-backend-url.vercel.app/api/health`

¡Listo! Ya no necesitas ngrok. 🎉

