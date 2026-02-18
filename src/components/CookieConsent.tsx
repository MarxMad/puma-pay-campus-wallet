import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, Shield, BarChart3, Target, CheckCircle } from 'lucide-react';

const STORAGE_KEY = 'pumapay_cookie_consent';

export type CookieChoice = 'accepted' | 'denied' | 'custom';

export interface CookiePreferences {
  necessary: boolean;   // siempre true, no editable
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface StoredConsent {
  choice: CookieChoice;
  timestamp: number;
  preferences?: CookiePreferences;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  preferences: true,
  analytics: true,
  marketing: false,
};

function getStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsent;
  } catch {
    return null;
  }
}

function saveConsent(data: StoredConsent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('No se pudo guardar preferencias de cookies:', e);
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) setVisible(true);
  }, []);

  const acceptAll = () => {
    saveConsent({
      choice: 'accepted',
      timestamp: Date.now(),
      preferences: {
        necessary: true,
        preferences: true,
        analytics: true,
        marketing: true,
      },
    });
    setVisible(false);
    setManageOpen(false);
  };

  const denyAll = () => {
    saveConsent({
      choice: 'denied',
      timestamp: Date.now(),
      preferences: {
        necessary: true,
        preferences: false,
        analytics: false,
        marketing: false,
      },
    });
    setVisible(false);
    setManageOpen(false);
  };

  const openManage = () => {
    const stored = getStoredConsent();
    if (stored?.preferences) {
      setPrefs(stored.preferences);
    } else {
      setPrefs(defaultPreferences);
    }
    setManageOpen(true);
  };

  const saveManage = () => {
    saveConsent({
      choice: 'custom',
      timestamp: Date.now(),
      preferences: { ...prefs },
    });
    setVisible(false);
    setManageOpen(false);
  };

  const acceptAllInModal = () => {
    const all: CookiePreferences = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    };
    setPrefs(all);
    saveConsent({ choice: 'accepted', timestamp: Date.now(), preferences: all });
    setVisible(false);
    setManageOpen(false);
  };

  const rejectNonEssentialInModal = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    };
    setPrefs(onlyNecessary);
    saveConsent({ choice: 'denied', timestamp: Date.now(), preferences: onlyNecessary });
    setVisible(false);
    setManageOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Banner fijo abajo: z-index bajo cuando el modal de gestionar está abierto para que el modal quede encima */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#0f0f0f] border-t border-zinc-700 shadow-2xl ${manageOpen ? 'z-[40]' : 'z-[100]'}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Cookie className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-0.5">Usamos cookies</p>
              <p className="text-xs text-zinc-400">
                Utilizamos cookies propias y de terceros para el funcionamiento del sitio, preferencias, análisis y, si lo aceptas, marketing.
                Puedes aceptar todas, denegar las no esenciales o gestionar tu elección.                 Más información en nuestro{' '}
                <Link to="/aviso-privacidad" className="text-amber-400 hover:underline">aviso de privacidad</Link>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-black font-medium"
              onClick={acceptAll}
            >
              Aceptar cookies
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              onClick={denyAll}
            >
              Denegar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              onClick={openManage}
            >
              Gestionar cookies
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Gestionar cookies (z-50 por defecto del Dialog, queda arriba del banner cuando manageOpen) */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col bg-[#0f0f0f] border-zinc-700 text-white">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-amber-400" />
              Gestionar preferencias de cookies
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Puedes activar o desactivar cada tipo de cookie. Las cookies necesarias son obligatorias para el funcionamiento del sitio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4 overflow-y-auto min-h-0 max-h-[45vh] pr-1 -mr-1">
            {/* Necesarias */}
            <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
              <div className="flex gap-3 min-w-0">
                <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <Label className="text-white font-medium cursor-default">Cookies necesarias</Label>
                  <p className="text-xs text-zinc-400 mt-1">
                    Esenciales para el funcionamiento: sesión, seguridad y preferencias básicas. No se pueden desactivar.
                  </p>
                </div>
              </div>
              <Switch checked disabled className="shrink-0 data-[state=checked]:bg-amber-500" />
            </div>

            {/* Preferencias */}
            <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
              <div className="flex gap-3 min-w-0">
                <Settings className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <Label htmlFor="prefs" className="text-white font-medium cursor-pointer">Cookies de preferencias</Label>
                  <p className="text-xs text-zinc-400 mt-1">
                    Guardan tu idioma, tema o configuración para mejorar la experiencia.
                  </p>
                </div>
              </div>
              <Switch
                id="prefs"
                checked={prefs.preferences}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, preferences: v }))}
                className="shrink-0 data-[state=checked]:bg-amber-500"
              />
            </div>

            {/* Analíticas */}
            <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
              <div className="flex gap-3 min-w-0">
                <BarChart3 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <Label htmlFor="analytics" className="text-white font-medium cursor-pointer">Cookies analíticas</Label>
                  <p className="text-xs text-zinc-400 mt-1">
                    Nos ayudan a entender cómo usas la app (páginas visitadas, tiempo) de forma agregada y anónima.
                  </p>
                </div>
              </div>
              <Switch
                id="analytics"
                checked={prefs.analytics}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
                className="shrink-0 data-[state=checked]:bg-amber-500"
              />
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
              <div className="flex gap-3 min-w-0">
                <Target className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <Label htmlFor="marketing" className="text-white font-medium cursor-pointer">Cookies de marketing</Label>
                  <p className="text-xs text-zinc-400 mt-1">
                    Permiten ofrecerte contenido o promociones relevantes (si en el futuro integramos publicidad o campañas).
                  </p>
                </div>
              </div>
              <Switch
                id="marketing"
                checked={prefs.marketing}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
                className="shrink-0 data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 shrink-0 border-t border-zinc-700/80 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 order-2 sm:order-1"
              onClick={rejectNonEssentialInModal}
            >
              Solo necesarias
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-black order-1 sm:order-2"
              onClick={acceptAllInModal}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Aceptar todo
            </Button>
            <Button
              size="sm"
              className="bg-zinc-700 hover:bg-zinc-600 text-white order-3"
              onClick={saveManage}
            >
              Guardar preferencias
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
