export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  spent?: number;
  isDefault: boolean;
}

export interface GlobalBudget {
  monthlyLimit: number;
  currentSpent: number;
  month: string; // formato "YYYY-MM"
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId: string;
  description: string;
  recipient?: string;
  date: Date;
  currency: 'MXNB' | 'MXN' | 'ARBITRUM';
  txHash?: string; // Hash de la transacción en blockchain
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Gastos
  { id: 'food', name: 'Comida', icon: '🍕', color: 'bg-red-500', type: 'expense', spent: 0, isDefault: true },
  { id: 'transport', name: 'Transporte', icon: '🚌', color: 'bg-blue-500', type: 'expense', spent: 0, isDefault: true },
  { id: 'books', name: 'Libros', icon: '📚', color: 'bg-green-500', type: 'expense', spent: 0, isDefault: true },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎮', color: 'bg-purple-500', type: 'expense', spent: 0, isDefault: true },
  { id: 'supplies', name: 'Materiales', icon: '✏️', color: 'bg-yellow-500', type: 'expense', spent: 0, isDefault: true },
  { id: 'health', name: 'Salud', icon: '🏥', color: 'bg-pink-500', type: 'expense', spent: 0, isDefault: true },
  { id: 'other', name: 'Otros', icon: '💼', color: 'bg-gray-500', type: 'expense', spent: 0, isDefault: true },
  
  // Ingresos
  { id: 'allowance', name: 'Mesada', icon: '💰', color: 'bg-green-600', type: 'income', spent: 0, isDefault: true },
  { id: 'scholarship', name: 'Beca', icon: '🎓', color: 'bg-blue-600', type: 'income', spent: 0, isDefault: true },
  { id: 'work', name: 'Trabajo', icon: '💼', color: 'bg-indigo-600', type: 'income', spent: 0, isDefault: true },
  { id: 'gift', name: 'Regalo', icon: '🎁', color: 'bg-pink-600', type: 'income', spent: 0, isDefault: true },
];

export const DEFAULT_GLOBAL_BUDGET: GlobalBudget = {
  monthlyLimit: 2500, // $2500 MXNB por mes (presupuesto típico estudiante)
  currentSpent: 0,
  month: new Date().toISOString().slice(0, 7) // formato "YYYY-MM"
}; 