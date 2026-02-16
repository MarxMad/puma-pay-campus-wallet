import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SignupSuccess = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,160,18,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,160,18,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold-600/5 rounded-full blur-3xl pointer-events-none" />
      <Card className="bg-zinc-900/90 backdrop-blur-xl border-2 border-gold-500/30 p-8 max-w-md w-full shadow-2xl relative z-10 text-center">
        <div className="w-20 h-20 rounded-full bg-positive-500/20 border-2 border-positive-500/50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-positive-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Cuenta creada en PumaPay</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Tu wallet está lista. Ya puedes usar la app para pagos, guías de estudio y más.
        </p>
        <Button
          onClick={() => navigate('/home')}
          className="w-full bg-gold-600 hover:bg-gold-500 text-black font-semibold py-6 rounded-xl"
          size="lg"
        >
          <Home className="h-5 w-5 mr-2" />
          Ir al inicio
        </Button>
        {!isAuthenticated && (
          <p className="text-xs text-zinc-500 mt-4">
            Si no entras automáticamente, inicia sesión con tu correo y contraseña.
          </p>
        )}
      </Card>
    </div>
  );
};

export default SignupSuccess;
