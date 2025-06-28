import { useAuth } from '@/contexts/AuthContext';

const AuthStatus = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Ocultar completamente para usuarios finales
  // Solo mostrar si está en modo debug explícito
  const isDebugMode = localStorage.getItem('pumapay_debug_mode') === 'true';
  
  if (!isDebugMode) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs z-50 max-w-xs">
      <div>🔐 Auth Status:</div>
      <div>Loading: {isLoading ? '✅' : '❌'} 🔔</div>
      <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
      <div>User: {user ? '✅' : '❌'}</div>
      {user && (
        <div className="mt-1 text-xs">
          <div>📧 {user.email || 'No email'}</div>
          <div>👤 {user.name || 'No name'}</div>
          <div>🏠 {user.address?.slice(0, 8)}...</div>
          <div>🔧 {user.authMethod}</div>
        </div>
      )}
    </div>
  );
};

export default AuthStatus; 