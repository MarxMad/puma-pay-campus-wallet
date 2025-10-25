# PumaPay Campus Wallet 🏛️

Una wallet digital universitaria moderna que permite a los estudiantes de la UNAM realizar pagos con tokens MXNB (Mexican Peso Backed) en el campus universitario.

## 🌟 Características Principales

### 💰 Gestión de Dinero Digital
- **Tokens MXNB**: Utiliza tokens respaldados por pesos mexicanos en la blockchain Arbitrum
- **Depósitos SPEI**: Convierte automáticamente MXN a MXNB mediante depósitos bancarios
- **Retiros Bancarios**: Convierte MXNB de vuelta a MXN en tu cuenta bancaria
- **Balance en Tiempo Real**: Visualización instantánea de saldos y transacciones

### 🏫 Ecosistema Universitario
- **Mapa del Campus**: Descubre lugares que aceptan PumaPay en Ciudad Universitaria
- **Descuentos Exclusivos**: Hasta 30% de descuento en comercios afiliados
- **QR Codes**: Pagos rápidos escaneando códigos QR
- **Categorización**: Organiza gastos por categorías (comida, transporte, libros, etc.)

### 📊 Análisis Financiero
- **Presupuesto Mensual**: Control de gastos con límites personalizables
- **Estadísticas Detalladas**: Gráficos de gastos por categoría y tiempo
- **Historial Completo**: Seguimiento de todas las transacciones
- **Progreso Visual**: Barras de progreso y métricas en tiempo real

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo rápido
- **Tailwind CSS** para estilos
- **Radix UI** para componentes accesibles
- **React Router** para navegación
- **TanStack Query** para manejo de estado del servidor

### Backend
- **Node.js** con Express
- **Juno APIs** para integración blockchain
- **Bitso/Juno** para manejo de tokens MXNB
- **Webhooks** para notificaciones en tiempo real

### Blockchain
- **Arbitrum Sepolia** (testnet)
- **Portal SDK** para wallets MPC (Multi-Party Computation)
- **MXNB Tokens** respaldados por pesos mexicanos

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 16+ 
- npm o yarn
- Cuenta de Bitso/Juno para APIs
- Wallet de Ethereum (MetaMask recomendado)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/puma-pay-campus-wallet.git
cd puma-pay-campus-wallet
```

### 2. Instalar Dependencias
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 3. Configurar Variables de Entorno

#### Frontend (.env)
```env
VITE_PORTAL_API_KEY=tu_portal_api_key
VITE_ALCHEMY_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
VITE_MXNB_CONTRACT_ADDRESS=0x...
VITE_BACKEND_URL=http://localhost:4000
```

#### Backend (.env)
```env
BITSO_APIKEY=tu_bitso_api_key
BITSO_SECRET_APIKEY=tu_bitso_secret
NODE_ENV=development
PORT=4000
```

### 4. Ejecutar en Desarrollo

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## 📱 Funcionalidades Detalladas

### 🏠 Dashboard Principal
- **Balance MXNB**: Saldo actual en tiempo real
- **CLABE Personal**: Para recibir depósitos SPEI
- **Gráfico Semanal**: Visualización de gastos por día
- **Acciones Rápidas**: Enviar y recibir dinero
- **Transacciones Recientes**: Historial de movimientos

### 💸 Gestión de Pagos
- **Enviar Dinero**: Transferencias a otros estudiantes
- **Recibir Dinero**: Generar códigos QR para cobros
- **Pagos en Campus**: Escanear QR en comercios afiliados
- **Historial Completo**: Todas las transacciones con detalles

### 🗺️ Mapa del Campus
- **Lugares Afiliados**: Comercios que aceptan PumaPay
- **Descuentos Activos**: Ofertas especiales por ubicación
- **Navegación**: Integración con Google Maps
- **Filtros**: Por tipo de comercio (comida, libros, deportes, etc.)

### 📊 Categorías y Presupuesto
- **Categorías Personalizables**: Crear y editar categorías de gastos
- **Presupuesto Global**: Límite mensual configurable
- **Progreso Visual**: Barras de progreso por categoría
- **Alertas**: Notificaciones cuando se excede el presupuesto

### 📈 Estadísticas
- **Gastos por Categoría**: Distribución de gastos
- **Tendencias Temporales**: Evolución de gastos en el tiempo
- **Comparativas**: Mes actual vs meses anteriores
- **Exportar Datos**: Descargar reportes en PDF

## 🔧 APIs y Servicios

### Juno APIs (Bitso)
- **Issuance**: Creación de tokens MXNB desde depósitos SPEI
- **Redemption**: Conversión de MXNB a MXN
- **Balance**: Consulta de saldos en tiempo real
- **Transacciones**: Historial completo de movimientos

### Portal SDK
- **Wallet MPC**: Creación automática de wallets
- **Transacciones On-chain**: Envío de tokens MXNB
- **Balance Real**: Consulta de balances desde blockchain
- **Recovery**: Recuperación de wallets con contraseña

## 🏗️ Arquitectura del Proyecto

```
puma-pay-campus-wallet/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── pages/              # Páginas principales
│   ├── services/           # Servicios de API
│   ├── hooks/              # Custom hooks
│   ├── contexts/           # Context providers
│   ├── types/              # Definiciones TypeScript
│   └── lib/                # Utilidades
├── backend/
│   ├── index.js           # Servidor Express
│   ├── bitso-webhook.js   # Webhooks de Bitso
│   └── package.json
├── public/                   # Assets estáticos
└── api/                    # Endpoints de Vercel
```

## 🔐 Seguridad

- **Wallets MPC**: Sin necesidad de manejar claves privadas
- **Autenticación OAuth**: Login con Google/Apple
- **Validación CLABE**: Verificación de cuentas bancarias mexicanas
- **Webhooks Seguros**: Notificaciones encriptadas
- **Rate Limiting**: Protección contra ataques

## 🚀 Deployment

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy frontend
vercel

# Deploy backend
cd backend
vercel
```

