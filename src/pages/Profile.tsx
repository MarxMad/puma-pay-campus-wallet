
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, User, Settings as SettingsIcon, Shield, Home, Search, Settings, CreditCard, History, LogOut, Edit, Phone, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();

  const userStats = [
    { label: 'Transacciones', value: '247', icon: History },
    { label: 'Ahorrado', value: '$1,240', icon: CreditCard },
    { label: 'Este mes', value: '$890', icon: Calendar }
  ];

  const menuItems = [
    { icon: CreditCard, label: 'Mis tarjetas', color: 'bg-blue-500' },
    { icon: Bell, label: 'Notificaciones', color: 'bg-green-500' },
    { icon: SettingsIcon, label: 'Configuración', color: 'bg-purple-500' },
    { icon: Shield, label: 'Seguridad', color: 'bg-red-500' },
    { icon: History, label: 'Historial completo', color: 'bg-orange-500' },
    { icon: Phone, label: 'Soporte', color: 'bg-teal-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-sm mx-auto">
        <Card className="bg-gray-800 border-gray-700 text-white">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <Bell className="h-5 w-5 text-gray-400" />
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
            
            {/* Profile Info */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl font-bold">AJ</span>
              </div>
              <h1 className="text-xl font-bold">Alex Johnson</h1>
              <p className="text-gray-400">alex.johnson@estudiante.unam.mx</p>
              <p className="text-sm text-gray-500">ID: 318145672 • Miembro desde 2022</p>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {userStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-10 h-10 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-sm font-semibold">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-6 space-y-3">
            {menuItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors cursor-pointer">
                <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
            ))}
            
            {/* Logout Button */}
            <div className="flex items-center space-x-4 p-4 bg-red-900/20 rounded-xl hover:bg-red-900/30 transition-colors cursor-pointer border border-red-800/30">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <LogOut className="h-5 w-5 text-white" />
              </div>
              <span className="flex-1 font-medium text-red-400">Cerrar sesión</span>
            </div>
          </div>
        </Card>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-around py-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
              <Home className="h-5 w-5 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/statistics')}>
              <Search className="h-5 w-5 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
