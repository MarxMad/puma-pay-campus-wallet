/**
 * Tarjetas estilo Boundless: oscuras, con tags, estado y efecto apilado/carrusel.
 */
import { useNavigate } from 'react-router-dom';

const cards = [
  {
    id: 'wallet',
    title: 'Wallet Stellar',
    by: 'PumaPay',
    description: 'Envía y recibe XLM por QR en segundos. Testnet listo al registrarte.',
    tags: ['Stellar', 'XLM', 'Testnet'],
    tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    status: 'Activo',
    statusColor: 'text-emerald-400',
  },
  {
    id: 'guias',
    title: 'Guías de estudio',
    by: 'Campus',
    description: 'Cuestionarios por materia. Insignias Bronze, Silver, Gold y puntos.',
    tags: ['Educación', 'Gamificación', 'UNAM'],
    tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    status: 'Disponible',
    statusColor: 'text-blue-400',
  },
  {
    id: 'ranking',
    title: 'Ranking del campus',
    by: 'PumaPay',
    description: 'Top 50 por puntos. Racha diaria. Compite con tu nombre.',
    tags: ['Leaderboard', 'Puntos', 'Racha'],
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    status: 'En vivo',
    statusColor: 'text-amber-400',
  },
  {
    id: 'feed',
    title: 'Feed del campus',
    by: 'Comunidad UNAM',
    description: 'Publicaciones y comentarios. Conecta con la comunidad.',
    tags: ['Social', 'Feed', 'UNAM'],
    tagColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    status: 'Activo',
    statusColor: 'text-emerald-400',
  },
];

export function FeatureCards() {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 w-full py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 text-center mb-12">
        <h2 className="text-2xl font-bold mb-2">Todo en una plataforma</h2>
        <p className="text-zinc-400 max-w-md mx-auto">
          Wallet, estudio y comunidad. Pensado para el campus.
        </p>
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-6 sm:gap-8">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="relative w-full sm:max-w-[320px] rounded-2xl border border-zinc-700/80 bg-zinc-900/80 backdrop-blur-sm p-5 shadow-xl transition-all hover:scale-[1.02] hover:border-amber-500/30 hover:shadow-amber-500/10"
              style={{
                zIndex: cards.length - index,
                transform: index % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <img src="/PumaPay.png" alt="" className="h-5 w-5 object-contain" />
                </div>
                <span className={`text-xs font-medium ${card.statusColor}`}>{card.status}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
              <p className="text-xs text-zinc-500 mb-3">por {card.by}</p>
              <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{card.description}</p>
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2.5 py-1 rounded-md border ${card.tagColor}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 transition"
          >
            Crear cuenta gratis
          </button>
        </div>
      </div>
    </section>
  );
}
