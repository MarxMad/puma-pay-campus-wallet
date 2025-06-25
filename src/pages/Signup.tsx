
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    lastName: '',
    studentId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate account creation
    setTimeout(() => {
      console.log('Creating account with:', formData);
      setIsLoading(false);
      navigate('/home');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-gray-700 p-8 max-w-sm w-full">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/welcome')}
            className="text-gray-400 hover:text-white p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-white ml-2">Crear cuenta</h1>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">🎓</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">PumaPay</h2>
          <p className="text-gray-400 text-sm">Únete a la comunidad estudiantil</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-300 text-sm">Nombre</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Alex"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-gray-300 text-sm">Apellido</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Johnson"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-300 text-sm">Email estudiantil</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="alex@estudiante.unam.mx"
              required
            />
          </div>

          <div>
            <Label htmlFor="studentId" className="text-gray-300 text-sm">Número de cuenta</Label>
            <Input
              id="studentId"
              type="text"
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="318145672"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300 text-sm">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              placeholder="••••••••"
              required
            />
          </div>

          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl mt-6 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creando cuenta...</span>
              </div>
            ) : (
              'Crear cuenta'
            )}
          </Button>

          <p className="text-center text-gray-400 text-sm mt-4">
            ¿Ya tienes cuenta?{' '}
            <button 
              type="button"
              onClick={() => navigate('/welcome')}
              className="text-red-400 hover:text-red-300"
            >
              Inicia sesión
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
