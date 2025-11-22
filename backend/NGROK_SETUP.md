# Configuración de ngrok para Backend Local

Este documento explica cómo configurar ngrok para exponer el backend local a internet, permitiendo que el frontend desplegado en Vercel se conecte al backend corriendo en tu máquina local.

## ¿Por qué usar ngrok?

Cuando despliegas el frontend en Vercel pero quieres que el backend corra localmente (por ejemplo, para desarrollo o pruebas), necesitas exponer tu backend local a internet. ngrok crea un túnel seguro que permite esto.

## Requisitos Previos

1. **Node.js** instalado (versión 16 o superior)
2. **Cuenta de ngrok** (gratuita): https://dashboard.ngrok.com/signup
3. **ngrok CLI** instalado

## Instalación de ngrok

### macOS (usando Homebrew)
```bash
brew install ngrok/ngrok/ngrok
```

### Windows (usando Chocolatey)
```bash
choco install ngrok
```

### Linux / Otras plataformas
Descarga desde: https://ngrok.com/download

### Instalación manual
1. Descarga ngrok desde https://ngrok.com/download
2. Extrae el archivo
3. Mueve el ejecutable a tu PATH o úsalo directamente

## Configuración Inicial

1. **Obtén tu authtoken de ngrok:**
   - Ve a https://dashboard.ngrok.com/get-started/your-authtoken
   - Copia tu authtoken

2. **Configura el token:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

## Uso

### Opción 1: Usar el script automatizado (Recomendado)

```bash
cd backend
npm run dev:tunnel
```

Este script:
- Inicia el backend en el puerto 4000
- Inicia ngrok automáticamente
- Muestra la URL pública que puedes usar en Vercel

### Opción 2: Iniciar manualmente

1. **Inicia el backend:**
   ```bash
   cd backend
   npm start
   # O para desarrollo con auto-reload:
   npm run dev
   ```

2. **En otra terminal, inicia ngrok:**
   ```bash
   ngrok http 4000
   ```

3. **Copia la URL HTTPS** que ngrok muestra (algo como `https://abc123.ngrok.io`)

## Configurar Vercel

Una vez que tengas la URL de ngrok, configura el frontend en Vercel:

### Opción 1: Variable de entorno en Vercel Dashboard

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Ve a **Settings** > **Environment Variables**
3. Agrega una nueva variable:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://tu-url-ngrok.ngrok.io` (sin `/api` al final)
   - **Environment:** Production, Preview, Development (según necesites)
4. Guarda y **redespliega** tu aplicación

### Opción 2: Usar archivo `.env` local (solo para desarrollo)

Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_BACKEND_URL=https://tu-url-ngrok.ngrok.io
```

⚠️ **Nota:** Este archivo NO debe subirse a git. Ya debería estar en `.gitignore`.

## Verificar la Configuración

1. **Verifica que el backend esté corriendo:**
   ```bash
   curl http://localhost:4000/api/health
   ```

2. **Verifica que ngrok esté funcionando:**
   ```bash
   curl https://tu-url-ngrok.ngrok.io/api/health
   ```

3. **Verifica en el frontend:**
   - Abre la consola del navegador en tu app de Vercel
   - Deberías ver que las peticiones van a la URL de ngrok

## URLs de ngrok

⚠️ **IMPORTANTE:** Con el plan gratuito de ngrok, la URL cambia cada vez que reinicias ngrok. Si necesitas una URL fija, considera:

1. **Plan de pago de ngrok** (URLs fijas)
2. **Alternativas gratuitas:**
   - **Cloudflare Tunnel** (gratis, URLs fijas)
   - **localtunnel** (gratis, pero URLs cambian)
   - **serveo.net** (gratis, pero menos confiable)

## Solución de Problemas

### Error: "ngrok: command not found"
- Asegúrate de que ngrok esté instalado y en tu PATH
- Verifica con: `ngrok version`

### Error: "authtoken not configured"
- Ejecuta: `ngrok config add-authtoken YOUR_TOKEN`
- Verifica tu token en: https://dashboard.ngrok.com/get-started/your-authtoken

### Error de CORS en el navegador
- Verifica que el backend esté configurado para aceptar tu dominio de Vercel
- El backend ya está configurado para aceptar URLs de ngrok automáticamente

### El frontend no se conecta al backend
1. Verifica que ngrok esté corriendo: `curl http://localhost:4040/api/tunnels`
2. Verifica que la variable `VITE_BACKEND_URL` esté configurada correctamente en Vercel
3. Verifica que hayas redesplegado después de cambiar las variables de entorno
4. Revisa la consola del navegador para ver errores específicos

### La URL de ngrok cambió
- Con el plan gratuito, esto es normal
- Actualiza `VITE_BACKEND_URL` en Vercel con la nueva URL
- Redespliega la aplicación

## Firmar Transacciones de Stellar

Las transacciones de Stellar se firman en el backend usando las secret keys almacenadas de forma encriptada. El flujo es:

1. El frontend envía una solicitud de transacción al backend
2. El backend obtiene la secret key del usuario (desencriptada)
3. El backend construye y firma la transacción
4. El backend envía la transacción a la red Stellar

**No es necesario firmar transacciones en el frontend** - todo se maneja de forma segura en el backend.

## Seguridad

⚠️ **IMPORTANTE:** 
- Nunca compartas tu URL de ngrok públicamente
- El backend local tiene acceso a las secret keys de los usuarios
- Solo usa esto para desarrollo y pruebas
- Para producción, despliega el backend en un servidor seguro

## Próximos Pasos

Una vez que todo funcione:
1. Considera desplegar el backend en un servicio como Railway, Render, o Fly.io
2. Configura un dominio personalizado
3. Usa HTTPS con certificados SSL válidos
4. Configura variables de entorno de producción

