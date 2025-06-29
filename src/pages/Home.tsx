
import { useState, useEffect } from 'react';
import { Bell, Home, Search, Settings, User, ArrowUp, ArrowDown, ArrowLeftRight, Eye, EyeOff, TrendingUp, TrendingDown, Plus, Banknote, BarChart3, Send, Download, Repeat, Zap, Sparkles, Activity, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { bitsoService } from '@/services/bitso';
import { portalService } from '@/services/portal';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useBalance } from '@/hooks/useBalance';
import { SkeletonBalance } from '../components/SkeletonLoader';

const HomePage = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Hook de categorías para obtener datos reales
  const { 
    getRecentTransactions, 
    getTotalExpenses, 
    getTotalIncome, 
    getGlobalBudgetProgress,
    getCategoryStats,
    isLoading: categoriesLoading 
  } = useCategories();

  // Hook de balance para obtener balance real del usuario
  const { balance, available, isLoading: balanceLoading, recalculateBalance } = useBalance();

  // Forzar actualización del balance cuando se monta el componente Home
  useEffect(() => {
    console.log('🏠 Home montado, forzando actualización de balance...');
    if (recalculateBalance) {
      setTimeout(() => {
        recalculateBalance();
      }, 500);
    }
  }, [recalculateBalance]);

  // Datos reales de categorías y transacciones
  const totalExpenses = getTotalExpenses();
  const totalIncome = getTotalIncome();
  const budgetProgress = getGlobalBudgetProgress();
  const categoryStats = getCategoryStats();
  const realTransactions = getRecentTransactions(4);
  
  // Calcular progreso del presupuesto mensual global
  const monthlyGoalProgress = Math.round(budgetProgress.progress);



  // Helper para formatear transacciones para la UI
  const formatTransactionForDisplay = (transaction: any) => {
    const categories = [...categoryStats];
    const category = categories.find(c => c.id === transaction.categoryId);
    
    const formatTime = (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays === 0) {
        if (diffHours === 0) return 'Hace un momento';
        return `${diffHours}h`;
      } else if (diffDays === 1) {
        return 'Ayer';
      } else {
        return `${diffDays}d`;
      }
    };

    return {
      id: transaction.id,
      merchant: transaction.recipient || transaction.description || 'Transacción',
      amount: `${transaction.type === 'expense' ? '-' : '+'}$${transaction.amount.toFixed(2)}`,
      time: formatTime(transaction.date),
      icon: category?.icon || (transaction.type === 'expense' ? '💸' : '💰'),
      type: transaction.type,
      change: '' // No calculamos cambios por ahora
    };
  };

  // Función handleDeposit eliminada - los depósitos se hacen en /receive

  const quickActions = [
    { icon: Send, label: 'Enviar', color: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600', action: () => navigate('/send') },
    { icon: Download, label: 'Recibir', color: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600', action: () => navigate('/receive') },
    { icon: Repeat, label: 'Swap', color: 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600', action: () => navigate('/swap') }
  ];

  // Calcular gastos por día de la semana
  const calculateWeeklySpending = () => {
    const today = new Date();
    const weekData = [];
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayExpenses = realTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'expense' && 
                 tDate.toDateString() === date.toDateString();
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      weekData.push({
        day: dayNames[date.getDay()],
        amount: dayExpenses // Solo gastos reales, no datos aleatorios
      });
    }
    
    return weekData;
  };

  const weeklySpending = calculateWeeklySpending();

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 text-white bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-xl shadow-black/30">
        <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
          <User className="h-5 w-5" />
        </Button>
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg p-1">
          <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-full flex items-center justify-center shadow-inner">
            <img src="/PumaPay.png" alt="PumaPay" className="h-5 w-5 object-contain" />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {/* Balance Card */}
      <div className="p-4 overflow-hidden">
        <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white relative overflow-hidden shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-gray-300 text-sm">Saldo disponible</span>
              {totalExpenses > 0 && (
              <div className="flex items-center space-x-2 mt-1">
                  <span className="text-gray-400 text-xs">
                    Gastado este mes: ${totalExpenses.toFixed(2)}
                </span>
              </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="text-gray-300 hover:text-white"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {balanceLoading ? (
            <SkeletonBalance />
          ) : (
            <div className="text-4xl font-bold mb-6 transform transition-all duration-300 ease-out hover:brightness-110 hover:text-shadow-glow">
              {showBalance ? `$${available.toFixed(2)}` : '••••••'}
              <span className="text-lg text-gray-400 ml-2">MXNB</span>
            </div>
          )}
          
          {/* Weekly Chart */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300 font-medium">Gastos de la semana</span>
              <div className="flex-1"></div>
              {weeklySpending.some(d => d.amount > 0) && (
                <span className="text-xs text-gray-400">
                  Total: ${weeklySpending.reduce((sum, d) => sum + d.amount, 0).toFixed(0)}
                </span>
              )}
            </div>
            
            <div className="h-24 flex items-end justify-between space-x-3 px-2">
              {weeklySpending.map((day, i) => {
                const maxAmount = Math.max(...weeklySpending.map(d => d.amount), 100);
                const heightPercentage = day.amount > 0 ? Math.max((day.amount / maxAmount) * 100, 6) : 6;
                const isHovered = hoveredDay === i;
                const isToday = day.day === ['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date().getDay()];
                
                return (
                  <div 
                    key={i} 
                    className="flex flex-col items-center space-y-2 flex-1 relative cursor-pointer"
                    onMouseEnter={() => setHoveredDay(i)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && day.amount > 0 && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10 shadow-lg">
                        <div className="text-white font-semibold">${day.amount.toFixed(2)}</div>
                        <div className="text-gray-400">{isToday ? 'Hoy' : day.day}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                    
                    {/* Bar */}
                    <div className="w-full bg-gray-700/30 rounded-lg relative overflow-hidden" style={{ height: '70px' }}>
                      {day.amount > 0 ? (
                        <div 
                          className={`w-full absolute bottom-0 rounded-lg transition-all duration-500 ease-out transform ${
                            isHovered ? 'scale-110' : 'scale-100'
                          } ${
                            isToday 
                              ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400' 
                              : 'bg-gradient-to-t from-red-600 via-red-500 to-red-400'
                          }`}
                          style={{ 
                            height: `${heightPercentage}%`,
                            animationDelay: `${i * 100}ms`,
                            boxShadow: isHovered ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
                          }}
                        >
                          {/* Animated shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Glow effect for today */}
                          {isToday && (
                            <div className="absolute inset-0 bg-blue-400/20 rounded-lg animate-pulse"></div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-2 bg-gray-600/50 rounded-lg absolute bottom-0 opacity-50"></div>
                      )}
                      
                      {/* Today indicator */}
                      {isToday && (
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    
                    {/* Day Label */}
                    <span className={`text-xs transition-all duration-200 ${
                      isToday 
                        ? 'text-blue-400 font-bold' 
                        : isHovered 
                          ? 'text-orange-400 font-semibold' 
                          : 'text-gray-400'
                    }`}>
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Week summary */}
            {weeklySpending.some(d => d.amount > 0) ? (
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Hoy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Otros días</span>
                </div>
                <div>
                  Promedio: ${(weeklySpending.reduce((sum, d) => sum + d.amount, 0) / 7).toFixed(0)}/día
                </div>
              </div>
            ) : (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">No hay gastos esta semana</p>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Button 
                key={index}
                onClick={action.action}
                className={`${action.color} text-white p-4 rounded-xl flex flex-col items-center space-y-2 h-auto transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl active:scale-95 group relative overflow-hidden`}
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-700 ease-out"></div>
                
                {/* Icon with tech effect */}
                <action.icon className="h-6 w-6 relative z-10 transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
                
                {/* Text with glow effect */}
                <span className="text-sm font-medium relative z-10 group-hover:text-shadow-glow">{action.label}</span>
                
                {/* Corner accent */}
                <div className="absolute top-1 right-1 w-2 h-2 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors duration-300"></div>
              </Button>
            ))}
          </div>

          {/* Background decoration */}
          <div className="absolute top-4 right-4 opacity-10">
            <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">₱</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Campus Map Feature */}
      <div className="px-4 mb-6">
        <Card 
          className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 text-white relative overflow-hidden group hover:bg-gray-800/70 transition-all duration-500 shadow-2xl cursor-pointer"
          onClick={() => navigate('/campus-map')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">🗺️ Descubre el Campus</h3>
                <p className="text-gray-300 text-sm">
                  Encuentra lugares que aceptan PumaPay
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">Descuentos exclusivos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-400">6 lugares disponibles</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-green-500/20 border border-green-500/40 rounded-full px-3 py-1 mb-2">
                <span className="text-green-400 text-xs font-bold">¡NUEVO!</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-300">
                <span className="text-sm">Ver mapa</span>
                <ArrowUp className="h-4 w-4 rotate-45" />
              </div>
            </div>
          </div>
          
          {/* Popular places preview */}
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-xs text-gray-400">Populares:</span>
            <div className="flex items-center space-x-1">
              <span className="text-lg">🍕</span>
              <span className="text-xs text-white">Cafetería</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg">🏃‍♂️</span>
              <span className="text-xs text-white">Gimnasio</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg">📚</span>
              <span className="text-xs text-white">Librería</span>
            </div>
          </div>
          
          {/* Animated background effects */}
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="absolute top-1/2 right-12 w-6 h-6 bg-gray-500/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        </Card>
      </div>

      {/* Spending Overview */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Gastos del mes */}
                      <Card className="bg-orange-500/20 backdrop-blur-lg border border-orange-500/30 p-5 relative overflow-hidden group hover:bg-orange-500/30 transition-all duration-300 shadow-lg shadow-orange-500/10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Gastos del mes</p>
                                  <p className="text-white font-bold text-xl">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
            
            {/* Progress indicator */}
            {monthlyGoalProgress > 0 && (
              <div className="mt-2 w-full bg-orange-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(monthlyGoalProgress, 100)}%` }}
                ></div>
              </div>
            )}
            
            {/* Background decoration */}
                          <div className="absolute -top-3 -right-3 w-12 h-12 bg-orange-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </Card>
          
          {/* Meta mensual */}
          <Card className="bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 p-5 relative overflow-hidden group hover:bg-blue-500/30 transition-all duration-300 shadow-lg shadow-blue-500/10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Meta mensual</p>
                                  <p className="text-white font-bold text-xl">{monthlyGoalProgress.toFixed(0)}%</p>
              </div>
            </div>
            
            {/* Progress circle */}
            <div className="mt-2 flex items-center justify-between">
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="rgb(191, 219, 254)"
                    strokeWidth="3"
                    fill="transparent"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="rgb(30, 64, 175)"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={`${(monthlyGoalProgress / 100) * 75.4} 75.4`}
                    className="transition-all duration-700"
                  />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-xs text-white">
                  ${budgetProgress.remaining.toFixed(0)} restante
                </p>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </Card>
        </div>
      </div>

      {/* Category Stats - Solo mostrar si hay gastos */}
      {categoryStats.some(cat => cat.spent > 0) && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-semibold">Categorías más usadas</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-400 hover:text-orange-300"
              onClick={() => navigate('/statistics')}
            >
              Ver todas
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {categoryStats.slice(0, 4).map((category, index) => (
              <Card 
                key={category.id} 
                className="bg-gradient-to-br from-gray-800/80 to-gray-700/50 border border-gray-600/50 p-4 relative overflow-hidden group hover:from-gray-700/80 hover:to-gray-600/50 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 ${category.color} rounded-full flex items-center justify-center text-sm shadow-lg transform transition-transform duration-200 group-hover:scale-110`}>
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{category.name}</p>
                    <p className="text-gray-300 text-xs font-medium">
                      ${(category.spent || 0).toFixed(0)} gastado
                    </p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-600/30 rounded-full h-2 mb-3 overflow-hidden">
                  <div 
                    className={`h-2 ${category.color} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                    style={{ 
                      width: `${((category.spent || 0) / totalExpenses * 100)}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {category.transactionCount} {category.transactionCount === 1 ? 'transacción' : 'transacciones'}
                  </span>
                  <span className="text-xs text-white font-medium">
                    {((category.spent || 0) / totalExpenses * 100).toFixed(0)}%
                  </span>
                </div>
                
                {/* Background decoration */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Transacciones recientes</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-orange-400 hover:text-orange-300"
            onClick={() => navigate('/statistics')}
          >
            Ver todas
          </Button>
        </div>
        
        <div className="space-y-3">
          {realTransactions.length > 0 ? (
            realTransactions.map((transaction) => {
              const displayTransaction = formatTransactionForDisplay(transaction);
              return (
                <Card key={displayTransaction.id} className="bg-gray-800 border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl">
                        {displayTransaction.icon}
                  </div>
                  <div>
                        <p className="text-white font-medium">{displayTransaction.merchant}</p>
                    <div className="flex items-center space-x-2">
                          <p className="text-gray-400 text-sm">{displayTransaction.time}</p>
                          <span className="text-xs text-gray-500">
                            {transaction.currency}
                        </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                        displayTransaction.type === 'expense' ? 'text-orange-400' : 'text-green-400'
                  }`}>
                        {displayTransaction.amount}
                  </p>
                </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="bg-gray-800 border-gray-700 p-6 text-center">
              <div className="text-gray-400 mb-2">
                <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
              </div>
              <p className="text-gray-400 text-sm mb-1">
                ¡Bienvenido a PumaPay Campus!
              </p>
              <p className="text-gray-500 text-xs mb-4">
                Inicia enviando o recibiendo tu primer pago
              </p>
              <div className="flex space-x-3 justify-center">
                <Button 
                  onClick={() => navigate('/send')}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Enviar dinero
                </Button>
                <Button 
                  onClick={() => navigate('/receive')}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  Recibir dinero
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-around py-2">
          <Button variant="ghost" size="sm">
            <Home className="h-5 w-5 text-white" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/campus-map')}>
            <MapPin className="h-5 w-5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/statistics')}>
            <Search className="h-5 w-5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <Settings className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

