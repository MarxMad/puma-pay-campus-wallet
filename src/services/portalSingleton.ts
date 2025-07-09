import Portal from '@portal-hq/web';

const portal = new Portal({
  apiKey: import.meta.env.VITE_PORTAL_API_KEY!,
  autoApprove: true,
  rpcConfig: {
    'eip155:421614': import.meta.env.VITE_ALCHEMY_RPC_URL!,
  },
});

export default portal; 