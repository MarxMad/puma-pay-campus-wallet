
export const ARBITRUM_CONFIG = {
  chainId: 42161,
  name: 'Arbitrum One',
  currency: 'ETH',
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  blockExplorer: 'https://arbiscan.io',
};

export const MXNB_CONTRACT = {
  address: '0x...' as const, // MXNB contract address on Arbitrum
  abi: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
  ] as const,
};

export const formatMXNB = (amount: string): string => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(num);
};
