import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, TrendingUp, Search, Home, Settings, ArrowLeft, Calendar, Filter, Banknote, PieChart, BarChart3, Activity, Zap, Sparkles, Target, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { useBalance } from '@/hooks/useBalance';
import { BottomNav } from '@/components/BottomNav';

// Extensión temporal del tipo Transaction para props extra de portalService
type TransactionWithToken = import('@/types/categories').Transaction & { isMXNB?: boolean; tokenSymbol?: string };

const Statistics = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [showChartType, setShowChartType] = useState<'bar' | 'pie'>('bar');
  
  // Hooks para datos reales
  const { 
    getRecentTransactions,
    getExpenseCategories,
    getIncomeCategories,
    getTotalExpenses,
    getTotalIncome,
    getGlobalBudgetProgress,
    globalBudget
  } = useCategories();
  
  const { available } = useBalance();

  // Calcular datos reales
  const totalExpenses = getTotalExpenses();
  const totalIncome = getTotalIncome();
  const budgetProgress = getGlobalBudgetProgress();
  const allTransactions = getRecentTransactions(50);
  // Solo transacciones reales (con hash)
  const realTransactions = allTransactions.filter(tx => tx.txHash && tx.txHash.length > 0);

  // Calcular gastos por categoría con datos reales
  const expenseCategories = getExpenseCategories().map(category => {
    const categoryExpenses = allTransactions
      .filter(t => t.type === 'expense' && t.categoryId === category.id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const percentage = totalExpenses > 0 ? (categoryExpenses / totalExpenses) * 100 : 0;
    
    return {
      name: category.name,
      amount: categoryExpenses,
      percentage: Math.round(percentage),
      color: category.color,
      icon: category.icon
    };
  }).filter(cat => cat.amount > 0); // Solo mostrar categorías con gastos

  // Calcular datos mensuales (últimos 6 meses)
  const getMonthlyData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthExpenses = allTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'expense' &&
                 tDate.getMonth() === date.getMonth() &&
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: months[date.getMonth()],
        spent: monthExpenses,
        budget: globalBudget.monthlyLimit
      });
    }

    return monthlyData;
  };

  const monthlyData = getMonthlyData();

  // Filtrar transacciones por búsqueda SOLO en reales
  const filteredTransactions = realTransactions.filter(transaction => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.recipient?.toLowerCase().includes(searchLower) ||
      transaction.currency?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Estadísticas</h1>
        <Button variant="ghost" size="sm">
          <Filter className="h-5 w-5" />
        </Button>
      </div>
          
      <div className="p-4 space-y-6">
        {/* Balance Overview */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Resumen Financiero</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
            </div>
            </div>
            
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Ingresos Card */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-500/10 border border-green-500/20 p-5 rounded-xl relative overflow-hidden group hover:from-green-600/30 hover:to-green-500/20 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-green-300 text-sm font-medium">Ingresos</span>
              </div>
              <p className="text-3xl font-bold text-white mb-2">${totalIncome.toFixed(2)}</p>
              {totalIncome > 0 ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs font-medium">Recibido este mes</span>
                </div>
              ) : (
                <span className="text-gray-400 text-xs">Sin ingresos registrados</span>
              )}
              
              {/* Background decoration */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-green-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-green-400/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            </div>

            {/* Gastos Card */}
                          <div className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 border border-orange-500/20 p-5 rounded-xl relative overflow-hidden group hover:from-orange-600/30 hover:to-orange-500/20 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <span className="text-red-300 text-sm font-medium">Gastos</span>
              </div>
              <p className="text-3xl font-bold text-white mb-2">${totalExpenses.toFixed(2)}</p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  budgetProgress.isOverBudget ? 'bg-orange-500 animate-pulse' : 'bg-orange-400'
                }`}></div>
                <span className={`text-xs font-medium ${
                  budgetProgress.isOverBudget ? 'text-red-400' : 'text-orange-400'
                }`}>
                  {budgetProgress.progress.toFixed(0)}% del presupuesto
                </span>
              </div>
              
              {/* Budget progress indicator */}
              <div className="mt-3 w-full bg-gray-600 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-700 ${
                    budgetProgress.isOverBudget 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-400' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-400'
                  }`}
                  style={{ width: `${Math.min(budgetProgress.progress, 100)}%` }}
                ></div>
              </div>
              
              {/* Background decoration */}
                              <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-orange-400/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/30 p-6 rounded-xl relative overflow-hidden group hover:from-cyan-600/30 hover:via-blue-600/30 hover:to-purple-600/30 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Banknote className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-cyan-300 text-sm font-medium">Balance disponible</p>
                </div>
                <p className="text-4xl font-bold text-white mb-1">${available.toFixed(2)}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-cyan-400 text-xs font-medium">MXNB</span>
                </div>
              </div>
              
              <div className="text-right ml-4">
                <div className="flex items-center space-x-2 mb-2 justify-end">
                  <div className={`w-3 h-3 rounded-full ${
                    budgetProgress.remaining > 0 ? 'bg-green-500' : 'bg-orange-500'
                  } animate-pulse`}></div>
                  <p className={`text-sm font-medium ${
                    budgetProgress.remaining > 0 ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {budgetProgress.remaining > 0 ? 'Presupuesto restante' : 'Presupuesto excedido'}
                  </p>
                </div>
                <p className={`text-2xl font-bold ${
                  budgetProgress.remaining > 0 ? 'text-white' : 'text-red-400'
                }`}>
                  ${Math.abs(budgetProgress.remaining).toFixed(2)}
                </p>
                {budgetProgress.remaining <= 0 && (
                  <div className="text-xs text-red-400 mt-1">
                    ⚠️ Límite superado
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress bar for budget */}
            <div className="mt-4 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="relative h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    budgetProgress.isOverBudget 
                      ? 'bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400' 
                      : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500'
                  }`}
                  style={{ width: `${Math.min(budgetProgress.progress, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Background decorations */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute top-1/2 right-8 w-6 h-6 bg-cyan-400/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          </div>
        </Card>

        {/* Monthly Chart */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold">Gastos por Mes</h3>
            </div>
            <div className="text-sm text-gray-400">
              Presupuesto: ${globalBudget.monthlyLimit.toFixed(0)}
            </div>
          </div>
          
          <div className="h-48 flex items-end justify-between space-x-3 mb-4">
            {monthlyData.map((month, index) => {
              const heightPercentage = Math.max((month.spent / month.budget) * 100, 2);
              const isHovered = hoveredMonth === index;
              
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center space-y-3 flex-1 relative"
                  onMouseEnter={() => setHoveredMonth(index)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Enhanced Tooltip */}
                  {isHovered && month.spent > 0 && (
                    <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-lg border border-gray-600/50 rounded-xl px-4 py-3 text-xs whitespace-nowrap z-20 shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="text-white font-bold text-sm">${month.spent.toFixed(2)}</div>
                      <div className="text-gray-300 font-medium">
                        {((month.spent / month.budget) * 100).toFixed(1)}% del presupuesto
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {month.spent > month.budget ? 'Excede por' : 'Restante'}: ${Math.abs(month.budget - month.spent).toFixed(2)}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                  
                  {/* Bar Container */}
                  <div className="w-full bg-gray-700/50 rounded-lg relative overflow-hidden" style={{ height: '140px' }}>
                    {/* Budget Line */}
                    <div className="absolute w-full h-0.5 bg-yellow-400/30 top-0 left-0"></div>
                    
                    {/* Enhanced Bar */}
                    {month.spent > 0 ? (
                      <div 
                        className={`w-full absolute bottom-0 rounded-lg transition-all duration-700 ease-out transform ${
                          isHovered ? 'scale-105 shadow-2xl' : 'scale-100'
                        } ${
                          month.spent > month.budget 
                            ? 'bg-gradient-to-t from-orange-600 via-orange-500 to-orange-400' 
                            : 'bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400'
                        }`}
                        style={{ 
                          height: `${heightPercentage}%`,
                          animationDelay: `${index * 100}ms`,
                          boxShadow: isHovered 
                            ? month.spent > month.budget 
                              ? '0 0 30px rgba(249, 115, 22, 0.6), 0 0 60px rgba(249, 115, 22, 0.3)' 
                              : '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)'
                            : 'none'
                        }}
                      >
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-full transition-transform duration-1000"></div>
                        
                        {/* Pulsing effect for exceeded budget */}
                        {month.spent > month.budget && (
                          <div className="absolute inset-0 bg-orange-400/20 rounded-lg animate-pulse"></div>
                        )}
                        
                        {/* Hover glow effect */}
                        {isHovered && (
                          <div className="absolute inset-0 bg-white/10 rounded-lg animate-pulse"></div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-2 bg-gray-600 rounded-lg absolute bottom-0 opacity-50"></div>
                    )}
                  </div>
                  
                  {/* Month Label */}
                  <span className={`text-xs transition-colors duration-200 ${
                    isHovered ? 'text-blue-400 font-semibold' : 'text-gray-400'
                  }`}>
                    {month.month}
                  </span>
                  
                  {/* Amount Label */}
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    isHovered ? 'text-white' : 'text-gray-300'
                  }`}>
                    ${month.spent > 0 ? month.spent.toFixed(0) : '0'}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-400 border-t border-gray-700 pt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-blue-400 rounded"></div>
              <span>Dentro del presupuesto</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-600 to-orange-400 rounded"></div>
              <span>Excede presupuesto</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-yellow-400 rounded"></div>
              <span>Meta mensual</span>
            </div>
          </div>
          
          {monthlyData.every(m => m.spent === 0) && (
            <div className="text-center py-8 bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-600">
              <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-2">No hay gastos registrados</p>
              <p className="text-gray-500 text-xs">Los datos aparecerán conforme realices transacciones</p>
            </div>
          )}
        </Card>

        {/* Categories */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold">Gastos por Categoría</h3>
            </div>
            
            {expenseCategories.length > 0 && (
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setShowChartType('bar')}
                  className={`px-3 py-1 rounded-md text-xs transition-all duration-200 ${
                    showChartType === 'bar' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Barras
                </button>
                <button
                  onClick={() => setShowChartType('pie')}
                  className={`px-3 py-1 rounded-md text-xs transition-all duration-200 ${
                    showChartType === 'pie' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Circular
                </button>
              </div>
            )}
          </div>
          
          {expenseCategories.length > 0 ? (
            <>
              {/* Pie Chart View */}
              {showChartType === 'pie' && (
                <div className="mb-6">
                  <div className="relative flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-48 h-48 transform -rotate-90">
                      {expenseCategories.map((category, index) => {
                        const circumference = 2 * Math.PI * 80;
                        const strokeDasharray = `${(category.percentage / 100) * circumference} ${circumference}`;
                        const rotation = expenseCategories
                          .slice(0, index)
                          .reduce((acc, cat) => acc + (cat.percentage / 100) * 360, 0);
                        
                        return (
                          <circle
                            key={index}
                            cx="100"
                            cy="100"
                            r="80"
                            fill="transparent"
                            stroke={category.color.includes('bg-') ? 
                              category.color === 'bg-blue-500' ? '#3b82f6' :
                              category.color === 'bg-orange-500' ? '#f97316' :
                              category.color === 'bg-green-500' ? '#22c55e' :
                              category.color === 'bg-yellow-500' ? '#eab308' :
                              category.color === 'bg-purple-500' ? '#a855f7' :
                              category.color === 'bg-pink-500' ? '#ec4899' :
                              category.color === 'bg-indigo-500' ? '#6366f1' :
                              '#06b6d4' : '#6366f1'
                            }
                            strokeWidth={hoveredCategory === category.name ? '26' : '20'}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset="0"
                            transform={`rotate(${rotation} 100 100)`}
                            className="transition-all duration-500 ease-out cursor-pointer"
                            style={{
                              filter: hoveredCategory === category.name 
                                ? 'brightness(1.3) drop-shadow(0 0 8px currentColor)' 
                                : 'brightness(1)',
                              transformOrigin: '100px 100px'
                            }}
                            onMouseEnter={() => setHoveredCategory(category.name)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          />
                        );
                      })}
                    </svg>
                    
                    {/* Center info */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">${totalExpenses.toFixed(0)}</div>
                        <div className="text-xs text-gray-400">Total gastado</div>
                    </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Bar Chart View & Legend */}
              <div className="space-y-4">
                {expenseCategories.map((category, index) => (
                  <div 
                    key={index} 
                    className={`space-y-3 p-4 rounded-xl transition-all duration-300 cursor-pointer ${
                      hoveredCategory === category.name 
                        ? 'bg-gray-700/50 scale-105 shadow-lg' 
                        : 'bg-gray-700/20 hover:bg-gray-700/30'
                    }`}
                    onMouseEnter={() => setHoveredCategory(category.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center transform transition-transform duration-200 ${
                          hoveredCategory === category.name ? 'scale-110' : 'scale-100'
                        }`}>
                          <span className="text-lg">{category.icon}</span>
                    </div>
                    <div>
                          <span className="text-white font-medium">{category.name}</span>
                          <div className="text-xs text-gray-400">
                            {allTransactions.filter(t => t.categoryId === expenseCategories.find(c => c.name === category.name)?.name).length} transacciones
                          </div>
                    </div>
                  </div>
                  <div className="text-right">
                        <p className="text-white font-bold text-lg">${category.amount.toFixed(2)}</p>
                        <p className={`text-sm font-medium ${
                          hoveredCategory === category.name ? 'text-purple-400' : 'text-gray-400'
                        }`}>
                          {category.percentage}%
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress Bar (only show in bar mode) */}
                    {showChartType === 'bar' && (
                      <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-700 ease-out ${category.color} relative overflow-hidden`}
                          style={{ 
                            width: `${category.percentage}%`,
                            animationDelay: `${index * 150}ms`
                          }}
                        >
                          {/* Animated shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-full animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Category insights */}
              <div className="mt-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Insights</span>
                </div>
                <div className="space-y-2 text-xs text-gray-300">
                  {expenseCategories.length > 0 && (
                    <>
                      <div>• Tu categoría con mayor gasto es <span className="text-white font-medium">{expenseCategories[0].name}</span> (${expenseCategories[0].amount.toFixed(0)})</div>
                      {expenseCategories.length > 1 && (
                        <div>• Has gastado en {expenseCategories.length} categorías diferentes este mes</div>
                      )}
                      <div>• Promedio por categoría: ${(totalExpenses / expenseCategories.length).toFixed(0)}</div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-600">
              <PieChart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-2">No hay gastos registrados</p>
              <p className="text-gray-500 text-xs">Inicia enviando tu primer pago para ver las estadísticas</p>
            </div>
          )}
        </Card>

        {/* Search and Recent Transactions */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transacciones Recientes</h3>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
              Ver todas
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white pl-10 rounded-xl"
            />
          </div>

          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              (filteredTransactions.slice(0, 10) as TransactionWithToken[]).map((transaction, index) => {
                const category = [...getExpenseCategories(), ...getIncomeCategories()]
                  .find(c => c.id === transaction.categoryId);
                // Icono según token
                let icon = category?.icon || '💰';
                if (!transaction.isMXNB) icon = '💱';
                else if (transaction.type === 'expense') icon = '💸';
                // Monto seguro
                const amount = (typeof transaction.amount === 'number' && !isNaN(transaction.amount)) ? transaction.amount : 0;
                // Color
                const amountColor = !transaction.isMXNB ? 'text-blue-400' : (transaction.type === 'expense' ? 'text-red-400' : 'text-green-400');
                // Símbolo
                const symbol = transaction.tokenSymbol || transaction.currency || 'MXNB';
                // Fecha
                let dateStr = '-';
                if (transaction.date instanceof Date && !isNaN(transaction.date.getTime())) {
                  dateStr = transaction.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                }
                return (
                  <div key={index} className="bg-gray-700 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${category?.color || 'bg-gray-500'} rounded-full flex items-center justify-center`}>
                          <span className="text-white text-sm">{icon}</span>
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description || transaction.recipient || 'Transacción'}</p>
                          <p className="text-sm text-gray-400">
                            {category?.name || 'Sin categoría'} • {dateStr}
                          </p>
                          {/* Mostrar hash real si existe */}
                          {transaction.txHash && (
                            <div className="text-xs text-gray-400 break-all mt-1">
                              <span className="font-mono">Hash:</span> {transaction.txHash}
                            </div>
                          )}
                          {/* Mostrar símbolo si no es MXNB */}
                          {!transaction.isMXNB && (
                            <div className="text-xs text-blue-400 mt-1">Token: {symbol}</div>
                          )}
                        </div>
                      </div>
                      <div className={`text-right`}>
                        <p className={`font-semibold ${amountColor}`}>
                          {transaction.type === 'expense' ? '-' : '+'}${amount.toFixed(2)} {symbol}
                        </p>
                        <p className="text-xs text-gray-400">{symbol}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-sm mb-2">
                  {searchTerm ? 'No se encontraron transacciones' : 'No hay transacciones registradas'}
                </p>
                <p className="text-gray-500 text-xs">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Inicia enviando o recibiendo tu primer pago'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Statistics;
