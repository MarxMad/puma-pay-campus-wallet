import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Check, X, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor completa todos los campos correctamente",
        variant: "destructive",
      });
      return;
    }
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
    setShowTermsModal(true);
  };

  const doCreateAccount = async () => {
    if (!acceptedTerms || !acceptedPrivacy) return;
    try {
      setSignupStep('Guardando usuario...');
      setEmailError(null);
      setShowTermsModal(false);
      console.log('🔄 Iniciando creación de cuenta...');
      const fullName = `${formData.name} ${formData.lastName}`.trim();
      await createAccount(
        formData.email,
        formData.password,
        fullName,
        formData.studentId,
        (step) => setSignupStep(step)
      );
      setSignupStep(null);
      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta PumaPay está lista. Serás redirigido a la página de éxito.",
      });
      navigate('/signup-success');
    } catch (error) {
      setSignupStep(null);
      console.error('❌ Error creando cuenta:', error);
      toast({
        title: "Error al crear cuenta",
        description: error instanceof Error ? error.message : "No se pudo crear la cuenta o la wallet. Intenta de nuevo.",
        variant: "destructive",
      });
      if (error instanceof Error && /correo/i.test(error.message)) {
        setEmailError(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,160,18,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,160,18,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold-600/5 rounded-full blur-3xl pointer-events-none" />
      <Card className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 p-8 max-w-md w-full shadow-2xl relative z-10">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/welcome')}
            className="text-zinc-400 hover:text-white p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-white ml-2">Crear cuenta</h1>
        </div>

        {/* Aviso informativo */}
        <div className="mb-4 p-3 bg-zinc-800/50 border border-zinc-600/50 rounded-xl text-zinc-300 text-sm text-center">
          Al crear tu cuenta, también se generará automáticamente tu wallet segura en Stellar.<br />
          <span className="block mt-2 text-gold-500 font-semibold">Tu wallet PumaPay estará lista para recibir y enviar XLM en la red Stellar.</span>
        </div>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 flex items-center justify-center p-2 ring-1 ring-gold-500/20">
            <img src="/PumaPay.png" alt="PumaPay" className="h-12 w-12 object-contain" />
          </div>
          <p className="text-zinc-400 text-sm">Únete a la comunidad estudiantil</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-zinc-300 text-sm">Nombre</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 mt-1 focus:border-gold-500"
                placeholder="Alex"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-zinc-300 text-sm">Apellido</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 mt-1 focus:border-gold-500"
                placeholder="García"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-zinc-300 text-sm">Email estudiantil</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                if (emailError) setEmailError(null);
              }}
              className={`bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 mt-1 focus:border-gold-500 ${emailError ? 'border-red-500' : ''}`}
              placeholder="alex@estudiante.unam.mx"
              required
            />
            {emailError && (
              <div className="mt-1 text-xs text-red-400">
                {emailError}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="studentId" className="text-zinc-300 text-sm">Número de cuenta</Label>
            <Input
              id="studentId"
              type="text"
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 mt-1 focus:border-gold-500"
              placeholder="318145672"
              required
            />
          </div>

          {/* Contraseña con validación */}
          <div>
            <Label htmlFor="password" className="text-zinc-300 text-sm">Contraseña</Label>
            <div className="relative mt-1">
            <Input
              id="password"
                type={showPassword ? "text" : "password"}
              value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 pr-10 focus:border-gold-500"
                placeholder="••••••••"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3 text-zinc-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Indicadores de fortaleza de contraseña */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-zinc-400">Fortaleza:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-4 h-1 rounded ${
                          5 - passwordErrors.length >= level
                            ? level <= 2 ? 'bg-red-500' 
                              : level <= 3 ? 'bg-gold-500' 
                              : 'bg-positive-500'
                            : 'bg-zinc-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs ${
                    passwordErrors.length === 0 ? 'text-positive-400' :
                    passwordErrors.length <= 2 ? 'text-gold-400' : 'text-red-400'
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
            <Label htmlFor="confirmPassword" className="text-zinc-300 text-sm">Confirmar contraseña</Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className={`bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 pr-10 focus:border-gold-500 ${
                  passwordsDontMatch ? 'border-red-500' : 
                  passwordsMatch ? 'border-positive-500' : ''
                }`}
              placeholder="••••••••"
              required
            />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3 text-zinc-400 hover:text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Feedback de confirmación */}
            {formData.confirmPassword && (
              <div className="mt-2">
                {passwordsMatch ? (
                  <div className="flex items-center space-x-2 text-xs text-positive-400">
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
                ? 'bg-gold-600 hover:bg-gold-500 text-black font-semibold' 
                : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center space-y-2 w-full">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                {signupStep && (
                  <span className="text-xs text-zinc-400 mt-2 animate-pulse">{signupStep}</span>
                )}
                {!signupStep && <span>Creando cuenta...</span>}
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
            <div className="flex items-center justify-center space-x-2 text-xs text-zinc-400 mt-2">
              <AlertCircle className="h-3 w-3" />
              <span>Completa todos los campos para continuar</span>
            </div>
          )}

          <p className="text-center text-zinc-400 text-sm mt-4">
            ¿Ya tienes cuenta?{' '}
            <button 
              type="button"
              onClick={() => navigate('/welcome')}
              className="text-gold-500 hover:text-gold-400 transition-colors"
            >
              Inicia sesión
            </button>
          </p>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800 mt-4 py-2"
            onClick={() => navigate('/')}
          >
            Regresar a página principal
          </Button>
        </form>
      </Card>

      {/* Modal: Aceptar términos y aviso de privacidad antes de crear cuenta */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-white">
              <FileText className="h-5 w-5 text-gold-500" />
              Términos y privacidad
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Para crear tu cuenta debes aceptar los Términos y condiciones y el Aviso de privacidad de PumaPay.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <label className="flex items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 cursor-pointer hover:bg-zinc-800 transition-colors">
              <Checkbox
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(!!v)}
                className="mt-0.5 border-zinc-600 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
              />
              <span className="text-sm text-zinc-300">
                He leído y acepto los{' '}
                <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline font-medium">
                  Términos y condiciones
                </a>
                .
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 cursor-pointer hover:bg-zinc-800 transition-colors">
              <Checkbox
                checked={acceptedPrivacy}
                onCheckedChange={(v) => setAcceptedPrivacy(!!v)}
                className="mt-0.5 border-zinc-600 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
              />
              <span className="text-sm text-zinc-300">
                He leído y acepto el{' '}
                <a href="/aviso-privacidad" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline font-medium">
                  Aviso de privacidad
                </a>
                .
              </span>
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setShowTermsModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!acceptedTerms || !acceptedPrivacy}
              className="bg-gold-600 hover:bg-gold-500 text-black font-semibold disabled:opacity-50 disabled:pointer-events-none"
              onClick={doCreateAccount}
            >
              Acepto y continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Signup;
