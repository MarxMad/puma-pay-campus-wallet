import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  Zap,
  GraduationCap,
  Trophy,
  MessageSquare,
  Code2,
  ArrowRight,
  Shield,
  Smartphone,
  Github,
  Twitter,
  Instagram,
  Linkedin,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { FeatureCards } from '@/components/FeatureCards';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const onScroll = () => {
      if (!parallaxRef.current) return;
      const rect = parallaxRef.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      setParallaxOffset(center * 0.15);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500/60 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Grid background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,175,55,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <img src="/PumaPay.png" alt="PumaPay" className="h-6 w-6 object-contain" />
          </div>
          <span className="font-bold text-lg tracking-tight">PumaPay</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white"
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            onClick={() => navigate('/signup')}
          >
            Crear cuenta
          </Button>
        </div>
      </nav>

      {/* Hero con video de fondo */}
      <section className="relative z-10 min-h-[85vh] flex items-center justify-center max-w-6xl mx-auto px-6 pt-16 pb-28 text-center overflow-hidden">
        {/* Video de fondo: coloca tu archivo en public/hero-bg.mp4 */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="/placeholder.svg"
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-[#050505]" />
          <div className="absolute inset-0 bg-[#050505]/50" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-4 py-1.5 text-sm text-amber-400/90 mb-8">
            <Code2 className="h-4 w-4" />
            <span>Wallet digital · Stellar · Para la UNAM</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-lg">
            El campus en tu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              wallet
            </span>
          </h1>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto mb-10 drop-shadow-md">
            Paga con XLM en CU, gana puntos con guías y cuestionarios, compite en el ranking y conecta con la comunidad. Todo en una app.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-6 rounded-xl"
              onClick={() => navigate('/signup')}
            >
              Crear cuenta gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-500 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8 py-6 rounded-xl"
              onClick={() => navigate('/login')}
            >
              Ya tengo cuenta
            </Button>
          </div>
        </div>
      </section>

      {/* Code / tech strip */}
      <section className="relative z-10 border-y border-zinc-800/80 bg-zinc-900/30 py-4 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto font-mono text-sm text-zinc-500 flex items-center gap-8">
          <span><span className="text-amber-500/80">const</span> wallet = createStellarAccount();</span>
          <span><span className="text-amber-500/80">await</span> fundWithFriendbot(wallet);</span>
          <span><span className="text-amber-500/80">return</span> &lt;PumaPay /&gt;;</span>
        </div>
      </section>

      {/* Banner Parallax (ancho total de la página) */}
      <section
        ref={parallaxRef}
        className="relative z-10 w-full min-h-[280px] py-24 overflow-hidden flex items-center justify-center"
        aria-hidden
      >
        <div
          className="absolute inset-0 w-full min-h-[140%] -top-[20%] bg-gradient-to-r from-amber-900/25 via-amber-700/20 to-amber-900/25 border-y border-amber-500/10 bg-[length:100%_100%]"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 text-center">
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">
            Stellar · Testnet · UNAM
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400/90 mt-2">
            Una wallet, todo el campus
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Hecho para estudiantes</h2>
        <p className="text-zinc-400 text-center max-w-xl mx-auto mb-16">
          Una sola app: pagos en campus, estudio gamificado y comunidad universitaria.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Wallet,
              title: 'Wallet Stellar',
              desc: 'Cuenta en testnet al registrarte. Envía y recibe XLM por QR en segundos.',
              color: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
            },
            {
              icon: GraduationCap,
              title: 'Guías y cuestionarios',
              desc: 'Prepara exámenes por materia. Aprobas = insignias Bronze, Silver, Gold y puntos.',
              color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
            },
            {
              icon: Trophy,
              title: 'Ranking del campus',
              desc: 'Top 50 por puntos. Racha diaria de 50 pts. Compite con tu nombre en el leaderboard.',
              color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
            },
            {
              icon: MessageSquare,
              title: 'Feed del campus',
              desc: 'Publicaciones y comentarios. Comunidad UNAM en un solo feed.',
              color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
            },
            {
              icon: Shield,
              title: 'Tu llave, tu control',
              desc: 'Secret key encriptada en nuestra DB. Sin Supabase Auth: solo email y contraseña.',
              color: 'from-zinc-500/20 to-zinc-600/5 border-zinc-500/20',
            },
            {
              icon: Smartphone,
              title: 'Listo en el cel',
              desc: 'PWA-friendly. Regístrate, fondear testnet y a usar en CU.',
              color: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className={`rounded-2xl border bg-gradient-to-br ${color} p-6 backdrop-blur-sm transition hover:scale-[1.02]`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tarjetas estilo Boundless */}
      <FeatureCards />

      {/* UNAM y PumaPay: dos columnas — izquierda bullets, derecha imagen */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-2">UNAM y PumaPay</h2>
        <p className="text-zinc-400 text-center max-w-lg mx-auto mb-12">
          El campus en tu wallet.
        </p>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="order-2 md:order-1">
            <ul className="space-y-3 text-zinc-300 text-sm sm:text-base">
              <li className="flex items-start gap-3">
                <span className="text-amber-400 mt-1.5 shrink-0">•</span>
                <span>Wallet en Stellar (testnet) para pagar con XLM en CU.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400 mt-1.5 shrink-0">•</span>
                <span>Guías y cuestionarios por materia; ganas puntos e insignias.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400 mt-1.5 shrink-0">•</span>
                <span>Ranking del campus y feed para la comunidad universitaria.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400 mt-1.5 shrink-0">•</span>
                <span>Una sola app: pagos, estudio y comunidad.</span>
              </li>
            </ul>
          </div>
          <div className="relative aspect-[4/3] rounded-xl border border-zinc-700 bg-zinc-900/80 overflow-hidden order-1 md:order-2">
            <img
              src="/unam-1.jpg"
              alt="Campus UNAM"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.closest('div');
                const fallback = parent?.querySelector('[data-fallback]');
                if (fallback) (fallback as HTMLElement).classList.remove('hidden');
              }}
            />
            <div
              data-fallback
              className="absolute inset-0 bg-zinc-800/90 flex items-center justify-center hidden"
            >
              <span className="text-amber-400 font-semibold">UNAM · PumaPay</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-12">
          <Zap className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">¿Eres de la UNAM?</h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            Crea tu cuenta, recibe XLM en testnet y empieza a pagar, estudiar y competir en el ranking.
          </p>
          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-6 rounded-xl"
            onClick={() => navigate('/signup')}
          >
            Crear cuenta
          </Button>
        </div>
      </section>

      {/* Flujos y cuadros dinámicos */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-3">Cómo funciona</h2>
        <p className="text-zinc-400 text-center max-w-lg mx-auto mb-14">
          Regístrate, fondear tu wallet y empieza a usar PumaPay en minutos.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Crear cuenta', desc: 'Email y contraseña. Wallet Stellar se crea al instante.', delay: '0ms' },
            { step: '02', title: 'Fondear testnet', desc: 'Un clic y recibes XLM de prueba para usar en la app.', delay: '75ms' },
            { step: '03', title: 'Pagar o estudiar', desc: 'Envía XLM por QR, haz cuestionarios y gana insignias.', delay: '150ms' },
            { step: '04', title: 'Subir en el ranking', desc: 'Puntos y racha diaria. Compite en el leaderboard.', delay: '225ms' },
          ].map(({ step, title, desc, delay }) => (
            <div
              key={step}
              className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:bg-zinc-800/50"
              style={{ animationDelay: delay }}
            >
              <span className="text-3xl font-bold text-amber-500/60">{step}</span>
              <h3 className="text-lg font-semibold mt-2 mb-1">{title}</h3>
              <p className="text-sm text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-4 text-center min-w-[140px]">
            <span className="text-2xl font-bold text-amber-400">XLM</span>
            <p className="text-xs text-zinc-500 mt-1">Pagos en testnet</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-4 text-center min-w-[140px]">
            <span className="text-2xl font-bold text-emerald-400">Puntos</span>
            <p className="text-xs text-zinc-500 mt-1">Cuestionarios y racha</p>
          </div>
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-6 py-4 text-center min-w-[140px]">
            <span className="text-2xl font-bold text-violet-400">Feed</span>
            <p className="text-xs text-zinc-500 mt-1">Comunidad campus</p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <img src="/PumaPay.png" alt="PumaPay" className="h-6 w-6 object-contain" />
                <span className="font-semibold">PumaPay</span>
              </div>
              <p className="text-sm text-zinc-500">
                Wallet digital para el campus. Pagos, guías y comunidad UNAM.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><button type="button" className="text-zinc-500 hover:text-amber-400 transition" onClick={() => navigate('/login')}>Iniciar sesión</button></li>
                <li><button type="button" className="text-zinc-500 hover:text-amber-400 transition" onClick={() => navigate('/signup')}>Registrarse</button></li>
                <li><button type="button" className="text-zinc-500 hover:text-amber-400 transition" onClick={() => navigate('/home')}>App (requiere cuenta)</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><button type="button" className="text-zinc-500 hover:text-amber-400 transition flex items-center gap-2" onClick={() => navigate('/terminos')}><FileText className="h-4 w-4" /> Términos y condiciones</button></li>
                <li><button type="button" className="text-zinc-500 hover:text-amber-400 transition flex items-center gap-2" onClick={() => navigate('/aviso-privacidad')}><ShieldCheck className="h-4 w-4" /> Aviso de privacidad</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider mb-4">Síguenos</h4>
              <div className="flex gap-3">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition" aria-label="GitHub">
                  <Github className="h-5 w-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
              <p className="text-xs text-zinc-500 mt-3">Repositorio y redes del proyecto</p>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-zinc-500 text-sm">© {new Date().getFullYear()} PumaPay · Campus Wallet · UNAM</span>
            <div className="flex gap-6 text-sm text-zinc-500">
              <button type="button" className="hover:text-amber-400 transition" onClick={() => navigate('/terminos')}>Términos</button>
              <button type="button" className="hover:text-amber-400 transition" onClick={() => navigate('/aviso-privacidad')}>Privacidad</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
