
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const WalletSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    universityId: '',
    email: '',
    paymentMethod: ''
  });

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-sm mx-auto">
        <Card className="bg-gray-800 border-gray-700 p-6 text-white">
          <div className="text-center mb-6">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-xl font-bold mt-2">Wallet Setup</h1>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Account Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">University ID</Label>
                  <Input
                    value="12345"
                    readOnly
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-300">Email address</Label>
                  <Input
                    value="student@example.com"
                    readOnly
                    className="bg-gray-700 border-gray-600 text-blue-400 mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Payment Method</Label>
              <div className="absolute top-4 right-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                >
                  UPGRADE PLAN
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2 bg-gray-700 p-3 rounded-lg">
                  <div className="w-8 h-6 bg-blue-600 rounded"></div>
                  <span>Preferred</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <span>No fees</span>
                  <span>•</span>
                  <span>24 Business</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/home')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl"
            >
              Next
            </Button>
          </div>
        </Card>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-around py-2">
            <Button variant="ghost" size="sm">
              <span className="text-white">🏠</span>
            </Button>
            <Button variant="ghost" size="sm">
              <span className="text-gray-400">🔍</span>
            </Button>
            <Button variant="ghost" size="sm">
              <span className="text-gray-400">⚙️</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletSetup;
