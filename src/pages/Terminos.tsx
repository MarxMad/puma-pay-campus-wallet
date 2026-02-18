import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

const Terminos = () => {
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
            <FileText className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Términos y condiciones</h1>
            <p className="text-sm text-zinc-500">Uso del servicio PumaPay</p>
          </div>
        </div>
        <div className="prose prose-invert prose-amber max-w-none space-y-6 text-zinc-300">
          <p className="text-sm text-zinc-500">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Aceptación</h2>
            <p>
              Al utilizar PumaPay («el Servicio») aceptas estos términos. PumaPay es una wallet digital y plataforma
              de comunidad dirigida al ámbito universitario (UNAM), operando en red Stellar de prueba (testnet).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Uso del servicio</h2>
            <p>
              Te comprometes a usar el Servicio de forma lícita, sin fines fraudulentos ni que vulneren derechos de
              terceros. Los XLM en testnet no tienen valor monetario real y son únicamente para pruebas y uso educativo.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Cuenta y datos</h2>
            <p>
              Eres responsable de la confidencialidad de tu contraseña y del uso de tu cuenta. Los datos que proporciones
              se tratarán conforme a nuestro Aviso de privacidad.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Seguridad de la wallet</h2>
            <p>
              Las llaves privadas de las wallets asociadas a tu cuenta están protegidas con medidas de seguridad que
              utilizan encriptación mediante funciones hash. Estas prácticas nos permiten ofrecer recuperación de cuentas
              de forma segura, sin exponer tu llave privada en texto plano. La custodia y el uso de las llaves se realizan
              conforme a estándares de protección de datos.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Limitación de responsabilidad</h2>
            <p>
              El Servicio se ofrece «tal cual». En testnet no se garantiza disponibilidad ni resultados. PumaPay no se
              hace responsable por daños indirectos o por el mal uso de la aplicación o de la red Stellar.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Cambios</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos. Los cambios relevantes se comunicarán mediante
              la aplicación o por los medios que indiquemos. El uso continuado del Servicio tras los cambios implica
              su aceptación.
            </p>
          </section>
          <p className="text-sm text-zinc-500 pt-4">
            Para dudas sobre estos términos, contacta al equipo del proyecto PumaPay a través de los canales oficiales
            (GitHub o redes indicadas en el sitio).
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terminos;
