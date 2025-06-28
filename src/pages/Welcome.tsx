
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Welcome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginWithPortal, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-gray-700 p-8 max-w-sm w-full text-center">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-orange-400/20 p-3">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner">
              <img src="/PumaPay.png" alt="PumaPay" className="h-16 w-16 object-contain" />
            </div>
          </div>
        </div>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Tu wallet estudiantil para pagos<br />
          rápidos y seguros en el campus
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/signup')}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>Crear cuenta nueva</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">o accede rápido con</span>
            </div>
          </div>

          {/* Portal MPC Quick Access */}
          <div className="space-y-3">
            <Button 
              onClick={async () => {
                try {
                  console.log('🔄 Iniciando login rápido con Google...');
                  await loginWithPortal('google');
                  
                  console.log('✅ Login rápido Google exitoso');
                  toast({
                    title: "¡Wallet creada!",
                    description: "Tu wallet MPC está lista",
                  });
                  
                  // La navegación se maneja por el AuthProvider automáticamente
                  
                } catch (error) {
                  console.error('❌ Error login rápido Google:', error);
                  toast({
                    title: "Error",
                    description: "No se pudo conectar con Google (Modo Demo)",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isLoading}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white py-3 rounded-xl disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
{isLoading ? 'Creando wallet MPC...' : 'Demo Google Login'}
            </Button>

            <Button 
              onClick={async () => {
                try {
                  console.log('🔄 Iniciando login rápido con Apple...');
                  await loginWithPortal('apple');
                  
                  console.log('✅ Login rápido Apple exitoso');
                  toast({
                    title: "¡Wallet creada!",
                    description: "Tu wallet MPC está lista",
                  });
                  
                  // La navegación se maneja por el AuthProvider automáticamente
                  
                } catch (error) {
                  console.error('❌ Error login rápido Apple:', error);
                  toast({
                    title: "Error",
                    description: "No se pudo conectar con Apple (Modo Demo)",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isLoading}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white py-3 rounded-xl disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
{isLoading ? 'Creando wallet MPC...' : 'Demo Apple Login'}
            </Button>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-gray-400 text-sm mb-2">¿Ya tienes una wallet?</p>
            <Button 
              variant="ghost"
              onClick={() => navigate('/login')}
              disabled={isLoading}
              className="text-orange-400 hover:text-orange-300 underline disabled:opacity-50"
            >
              <Wallet className="h-4 w-4 mr-1" />
              Acceder con mi wallet
            </Button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">🏪</div>
              <p className="text-xs text-gray-400">Cafeterías</p>
            </div>
            <div>
              <div className="text-2xl mb-1">🚌</div>
              <p className="text-xs text-gray-400">Transporte</p>
            </div>
            <div>
              <div className="text-2xl mb-1">📚</div>
              <p className="text-xs text-gray-400">Papelerías</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Welcome;
