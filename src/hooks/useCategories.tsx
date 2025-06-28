import { useState, useEffect } from 'react';
import { Category, Transaction, GlobalBudget, DEFAULT_CATEGORIES, DEFAULT_GLOBAL_BUDGET } from '@/types/categories';

const CATEGORIES_STORAGE_KEY = 'pumapay_categories';
const TRANSACTIONS_STORAGE_KEY = 'pumapay_transactions';
const GLOBAL_BUDGET_STORAGE_KEY = 'pumapay_global_budget';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [globalBudget, setGlobalBudget] = useState<GlobalBudget>(DEFAULT_GLOBAL_BUDGET);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    const loadData = () => {
      try {
        // Cargar categorías
        const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (storedCategories) {
          setCategories(JSON.parse(storedCategories));
        } else {
          // Si no hay categorías guardadas, usar las por defecto
          setCategories(DEFAULT_CATEGORIES);
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        }

        // Cargar transacciones
        const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
        if (storedTransactions) {
          const parsedTransactions = JSON.parse(storedTransactions);
          // Convertir las fechas de string a Date
          const transactionsWithDates = parsedTransactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          }));
          setTransactions(transactionsWithDates);
        }

        // Cargar presupuesto global
        const storedBudget = localStorage.getItem(GLOBAL_BUDGET_STORAGE_KEY);
        if (storedBudget) {
          const parsedBudget = JSON.parse(storedBudget);
          const currentMonth = new Date().toISOString().slice(0, 7);
          
          // Si es un nuevo mes, resetear el gasto actual
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
          // Si no hay presupuesto guardado, usar el por defecto
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

  // Agregar nueva transacción
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}`,
      date: new Date()
    };
    
    console.log(`📝 Agregando nueva transacción: ${transaction.type} $${transaction.amount}`);
    
    // PRIMERO: Obtener transacciones actuales y agregar la nueva
    const currentTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
    const newTransactions = [newTransaction, ...currentTransactions];
    
    // SEGUNDO: Guardar INMEDIATAMENTE en localStorage
    try {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(newTransactions));
      console.log(`💾 Transacciones guardadas DIRECTAMENTE en localStorage: ${newTransactions.length} total`);
      console.log(`📊 Nueva transacción guardada:`, newTransaction);
      
      // Verificar que se guardó correctamente
      const verification = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      console.log(`🔍 Verificación localStorage después de guardar:`, verification);
    } catch (error) {
      console.error('❌ Error guardando en localStorage:', error);
    }
    
    // TERCERO: Actualizar el estado de React
    setTransactions(newTransactions);
    
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

    // CUARTO: Disparar evento para que otras partes de la app se actualicen
    console.log('🚀 Disparando evento transactionAdded...');
    window.dispatchEvent(new CustomEvent('transactionAdded', { 
      detail: { transaction: newTransaction } 
    }));
    console.log('✅ Evento transactionAdded disparado exitosamente');
  };

  // Obtener categorías por tipo
  const getExpenseCategories = () => categories.filter(c => c.type === 'expense');
  const getIncomeCategories = () => categories.filter(c => c.type === 'income');

  // Obtener transacciones recientes
  const getRecentTransactions = (limit: number = 10) => {
    return transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
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