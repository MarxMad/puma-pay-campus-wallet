
# PumaPay - Wallet Universitaria

PumaPay es una aplicación wallet diseñada específicamente para pagos universitarios usando la stablecoin MXNB en la red Arbitrum. Permite a estudiantes realizar pagos diarios en cafeterías, papelerías y transporte escolar de manera rápida y segura.

## 🚀 Características Principales

### Integración Blockchain
- **Red Arbitrum**: Transacciones rápidas y económicas
- **Token MXNB**: Stablecoin pareada al peso mexicano
- **Smart Contracts**: Interacción segura con contratos ERC20

### Funcionalidades Core
- 📱 **Pagos Instantáneos**: Transfers P2P y pagos a comercios
- 💰 **Gestión de Saldo**: Visualización en tiempo real de MXNB y MXN fiat
- 🏦 **Integración Bitso**: Depósitos y retiros fiat automáticos
- 📊 **Historial**: Tracking completo de transacciones
- 🔐 **Seguridad**: Wallet connection y manejo seguro de claves

### Experiencia de Usuario
- 🎨 **Diseño Moderno**: UI/UX optimizada para estudiantes mexicanos
- 📱 **Responsive**: Compatible con móviles y desktop
- ⚡ **Onboarding Simple**: Proceso de registro intuitivo
- 🔔 **Notificaciones**: Confirmaciones en tiempo real

## 🛠 Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Shadcn/UI** para componentes
- **Lucide React** para iconografía

### Blockchain
- **Wagmi** para interacción con Ethereum
- **Ethers.js** para operaciones blockchain
- **Arbitrum** como L2 solution
- **MXNB Token** (ERC20) como stablecoin

### APIs Externas
- **Bitso Business API** para fiat gateway
- **Web3Auth** para autenticación simplificada
- **Arbitrum RPC** para conectividad blockchain

## 🏗 Arquitectura del Sistema

```
Frontend (React)
├── Wallet Management (Wagmi/Ethers)
├── UI Components (Shadcn)
└── State Management (React Hooks)

Backend APIs
├── Bitso Integration
├── User Management
└── Transaction Processing

Blockchain Layer
├── Arbitrum Network
├── MXNB Smart Contract
└── Payment Processing
```

## 📦 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- npm/yarn
- Wallet compatible (MetaMask, etc.)

### Setup Local
```bash
# Clonar repositorio
git clone <your-repo-url>
cd pumapay

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar desarrollo
npm run dev
```

### Variables de Entorno Requeridas
```env
VITE_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
VITE_MXNB_CONTRACT_ADDRESS=0x...
VITE_BITSO_API_KEY=your_bitso_key
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
```

## 🔧 Configuración Blockchain

### Red Arbitrum
- **Chain ID**: 42161
- **RPC URL**: https://arb1.arbitrum.io/rpc
- **Block Explorer**: https://arbiscan.io

### Contrato MXNB
```solidity
// Dirección del contrato MXNB en Arbitrum
address constant MXNB_TOKEN = 0x...;

// ABI principales
function balanceOf(address owner) view returns (uint256)
function transfer(address to, uint256 amount) returns (bool)
function approve(address spender, uint256 amount) returns (bool)
```

## 💼 Integración Bitso Business

### Funcionalidades
- **Depósitos**: Conversión MXN → MXNB
- **Retiros**: Conversión MXNB → MXN
- **Cuentas**: Gestión de cuentas fiat por usuario
- **Compliance**: KYC/AML automático

### API Endpoints
```javascript
// Depósito fiat
POST /api/deposits
{
  "user_id": "string",
  "amount": "number",
  "currency": "MXN"
}

// Retiro a banco
POST /api/withdrawals
{
  "user_id": "string", 
  "amount": "number",
  "account_id": "string"
}
```

## 🎯 Roadmap de Desarrollo

### Fase 1 - MVP (Hackathon)
- [x] UI/UX básica
- [x] Conexión wallet
- [x] Pagos MXNB simulados
- [x] Historial de transacciones
- [ ] Integración Arbitrum real
- [ ] Conexión Bitso API

### Fase 2 - Beta
- [ ] QR code payments
- [ ] Multi-merchant integration
- [ ] Push notifications
- [ ] Enhanced security features

### Fase 3 - Producción
- [ ] Campus partnerships
- [ ] Advanced analytics
- [ ] Loyalty programs
- [ ] Cross-chain bridging

