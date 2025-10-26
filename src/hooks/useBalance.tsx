import { useState, useEffect } from 'react';
import { portalService } from '@/services/portal';
import { junoService } from '@/services/junoService';
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

  // Función para recalcular balance basado en transacciones
  const recalculateBalance = () => {
    const rawTransactions = localStorage.getItem('pumapay_transactions');
    console.log(`🔍 Raw localStorage data:`, rawTransactions);
    
    const transactions = JSON.parse(rawTransactions || '[]');
    console.log(`📊 Transacciones parseadas:`, transactions);
    console.log(`📈 Total transacciones encontradas: ${transactions.length}`);
    
    const incomeTransactions = transactions.filter((t: any) => t.type === 'income');
    const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');
    
    console.log(`💚 Ingresos encontrados: ${incomeTransactions.length}`, incomeTransactions);
    console.log(`💸 Gastos encontrados: ${expenseTransactions.length}`, expenseTransactions);
    
    const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const correctBalance = Math.max(totalIncome - totalExpenses, 0);
    
    const newState = {
      balance: correctBalance,
      available: correctBalance,
      isLoading: false,
      lastUpdated: new Date()
    };
    
    setBalanceState(newState);
    localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(newState));
    
    console.log(`💰 Balance recalculado: Ingresos $${totalIncome} - Gastos $${totalExpenses} = $${correctBalance}`);
    
    // Actualizar el contador de transacciones
    localStorage.setItem('pumapay_last_transaction_count', transactions.length.toString());
    
    return correctBalance;
  };

  // Escuchar cuando se agreguen nuevas transacciones para recalcular balance
  useEffect(() => {
    const handleTransactionAdded = (event: CustomEvent) => {
      console.log('🔄 Nueva transacción detectada, recalculando balance...');
      setTimeout(() => {
        console.log('⏱️ Ejecutando recálculo después de delay por evento transactionAdded');
        recalculateBalance();
      }, 300); // Incrementar delay
    };

    const handleForceUpdate = () => {
      console.log('🚀 Forzando actualización de balance...');
      setTimeout(() => {
        console.log('⏱️ Ejecutando recálculo después de delay por forceUpdate');
        recalculateBalance();
      }, 100); // Pequeño delay también aquí
    };

    window.addEventListener('transactionAdded', handleTransactionAdded as EventListener);
    window.addEventListener('forceBalanceUpdate', handleForceUpdate);
    
    return () => {
      window.removeEventListener('transactionAdded', handleTransactionAdded as EventListener);
      window.removeEventListener('forceBalanceUpdate', handleForceUpdate);
    };
  }, []);

  // Función para agregar fondos (depósito) - NO USAR, solo para emergencias
  const addFunds = (amount: number) => {
    console.log(`💸 AddFunds llamado con $${amount} - Recomendamos usar addTransaction en su lugar`);
    
    // Como medida de emergencia, forzar recálculo después de un pequeño delay
    setTimeout(() => {
      recalculateBalance();
    }, 100);
  };

  // Función para enviar dinero (débito)
  const sendMoney = (amount: number) => {
    if (balanceState.available >= amount) {
      // El balance se actualizará automáticamente cuando se agregue la transacción de gasto
      setTimeout(() => {
        recalculateBalance();
      }, 100);
      return true; // Transacción exitosa
    }
    return false; // Fondos insuficientes
  };

  // Función para obtener balance real desde Juno
  const getRealBalanceFromJuno = async (): Promise<number> => {
    try {
      console.log('🔄 Obteniendo balance real desde Juno...');
      const balance = await junoService.getMXNBBalance();
      console.log('💰 Balance real desde Juno:', balance);
      return balance;
    } catch (error) {
      console.error('❌ Error obteniendo balance desde Juno:', error);
      return 0;
    }
  };

  // Función para recargar balance manualmente
  const refreshBalance = async () => {
    setBalanceState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Priorizar balance real de Juno sobre Portal
      const junoBalance = await getRealBalanceFromJuno();
      const portalBalance = await portalService.getMXNBBalance();
      
      // Usar el balance más alto entre Juno y Portal
      const balance = Math.max(
        typeof junoBalance === 'number' ? junoBalance : 0,
        typeof portalBalance === 'number' ? portalBalance : 0
      );
      
      const newState = {
        balance,
        available: balance,
        isLoading: false,
        lastUpdated: new Date()
      };
      
      setBalanceState(newState);
      localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(newState));
      console.log('✅ Balance actualizado:', balance);
    } catch (error) {
      console.error('Error refreshing balance:', error);
      setBalanceState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Al montar, obtener balance real desde Juno y Portal
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isAuthenticated || !user) return;
      
      setBalanceState(prev => ({ ...prev, isLoading: true }));
      try {
        console.log('🔄 Inicializando balance real...');
        
        // Obtener balance desde Juno (fuente de verdad)
        const junoBalance = await getRealBalanceFromJuno();
        
        // Obtener balance desde Portal como backup
        await portalService.onReady();
        const portalBalance = await portalService.getMXNBBalance();
        
        // Usar el balance más alto entre Juno y Portal
        const balance = Math.max(
          typeof junoBalance === 'number' ? junoBalance : 0,
          typeof portalBalance === 'number' ? portalBalance : 0
        );
        
        const newState = {
          balance,
          available: balance,
          isLoading: false,
          lastUpdated: new Date()
        };
        
        setBalanceState(newState);
        localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(newState));
        console.log('✅ Balance inicializado:', { junoBalance, portalBalance, finalBalance: balance });
      } catch (error) {
        console.error('❌ Error inicializando balance:', error);
        setBalanceState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchBalance();
  }, [isAuthenticated, user]);

  return {
    ...balanceState,
    recalculateBalance,
    addFunds,
    sendMoney,
    refreshBalance,
    getRealBalanceFromJuno,
    hasInsufficientFunds: (amount: number) => balanceState.available < amount
  };
}; 