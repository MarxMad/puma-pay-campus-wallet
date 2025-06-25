
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, User, Settings as SettingsIcon, Shield, Home, Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-sm mx-auto">
        <Card className="bg-gray-800 border-gray-700 p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <Bell className="h-5 w-5" />
            <User className="h-5 w-5" />
          </div>
          
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <h1 className="text-xl font-bold">Alex Johnson</h1>
            <p className="text-gray-400">Member since 2022</p>
            
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
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white">💳</span>
              </div>
              <span>My cards</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <span>Payment notifications</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <SettingsIcon className="h-4 w-4 text-white" />
              </div>
              <span>Profile settings</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span>Security settings</span>
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
              <Settings className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
