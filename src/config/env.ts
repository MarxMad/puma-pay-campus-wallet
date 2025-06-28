// Configuración de variables de entorno para PumaPay
// Portal MPC + MXNB + Bitso Integration

export const config = {
  // Portal MPC Configuration
  // Obtén estas credenciales del Portal Admin Dashboard
  // Más info: https://docs.portalhq.io/support/mxnb-hackathon-hub
  portal: {
    apiKey: import.meta.env.VITE_PORTAL_API_KEY || 'YOUR_PORTAL_API_KEY',
    // Alchemy RPC URL para Arbitrum Sepolia (opcional, usa endpoint público por defecto)
    alchemyRpcUrl: import.meta.env.VITE_ALCHEMY_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    // Dirección del contrato MXNB en Arbitrum Sepolia
    mxnbContractAddress: import.meta.env.VITE_MXNB_CONTRACT_ADDRESS || '0x...',
    // Chain ID para Arbitrum Sepolia
    chainId: 'eip155:421614',
  },
  
  // Bitso API Configuration (opcional)
  bitso: {
    apiKey: import.meta.env.VITE_BITSO_API_KEY || '',
    apiSecret: import.meta.env.VITE_BITSO_API_SECRET || '',
    baseUrl: 'https://api.bitso.com',
  },
  
  // App Configuration
  app: {
    name: 'PumaPay',
    version: '1.0.0',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  }
};

export default config; 