## 🏛 Casos de Uso Universitarios

### Para Estudiantes
- 🍕 **Cafeterías**: Pagos rápidos sin efectivo
- 📚 **Papelerías**: Compra de materiales académicos  
- 🚌 **Transporte**: Pago de rutas universitarias
- 👥 **P2P**: Transferencias entre compañeros

### Para Padres
- 💸 **Envío de Fondos**: Depósitos seguros a sus hijos
- 📊 **Monitoreo**: Visibilidad de gastos estudiantiles
- 🔒 **Control**: Límites y restricciones configurables

### Para Comercios
- ⚡ **Pagos Instantáneos**: Settlements en segundos
- 💰 **Menores Comisiones**: Costos reducidos vs. tarjetas
- 📱 **Integración Simple**: API fácil de implementar

## 🛡 Seguridad y Compliance

### Medidas de Seguridad
- 🔐 **Wallet Security**: Claves privadas nunca en servidor
- 🔒 **Transport Layer**: HTTPS y WSS encryption
- 🛡 **Smart Contracts**: Auditorías de seguridad
- 👤 **User Authentication**: Multi-factor authentication

### Compliance
- 📋 **KYC/AML**: Integración con Bitso compliance
- 🏛 **Regulatorio**: Cumplimiento CNBV México
- 📊 **Reporting**: Logs y auditoría completos
- 🔍 **Monitoring**: Detección de actividades sospechosas

## 📈 Métricas y Analytics

### KPIs Principales
- 👥 **Usuarios Activos**: DAU/MAU
- 💰 **Volumen Transaccional**: MXNB procesados
- ⚡ **Velocidad**: Tiempo promedio de transacción
- 🎯 **Adopción**: % penetración por campus

### Dashboard Analytics
- 📊 **Transaction Volume**: Gráficos en tiempo real
- 🗺 **Usage Heatmaps**: Patrones por ubicación  
- 📈 **Growth Metrics**: Tendencias de crecimiento
- 🔄 **Retention**: Análisis de retención usuarios

## 🤝 Partnerships Estratégicos

### Universidades Target
- 🏛 **UNAM**: Campus Ciudad Universitaria
- 🎓 **IPN**: Unidades Zacatenco y Santo Tomás
- 🏫 **UAM**: Campus Xochimilco e Iztapalapa
- 🎨 **La Salle**: Campus Benjamín Franklin

### Comercios Campus
- ☕ **Cafeterías**: Starbucks, cafés locales
- 📚 **Librerías**: Gandhi, Porrúa, locales
- 🚌 **Transporte**: Rutas y sistemas públicos
- 🏪 **Tiendas**: OXXO, 7-Eleven, locales

## 🚀 Despliegue y Distribución

### Deployment Stack
- **Frontend**: Vercel/Netlify
- **Backend**: Railway/Render  
- **Database**: PostgreSQL
- **Cache**: Redis
- **CDN**: Cloudflare

### Distribución
- 📱 **PWA**: Progressive Web App
- 🌐 **Web Access**: Campus portals
- 📲 **QR Codes**: Onboarding físico
- 📧 **Email**: Campañas dirigidas

## 📞 Soporte y Documentación

### Para Desarrolladores
- 📖 **API Docs**: Documentación completa
- 🔧 **SDKs**: JavaScript/React SDK
- 💻 **Sandbox**: Ambiente de pruebas
- 🐛 **Issue Tracking**: GitHub Issues

### Para Usuarios
- ❓ **FAQ**: Preguntas frecuentes
- 📞 **Support**: Chat en vivo
- 🎥 **Tutorials**: Videos explicativos
- 📱 **In-App Help**: Guías contextuales

---

## 🏆 Equipo y Contacto

**PumaPay Team**
- 💼 **Business**: [team@pumapay.mx](mailto:team@pumapay.mx)
- 🛠 **Technical**: [dev@pumapay.mx](mailto:dev@pumapay.mx)
- 🤝 **Partnerships**: [partners@pumapay.mx](mailto:partners@pumapay.mx)

**Social Media**
- 🐦 Twitter: [@PumaPayMX](https://twitter.com/PumaPayMX)
- 📘 LinkedIn: [PumaPay](https://linkedin.com/company/pumapay)
- 📱 Discord: [PumaPay Community](https://discord.gg/pumapay)

---

*PumaPay - Revolucionando los pagos universitarios en México 🇲🇽*
