import { Home, MapPin, GraduationCap, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/feed', icon: MessageSquare, label: 'Feed' },
  { path: '/courses', icon: GraduationCap, label: 'Guías' },
  // { path: '/campus-map', icon: MapPin, label: 'Mapa' },
  // TEMPORALMENTE COMENTADO - Estadísticas
  // { path: '/statistics', icon: Search, label: 'Estadísticas' },
  { path: '/profile', icon: Settings, label: 'Perfil' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-gold-500' : 'text-zinc-500'}`} />
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav; 