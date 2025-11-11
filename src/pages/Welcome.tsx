import { useState } from 'react';
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
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Formularios simples para demo
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica real de registro
    toast({ title: 'Cuenta creada', description: '¡Bienvenido a PumaPay!' });
    setShowSignup(false);
    navigate('/wallet-setup');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica real de login
    toast({ title: 'Login exitoso', description: '¡Bienvenido de nuevo!' });
    setShowLogin(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-8 max-w-sm w-full text-center shadow-2xl shadow-black/50">
        <div className="mb-8">
          <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500/30 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-orange-500/10 p-4">
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-inner border border-gray-600/50">
              <img src="/PumaPay.png" alt="PumaPay" className="h-24 w-24 object-contain brightness-110 rounded-full" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            PumaPay
          </h1>
          <p className="text-sm text-gray-400">Campus Wallet</p>
        </div>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Tu wallet estudiantil para pagos<br />
          rápidos y seguros en el campus
        </p>
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/signup')}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>Crear cuenta</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
            <Button 
            onClick={() => navigate('/login')}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white py-3 rounded-xl disabled:opacity-50"
            >
            Iniciar sesión
            </Button>
        </div>
        {/* Modales */}
        {showSignup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gray-900 rounded-xl p-8 w-full max-w-xs shadow-xl relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setShowSignup(false)}>&times;</button>
              <h2 className="text-xl font-bold text-white mb-4">Crear cuenta</h2>
              <form onSubmit={handleSignup} className="space-y-4">
                <input type="text" required placeholder="Nombre" className="w-full p-2 rounded bg-gray-800 text-white" value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} />
                <input type="email" required placeholder="Email" className="w-full p-2 rounded bg-gray-800 text-white" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
                <input type="password" required placeholder="Contraseña" className="w-full p-2 rounded bg-gray-800 text-white" value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} />
                <Button type="submit" className="w-full bg-orange-500 text-white">Crear cuenta</Button>
              </form>
            </div>
          </div>
        )}
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gray-900 rounded-xl p-8 w-full max-w-xs shadow-xl relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setShowLogin(false)}>&times;</button>
              <h2 className="text-xl font-bold text-white mb-4">Acceder</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" required placeholder="Email" className="w-full p-2 rounded bg-gray-800 text-white" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
                <input type="password" required placeholder="Contraseña" className="w-full p-2 rounded bg-gray-800 text-white" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
                <Button type="submit" className="w-full bg-orange-500 text-white">Acceder</Button>
              </form>
            </div>
          </div>
        )}
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
