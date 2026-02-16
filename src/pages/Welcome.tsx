import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Wallet, MessageSquare, BookOpen, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Welcome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginWithPortal, isLoading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Cuenta creada', description: '¡Bienvenido a PumaPay!' });
    setShowSignup(false);
    navigate('/wallet-setup');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Login exitoso', description: '¡Bienvenido de nuevo!' });
    setShowLogin(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,160,18,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,160,18,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold-600/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 p-8 max-w-md w-full text-center shadow-2xl relative z-10">
        <div className="relative z-10">
          <div className="mb-8">
            <div className="w-28 h-28 mx-auto mb-5 rounded-2xl bg-zinc-800 border border-zinc-600/50 flex items-center justify-center p-4 ring-1 ring-gold-500/20">
              <img src="/PumaPay.png" alt="PumaPay" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">PumaPay</h1>
            <p className="text-sm text-zinc-400 font-medium"> GOYA</p>
            <p className="text-xs text-zinc-500 mt-1">El campus en tus manos</p>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-600/40 bg-zinc-800/50">
              <CreditCard className="h-5 w-5 text-gold-500 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">Pagos</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-600/40 bg-zinc-800/50">
              <MessageSquare className="h-5 w-5 text-gold-500 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">Chats</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-600/40 bg-zinc-800/50">
              <BookOpen className="h-5 w-5 text-gold-500 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">Guías</p>
            </div>
          </div>

          <p className="text-zinc-400 mb-8 text-sm">
            Paga en el campus, <span className="text-gold-500 font-medium">chatea en vivo</span> y prepara tus exámenes con guías de estudio
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/signup')}
              className="w-full bg-gold-600 hover:bg-gold-500 text-black font-semibold py-6 rounded-xl transition-colors"
            >
              <Wallet className="h-5 w-5 mr-2" />
              Crear cuenta
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full border border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white py-4 rounded-xl font-medium"
            >
              Iniciar sesión
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-700/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-xl border border-zinc-600/40 bg-zinc-800/50 flex items-center justify-center mb-2">
                  <CreditCard className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-500 font-medium">Pagos</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-xl border border-zinc-600/40 bg-zinc-800/50 flex items-center justify-center mb-2">
                  <MessageSquare className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-500 font-medium">Chats</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-xl border border-zinc-600/40 bg-zinc-800/50 flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-500 font-medium">Guías de estudio</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-xl p-8 w-full max-w-xs shadow-xl relative border border-zinc-700">
            <button className="absolute top-2 right-2 text-zinc-400 hover:text-white" onClick={() => setShowSignup(false)}>&times;</button>
            <h2 className="text-xl font-bold text-white mb-4">Crear cuenta</h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <input type="text" required placeholder="Nombre" className="w-full p-2.5 rounded-lg bg-zinc-800 text-white border border-zinc-600 focus:border-gold-500 focus:outline-none" value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} />
              <input type="email" required placeholder="Email" className="w-full p-2.5 rounded-lg bg-zinc-800 text-white border border-zinc-600 focus:border-gold-500 focus:outline-none" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
              <input type="password" required placeholder="Contraseña" className="w-full p-2.5 rounded-lg bg-zinc-800 text-white border border-zinc-600 focus:border-gold-500 focus:outline-none" value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} />
              <Button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-black font-semibold">Crear cuenta</Button>
            </form>
          </div>
        </div>
      )}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-xl p-8 w-full max-w-xs shadow-xl relative border border-zinc-700">
            <button className="absolute top-2 right-2 text-zinc-400 hover:text-white" onClick={() => setShowLogin(false)}>&times;</button>
            <h2 className="text-xl font-bold text-white mb-4">Acceder</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required placeholder="Email" className="w-full p-2.5 rounded-lg bg-zinc-800 text-white border border-zinc-600 focus:border-gold-500 focus:outline-none" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
              <input type="password" required placeholder="Contraseña" className="w-full p-2.5 rounded-lg bg-zinc-800 text-white border border-zinc-600 focus:border-gold-500 focus:outline-none" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
              <Button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-black font-semibold">Acceder</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Welcome;
