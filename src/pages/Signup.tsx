import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    lastName: '',
    studentId: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { createAccount, isLoading } = useAuth();

  // Validar fortaleza de contraseña
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Una minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Un carácter especial');
    }
    
    return errors;
  };

  // Verificar si las contraseñas coinciden
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsDontMatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  // Verificar si el formulario es válido
  const isFormValid = 
    formData.name.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.studentId.trim() &&
    formData.password &&
    passwordsMatch &&
    passwordErrors.length === 0;

  const handlePasswordChange = (password: string) => {
    setFormData({...formData, password});
    setPasswordErrors(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor completa todos los campos correctamente",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('🔄 Iniciando creación de cuenta...');
      const fullName = `${formData.name} ${formData.lastName}`.trim();
      const result = await createAccount(formData.email, formData.password, fullName, formData.studentId);
      console.log('✅ Cuenta creada exitosamente');
      toast({
        title: "¡Cuenta y wallet creadas!",
        description: result && result.address ? `Tu wallet PumaPay está lista: ${result.address}` : "Tu wallet PumaPay está lista",
      });
      navigate('/home');
    } catch (error) {
      console.error('❌ Error creando cuenta:', error);
      toast({
        title: "Error al crear cuenta",
        description: error instanceof Error ? error.message : "No se pudo crear la cuenta o la wallet. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-8 max-w-md w-full shadow-2xl shadow-black/50">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/welcome')}
            className="text-gray-400 hover:text-white p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-white ml-2">Crear cuenta</h1>
        </div>

        {/* Aviso informativo */}
        <div className="mb-4 p-3 bg-blue-900/40 border border-blue-700 rounded text-blue-200 text-sm text-center">
          Al crear tu cuenta, también se generará automáticamente tu wallet segura de PumaPay.<br />
          <span className="block mt-2 text-blue-300 font-semibold">Además, se creará una cuenta CLABE única a tu nombre para que puedas recibir depósitos SPEI y fondear tu wallet PumaPay.</span>
        </div>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-orange-400/20 p-2">
            <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-full flex items-center justify-center shadow-inner">
              <img src="/PumaPay.png" alt="PumaPay" className="h-10 w-10 object-contain" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Únete a la comunidad estudiantil</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-300 text-sm">Nombre</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Alex"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-gray-300 text-sm">Apellido</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="García"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-300 text-sm">Email estudiantil</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="alex@estudiante.unam.mx"
              required
            />
          </div>

          <div>
            <Label htmlFor="studentId" className="text-gray-300 text-sm">Número de cuenta</Label>
            <Input
              id="studentId"
              type="text"
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="318145672"
              required
            />
          </div>

          {/* Contraseña con validación */}
          <div>
            <Label htmlFor="password" className="text-gray-300 text-sm">Contraseña</Label>
            <div className="relative mt-1">
            <Input
              id="password"
                type={showPassword ? "text" : "password"}
              value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white pr-10"
                placeholder="••••••••"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Indicadores de fortaleza de contraseña */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-400">Fortaleza:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-4 h-1 rounded ${
                          5 - passwordErrors.length >= level
                            ? level <= 2 ? 'bg-red-500' 
                              : level <= 3 ? 'bg-yellow-500' 
                              : 'bg-green-500'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs ${
                    passwordErrors.length === 0 ? 'text-green-400' :
                    passwordErrors.length <= 2 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {passwordErrors.length === 0 ? 'Fuerte' :
                     passwordErrors.length <= 2 ? 'Media' : 'Débil'}
                  </span>
                </div>

                {passwordErrors.length > 0 && (
                  <div className="space-y-1">
                    {passwordErrors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs text-red-400">
                        <X className="h-3 w-3" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">Confirmar contraseña</Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className={`bg-gray-700 border-gray-600 text-white pr-10 ${
                  passwordsDontMatch ? 'border-red-500' : 
                  passwordsMatch ? 'border-green-500' : ''
                }`}
              placeholder="••••••••"
              required
            />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Feedback de confirmación */}
            {formData.confirmPassword && (
              <div className="mt-2">
                {passwordsMatch ? (
                  <div className="flex items-center space-x-2 text-xs text-green-400">
                    <Check className="h-3 w-3" />
                    <span>Las contraseñas coinciden</span>
                  </div>
                ) : passwordsDontMatch ? (
                  <div className="flex items-center space-x-2 text-xs text-red-400">
                    <X className="h-3 w-3" />
                    <span>Las contraseñas no coinciden</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <Button 
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full py-3 rounded-xl mt-6 transition-all duration-200 ${
              isFormValid 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creando cuenta...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>Crear cuenta</span>
                {isFormValid && <Check className="h-4 w-4" />}
              </div>
            )}
          </Button>

          {/* Indicador de estado del formulario */}
          {!isFormValid && formData.password && (
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 mt-2">
              <AlertCircle className="h-3 w-3" />
              <span>Completa todos los campos para continuar</span>
            </div>
          )}

          <p className="text-center text-gray-400 text-sm mt-4">
            ¿Ya tienes cuenta?{' '}
            <button 
              type="button"
              onClick={() => navigate('/welcome')}
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              Inicia sesión
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
