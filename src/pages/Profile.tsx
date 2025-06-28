import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, User, Settings as SettingsIcon, Shield, Home, Search, Settings, CreditCard, History, LogOut, Edit, Phone, Mail, Calendar, ChevronRight, Download, Copy, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useBalance } from '@/hooks/useBalance';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  // Hooks para datos reales
  const { getRecentTransactions, getTotalIncome } = useCategories();
  const { available } = useBalance();

  // Calcular estadísticas reales del usuario
  const allTransactions = getRecentTransactions(1000); // Todas las transacciones
  const totalTransactions = allTransactions.length;
  const totalSaved = getTotalIncome(); // Total de dinero que ha recibido (como "ahorrado")
  
  // Calcular gastos de este mes
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthExpenses = allTransactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && 
             tDate.getMonth() === currentMonth && 
             tDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const userStats = [
    { 
      label: 'Transacciones', 
      value: totalTransactions.toString(), 
      icon: History 
    },
    { 
      label: 'Recibido', 
      value: totalSaved > 0 ? `$${totalSaved.toFixed(0)}` : '$0', 
      icon: CreditCard 
    },
    { 
      label: 'Este mes', 
      value: thisMonthExpenses > 0 ? `$${thisMonthExpenses.toFixed(0)}` : '$0', 
      icon: Calendar 
    }
  ];

  const menuItems = [
    { 
      icon: Tag, 
      label: 'Gestionar categorías', 
      color: 'bg-purple-500',
      action: () => navigate('/categories')
    },
    { 
      icon: CreditCard, 
      label: 'Mis tarjetas', 
      color: 'bg-blue-500',
      action: () => {
        alert('Funcionalidad de tarjetas próximamente. Aquí podrás gestionar tus métodos de pago.');
      }
    },
    { 
      icon: Bell, 
      label: 'Notificaciones', 
      color: 'bg-green-500',
      action: () => navigate('/notifications')
    },
    { 
      icon: SettingsIcon, 
      label: 'Configuración', 
      color: 'bg-purple-500',
      action: () => {
        alert('Panel de configuración próximamente. Aquí podrás ajustar preferencias de la app.');
      }
    },
    { 
      icon: Shield, 
      label: 'Seguridad', 
      color: 'bg-red-500',
      action: () => {
        alert('Configuración de seguridad próximamente. Gestiona 2FA, cambio de contraseña, etc.');
      }
    },
    { 
      icon: History, 
      label: 'Historial completo', 
      color: 'bg-orange-500',
      action: () => navigate('/statistics')
    },
    { 
      icon: Phone, 
      label: 'Soporte', 
      color: 'bg-teal-500',
      action: () => {
        const message = `Hola, necesito ayuda con mi cuenta PumaPay.\n\nUsuario: ${user?.email || user?.address}\nMétodo de auth: ${user?.authMethod}`;
        const whatsappUrl = `https://wa.me/5215512345678?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    }
  ];

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleCopyWallet = async () => {
    if (user?.address) {
      try {
        await navigator.clipboard.writeText(user.address);
        alert('Dirección de wallet copiada al portapapeles');
      } catch (error) {
        console.error('Error al copiar:', error);
        alert('Error al copiar la dirección');
      }
    }
  };

  const handleExportData = () => {
    const userData = {
      email: user?.email,
      name: user?.name,
      address: user?.address,
      authMethod: user?.authMethod,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pumapay_profile_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
      navigate('/welcome');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
          <Bell className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Mi Perfil</h1>
        <Button variant="ghost" size="sm" onClick={handleEditProfile}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Info Card */}
        <Card className="bg-gray-800 border-gray-700 p-6 text-white">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl ring-4 ring-orange-400/20">
              <span className="text-3xl font-bold">
                {user?.name ? user.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase() : 'U'}
              </span>
            </div>
            <h1 className="text-xl font-bold">{user?.name || 'Usuario'}</h1>
            <p className="text-gray-400 mb-2">{user?.email || 'Sin email'}</p>
            
            {/* Wallet Info */}
            <div className="bg-gray-700 p-3 rounded-xl mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Wallet Address</span>
                <Button
                  onClick={handleCopyWallet}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white p-1"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs font-mono text-gray-300 break-all">
                {user?.address}
              </p>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <div className={`w-2 h-2 ${user?.authMethod === 'portal' ? 'bg-green-500' : 'bg-blue-500'} rounded-full`}></div>
                <span className="text-xs text-gray-400">
                  {user?.authMethod === 'portal' ? 'Portal MPC' : 'Tradicional'}
                </span>
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-3 gap-4">
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
        </Card>

        {/* Menu Items */}
        <Card className="bg-gray-800 border-gray-700 p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Configuración</h3>
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div 
                key={index} 
                onClick={item.action}
                className="flex items-center space-x-4 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gray-800 border-gray-700 p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleExportData}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Datos
            </Button>
            <Button
              onClick={() => navigate('/debug')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Debug Panel
            </Button>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="bg-gray-800 border-gray-700 p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Cuenta</h3>
          
          {/* Logout Button */}
          <div 
            onClick={handleLogout}
            className="flex items-center space-x-4 p-4 bg-red-900/20 rounded-xl hover:bg-red-900/30 transition-colors cursor-pointer border border-red-800/30"
          >
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <LogOut className="h-5 w-5 text-white" />
            </div>
            <span className="flex-1 font-medium text-red-400">Cerrar sesión</span>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="text-gray-400"
              >
                ✕
              </Button>
            </div>
            
            <div className="text-center text-gray-300 py-8">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <p>Funcionalidad de edición de perfil próximamente.</p>
              <p className="text-sm text-gray-400 mt-2">
                Podrás cambiar tu nombre, foto de perfil y otras configuraciones.
              </p>
            </div>
            
            <Button
              onClick={() => setShowEditModal(false)}
              className="w-full bg-red-500 hover:bg-red-600 rounded-xl"
            >
              Entendido
            </Button>
          </Card>
        </div>
      )}

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
  );
};

export default Profile;
