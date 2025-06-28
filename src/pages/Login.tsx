import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, loginWithPortal, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('🔄 Iniciando login tradicional...');
      await login(formData.email, formData.password);
      
      console.log('✅ Login exitoso');
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
      
      // La navegación se maneja por el AuthProvider automáticamente
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Credenciales incorrectas",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-gray-700 p-8 max-w-sm w-full">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/welcome')}
            className="text-gray-400 hover:text-white p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-white ml-2">Iniciar sesión</h1>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Bienvenido de nuevo</h2>
          <p className="text-gray-400 text-sm">Accede a tu wallet estudiantil</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-300 text-sm">Email estudiantil</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="tu-email@estudiante.unam.mx"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300 text-sm">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white mt-1 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm text-gray-400">
              <input type="checkbox" className="rounded border-gray-600" />
              <span>Recordarme</span>
            </label>
            <button 
              type="button"
              className="text-sm text-red-400 hover:text-red-300"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl mt-6 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              'Iniciar sesión'
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">o continúa con</span>
            </div>
          </div>

          {/* Portal MPC Wallet Login Options */}
          <div className="space-y-3">
            <Button 
              type="button"
              variant="outline"
              disabled={isLoading}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white py-3 rounded-xl disabled:opacity-50"
              onClick={async () => {
                try {
                  console.log('🔄 Iniciando login con Google...');
                  await loginWithPortal('google');
                  
                  console.log('✅ Login Google exitoso');
                  toast({
                    title: "¡Autenticación exitosa!",
                    description: "Bienvenido con Google",
                  });
                  
                  // La navegación se maneja por el AuthProvider automáticamente
                  
                } catch (error) {
                  console.error('❌ Error login Google:', error);
                  toast({
                    title: "Error de autenticación",
                    description: "No se pudo conectar con Google (Modo Demo)",
                    variant: "destructive",
                  });
                }
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
Demo Google Login
            </Button>

            <Button 
              type="button"
              variant="outline"
              disabled={isLoading}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white py-3 rounded-xl disabled:opacity-50"
              onClick={async () => {
                try {
                  console.log('🔄 Iniciando login con Apple...');
                  await loginWithPortal('apple');
                  
                  console.log('✅ Login Apple exitoso');
                  toast({
                    title: "¡Autenticación exitosa!",
                    description: "Bienvenido con Apple",
                  });
                  
                  // La navegación se maneja por el AuthProvider automáticamente
                  
                } catch (error) {
                  console.error('❌ Error login Apple:', error);
                  toast({
                    title: "Error de autenticación",
                    description: "No se pudo conectar con Apple (Modo Demo)",
                    variant: "destructive",
                  });
                }
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
Demo Apple Login
            </Button>
          </div>

          <p className="text-center text-gray-400 text-sm mt-4">
            ¿No tienes cuenta?{' '}
            <button 
              type="button"
              onClick={() => navigate('/signup')}
              className="text-red-400 hover:text-red-300"
            >
              Crear cuenta
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Login; 