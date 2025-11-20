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

## 📊 Diagramas de Arquitectura

### 1. Arquitectura General del Sistema

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        UI[Interfaz de Usuario]
        Auth[AuthContext]
        Services[Servicios Frontend]
        Portal[Portal SDK]
    end
    
    subgraph "Backend (Node.js + Express)"
        API[API REST]
        Juno[Juno/Bitso Integration]
        Webhooks[Webhook Handler]
    end
    
    subgraph "Blockchain"
        Arbitrum[Arbitrum Sepolia]
        MXNB[MXNB Token Contract]
        PortalMPC[Portal MPC Wallets]
    end
    
    subgraph "Servicios Externos"
        Supabase[Supabase Auth/DB]
        Bitso[Bitso/Juno APIs]
        Bank[SPEI Banking]
    end
    
    UI --> Auth
    UI --> Services
    Services --> Portal
    Services --> API
    Portal --> PortalMPC
    PortalMPC --> Arbitrum
    Arbitrum --> MXNB
    
    API --> Juno
    API --> Supabase
    Juno --> Bitso
    Webhooks --> Juno
    Bitso --> Bank
    
    style UI fill:#3b82f6
    style API fill:#10b981
    style Arbitrum fill:#8b5cf6
    style MXNB fill:#f59e0b
```

### 2. Flujo de Depósito (SPEI → MXNB)

```mermaid
sequenceDiagram
    participant User as Estudiante
    participant App as PumaPay App
    participant Backend as Backend API
    participant Juno as Juno API
    participant Bank as Banco (SPEI)
    participant Blockchain as Arbitrum
    
    User->>App: Solicita CLABE para depósito
    App->>Backend: GET /api/account-details
    Backend->>Juno: Obtener CLABE AUTO_PAYMENT
    Juno-->>Backend: CLABE única del usuario
    Backend-->>App: CLABE para depósito
    App-->>User: Muestra CLABE personal
    
    User->>Bank: Realiza transferencia SPEI
    Bank->>Juno: Depósito recibido
    Juno->>Backend: Webhook de depósito
    Backend->>Juno: Verificar depósito
    Juno->>Blockchain: Mint MXNB tokens
    Blockchain-->>Juno: Tokens minteados
    Juno->>Backend: Confirmación
    Backend->>App: Notificación de balance actualizado
    App-->>User: Balance actualizado en UI
```

### 3. Flujo de Pago/Transferencia

```mermaid
sequenceDiagram
    participant Sender as Usuario A
    participant App as PumaPay App
    participant Portal as Portal SDK
    participant Blockchain as Arbitrum
    participant Receiver as Usuario B
    
    Sender->>App: Inicia transferencia
    App->>App: Valida balance suficiente
    App->>Portal: Prepara transacción
    Portal->>Blockchain: Firma y envía TX
    Blockchain->>Blockchain: Ejecuta transferencia MXNB
    Blockchain-->>Portal: Confirmación on-chain
    Portal-->>App: TX Hash recibido
    App->>App: Actualiza balance local
    App-->>Sender: Pago completado
    
    Blockchain->>Receiver: Tokens recibidos
    Receiver->>App: Consulta balance
    App->>Blockchain: Query balance actualizado
    Blockchain-->>App: Nuevo balance
    App-->>Receiver: Notificación de pago recibido
```

### 4. Flujo de Retiro (MXNB → MXN)

```mermaid
sequenceDiagram
    participant User as Estudiante
    participant App as PumaPay App
    participant Backend as Backend API
    participant Juno as Juno API
    participant Blockchain as Arbitrum
    participant Bank as Banco (SPEI)
    
    User->>App: Solicita retiro a cuenta bancaria
    App->>Backend: POST /api/redeem
    Backend->>Backend: Valida cuenta bancaria registrada
    Backend->>Juno: Inicia redención
    Juno->>Blockchain: Quema tokens MXNB
    Blockchain-->>Juno: Tokens quemados confirmados
    Juno->>Bank: Transferencia SPEI a cuenta bancaria
    Bank-->>Juno: Transferencia completada
    Juno->>Backend: Webhook de redención exitosa
    Backend->>App: Confirmación de retiro
    App-->>User: MXN recibido en cuenta bancaria
