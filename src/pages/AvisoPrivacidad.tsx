import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const AvisoPrivacidad = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white mb-8 -ml-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Aviso de privacidad</h1>
            <p className="text-sm text-zinc-500">Tratamiento de datos personales · PumaPay</p>
          </div>
        </div>
        <div className="prose prose-invert prose-amber max-w-none space-y-6 text-zinc-300">
          <p className="text-sm text-zinc-500">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Responsable</h2>
            <p>
              El responsable del tratamiento de los datos personales que recabamos a través de la aplicación PumaPay
              («Campus Wallet») es el equipo del proyecto PumaPay. Puedes contactarnos mediante los canales indicados
              en el sitio (GitHub, redes sociales).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Datos que recabamos</h2>
            <p>
              Recabamos: nombre, apellido, correo electrónico, contraseña (almacenada de forma encriptada), dirección
              de wallet Stellar y datos derivados del uso (progreso en cursos, puntos, publicaciones en el feed, etc.).
              En testnet no procesamos pagos con valor real.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Finalidad</h2>
            <p>
              Los datos se utilizan para: crear y gestionar tu cuenta, operar la wallet en testnet, mostrar ranking y
              progreso, moderar el feed y la comunidad, y mejorar el servicio. No vendemos tus datos personales.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Base legal y conservación</h2>
            <p>
              El tratamiento se basa en tu consentimiento al registrarte y en la ejecución del contrato de uso del
              Servicio. Conservamos los datos mientras mantengas tu cuenta activa y, tras baja, el tiempo que exija
              la ley o sea necesario para reclamaciones.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Derechos (ARCO y revocación)</h2>
            <p>
              Tienes derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos, así como a
              revocar tu consentimiento. Para ejercer estos derechos o solicitar la eliminación de tu cuenta,
              contáctanos por los canales oficiales del proyecto.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Transferencias y seguridad</h2>
            <p>
              Utilizamos servicios de infraestructura (por ejemplo Supabase) que pueden implicar transferencia o
              almacenamiento de datos en servidores fuera de México. Aplicamos medidas técnicas y organizativas
              para proteger tu información.
            </p>
          </section>
          <p className="text-sm text-zinc-500 pt-4">
            Cualquier cambio relevante a este aviso se publicará en la aplicación o en el sitio. Te recomendamos
            revisarlo periódicamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvisoPrivacidad;
