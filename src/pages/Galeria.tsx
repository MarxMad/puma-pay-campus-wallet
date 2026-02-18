import { useNavigate } from 'react-router-dom';
import { AppHeader, headerIconClass } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { ArrowLeft, ImageIcon } from 'lucide-react';

const GALLERY_ITEMS = [
  { src: '/unam-1.jpg', alt: 'Campus UNAM', label: 'Campus' },
  { src: '/unam-2.jpg', alt: 'UNAM', label: 'UNAM' },
  { src: '/pumapay-1.jpg', alt: 'PumaPay', label: 'PumaPay' },
  { src: '/unam-3.jpg', alt: 'CU', label: 'CU' },
  { src: '/pumapay-2.jpg', alt: 'Proyecto', label: 'Proyecto' },
  { src: '/unam-4.jpg', alt: 'Comunidad', label: 'Comunidad' },
  { src: '/pumapay-3.jpg', alt: 'Evento PumaPay', label: 'Evento' },
  { src: '/unam-5.jpg', alt: 'Facultad', label: 'Facultad' },
];

export default function Galeria() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <AppHeader
        subtitle="Galería"
        leftAction={<ArrowLeft className={headerIconClass} />}
        onLeftAction={() => navigate('/home')}
      />
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-1">UNAM y PumaPay</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Fotos del campus y del proyecto. Añade imágenes en <code className="bg-zinc-800 px-1 rounded text-xs">public/</code>.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {GALLERY_ITEMS.map((item, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden"
            >
              <img
                src={item.src}
                alt={item.alt}
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
                className="absolute inset-0 bg-zinc-800 flex flex-col items-center justify-center gap-2 hidden"
              >
                <ImageIcon className="h-8 w-8 text-zinc-500" />
                <span className="text-amber-400 font-medium text-sm">{item.label}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                <span className="text-xs font-medium text-white">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
