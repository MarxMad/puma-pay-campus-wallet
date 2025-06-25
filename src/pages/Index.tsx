
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to welcome page on first load
    navigate('/welcome');
  }, [navigate]);

  return null;
};

export default Index;
