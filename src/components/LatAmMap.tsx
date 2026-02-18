/**
 * Mapa estilizado de Latinoamérica (estilo Boundless: fondo oscuro, puntos/contorno, acento ámbar).
 * Reemplaza el diagrama de ecosistema en la landing.
 */
import { useId } from 'react';

// Contorno simplificado de Latinoamérica (México + Centroamérica + Sudamérica) viewBox 0 0 400 500
// Forma reconocible: México arriba-izq, Centroamérica, Sudamérica (Brasil, costa este, Cono Sur)
const LATAM_PATH =
  'M 72 58 L 115 52 L 142 62 L 158 82 L 162 108 L 158 132 L 148 158 L 138 188 L 128 222 L 122 258 L 118 298 L 115 338 L 112 378 L 108 418 L 105 455 L 108 482 L 122 492 L 155 488 L 195 478 L 238 465 L 278 452 L 318 435 L 352 415 L 378 388 L 388 355 L 382 318 L 368 282 L 348 248 L 325 218 L 298 192 L 268 172 L 235 158 L 198 148 L 162 142 L 128 138 L 98 128 L 78 108 L 72 82 Z ' +
  'M 162 142 L 172 165 L 178 195 L 182 228 L 185 265 L 188 302 L 192 338 L 195 372 L 198 405 L 198 438 L 192 465 L 182 482 L 168 488 L 148 485 L 132 472 L 122 452 L 118 428 L 115 398 L 112 365 L 108 332 L 105 298 L 102 265 L 98 232 L 95 198 L 92 168 L 88 142 L 85 118 L 82 95 L 85 75 L 92 58 L 102 48 L 118 45 L 138 52 L 155 68 L 165 92 Z';

// Puntos decorativos sobre la región (efecto "dot map") - coordenadas dentro del contorno
const dotPositions: Array<[number, number]> = [
  [120, 60], [145, 55], [155, 75], [135, 90], [165, 95], [150, 115], [160, 135], [140, 155],
  [170, 165], [155, 190], [145, 215], [160, 240], [138, 265], [152, 290], [165, 320], [142, 345],
  [158, 370], [172, 395], [148, 418], [162, 442], [185, 455], [210, 460], [238, 458], [268, 450],
  [298, 438], [325, 422], [352, 405], [368, 380], [358, 350], [342, 320], [328, 288], [318, 258],
  [305, 228], [288, 198], [268, 172], [245, 152], [218, 138], [192, 128], [178, 108], [188, 85],
  [115, 78], [128, 105], [118, 132], [125, 158], [132, 185], [128, 210], [135, 238], [128, 268],
  [175, 225], [198, 255], [215, 285], [228, 315], [242, 348], [255, 378], [265, 408], [272, 435],
  [192, 355], [205, 385], [218, 412], [232, 438], [248, 458], [198, 398], [212, 425], [225, 452],
];

export const LatAmMap = () => {
  const id = useId().replace(/:/g, '');
  const width = 400;
  const height = 500;

  return (
    <section className="relative z-10 w-full py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center mb-2">Presentes en Latinoamérica</h2>
        <p className="text-zinc-400 text-center max-w-md mx-auto mb-12">
          PumaPay nace desde México para la comunidad universitaria de la región.
        </p>
      </div>
      <div className="relative w-full max-w-2xl mx-auto aspect-[4/5] min-h-[280px] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full text-amber-400/90"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(212,175,55)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="rgb(212,175,55)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`${id}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(212,175,55)" stopOpacity="0.5" />
              <stop offset="50%" stopColor="rgb(212,175,55)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="rgb(212,175,55)" stopOpacity="0.5" />
            </linearGradient>
            <filter id={`${id}-glow`}>
              <feGaussianBlur stdDeviation="1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Contorno de Latinoamérica */}
          <path
            d={LATAM_PATH}
            fill={`url(#${id}-fill)`}
            stroke={`url(#${id}-stroke)`}
            strokeWidth="1.2"
            strokeLinejoin="round"
            className="latam-outline"
          />
          {/* Puntos decorativos tipo "dot map" */}
          <g filter={`url(#${id}-glow)`}>
            {dotPositions.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2.5"
                fill="rgb(212,175,55)"
                opacity={0.4 + (i % 3) * 0.2}
                className="latam-dot"
                style={{ animationDelay: `${(i % 8) * 0.15}s` }}
              />
            ))}
          </g>
          {/* Marca México / UNAM */}
          <circle cx="92" cy="78" r="10" fill="none" stroke="rgb(212,175,55)" strokeWidth="1.8" opacity="0.95" />
          <text x="92" y="94" textAnchor="middle" className="fill-amber-400 font-semibold" style={{ fontSize: 9 }}>México</text>
        </svg>
        {/* Fondo sutil de puntos */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.35) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>
      <style>{`
        .latam-outline {
          animation: latamPulse 4s ease-in-out infinite;
        }
        .latam-dot {
          animation: latamDot 3s ease-in-out infinite;
        }
        @keyframes latamPulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        @keyframes latamDot {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </section>
  );
};