### Variables de Entorno en Producción
```env
# Frontend
VITE_PORTAL_API_KEY=prod_portal_key
VITE_BACKEND_URL=https://tu-backend.vercel.app

# Backend
BITSO_APIKEY=prod_bitso_key
BITSO_SECRET_APIKEY=prod_bitso_secret
NODE_ENV=production
```

## 📚 Documentación de APIs

### Endpoints Principales

#### Issuance (Minteo)
- `GET /api/account-details` - Obtener CLABEs para depósitos
- `POST /api/mock-deposit` - Crear depósito mock (testing)

#### Balance y Transacciones
- `GET /api/balance` - Obtener balance MXNB
- `GET /api/transactions` - Historial de transacciones

#### Redemption (Canje)
- `GET /api/bank-accounts` - Cuentas bancarias registradas
- `POST /api/register-bank` - Registrar cuenta bancaria
- `POST /api/redeem` - Redimir tokens MXNB

#### Utilidades
- `GET /api/health` - Health check
- `GET /api/info` - Información de endpoints

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/puma-pay-campus-wallet/issues)
- **Documentación**: [Wiki del Proyecto](https://github.com/tu-usuario/puma-pay-campus-wallet/wiki)
- **Email**: soporte@pumapay.mx

## 🎯 Roadmap

### Versión 1.1
- [ ] Integración con más universidades
- [ ] Pagos con tarjeta de crédito
- [ ] Notificaciones push
- [ ] Modo offline

### Versión 1.2
- [ ] Marketplace universitario
- [ ] Sistema de recompensas
- [ ] Integración con transporte público
- [ ] API pública para desarrolladores

## 🙏 Agradecimientos

- **UNAM** por el apoyo institucional
- **Bitso/Juno** por las APIs de blockchain
- **Portal** por el SDK de wallets MPC
- **Comunidad** de desarrolladores blockchain

---

**PumaPay Campus Wallet** - Revolucionando los pagos universitarios con tecnología blockchain 🚀

*Desarrollado con ❤️ para la comunidad universitaria mexicana*