
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Home, Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-sm mx-auto">
        <Card className="bg-gray-800 border-gray-700 p-6 text-white min-h-screen">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Notifications</h1>
            <div></div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white">!</span>
                </div>
                <div>
                  <p className="font-medium">IMPORTANT: Balance low</p>
                  <p className="text-sm text-gray-400 mt-1">Your balance is running low. Consider adding more funds.</p>
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
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white">💰</span>
                </div>
                <div>
                  <p className="font-medium">New rewards available</p>
                  <p className="text-sm text-gray-400 mt-1">You've earned new rewards from your recent transactions.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white">📱</span>
                </div>
                <div>
                  <p className="font-medium">Payment method updated</p>
                  <p className="text-sm text-gray-400 mt-1">Your preferred payment method has been successfully updated.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white">🔒</span>
                </div>
                <div>
                  <p className="font-medium">New QR code payment</p>
                  <p className="text-sm text-gray-400 mt-1">A new payment was made using QR code scanning.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white">📊</span>
                </div>
                <div>
                  <p className="font-medium">Limited time offer overrides</p>
                  <p className="text-sm text-gray-400 mt-1">Special offers are available for a limited time.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white">💳</span>
                </div>
                <div>
                  <p className="font-medium">IMPORTANT: Own account</p>
                  <p className="text-sm text-gray-400 mt-1">Important updates regarding your account.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white">💡</span>
                </div>
                <div>
                  <p className="font-medium">IMPORTANT: Update payment</p>
                  <p className="text-sm text-gray-400 mt-1">Please update your payment information.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white">🎯</span>
                </div>
                <div>
                  <p className="font-medium">Monthly budget comparison</p>
                  <p className="text-sm text-gray-400 mt-1">View your monthly spending comparison.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-around py-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
              <Home className="h-5 w-5 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm">
              <Search className="h-5 w-5 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
