# ⚡ Despliegue Rápido del Backend en Vercel

## Pasos Rápidos

### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Desplegar
```bash
cd backend
vercel --prod
```

### 4. Configurar Variables de Entorno en Vercel Dashboard

Ve a: https://vercel.com/dashboard > Tu proyecto > Settings > Environment Variables

Agrega:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`
- `ENCRYPTION_KEY`
- `STELLAR_NETWORK=testnet`
- `STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org`
- `SOROBAN_RPC_URL=https://soroban-testnet.stellar.org`

### 5. Redesplegar
```bash
vercel --prod
```

### 6. Configurar Frontend

En el proyecto del frontend en Vercel:
- Agrega variable: `VITE_BACKEND_URL=https://tu-backend-url.vercel.app`
- Redespliega

## ✅ Listo!

Ver documentación completa en `DEPLOY_VERCEL.md`

