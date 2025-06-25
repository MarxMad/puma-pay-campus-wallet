
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, TrendingUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Statistics = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-sm mx-auto">
        <Card className="bg-gray-800 border-gray-700 p-6 text-white">
          <h1 className="text-xl font-bold mb-6">Overview de Gastos</h1>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Billetera Estudiantil</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Billetera Estudiantil</span>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">⚡</span>
                  <span>5.75</span>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm">Saldo Actual</p>
                <p className="text-2xl font-bold">MXN 2,500.00</p>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm">Disponible</p>
                <p className="text-xl font-semibold">MXN 1,800.00</p>
              </div>
              
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    <span className="text-gray-400">Ingresos</span>
                  </div>
                  <p>MXN 4,000.00</p>
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">Gastos</span>
                  </div>
                  <p>MXN</p>
                </div>
              </div>
              
              <div className="bg-gray-600 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Saldo Disponible</span>
                </div>
                <p className="text-xl font-bold">MXN 2,500.00</p>
                <p className="text-sm text-gray-400 mt-2">1234 •••• •••• 5678</p>
                <p className="text-sm text-gray-400">Estudiante Ana Animo    08/25</p>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Historial de Pagos</h2>
              <Button variant="ghost" size="sm">
                <span>▼</span>
              </Button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar"
                className="bg-gray-700 border-gray-600 text-white pl-10"
              />
              <Button size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">C</span>
                    </div>
                    <div>
                      <p className="font-medium">CafeteríaA Central</p>
                      <p className="text-sm text-gray-400">Cafetería y Restaurante</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">-MXN 150.00</p>
                    <p className="text-sm text-gray-400">2500.00</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Pendile</p>
              </div>
              
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">P</span>
                    </div>
                    <div>
                      <p className="font-medium">PapeleríaA</p>
                      <p className="text-sm text-gray-400">Transporte</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">-MXN 75.00</p>
                    <p className="text-sm text-gray-400">2500.00</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Hoy</p>
              </div>
            </div>
          </div>
          
          <div className="absolute top-4 right-4">
            <Button 
              variant="outline" 
              size="sm"
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
            >
              UPGRADE PLAN
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
