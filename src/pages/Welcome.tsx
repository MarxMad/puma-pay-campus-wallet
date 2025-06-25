
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-gray-700 p-8 max-w-sm w-full text-center">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">👨‍🎓</span>
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
        
        <h1 className="text-2xl font-bold text-white mb-2">MXNB Student</h1>
        <p className="text-gray-400 mb-8">
          Manage your student expenses<br />
          Track your spending and earn rewards
        </p>
        
        <Button 
          onClick={() => navigate('/signup')}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl"
        >
          Get Started
        </Button>
      </Card>
    </div>
  );
};

export default Welcome;
