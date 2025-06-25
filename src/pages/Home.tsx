
import { useState } from 'react';
import { Bell, Home, Search, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button variant="ghost" size="sm">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">MXNB Student Wallet</h1>
        <Button variant="ghost" size="sm">
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <Card className="bg-gray-800 border-gray-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Available balance</span>
            <span className="text-red-400 text-sm">-19.2%</span>
          </div>
          
          <div className="text-4xl font-bold mb-6">$500.00</div>
          
          {/* Chart placeholder */}
          <div className="h-20 bg-gray-700 rounded-lg mb-6 flex items-center justify-center">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div 
                  key={i} 
                  className="w-2 bg-red-500 rounded-full" 
                  style={{ height: `${Math.random() * 40 + 10}px` }}
                />
              ))}
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
          
          <div className="flex space-x-4">
            <Button className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl">
              Rewards
            </Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl">
              Scan QR
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="p-4">
        <h3 className="text-white text-lg font-semibold mb-4">Recent transactions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white">C</span>
              </div>
              <div>
                <p className="text-white font-medium">Cafetería</p>
                <p className="text-gray-400 text-sm">↗ +5.00%</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white">T</span>
              </div>
              <div>
                <p className="text-white font-medium">Transport</p>
                <p className="text-gray-400 text-sm">↓ -1.50%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-around py-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="h-5 w-5 text-white" />
          </Button>
          <Button variant="ghost" size="sm">
            <Search className="h-5 w-5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <Settings className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
