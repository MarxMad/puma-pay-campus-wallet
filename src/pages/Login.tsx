import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithPortal, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('🔄 Iniciando login tradicional...');
      await login(formData.email, formData.password);
      
      console.log('✅ Login exitoso');
      toast('¡Bienvenido!', {
        description: 'Has iniciado sesión correctamente',
      });
      
      // La navegación se maneja por el AuthProvider automáticamente
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      let description = 'Credenciales incorrectas';
      if (error instanceof Error) {
        if (error.message === 'Usuario no registrado') {
          description = 'El usuario no está registrado. Por favor crea una cuenta.';
        } else if (error.message === 'Contraseña incorrecta') {
          description = 'La contraseña es incorrecta. Intenta de nuevo.';
        } else {
          description = error.message;
        }
      }
      toast('Error de autenticación', {
        description,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-8 max-w-sm w-full shadow-2xl shadow-black/50">
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
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-orange-400/20 p-2">
            <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-full flex items-center justify-center shadow-inner">
              <img src="/PumaPay.png" alt="PumaPay" className="h-10 w-10 object-contain" />
            </div>
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
              className="text-sm text-orange-400 hover:text-orange-300"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl mt-6 disabled:opacity-50"
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
        </form>
      </Card>
    </div>
  );
};

export default Login; 