import { useState, useEffect } from 'react';
import { portalService } from '@/services/portal';
import { useAuth } from '@/contexts/AuthContext';

const BALANCE_STORAGE_KEY = 'pumapay_mxnb_balance';

export interface BalanceState {
  balance: number;
  available: number;
  isLoading: boolean;
  lastUpdated: Date;
}

// Función para forzar reset completo de datos
export const forceResetAllData = () => {
  // Borrar TODOS los datos relacionados con PumaPay
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.startsWith('pumapay_') || 
    key.includes('puma') || 
    key.includes('balance') ||
    key.includes('mxnb') ||
    key.includes('transaction')
  );
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Establecer datos iniciales limpios
  const zeroBalance = {
    balance: 0,
    available: 0,
    isLoading: false,
    lastUpdated: new Date()
  };
  localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(zeroBalance));
  localStorage.setItem('pumapay_transactions', JSON.stringify([]));
  
  const cleanBudget = {
    monthlyLimit: 2500, // Forzar $2500 no $5000
    currentSpent: 0,
    month: new Date().toISOString().slice(0, 7)
  };
  localStorage.setItem('pumapay_global_budget', JSON.stringify(cleanBudget));
  
  // Marcar como limpio
  localStorage.setItem('pumapay_initialized', 'true');
  localStorage.setItem('pumapay_force_reset', Date.now().toString());
  
  console.log('🎉 FORCE RESET: Balance en $0.00, presupuesto $2500');
  
  return zeroBalance;
};

export const useBalance = () => {
  const [balanceState, setBalanceState] = useState<BalanceState>({
    balance: 0,
    available: 0,
    isLoading: true,
    lastUpdated: new Date()
  });
  
  const { user, isAuthenticated } = useAuth();

  // Eliminar recalculateBalance del flujo principal, solo dejarlo para compatibilidad si se usa en otros lados
  const recalculateBalance = async () => {
    await refreshBalance();
  };

  // Función para recargar balance manualmente
  const refreshBalance = async () => {
    setBalanceState(prev => ({ ...prev, isLoading: true }));
    try {
      await portalService.onReady();
      const portalBalance = await portalService.getMXNBBalance();
      const balance = typeof portalBalance === 'number' ? portalBalance : 0;
      const newState = {
        balance,
        available: balance,
        isLoading: false,
        lastUpdated: new Date()
      };
      setBalanceState(newState);
    } catch (error) {
      console.error('Error refreshing balance:', error);
      setBalanceState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Al montar, obtener balance real de Portal SDK (esperando onReady)
  useEffect(() => {
    refreshBalance();
  }, []);

  // Escuchar cuando se agreguen nuevas transacciones para refrescar balance real
  useEffect(() => {
    const handleUpdate = () => {
      refreshBalance();
    };
    window.addEventListener('transactionAdded', handleUpdate);
    window.addEventListener('forceBalanceUpdate', handleUpdate);
    return () => {
      window.removeEventListener('transactionAdded', handleUpdate);
      window.removeEventListener('forceBalanceUpdate', handleUpdate);
    };
  }, []);

  // Función para agregar fondos (depósito) - NO USAR, solo para compatibilidad
  const addFunds = async (amount: number) => {
    await refreshBalance();
  };

  // Función para enviar dinero (débito) - solo refresca balance
  const sendMoney = async (amount: number) => {
    await refreshBalance();
    return true;
  };

  return {
    ...balanceState,
    recalculateBalance,
    addFunds,
    sendMoney,
    refreshBalance,
    hasInsufficientFunds: (amount: number) => balanceState.available < amount
  };
}; 