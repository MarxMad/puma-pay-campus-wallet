import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/services/supabaseClient';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verified = searchParams.get('verified') === '1';
  const { login, loginWithPortal, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(formData.email, formData.password);
      toast('¡Bienvenido!', {
        description: 'Has iniciado sesión correctamente',
      });
    } catch (error) {
      console.error('❌ Error en login:', error);
      let description = 'Credenciales incorrectas';
      if (error instanceof Error) {
        if (error.message === 'EMAIL_NOT_CONFIRMED') {
          description = 'Verifica tu correo: revisa el enlace que enviamos a tu email para activar tu cuenta.';
        } else if (error.message === 'Usuario no registrado') {
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

  const handleResendVerification = async () => {
    if (!formData.email?.trim()) {
      toast.error('Escribe tu correo', { description: 'Introduce tu email para reenviar el enlace.' });
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email.trim(),
      });
      if (error) throw error;
      toast('Correo reenviado', { description: 'Revisa tu bandeja (y spam) para el enlace de verificación.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo reenviar. Intenta más tarde.';
      toast.error('Error', { description: msg });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <Card className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 p-8 max-w-sm w-full shadow-xl">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/welcome')}
            className="text-zinc-400 hover:text-white p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-white ml-2">Iniciar sesión</h1>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-zinc-800 border border-zinc-600/50 flex items-center justify-center p-2 ring-1 ring-gold-500/20">
            <img src="/PumaPay.png" alt="PumaPay" className="h-9 w-9 object-contain" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Bienvenido de nuevo</h2>
          <p className="text-zinc-500 text-sm">Accede a tu wallet estudiantil</p>
          {verified && (
            <p className="mt-3 text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              Correo verificado. Ya puedes iniciar sesión.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-zinc-400 text-sm">Email estudiantil</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-zinc-800 border-zinc-600 text-white mt-1 focus-visible:ring-gold-500"
              placeholder="tu-email@estudiante.unam.mx"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-zinc-400 text-sm">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="bg-zinc-800 border-zinc-600 text-white mt-1 pr-10 focus-visible:ring-gold-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm text-zinc-500">
                <input type="checkbox" className="rounded border-zinc-600 bg-zinc-800" />
                <span>Recordarme</span>
              </label>
              <button type="button" className="text-sm text-gold-500 hover:text-gold-400">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="text-sm text-zinc-400 hover:text-gold-500 flex items-center gap-1.5 justify-center"
            >
              <Mail className="h-3.5 w-3.5" />
              {resending ? 'Enviando...' : 'Reenviar correo de verificación'}
            </button>
          </div>

          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gold-600 hover:bg-gold-500 text-black font-semibold py-3 rounded-xl mt-6 disabled:opacity-50"
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