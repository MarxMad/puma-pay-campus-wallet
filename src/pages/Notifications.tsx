import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Home, Search, Settings, Bell, Trash2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 1,
      type: 'warning',
      icon: '⚠️',
      title: 'Balance bajo',
      message: 'Tu saldo está bajo. Considera agregar más fondos a tu wallet.',
      time: '2 min',
      color: 'bg-yellow-500',
      isRead: false
    },
    {
      id: 2,
      type: 'success',
      icon: '💰',
      title: 'Nuevas recompensas disponibles',
      message: 'Has ganado nuevas recompensas de tus transacciones recientes.',
      time: '15 min',
      color: 'bg-green-500',
      isRead: false
    },
    {
      id: 3,
      type: 'info',
      icon: '📱',
      title: 'Método de pago actualizado',
      message: 'Tu método de pago preferido se ha actualizado exitosamente.',
      time: '1 h',
      color: 'bg-blue-500',
      isRead: true
    },
    {
      id: 4,
      type: 'transaction',
      icon: '🔒',
      title: 'Nuevo pago con QR',
      message: 'Se realizó un nuevo pago usando escaneo de código QR.',
      time: '2 h',
      color: 'bg-red-500',
      isRead: true
    },
    {
      id: 5,
      type: 'offer',
      icon: '📊',
      title: 'Oferta por tiempo limitado',
      message: 'Ofertas especiales están disponibles por tiempo limitado.',
      time: '3 h',
      color: 'bg-purple-500',
      isRead: true
    },
    {
      id: 6,
      type: 'account',
      icon: '💳',
      title: 'Actualización de cuenta',
      message: 'Actualizaciones importantes respecto a tu cuenta.',
      time: '5 h',
      color: 'bg-orange-500',
      isRead: true
    },
    {
      id: 7,
      type: 'payment',
      icon: '💡',
      title: 'Actualizar información de pago',
      message: 'Por favor actualiza tu información de pago.',
      time: '1 día',
      color: 'bg-teal-500',
      isRead: true
    },
    {
      id: 8,
      type: 'budget',
      icon: '🎯',
      title: 'Comparación mensual de presupuesto',
      message: 'Ve la comparación de tus gastos mensuales.',
      time: '2 días',
      color: 'bg-pink-500',
      isRead: true
    }
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: number) => {
    // En una aplicación real, esto actualizaría el estado
    console.log(`Marcando notificación ${id} como leída`);
  };

  const deleteNotification = (id: number) => {
    // En una aplicación real, esto eliminaría la notificación
    console.log(`Eliminando notificación ${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-black/30 backdrop-blur-xl border-b border-white/10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 border-2 border-blue-400/40 p-2 sm:p-2.5">
            <img src="/PumaPay.png" alt="PumaPay" className="h-full w-full object-contain drop-shadow-lg rounded-2xl" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              PumaPay
            </h1>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-400 hidden sm:block">Notificaciones</p>
              {unreadCount > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount}
                </div>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
          
      <div className="p-4 space-y-4">
        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">
                {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
              </span>
                <Button 
                variant="ghost" 
                  size="sm"
                className="text-red-400 hover:text-red-300"
                >
                Marcar todas como leídas
                </Button>
            </div>
          </Card>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`border-gray-700 p-4 cursor-pointer transition-all ${
                notification.isRead 
                  ? 'bg-gray-800 opacity-75' 
                  : 'bg-gray-750 border-l-4 border-l-red-500'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 ${notification.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm">{notification.icon}</span>
            </div>
            
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                        {notification.title}
                      </p>
                      <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-400'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Hace {notification.time}
                      </p>
            </div>
            
                    <div className="flex items-center space-x-2 ml-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-400 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
              </div>
            </div>
                </div>
              </div>
            </Card>
          ))}
            </div>
            
        {/* Empty state if no notifications */}
        {notifications.length === 0 && (
          <Card className="bg-gray-800 border-gray-700 p-8 text-center">
            <Bell className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">
              No hay notificaciones
            </h3>
            <p className="text-gray-400 text-sm">
              Cuando tengas nuevas notificaciones aparecerán aquí
            </p>
          </Card>
        )}
            </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-around py-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
              <Home className="h-5 w-5 text-gray-400" />
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

export default Notifications;
