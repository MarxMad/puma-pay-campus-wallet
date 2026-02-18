import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HEADER_ICON_SIZE = 'h-5 w-5 sm:h-6 sm:w-6';
const SIDE_WIDTH = 'w-10 h-10 min-w-[2.5rem]';

export interface AppHeaderProps {
  /** Contenido del botón izquierdo (icono). Si no se pasa, se muestra un espaciador del mismo tamaño. */
  leftAction?: React.ReactNode;
  onLeftAction?: () => void;
  /** Subtítulo bajo "PumaPay" (ej: "Inicio", "Feed", "Guías de estudio"). */
  subtitle: string;
  /** Contenido del botón derecho (icono). Si no se pasa, se muestra un espaciador del mismo tamaño. */
  rightAction?: React.ReactNode;
  onRightAction?: () => void;
  /** Mostrar punto verde de notificación en el botón derecho (solo si hay rightAction). */
  showNotificationDot?: boolean;
  /** Contenido opcional debajo de la barra (ej: barra de búsqueda en Cursos). */
  children?: React.ReactNode;
}

/**
 * Header unificado de la app: logo PumaPay centrado, columnas izquierda/derecha de ancho fijo
 * para que el logo no se mueva al cambiar de pantalla.
 */
export function AppHeader({
  leftAction,
  onLeftAction,
  subtitle,
  rightAction,
  onRightAction,
  showNotificationDot,
  children,
}: AppHeaderProps) {
  const navigate = useNavigate();

  const LeftSlot = () => {
    if (leftAction != null && onLeftAction != null)
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeftAction}
          className={`rounded-full text-white hover:text-white hover:bg-white/10 transition-colors shrink-0 ${SIDE_WIDTH}`}
          aria-label="Atrás o menú"
        >
          {leftAction}
        </Button>
      );
    return <div className={`${SIDE_WIDTH} shrink-0`} aria-hidden />;
  };

  const RightSlot = () => {
    if (rightAction == null) return <div className={`${SIDE_WIDTH} shrink-0`} aria-hidden />;
    // Si no hay onRightAction, rightAction puede ser un menú desplegable completo (se renderiza tal cual)
    if (onRightAction == null)
      return <div className={`${SIDE_WIDTH} shrink-0 flex items-center justify-center`}>{rightAction}</div>;
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onRightAction}
        className={`rounded-full text-white hover:text-white hover:bg-white/10 transition-colors relative shrink-0 overflow-hidden ${SIDE_WIDTH}`}
        aria-label="Acción"
      >
        {rightAction}
        {showNotificationDot && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-positive-500 rounded-full animate-pulse pointer-events-none" aria-hidden />
        )}
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-gold-500/20 w-full max-w-full overflow-x-hidden shrink-0">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 text-white">
        <LeftSlot />
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-xl py-1"
          aria-label="Ir al inicio (Landing)"
        >
          <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700 rounded-2xl flex items-center justify-center shadow-xl shadow-gold-500/20 border-2 border-gold-500/40 p-2 sm:p-2.5 shrink-0">
            <img src="/PumaPay.png" alt="PumaPay" className="h-full w-full object-contain drop-shadow-lg rounded-2xl" />
          </div>
          <div className="min-w-0 text-left">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">PumaPay</h1>
            <p className="text-xs text-gray-400 hidden sm:block truncate">{subtitle}</p>
          </div>
        </button>
        <RightSlot />
      </div>
      {children != null ? <div className="px-4 sm:px-6 pb-3">{children}</div> : null}
    </header>
  );
}

/** Tamaño de icono estándar para usar en leftAction/rightAction del AppHeader */
export const headerIconClass = HEADER_ICON_SIZE;
