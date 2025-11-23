import { useState, useEffect, useCallback, useRef } from 'react';
// ⚠️ COMENTADO - Ahora usamos Stellar
// import { portalService } from '@/services/portal';
// import { junoService } from '@/services/junoService';
// import { ethersBalanceService } from '@/services/ethersBalance';
import { useAuth } from '@/contexts/AuthContext';
import { stellarService } from '@/services/stellarService';

// Función para obtener la clave de balance específica por usuario
const getBalanceStorageKey = (userEmail?: string, userAddress?: string): string => {
  if (userEmail) {
    return `pumapay_balance_${userEmail}`;
  }
  if (userAddress) {
    return `pumapay_balance_${userAddress}`;
  }
  return 'pumapay_mxnb_balance'; // Fallback para compatibilidad
};

const BALANCE_STORAGE_KEY = 'pumapay_mxnb_balance'; // Mantener para compatibilidad

export interface BalanceState {
  balance: number;
  available: number;
  assetSymbol: string;
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
    assetSymbol: 'USDC',
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
    assetSymbol: 'USDC',
    isLoading: true,
    lastUpdated: new Date()
  });
  
  const { user, isAuthenticated } = useAuth();
  
  // Obtener clave de balance específica para este usuario
  const balanceStorageKey = getBalanceStorageKey(user?.email, user?.address);
  
  // Flag para prevenir múltiples consultas simultáneas
  const isRefreshingRef = useRef(false);
  const lastRefreshTimeRef = useRef<number>(0);
  const REFRESH_COOLDOWN = 5000; // 5 segundos mínimo entre refreshes

  // Función para recalcular balance basado en transacciones
  // Memoizada para evitar recreaciones y loops infinitos
  const recalculateBalance = useCallback(() => {
    // Usar clave específica por usuario para transacciones también
    const transactionsKey = user?.email ? `pumapay_transactions_${user.email}` : 
                           user?.address ? `pumapay_transactions_${user.address}` : 
                           'pumapay_transactions';
    const rawTransactions = localStorage.getItem(transactionsKey);
    
    // Solo calcular si hay transacciones o si no hay balance cacheado
    if (!rawTransactions) {
      const cached = localStorage.getItem(balanceStorageKey);
      if (cached) {
        try {
          const cachedState = JSON.parse(cached);
          if (cachedState.balance !== undefined) {
            setBalanceState({
              ...cachedState,
              isLoading: false,
              lastUpdated: new Date(cachedState.lastUpdated || Date.now())
            });
            return cachedState.balance;
          }
        } catch (e) {
          // Ignorar errores de parse
        }
      }
      // Si no hay transacciones ni cache, balance es 0
      const zeroState = {
        balance: 0,
        available: 0,
        assetSymbol: 'USDC',
        isLoading: false,
        lastUpdated: new Date()
      };
      setBalanceState(zeroState);
      localStorage.setItem(balanceStorageKey, JSON.stringify(zeroState));
      return 0;
    }
    
    const transactions = JSON.parse(rawTransactions);
    
    // Si no hay transacciones, retornar 0
    if (!Array.isArray(transactions) || transactions.length === 0) {
      const zeroState = {
        balance: 0,
        available: 0,
        assetSymbol: 'USDC',
        isLoading: false,
        lastUpdated: new Date()
      };
      setBalanceState(zeroState);
      localStorage.setItem(balanceStorageKey, JSON.stringify(zeroState));
      return 0;
    }
    
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    
    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    
    const correctBalance = Math.max(totalIncome - totalExpenses, 0);
    
    const newState = {
      balance: correctBalance,
      available: correctBalance,
      assetSymbol: 'USDC',
      isLoading: false,
      lastUpdated: new Date()
    };
    
    setBalanceState(newState);
    localStorage.setItem(balanceStorageKey, JSON.stringify(newState));
    
    return correctBalance;
  }, [balanceStorageKey]); // Depende de balanceStorageKey para usar la clave correcta

  // Escuchar cuando se agreguen nuevas transacciones para recalcular balance
  // Optimizado: solo recalcula cuando realmente hay cambios
  // Usar useRef para mantener referencia estable a recalculateBalance
  const recalculateBalanceRef = useRef(recalculateBalance);
  recalculateBalanceRef.current = recalculateBalance;
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleTransactionAdded = () => {
      // Debounce: esperar 500ms antes de recalcular para evitar múltiples cálculos
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        recalculateBalanceRef.current();
      }, 500);
    };

    const handleForceUpdate = () => {
      // Debounce también para forceUpdate
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        recalculateBalanceRef.current();
      }, 300);
    };

    window.addEventListener('transactionAdded', handleTransactionAdded);
    window.addEventListener('forceBalanceUpdate', handleForceUpdate);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('transactionAdded', handleTransactionAdded);
      window.removeEventListener('forceBalanceUpdate', handleForceUpdate);
    };
  }, []); // Sin dependencias - usamos ref para acceder a la función

  // Función para agregar fondos (depósito) - NO USAR, solo para emergencias
  const addFunds = useCallback((amount: number) => {
    // El balance se actualizará automáticamente cuando se agregue la transacción
    // No necesitamos hacer nada aquí, el evento transactionAdded lo manejará
  }, []);

  // Función para enviar dinero (débito)
  const sendMoney = useCallback((amount: number) => {
    if (balanceState.available >= amount) {
      // El balance se actualizará automáticamente cuando se agregue la transacción de gasto
      return true; // Transacción exitosa
    }
    return false; // Fondos insuficientes
  }, [balanceState.available]);

  // ⚠️ COMENTADO - Procesos de balance de Bitso, Juno, Portal, Ethereum
  // Ahora usamos Stellar para obtener el balance
  /*
  // Función para obtener balance real desde blockchain usando ethers.js (FUENTE PRINCIPAL)
  // Memoizada para evitar recreaciones
  const getRealBalanceFromBlockchain = useCallback(async (walletAddress: string): Promise<number> => {
    try {
      if (!walletAddress) {
        console.warn('⚠️ Dirección de wallet no proporcionada');
        return 0;
      }

      // Verificar si el servicio está configurado
      if (!ethersBalanceService.isConfigured()) {
        console.warn('⚠️ Servicio ethers.js no configurado (falta VITE_MXNB_CONTRACT_ADDRESS)');
        return 0;
      }

      console.log('🔄 Obteniendo balance desde blockchain usando ethers.js...');
      const balance = await ethersBalanceService.getMXNBBalance(walletAddress);
      console.log('💰 Balance desde blockchain (ethers.js):', balance);
      return balance;
    } catch (error: any) {
      console.error('❌ Error obteniendo balance desde blockchain:', error);
      // Si el error es por configuración, lo logueamos pero no propagamos
      if (error.message?.includes('no configurada') || error.message?.includes('inválida')) {
        console.warn('⚠️ Configuración faltante o dirección inválida, usando fuentes alternativas');
      }
      return 0;
    }
  }, []);

  // Función para obtener balance real desde Juno (BACKUP)
  // Memoizada para evitar recreaciones
  const getRealBalanceFromJuno = useCallback(async (): Promise<number> => {
    try {
      console.log('🔄 Obteniendo balance desde Juno API...');
      const balance = await junoService.getMXNBBalance();
      console.log('💰 Balance desde Juno:', balance);
      return balance;
    } catch (error) {
      console.error('❌ Error obteniendo balance desde Juno:', error);
      return 0;
    }
  }, []);
  */
  
  // Funciones vacías para compatibilidad
  const getRealBalanceFromBlockchain = useCallback(async (walletAddress: string): Promise<number> => {
    if (!walletAddress) return 0;
    try {
      const { usdc, native } = await stellarService.getBalances(walletAddress);
      return usdc > 0 ? usdc : native;
    } catch (error) {
      console.error('❌ Error obteniendo balance desde Stellar:', error);
      return 0;
    }
  }, []);

  const getRealBalanceFromJuno = useCallback(async (): Promise<number> => {
    console.warn('⚠️ getRealBalanceFromJuno está deshabilitado. Usa Stellar en su lugar.');
    return 0;
  }, []);

  // ⚠️ COMENTADO - refreshBalance ahora solo usa recalculateBalance (transacciones locales)
  // La obtención de balance desde Bitso, Juno, Portal, Ethereum está deshabilitada
  // Ahora usamos Stellar para obtener el balance real
  const refreshBalance = useCallback(async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isRefreshingRef.current) {
      console.log('⚠️ Refresh ya en curso, ignorando llamada duplicada');
      return;
    }

    // Cooldown: No refrescar si pasaron menos de 5 segundos desde la última vez
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      console.log(`⚠️ Cooldown activo. Esperando ${Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh) / 1000)}s...`);
      return;
    }

    isRefreshingRef.current = true;
    lastRefreshTimeRef.current = now;
    setBalanceState(prev => ({ ...prev, isLoading: true }));
    
    try {
      let balance = 0;
      let assetSymbol = 'USDC';

      if (user?.address) {
        const { usdc, native } = await stellarService.getBalances(user.address);
        if (usdc > 0 || native > 0) {
          balance = usdc > 0 ? usdc : native;
          assetSymbol = usdc > 0 ? 'USDC' : 'XLM';
        } else {
          balance = recalculateBalance();
        }
      } else {
        balance = recalculateBalance();
      }
      
      const newState = {
        balance,
        available: balance,
        assetSymbol,
        isLoading: false,
        lastUpdated: new Date()
      };
      
      setBalanceState(newState);
      localStorage.setItem(balanceStorageKey, JSON.stringify(newState));
    } catch (error) {
      console.error('❌ Error refreshing balance:', error);
      setBalanceState(prev => ({ ...prev, isLoading: false }));
    } finally {
      isRefreshingRef.current = false;
    }
  }, [user?.address, recalculateBalance]);

  // ⚠️ COMENTADO - Ya no obtenemos balance desde blockchain, Juno o Portal
  // Solo recalculamos desde transacciones locales
  // Optimizado: solo se ejecuta una vez al montar o cuando cambia el usuario
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Si no hay usuario, resetear balance
      hasInitializedRef.current = false;
      setBalanceState({
        balance: 0,
        available: 0,
        assetSymbol: 'USDC',
        isLoading: false,
        lastUpdated: new Date()
      });
      return;
    }

    // Solo inicializar una vez por usuario
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    // Cargar balance inicial desde cache si existe (usando clave específica por usuario)
    const cached = localStorage.getItem(balanceStorageKey);
    if (cached) {
      try {
        const cachedState = JSON.parse(cached);
        if (cachedState.balance !== undefined) {
          setBalanceState({
            ...cachedState,
            assetSymbol: cachedState.assetSymbol || 'USDC',
            lastUpdated: new Date(cachedState.lastUpdated || Date.now()),
            isLoading: false
          });
          // Solo recalcular si hay transacciones nuevas (comparar contador)
          const transactionsKey = user?.email ? `pumapay_transactions_${user.email}` : 
                                 user?.address ? `pumapay_transactions_${user.address}` : 
                                 'pumapay_transactions';
          const lastCount = localStorage.getItem(`pumapay_last_transaction_count_${user?.email || user?.address || ''}`);
          const currentTransactions = JSON.parse(localStorage.getItem(transactionsKey) || '[]');
          if (lastCount !== currentTransactions.length.toString()) {
            // Hay transacciones nuevas, recalcular
            recalculateBalance();
          }
          return; // Ya cargamos desde cache, no necesitamos recalcular
        }
      } catch (e) {
        // Ignorar errores de parse
      }
    }

    // Si no hay cache, recalcular desde transacciones
    recalculateBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.email, user?.address, balanceStorageKey]); // Depende de email/address para detectar cambio de usuario

  return {
    ...balanceState,
    recalculateBalance,
    addFunds,
    sendMoney,
    refreshBalance,
    getRealBalanceFromBlockchain,
    getRealBalanceFromJuno,
    hasInsufficientFunds: (amount: number) => balanceState.available < amount
  };
}; 