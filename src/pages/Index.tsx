
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Redirigir según el estado de autenticación
      if (isAuthenticated) {
        navigate('/home');
      } else {
        navigate('/welcome');
      }
    }
  }, [navigate, isAuthenticated, isLoading]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gold-500/60 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center ring-1 ring-gold-500/40 bg-black/40 p-1">
              <img src="/PumaPay.png" alt="PumaPay" className="h-5 w-5 object-contain" />
            </div>
            <p className="text-zinc-300 text-sm font-medium">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
