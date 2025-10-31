// Configuración para Arbitrum Sepolia (testnet)
export const ARBITRUM_SEPOLIA_CONFIG = {
  chainId: 421614, // Arbitrum Sepolia
  name: 'Arbitrum Sepolia',
  currency: 'ETH',
  rpcUrl: import.meta.env.VITE_ALCHEMY_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
  blockExplorer: 'https://sepolia.arbiscan.io',
};

// Configuración para Arbitrum One (mainnet) - para futuro uso
export const ARBITRUM_ONE_CONFIG = {
  chainId: 42161,
  name: 'Arbitrum One',
  currency: 'ETH',
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  blockExplorer: 'https://arbiscan.io',
};

// Configuración del contrato MXNB
export const MXNB_CONTRACT = {
  address: (import.meta.env.VITE_MXNB_CONTRACT_ADDRESS || '0x...') as string,
  abi: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
  ] as const,
};

// Usar Sepolia como configuración por defecto
export const ARBITRUM_CONFIG = ARBITRUM_SEPOLIA_CONFIG;

export const formatMXNB = (amount: string): string => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(num);
};
