import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wallet, Sparkles, Shield, Zap, Star, Store, Bus, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Welcome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginWithPortal, isLoading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Formularios simples para demo
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Track mouse position for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              backgroundColor: i % 2 === 0 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(234, 179, 8, 0.5)',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Animated gradient orbs */}
      <div
        className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
        }}
      />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"
        style={{
          animationDelay: '1s',
          transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <Card className="bg-gray-800/80 backdrop-blur-2xl border-2 border-blue-500/30 p-8 max-w-md w-full text-center shadow-2xl shadow-blue-500/20 relative overflow-hidden z-10">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full animate-shimmer" />
        
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 via-yellow-500/20 to-blue-500/20 opacity-50 blur-xl" />

        <div className="relative z-10">
          {/* Logo with tech animation */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-yellow-500 rounded-2xl animate-spin-slow opacity-30 blur-sm" />
              
              {/* Logo container */}
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 border-2 border-blue-400/50 p-4">
                <img 
                  src="/PumaPay.png" 
                  alt="PumaPay" 
                  className="h-full w-full object-contain drop-shadow-2xl rounded-2xl animate-pulse-slow" 
                />
              </div>

              {/* Floating particles around logo */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-float"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: i % 2 === 0 ? '#3b82f6' : '#eab308',
                    left: `${50 + Math.cos((i * Math.PI) / 3) * 80}%`,
                    top: `${50 + Math.sin((i * Math.PI) / 3) * 80}%`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">
              PumaPay
            </h1>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
              <p className="text-sm text-gray-300 font-medium">Campus Wallet</p>
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <p className="text-xs text-gray-400">Tu wallet estudiantil en Stellar</p>
          </div>

          {/* Feature highlights */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 group">
              <Shield className="h-6 w-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs text-gray-300 font-medium">Seguro</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 hover:bg-yellow-500/20 transition-all duration-300 group">
              <Zap className="h-6 w-6 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs text-gray-300 font-medium">Rápido</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 group">
              <Star className="h-6 w-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs text-gray-300 font-medium">Confiable</p>
            </div>
          </div>

          <p className="text-gray-300 mb-8 leading-relaxed text-sm">
            Tu wallet estudiantil para pagos<br />
            <span className="text-blue-400 font-semibold">rápidos y seguros</span> en el campus
          </p>

          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/signup')}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white py-6 rounded-xl text-lg font-bold shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center space-x-2 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Wallet className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                Crear cuenta
              </span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
            
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full border-2 border-blue-500/50 text-blue-300 hover:bg-blue-500/20 hover:text-white hover:border-blue-400 py-4 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm"
            >
              Iniciar sesión
            </Button>
          </div>

          {/* Tech features grid */}
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="group cursor-pointer">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                    <Store className="h-6 w-6 text-blue-400 group-hover:scale-110 group-hover:text-blue-300 transition-all duration-300" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors font-medium">Cafeterías</p>
              </div>
              <div className="group cursor-pointer">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30 group-hover:bg-yellow-500/30 group-hover:border-yellow-400/50 transition-all duration-300">
                    <Bus className="h-6 w-6 text-yellow-400 group-hover:scale-110 group-hover:text-yellow-300 transition-all duration-300" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 group-hover:text-yellow-400 transition-colors font-medium">Transporte</p>
              </div>
              <div className="group cursor-pointer">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                    <BookOpen className="h-6 w-6 text-blue-400 group-hover:scale-110 group-hover:text-blue-300 transition-all duration-300" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors font-medium">Papelerías</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modales */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-xs shadow-xl relative border border-blue-500/30">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setShowSignup(false)}>&times;</button>
            <h2 className="text-xl font-bold text-white mb-4">Crear cuenta</h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <input type="text" required placeholder="Nombre" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none" value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} />
              <input type="email" required placeholder="Email" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
              <input type="password" required placeholder="Contraseña" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none" value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} />
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">Crear cuenta</Button>
            </form>
          </div>
        </div>
      )}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-xs shadow-xl relative border border-blue-500/30">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setShowLogin(false)}>&times;</button>
            <h2 className="text-xl font-bold text-white mb-4">Acceder</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required placeholder="Email" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
              <input type="password" required placeholder="Contraseña" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">Acceder</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Welcome;
