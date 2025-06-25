
import { useState } from 'react';
import { Bell, Home, Search, Settings, Menu, ArrowUp, ArrowDown, Plus, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  const quickActions = [
    { icon: ArrowUp, label: 'Enviar', color: 'bg-red-500', action: () => {} },
    { icon: ArrowDown, label: 'Recibir', color: 'bg-green-500', action: () => {} },
    { icon: Plus, label: 'Depositar', color: 'bg-blue-500', action: () => {} },
    { icon: Search, label: 'Escanear', color: 'bg-purple-500', action: () => {} }
  ];

  const recentTransactions = [
    {
      id: 1,
      merchant: 'Cafetería Central',
      amount: '-$45.50',
      time: '2:30 PM',
      icon: '☕',
      type: 'expense',
      change: '+5.2%'
    },
    {
      id: 2,
      merchant: 'Transporte Escolar',
      amount: '-$12.00',
      time: '8:15 AM',
      icon: '🚌',
      type: 'expense',
      change: '-2.1%'
    },
    {
      id: 3,
      merchant: 'Papelería UNAM',
      amount: '-$85.00',
      time: 'Ayer',
      icon: '📚',
      type: 'expense',
      change: '+1.8%'
    },
    {
      id: 4,
      merchant: 'Depósito Papá',
      amount: '+$500.00',
      time: 'Ayer',
      icon: '💰',
      type: 'income',
      change: ''
    }
  ];

  const weeklySpending = [
    { day: 'L', amount: 85 },
    { day: 'M', amount: 45 },
    { day: 'M', amount: 120 },
    { day: 'J', amount: 65 },
    { day: 'V', amount: 95 },
    { day: 'S', amount: 40 },
    { day: 'D', amount: 25 }
  ];

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button variant="ghost" size="sm">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">PumaPay</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 p-6 text-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-gray-300 text-sm">Saldo disponible</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-red-400 text-sm flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -19.2%
                </span>
              </div>
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
          
          <div className="text-4xl font-bold mb-6">
            {showBalance ? '$1,247.50' : '••••••'}
            <span className="text-lg text-gray-400 ml-2">MXNB</span>
          </div>
          
          {/* Weekly Chart */}
          <div className="h-20 mb-6 flex items-end justify-between px-2">
            {weeklySpending.map((day, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div 
                  className="w-4 bg-gradient-to-t from-red-500 to-red-400 rounded-full transition-all duration-300" 
                  style={{ height: `${(day.amount / 120) * 60}px` }}
                />
                <span className="text-xs text-gray-400">{day.day}</span>
              </div>
            ))}
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Button 
                key={index}
                onClick={action.action}
                className={`${action.color} hover:opacity-90 text-white p-3 rounded-xl flex flex-col items-center space-y-1 h-auto`}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-xs">{action.label}</span>
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

      {/* Spending Overview */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Esta semana</p>
                <p className="text-white font-semibold">$475.50</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🎯</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Meta mensual</p>
                <p className="text-white font-semibold">78%</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Transacciones recientes</h3>
          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
            Ver todas
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <Card key={transaction.id} className="bg-gray-800 border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl">
                    {transaction.icon}
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.merchant}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-400 text-sm">{transaction.time}</p>
                      {transaction.change && (
                        <span className={`text-xs flex items-center ${
                          transaction.change.includes('+') ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.change.includes('+') ? 
                            <TrendingUp className="h-3 w-3 mr-1" /> : 
                            <TrendingDown className="h-3 w-3 mr-1" />
                          }
                          {transaction.change}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'expense' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {transaction.amount}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-around py-2">
          <Button variant="ghost" size="sm">
            <Home className="h-5 w-5 text-white" />
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
