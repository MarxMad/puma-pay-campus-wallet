
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-gray-700 p-8 max-w-sm w-full text-center">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🐾</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">PumaPay</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Tu wallet estudiantil para pagos<br />
          rápidos y seguros en el campus
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/signup')}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Comenzar</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/home')}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white py-3 rounded-xl"
          >
            Ya tengo cuenta
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">🏪</div>
              <p className="text-xs text-gray-400">Cafeterías</p>
            </div>
            <div>
              <div className="text-2xl mb-1">🚌</div>
              <p className="text-xs text-gray-400">Transporte</p>
            </div>
            <div>
              <div className="text-2xl mb-1">📚</div>
              <p className="text-xs text-gray-400">Papelerías</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Welcome;
