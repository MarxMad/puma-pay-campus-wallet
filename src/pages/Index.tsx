
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg p-1">
              <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-full flex items-center justify-center shadow-inner">
                <img src="/PumaPay.png" alt="PumaPay" className="h-5 w-5 object-contain" />
              </div>
            </div>
            <p className="text-white">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