```

### 5. Arquitectura de Componentes Frontend

```mermaid
graph TD
    subgraph "App.tsx"
        Router[React Router]
        QueryClient[TanStack Query]
        AuthProvider[AuthProvider]
    end
    
    subgraph "Pages"
        Home[Home Page]
        Send[Send Page]
        Receive[Receive Page]
        Categories[Categories Page]
        Stats[Statistics Page]
    end
    
    subgraph "Components"
        BalanceCard[BalanceCard]
        TransactionHistory[TransactionHistory]
        QuickActions[QuickActions]
        DepositModal[DepositModal]
    end
    
    subgraph "Services"
        PortalService[portalService]
        JunoService[junoService]
        UserService[userService]
        SupabaseService[supabaseClient]
    end
    
    subgraph "Hooks"
        useWallet[useWallet]
        useBalance[useBalance]
        useCategories[useCategories]
    end
    
    Router --> Home
    Router --> Send
    Router --> Receive
    Router --> Categories
    Router --> Stats
    
    Home --> BalanceCard
    Home --> TransactionHistory
    Home --> QuickActions
    
    Send --> DepositModal
    Receive --> DepositModal
    
    BalanceCard --> useBalance
    TransactionHistory --> useWallet
    QuickActions --> useWallet
    
    useBalance --> PortalService
    useBalance --> JunoService
    useWallet --> PortalService
    useCategories --> UserService
    
    UserService --> SupabaseService
    PortalService --> PortalSDK[Portal SDK]
    JunoService --> BackendAPI[Backend API]
    
    style Router fill:#3b82f6
    style PortalService fill:#10b981
    style useWallet fill:#f59e0b
```

### 6. Flujo de Autenticación

```mermaid
sequenceDiagram
    participant User as Usuario
    participant App as PumaPay App
    participant Supabase as Supabase Auth
    participant Portal as Portal SDK
    participant Backend as Backend API
    
    User->>App: Inicia sesión (Google/OAuth)
    App->>Supabase: Autenticación OAuth
    Supabase-->>App: Token de sesión
    App->>App: Guarda sesión en AuthContext
    
    App->>Backend: POST /api/portal/create-client
    Backend->>Portal: Crear Client Session Token
    Portal-->>Backend: Client Session Token
    Backend-->>App: Token de Portal
    
    App->>Portal: Inicializa con Client Session Token
    Portal->>Portal: Crea/Recupera wallet MPC
    Portal-->>App: Wallet configurada
    
    App->>App: Carga datos del usuario
    App->>Supabase: Obtener perfil
    Supabase-->>App: Datos del usuario
    App-->>User: Dashboard cargado
```

### 7. Flujo de Categorización y Presupuesto

```mermaid
graph LR
    subgraph "Transacción"
        TX[Pago Realizado]
    end
    
    subgraph "Categorización"
        Category[Asignar Categoría]
        Budget[Verificar Presupuesto]
        Alert[Generar Alerta]
    end
    
    subgraph "Almacenamiento"
        DB[(Supabase DB)]
        Local[Estado Local]
    end
    
    subgraph "Visualización"
        Stats[Estadísticas]
        Progress[Barra de Progreso]
        Chart[Gráficos]
    end
    
    TX --> Category
    Category --> Budget
    Budget -->|Excede límite| Alert
    Budget --> DB
    DB --> Local
    Local --> Stats
    Stats --> Progress
    Stats --> Chart
    
    style TX fill:#3b82f6
    style Budget fill:#f59e0b
    style Alert fill:#ef4444
    style Stats fill:#10b981
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