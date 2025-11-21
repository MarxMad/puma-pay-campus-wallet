import { useState, useEffect } from 'react';
import { Category, Transaction, GlobalBudget, DEFAULT_CATEGORIES, DEFAULT_GLOBAL_BUDGET } from '@/types/categories';
// ⚠️ COMENTADO - Ya no usamos Portal ni ethers
// import { portalService } from '@/services/portal';
// import { ethers } from 'ethers';

const CATEGORIES_STORAGE_KEY = 'pumapay_categories';
const TRANSACTIONS_STORAGE_KEY = 'pumapay_transactions';
const GLOBAL_BUDGET_STORAGE_KEY = 'pumapay_global_budget';

// ⚠️ COMENTADO - Ya no verificamos contratos MXNB, ahora usamos Stellar
/*
const MXNB_CONTRACT_ADDRESS = import.meta.env.VITE_MXNB_CONTRACT_ADDRESS;
const ALCHEMY_RPC_URL = import.meta.env.VITE_ALCHEMY_RPC_URL;
const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// DEBUG: Mostrar configuración
console.log('[DEBUG] MXNB_CONTRACT_ADDRESS:', MXNB_CONTRACT_ADDRESS);
console.log('[DEBUG] ALCHEMY_RPC_URL:', ALCHEMY_RPC_URL);
*/

// Extensión temporal del tipo Transaction para props extra
type TransactionWithToken = Transaction & { isUSDC?: boolean; tokenSymbol?: string; tokenAddress?: string; decimals?: number };

// ⚠️ COMENTADO - Ya no obtenemos transacciones desde blockchain usando ethers
// Ahora usamos Stellar para transacciones
/*
// Función para obtener transacciones MXNB reales de la blockchain
async function fetchMXNBTransactions(walletAddress: string): Promise<TransactionWithToken[]> {
  if (!walletAddress || !MXNB_CONTRACT_ADDRESS || !ALCHEMY_RPC_URL) {
    console.warn('[DEBUG] Faltan datos para consultar MXNB:', { walletAddress, MXNB_CONTRACT_ADDRESS, ALCHEMY_RPC_URL });
    return [];
  }
  console.log('[DEBUG] Consultando transacciones MXNB para:', walletAddress);
  const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_RPC_URL);
  const contract = new ethers.Contract(MXNB_CONTRACT_ADDRESS, ERC20_ABI, provider);
  try {
    // Buscar eventos donde from o to sea la wallet
    const filterFrom = contract.filters.Transfer(walletAddress, null);
    const filterTo = contract.filters.Transfer(null, walletAddress);
    const [sentEvents, receivedEvents] = await Promise.all([
      contract.queryFilter(filterFrom, 0), // desde el bloque 0
      contract.queryFilter(filterTo, 0)
    ]);
    console.log('[DEBUG] sentEvents:', sentEvents.length, 'receivedEvents:', receivedEvents.length);
    // Obtener los timestamps de los bloques para todos los eventos
    const allEvents = [...sentEvents, ...receivedEvents];
    const blockNumbers = Array.from(new Set(allEvents.map(ev => ev.blockNumber)));
    const blockTimestamps: Record<number, number> = {};
    await Promise.all(blockNumbers.map(async (bn) => {
      const block = await provider.getBlock(bn);
      blockTimestamps[bn] = block.timestamp;
    }));
    const sentTxs: TransactionWithToken[] = sentEvents.map(ev => ({
      id: ev.transactionHash,
      txHash: ev.transactionHash,
      amount: parseFloat(ethers.utils.formatUnits(ev.args.value, 18)),
      type: 'expense' as const,
      description: 'Envío',
      categoryId: '',
      currency: 'MXNB',
      date: new Date(blockTimestamps[ev.blockNumber] * 1000),
      from: ev.args.from,
      to: ev.args.to,
      status: 'confirmed',
      isMXNB: true,
      tokenSymbol: 'MXNB',
      tokenAddress: MXNB_CONTRACT_ADDRESS,
      decimals: 18
    }));
    const receivedTxs: TransactionWithToken[] = receivedEvents.map(ev => ({
      id: ev.transactionHash,
      txHash: ev.transactionHash,
      amount: parseFloat(ethers.utils.formatUnits(ev.args.value, 18)),
      type: 'income' as const,
      description: 'Depósito',
      categoryId: '',
      currency: 'MXNB',
      date: new Date(blockTimestamps[ev.blockNumber] * 1000),
      from: ev.args.from,
      to: ev.args.to,
      status: 'confirmed',
      isMXNB: true,
      tokenSymbol: 'MXNB',
      tokenAddress: MXNB_CONTRACT_ADDRESS,
      decimals: 18
    }));
    // Unir, quitar duplicados por hash y ordenar por fecha descendente
    const allTxs = [...sentTxs, ...receivedTxs];
    const unique = Object.values(Object.fromEntries(allTxs.map(tx => [tx.txHash, tx])));
    unique.sort((a, b) => b.date.getTime() - a.date.getTime());
    console.log('[DEBUG] Transacciones MXNB encontradas:', unique.length);
    return unique;
  } catch (error) {
    console.error('[DEBUG] Error consultando eventos MXNB:', error);
    return [];
  }
}

// Función para obtener transacciones ETH nativas de la wallet
/*
async function fetchETHTransactions(walletAddress: string): Promise<TransactionWithToken[]> {
  if (!walletAddress || !ALCHEMY_RPC_URL) return [];
  const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_RPC_URL);
  // ethers v5 no tiene getHistory, así que solo devuelvo [] y muestro advertencia
  console.warn('El historial de ETH solo está disponible con ethers v6 o una API externa.');
  return [];
  // Si migras a ethers v6, puedes usar:
  // const history = await provider.getHistory(walletAddress, -10000);
  // ...
  // return history
  //   .filter(tx => tx.from.toLowerCase() === walletAddress.toLowerCase() || (tx.to && tx.to.toLowerCase() === walletAddress.toLowerCase()))
  //   .map(...)
}
*/

