/**
 * Mapa mental / flujo animado: nodos conectados con líneas y glow.
 * Estilo tipo Boundless: red de puntos y conexiones con acentos ámbar.
 */
import { useId } from 'react';

const nodePositions = [
  { id: 'center', x: 50, y: 50, label: 'PumaPay', isCenter: true },
  { id: 'wallet', x: 22, y: 28, label: 'Wallet' },
  { id: 'guias', x: 78, y: 28, label: 'Guías' },
  { id: 'feed', x: 78, y: 72, label: 'Feed' },
  { id: 'ranking', x: 22, y: 72, label: 'Ranking' },
  { id: 'xlm', x: 50, y: 12, label: 'XLM' },
  { id: 'campus', x: 50, y: 88, label: 'Campus' },
];

const connections = [
  ['center', 'wallet'],
  ['center', 'guias'],
  ['center', 'feed'],
  ['center', 'ranking'],
  ['center', 'xlm'],
  ['center', 'campus'],
  ['wallet', 'xlm'],
  ['guias', 'ranking'],
  ['feed', 'campus'],
];

const getCoords = (id: string) => {
  const n = nodePositions.find((p) => p.id === id);
  return n ? { x: n.x, y: n.y } : { x: 50, y: 50 };
};

export const FlowMap = () => {
  const id = useId().replace(/:/g, '');
  const width = 100;
  const height = 100;

  return (
    <section className="relative z-10 w-full py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center mb-2">Ecosistema en un vistazo</h2>
        <p className="text-zinc-400 text-center max-w-md mx-auto mb-12">
          Todo conectado: wallet, estudio y comunidad.
        </p>
      </div>
      <div className="relative w-full max-w-4xl mx-auto aspect-[1.4/1] min-h-[320px] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full text-amber-400/90"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <linearGradient id={`${id}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(212,175,55)" stopOpacity="0.2" />
              <stop offset="50%" stopColor="rgb(212,175,55)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(212,175,55)" stopOpacity="0.2" />
            </linearGradient>
            <filter id={`${id}-glow`}>
              <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={`${id}-glow-center`}>
              <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Líneas de conexión (animación de trazo) */}
          <g className="stroke-zinc-600/60" strokeWidth="0.4" fill="none">
            {connections.map(([a, b], i) => {
              const from = getCoords(a);
              const to = getCoords(b);
              return (
                <line
                  key={`${a}-${b}-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={`url(#${id}-line)`}
                  strokeWidth="0.4"
                  className="flow-map-line"
                  style={{
                    animationDelay: `${i * 0.25}s`,
                  }}
                />
              );
            })}
          </g>
          {/* Nodos */}
          <g>
            {nodePositions.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.isCenter ? 5 : 3}
                  fill={node.isCenter ? 'rgb(212,175,55)' : 'rgb(113,113,122)'}
                  opacity={node.isCenter ? 0.95 : 0.7}
                  filter={node.isCenter ? `url(#${id}-glow-center)` : `url(#${id}-glow)`}
                  className="animate-pulse-slow"
                  style={{ animationDuration: '2.5s' }}
                />
                <text
                  x={node.x}
                  y={node.y + (node.isCenter ? 8 : 5.5)}
                  textAnchor="middle"
                  className="fill-zinc-400 font-medium"
                  style={{ fontSize: node.isCenter ? 4.5 : 3.2 }}
                >
                  {node.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
        {/* Capa de puntos de fondo tipo "mapa" (decorativo) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(212,175,55,0.4) 1px, transparent 1px),
                              radial-gradient(circle at 80% 25%, rgba(212,175,55,0.3) 1px, transparent 1px),
                              radial-gradient(circle at 70% 70%, rgba(212,175,55,0.25) 1px, transparent 1px),
                              radial-gradient(circle at 25% 75%, rgba(212,175,55,0.2) 1px, transparent 1px)`,
            backgroundSize: '24px 24px, 32px 32px, 28px 28px, 30px 30px',
          }}
        />
      </div>
      <style>{`
        .flow-map-line {
          animation: flowLineOpacity 3s ease-in-out infinite;
        }
        @keyframes flowLineOpacity {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.85; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
