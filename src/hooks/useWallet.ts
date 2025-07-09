import { useState, useEffect } from 'react';
import { WalletBalance, Transaction, User } from '@/types/wallet';
import Portal from '@portal-hq/web';

const portal = new Portal({
  apiKey: import.meta.env.VITE_PORTAL_API_KEY!,
  autoApprove: true,
  rpcConfig: {
    'eip155:421614': import.meta.env.VITE_ALCHEMY_RPC_URL!,
  },
});

export const useWallet = () => {
  const [balance, setBalance] = useState<WalletBalance>({
    mxnb: '2450.50',
    fiat: '1200.00'
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'payment',
      amount: '85.50',
      currency: 'MXNB',
      merchant: 'Cafetería Central',
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed',
      hash: '0x123...abc'
    },
    {
      id: '2',
      type: 'deposit',
      amount: '500.00',
      currency: 'MXN',
      timestamp: new Date(Date.now() - 7200000),
      status: 'completed'
    },
    {
      id: '3',
      type: 'payment',
      amount: '32.00',
      currency: 'MXNB',
      merchant: 'Transporte Universitario',
      timestamp: new Date(Date.now() - 10800000),
      status: 'completed',
      hash: '0x456...def'
    }
  ]);

  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@alumno.unam.mx',
    wallet_address: '0x742d35Cc9A3C9E3C8...1234',
    university: 'UNAM',
    student_id: '318123456'
  });

  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId] = useState<string>('eip155:421614'); // Arbitrum Sepolia

  const connectWallet = async () => {
    setIsLoading(true);
    // Simulate wallet connection
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
    }, 2000);
  };

  const sendPayment = async (to: string, amount: string, concept: string) => {
    setIsLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'payment',
        amount,
        currency: 'MXNB',
        merchant: concept,
        timestamp: new Date(),
        status: 'completed',
        hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 8)}`
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Update balance
      const currentBalance = parseFloat(balance.mxnb);
      const newBalance = currentBalance - parseFloat(amount);
      setBalance(prev => ({ ...prev, mxnb: newBalance.toString() }));
      
      setIsLoading(false);
    }, 3000);
  };

  const depositFiat = async (amount: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount,
        currency: 'MXN',
        timestamp: new Date(),
        status: 'completed'
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Convert MXN to MXNB (1:1 ratio for demo)
      const currentBalance = parseFloat(balance.mxnb);
      const newBalance = currentBalance + parseFloat(amount);
      setBalance(prev => ({ ...prev, mxnb: newBalance.toString() }));
      
      setIsLoading(false);
    }, 2000);
  };

  const createWallet = async () => {
    setIsLoading(true);
    try {
      const address = await portal.createWallet();
      setWalletAddress(address);
      setIsConnected(true);
      setIsLoading(false);
      return address;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  return {
    balance,
    transactions,
    user,
    isConnected,
    isLoading,
    connectWallet,
    sendPayment,
    depositFiat,
    createWallet,
    walletAddress,
    chainId,
  };
};