// Funciones vacías para compatibilidad (ya no se usan)
async function fetchMXNBTransactions(walletAddress: string): Promise<TransactionWithToken[]> {
  console.warn('⚠️ fetchMXNBTransactions está deshabilitado. Usa Stellar en su lugar.');
  return [];
}

async function fetchETHTransactions(walletAddress: string): Promise<TransactionWithToken[]> {
  console.warn('⚠️ fetchETHTransactions está deshabilitado. Usa Stellar en su lugar.');
  return [];
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [globalBudget, setGlobalBudget] = useState<GlobalBudget>(DEFAULT_GLOBAL_BUDGET);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar categorías y transacciones reales al inicializar
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar categorías (localStorage)
        const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (storedCategories) {
          setCategories(JSON.parse(storedCategories));
        } else {
          setCategories(DEFAULT_CATEGORIES);
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        }

        // Obtener dirección de la wallet desde AuthContext (clave correcta: 'pumapay_auth')
        const user = JSON.parse(localStorage.getItem('pumapay_auth') || '{}');
        const walletAddress = user?.address;
        // Log solo si hay wallet address (evitar spam en consola)
        // if (walletAddress) console.log('[DEBUG] Dirección de wallet detectada:', walletAddress);
        if (walletAddress) {
          // ⚠️ COMENTADO - Ya no obtenemos transacciones desde blockchain usando ethers
          // Ahora usamos Stellar para transacciones
          /*
          const [mxnbTxs, ethTxs] = await Promise.all([
            fetchMXNBTransactions(walletAddress),
            fetchETHTransactions(walletAddress)
          ]);
          // Unir y ordenar por fecha descendente
          const allTxs = [...mxnbTxs, ...ethTxs];
          */
          // Por ahora, solo usamos transacciones locales
          // Cargar transacciones desde localStorage
          const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
          const allTxs: TransactionWithToken[] = storedTransactions 
            ? JSON.parse(storedTransactions) 
            : [];
          // Ordenar por fecha descendente si hay transacciones
          if (allTxs.length > 0) {
            allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          }
          setTransactions(allTxs);
        } else {
          setTransactions([]);
        }

        // Cargar presupuesto global (localStorage)
        const storedBudget = localStorage.getItem(GLOBAL_BUDGET_STORAGE_KEY);
        if (storedBudget) {
          const parsedBudget = JSON.parse(storedBudget);
          const currentMonth = new Date().toISOString().slice(0, 7);
          if (parsedBudget.month !== currentMonth) {
            setGlobalBudget({
              ...parsedBudget,
              currentSpent: 0,
              month: currentMonth
            });
          } else {
            setGlobalBudget(parsedBudget);
          }
        } else {
          setGlobalBudget(DEFAULT_GLOBAL_BUDGET);
          localStorage.setItem(GLOBAL_BUDGET_STORAGE_KEY, JSON.stringify(DEFAULT_GLOBAL_BUDGET));
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Guardar categorías en localStorage cuando cambien
  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    }
  }, [categories, isLoading]);

  // Guardar transacciones en localStorage cuando cambien - DESHABILITADO
  // Este useEffect está deshabilitado porque ahora guardamos directamente en addTransaction
  // useEffect(() => {
  //   if (!isLoading) {
  //     localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  //   }
  // }, [transactions, isLoading]);

  // Guardar presupuesto global en localStorage cuando cambie
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(GLOBAL_BUDGET_STORAGE_KEY, JSON.stringify(globalBudget));
    }
  }, [globalBudget, isLoading]);

  // Agregar nueva categoría
  const addCategory = (category: Omit<Category, 'id' | 'isDefault'>) => {
    const newCategory: Category = {
      ...category,
      id: `custom_${Date.now()}`,
      isDefault: false,
      spent: 0
    };
    setCategories(prev => [...prev, newCategory]);
  };

  // Editar categoría existente
  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      )
    );
  };

  // Eliminar categoría (solo las personalizadas)
  const deleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category && !category.isDefault) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
      // También eliminar transacciones de esta categoría
      setTransactions(prev => prev.filter(t => t.categoryId !== id));
    }
  };

  // Agregar nueva transacción (solo actualiza categorías y dispara evento para refrescar datos reales)
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    // Actualizar el gasto de la categoría si es un gasto
    if (transaction.type === 'expense') {
      setCategories(prev => 
        prev.map(cat => 
          cat.id === transaction.categoryId 
            ? { ...cat, spent: (cat.spent || 0) + transaction.amount }
            : cat
        )
      );
    }
    // Disparar evento para refrescar datos reales
    window.dispatchEvent(new CustomEvent('transactionAdded', { 
      detail: { transaction } 
    }));
  };

  // Obtener categorías por tipo
  const getExpenseCategories = () => categories.filter(c => c.type === 'expense');
  const getIncomeCategories = () => categories.filter(c => c.type === 'income');

  // Obtener transacciones recientes
  const getRecentTransactions = (limit: number = 10) => {
    return transactions
      .sort((a, b) => {
        const aTime = a.date instanceof Date && !isNaN(a.date.getTime()) ? a.date.getTime() : 0;
        const bTime = b.date instanceof Date && !isNaN(b.date.getTime()) ? b.date.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  };

  // Obtener transacciones por categoría
  const getTransactionsByCategory = (categoryId: string) => {
    return transactions.filter(t => t.categoryId === categoryId);
  };

  // Obtener gastos del mes actual
  const getCurrentMonthExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
  };

  // Obtener ingresos del mes actual
  const getCurrentMonthIncome = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'income' && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
  };

  // Calcular totales
  const getTotalExpenses = () => {
    return getCurrentMonthExpenses().reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalIncome = () => {
    return getCurrentMonthIncome().reduce((sum, t) => sum + t.amount, 0);
  };

  // Obtener presupuesto global
  const getGlobalBudget = () => globalBudget;

  // Actualizar presupuesto global
  const updateGlobalBudget = (newLimit: number) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const updatedBudget: GlobalBudget = {
      ...globalBudget,
      monthlyLimit: newLimit,
      month: currentMonth
    };
    setGlobalBudget(updatedBudget);
  };

  // Obtener progreso del presupuesto global
  const getGlobalBudgetProgress = () => {
    const totalExpenses = getTotalExpenses();
    const progress = globalBudget.monthlyLimit > 0 ? (totalExpenses / globalBudget.monthlyLimit) * 100 : 0;
    return {
      current: totalExpenses,
      limit: globalBudget.monthlyLimit,
      progress: Math.min(progress, 100),
      remaining: Math.max(globalBudget.monthlyLimit - totalExpenses, 0),
      isOverBudget: totalExpenses > globalBudget.monthlyLimit
    };
  };

  // Obtener categorías con estadísticas de uso (sin presupuestos individuales)
  const getCategoryStats = () => {
    return getExpenseCategories().map(category => ({
      ...category,
      transactionCount: transactions.filter(t => t.categoryId === category.id).length,
      spent: category.spent || 0
    }));
  };

  return {
    categories,
    transactions,
    globalBudget,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    getExpenseCategories,
    getIncomeCategories,
    getRecentTransactions,
    getTransactionsByCategory,
    getCurrentMonthExpenses,
    getCurrentMonthIncome,
    getTotalExpenses,
    getTotalIncome,
    getGlobalBudget,
    updateGlobalBudget,
    getGlobalBudgetProgress,
    getCategoryStats
  };
}; 