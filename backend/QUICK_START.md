# 🚀 Inicio Rápido: Backend Local con ngrok

## Pasos Rápidos

### 1. Instalar ngrok
```bash
# macOS
brew install ngrok/ngrok/ngrok

# O descarga desde: https://ngrok.com/download
```

### 2. Configurar ngrok (solo la primera vez)
```bash
# Obtén tu token en: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken TU_TOKEN_AQUI
```

### 3. Iniciar backend con ngrok
```bash
cd backend
npm run dev:tunnel
```

### 4. Copiar la URL de ngrok
El script mostrará algo como:
```
🌍 URL pública del backend: https://abc123.ngrok.io
```

### 5. Configurar en Vercel
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://abc123.ngrok.io` (la URL que te dio ngrok)
4. Guarda y **redespliega** tu app

## ✅ Listo!

Ahora tu frontend en Vercel se conectará al backend local.

## ⚠️ Importante

- La URL de ngrok cambia cada vez que reinicias (plan gratuito)
- Si cambia, actualiza `VITE_BACKEND_URL` en Vercel y redespliega
- El backend debe estar corriendo para que funcione

## 🔍 Verificar

1. Backend local: http://localhost:4000/api/health
2. Ngrok: https://tu-url.ngrok.io/api/health
3. Frontend: Abre la consola del navegador y verifica las peticiones

## 📚 Documentación Completa

Ver `NGROK_SETUP.md` para más detalles.

