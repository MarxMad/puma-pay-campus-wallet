import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit3, Trash2, DollarSign, TrendingUp, Target, Tag, PiggyBank, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/types/categories';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    getTransactionsByCategory,
    getExpenseCategories,
    getIncomeCategories,
    getGlobalBudgetProgress,
    updateGlobalBudget,
    globalBudget
  } = useCategories();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudgetLimit, setNewBudgetLimit] = useState(globalBudget.monthlyLimit.toString());

  const [formData, setFormData] = useState({
    name: '',
    icon: '📝',
    color: 'bg-blue-500'
  });

  const availableIcons = ['📝', '🍕', '🚌', '📚', '🎮', '✏️', '🏥', '💼', '🛍️', '🎯', '⚡', '🔧', '🎨', '🏃‍♂️', '🎪', '🔥', '💻', '💰', '🎓', '🎁', '📈', '💎', '🏆', '⭐', '🌟'];
  const availableColors = [
    'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
  ];

  const expenseCategories = getExpenseCategories();
  const incomeCategories = getIncomeCategories();
  const budgetProgress = getGlobalBudgetProgress();

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        icon: activeTab === 'expense' ? '📝' : '💰',
        color: activeTab === 'expense' ? 'bg-red-500' : 'bg-green-500'
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const categoryData = {
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      type: activeTab
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
    } else {
      addCategory(categoryData);
    }

    setShowModal(false);
    setEditingCategory(null);
  };

  const handleDelete = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && !category.isDefault) {
      const transactions = getTransactionsByCategory(categoryId);
      if (transactions.length > 0) {
        if (confirm(`Esta categoría tiene ${transactions.length} transacciones. ¿Estás seguro de eliminarla?`)) {
          deleteCategory(categoryId);
        }
      } else {
        deleteCategory(categoryId);
      }
    }
  };

  const handleBudgetUpdate = () => {
    const newLimit = parseFloat(newBudgetLimit);
    if (newLimit > 0) {
      updateGlobalBudget(newLimit);
      setShowBudgetModal(false);
    }
  };

  const renderCategoryCard = (category: Category) => {
    const transactions = getTransactionsByCategory(category.id);
    const spent = category.spent || 0;

    return (
      <Card key={category.id} className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${category.color} rounded-full flex items-center justify-center`}>
              <span className="text-lg">{category.icon}</span>
            </div>
            <div>
              <h3 className="text-white font-medium">{category.name}</h3>
              <p className="text-gray-400 text-sm">
                {transactions.length} transacciones
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => openModal(category)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            {!category.isDefault && (
              <Button
                onClick={() => handleDelete(category.id)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {category.type === 'expense' && spent > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total gastado</span>
              <span className="text-white">${spent.toFixed(2)}</span>
            </div>
          </div>
        )}

        {category.type === 'income' && (
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total recibido</span>
              <span className="text-green-400 font-medium">${spent.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-40">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-gray-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Gestión de Categorías</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* Presupuesto Global */}
      <div className="px-4 mt-6 mb-6">
        <Card className="bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border-indigo-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold">Presupuesto Mensual</h3>
                <p className="text-gray-400 text-sm">Control global de gastos</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setNewBudgetLimit(globalBudget.monthlyLimit.toString());
                setShowBudgetModal(true);
              }}
              variant="ghost"
              size="sm"
              className="text-indigo-300 hover:text-indigo-200"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Progreso del presupuesto */}
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-white">
                  ${budgetProgress.current.toFixed(2)}
                </p>
                <p className="text-gray-400 text-sm">
                  de ${budgetProgress.limit.toFixed(2)} MXNB
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${
                  budgetProgress.isOverBudget ? 'text-red-400' : 'text-green-400'
                }`}>
                  {budgetProgress.progress.toFixed(0)}%
                </p>
                <p className="text-gray-400 text-sm">
                  {budgetProgress.isOverBudget ? 'Excedido' : 'Utilizado'}
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  budgetProgress.isOverBudget ? 'bg-red-500' :
                  budgetProgress.progress > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetProgress.progress, 100)}%` }}
              />
            </div>

            {/* Estado del presupuesto */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {budgetProgress.isOverBudget ? 'Exceso:' : 'Restante:'}
              </span>
              <span className={budgetProgress.isOverBudget ? 'text-red-400' : 'text-green-400'}>
                ${Math.abs(budgetProgress.remaining).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-2 bg-gray-800 p-1 rounded-xl">
          <Button
            onClick={() => setActiveTab('expense')}
            className={`rounded-lg py-3 text-sm font-medium transition-all ${
              activeTab === 'expense'
                ? 'bg-red-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Target className="h-4 w-4 mr-2" />
            Gastos ({expenseCategories.length})
          </Button>
          <Button
            onClick={() => setActiveTab('income')}
            className={`rounded-lg py-3 text-sm font-medium transition-all ${
              activeTab === 'income'
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Ingresos ({incomeCategories.length})
          </Button>
        </div>
      </div>

      {/* Add Category Button */}
      <div className="px-4 mb-6">
        <Button
          onClick={() => openModal()}
          className={`w-full py-4 rounded-xl text-lg font-semibold ${
            activeTab === 'expense' 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva categoría de {activeTab === 'expense' ? 'gastos' : 'ingresos'}
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="px-4">
        <div className="grid gap-4">
          {activeTab === 'expense' ? (
            expenseCategories.length > 0 ? (
              expenseCategories.map(renderCategoryCard)
            ) : (
              <Card className="bg-gray-800 border-gray-700 p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No hay categorías de gastos</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Crea tu primera categoría para organizar mejor tus gastos
                </p>
                <Button
                  onClick={() => openModal()}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear categoría
                </Button>
              </Card>
            )
          ) : (
            incomeCategories.length > 0 ? (
              incomeCategories.map(renderCategoryCard)
            ) : (
              <Card className="bg-gray-800 border-gray-700 p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No hay categorías de ingresos</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Crea categorías para clasificar tus fuentes de ingresos
                </p>
                <Button
                  onClick={() => openModal()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear categoría
                </Button>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-gray-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingCategory ? 'Editar categoría' : `Nueva categoría de ${activeTab === 'expense' ? 'gastos' : 'ingresos'}`}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                className="text-gray-400"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">
                  Nombre de la categoría
                </Label>
                <Input
                  type="text"
                  placeholder="Ej: Comida, Transporte, Mesada..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="rounded-xl bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              {/* Icono */}
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">
                  Icono
                </Label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                  {availableIcons.map((icon) => (
                    <Button
                      key={icon}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      variant={formData.icon === icon ? "default" : "outline"}
                      className={`p-3 rounded-xl aspect-square ${
                        formData.icon === icon 
                          ? `${activeTab === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}` 
                          : 'border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">
                  Color
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {availableColors.map((color) => (
                    <Button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-12 h-12 rounded-xl ${color} ${
                        formData.color === color ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      {formData.color === color && <span className="text-white">✓</span>}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Vista previa */}
              <div className="bg-gray-700 p-4 rounded-xl">
                <Label className="text-white text-sm font-medium mb-2 block">
                  Vista previa
                </Label>
                <div className={`${formData.color} p-3 rounded-xl flex items-center space-x-2 w-fit`}>
                  <span className="text-lg">{formData.icon}</span>
                  <span className="text-white font-medium">
                    {formData.name || `Nueva categoría de ${activeTab === 'expense' ? 'gastos' : 'ingresos'}`}
                  </span>
                </div>

              </div>

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className={`flex-1 rounded-xl ${
                    activeTab === 'expense' 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de presupuesto global */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Configurar Presupuesto</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBudgetModal(false)}
                className="text-gray-400"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">
                  Límite mensual (MXNB)
                </Label>
                <Input
                  type="number"
                  placeholder="2500"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  className="rounded-xl bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Este será tu presupuesto global para todos los gastos del mes
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setShowBudgetModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBudgetUpdate}
                  disabled={!newBudgetLimit || parseFloat(newBudgetLimit) <= 0}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 rounded-xl"
                >
                  Actualizar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-around py-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
            <Tag className="h-5 w-5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/statistics')}>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <Target className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage; 