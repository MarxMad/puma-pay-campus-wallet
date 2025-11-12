import React, { createContext, useContext, useState, useEffect } from 'react';
import { portalService } from '@/services/portal';
import { junoService } from '@/services/junoService';
import { registrarUsuario, loginUsuario } from '@/services/userService';
import { asignarApiKeyAUsuario } from '@/services/portalApiKeyService';
import { supabase } from '@/services/supabaseClient';

interface User {
  address: string;
  email?: string;
  name?: string;
  authMethod: 'portal' | 'traditional';
  clabe?: string;
  apiKey?: string;
  clientId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPortal: (method: 'google' | 'apple') => Promise<void>;
  logout: () => void;
  createAccount: (email: string, password: string, name: string, studentId: string) => Promise<{ address: string }>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clave para localStorage
const AUTH_STORAGE_KEY = 'pumapay_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Cargar usuario desde localStorage al inicializar
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const userData = JSON.parse(stored);
          setUser(userData);
          
          // Si es usuario de Portal, re-inicializar Portal con las credenciales correctas
          if (userData.authMethod === 'portal' || userData.authMethod === 'traditional') {
            // Restaurar estado en el servicio Portal
            portalService.setCurrentUser({ address: userData.address });
            
            // Si tenemos credenciales, re-inicializar Portal con ellas
            if (userData.apiKey) {
              console.log('🔄 Re-inicializando Portal con credenciales del usuario...');
              try {
                await portalService.initialize({
                  apiKey: userData.apiKey,
                  clientId: userData.clientId
                });
                console.log('✅ Portal re-inicializado correctamente');
              } catch (error) {
                console.warn('⚠️ Error re-inicializando Portal:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error cargando autenticación:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Guardar usuario en localStorage
  const updateUser = (userData: User) => {
    console.log('💾 Guardando datos de autenticación:', userData);
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  // Login tradicional con email/password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Autenticar contra Supabase
      const userData = await loginUsuario(email, password);
      
      // Obtener o refrescar Client Session Token
      let clientSessionToken: string | undefined;
      let portalClientId: string | undefined;
      
      // Si el usuario tiene portal_client_id, intentar refrescar el token
      if (userData.portal_client_id) {
        try {
          console.log('🔄 Refrescando Client Session Token...');
          const refreshed = await refreshPortalSession(userData.portal_client_id);
          clientSessionToken = refreshed.clientSessionToken;
          portalClientId = userData.portal_client_id;
          console.log('✅ Client Session Token refrescado');
        } catch (error) {
          console.warn('⚠️ No se pudo refrescar Client Session Token, intentando crear nuevo cliente...', error);
          // Si falla, crear un nuevo cliente
          try {
            const newClient = await createPortalClient();
            clientSessionToken = newClient.clientSessionToken;
            portalClientId = newClient.clientId;
            console.log('✅ Nuevo cliente creado en Portal');
          } catch (createError) {
            console.error('❌ Error creando nuevo cliente:', createError);
            // Continuar sin Client Session Token (modo demo)
          }
        }
      } else if (userData.client_session_token) {
        // Si tiene client_session_token guardado, intentar usarlo primero
        // Si falla, se refrescará o se creará uno nuevo
        clientSessionToken = userData.client_session_token;
        portalClientId = userData.portal_client_id;
        console.log('ℹ️ Usando Client Session Token guardado (puede estar expirado)');
        console.log('🔑 Token guardado:', {
          hasToken: !!clientSessionToken,
          tokenPrefix: clientSessionToken?.substring(0, 20) + '...',
          tokenLength: clientSessionToken?.length,
          hasClientId: !!portalClientId,
          clientId: portalClientId
        });
      } else {
        // Si no tiene token, crear uno nuevo
        console.log('⚠️ Usuario no tiene Client Session Token, creando uno nuevo...');
        try {
          const newClient = await createPortalClient();
          clientSessionToken = newClient.clientSessionToken;
          portalClientId = newClient.clientId;
          console.log('✅ Nuevo Client Session Token creado');
          
          // Guardar el nuevo token en la base de datos
          try {
            await supabase
              .from('usuarios')
              .update({
                client_session_token: clientSessionToken,
                portal_client_id: portalClientId
              })
              .eq('id', userData.id);
            console.log('✅ Client Session Token guardado en la base de datos');
          } catch (updateError) {
            console.warn('⚠️ No se pudo guardar el Client Session Token en la base de datos:', updateError);
          }
        } catch (createError) {
          console.error('❌ Error creando nuevo Client Session Token:', createError);
          // Continuar sin token (fallará al enviar transacciones)
        }
      }
      
      // Re-inicializar Portal con Client Session Token si está disponible
      if (clientSessionToken) {
        console.log('🔄 Re-inicializando Portal con Client Session Token...');
        await portalService.initialize({
          apiKey: clientSessionToken, // Client Session Token, NO Portal API Key
          clientId: portalClientId
        });
        console.log('✅ Portal re-inicializado correctamente');
      } else {
        console.warn('⚠️ No se pudo obtener Client Session Token, Portal puede no funcionar correctamente');
      }
      
      // Sincronizar usuario con Portal Service
      portalService.setCurrentUser({ address: userData.wallet_address });
      
      // Guardar usuario autenticado en localStorage
      updateUser({
        address: userData.wallet_address,
        email: userData.email,
        name: userData.nombre,
        authMethod: userData.auth_method as 'portal' | 'traditional',
        clabe: userData.clabe,
        apiKey: clientSessionToken, // Client Session Token
        clientId: portalClientId // clientId de Portal
      });
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login con Portal (Google/Apple)
  const loginWithPortal = async (method: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      let result;
      if (method === 'google') {
        result = await portalService.loginWithGoogle();
      } else {
        result = await portalService.loginWithApple();
      }

      const userData: User = {
        address: result.address,
        name: method === 'google' ? 'Usuario Google' : 'Usuario Apple',
        authMethod: 'portal'
      };

      updateUser(userData);
    } catch (error) {
      console.error('Error en login Portal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Crear cuenta nueva
  // onStepChange permite mostrar el progreso en el frontend
  const createAccount = async (
    email: string,
    password: string,
    name: string,
    studentId: string,
    onStepChange?: (step: string) => void
  ) => {
    setIsLoading(true);
    try {
      await portalService.logout();
      const nombre = name;
      const apellido = '';
      const auth_method = 'traditional';
      if (onStepChange) onStepChange('Guardando usuario...');
      // 1. Guardar usuario en Supabase (sin wallet ni clabe)
      const userInsert = await registrarUsuario({
        nombre,
        apellido,
        email,
        password,
        wallet_address: '',
        clabe: '',
        auth_method
      });
      const userId = userInsert && Array.isArray(userInsert) && userInsert[0]?.id;
      if (!userId) throw new Error('No se pudo obtener el ID del usuario');
      if (onStepChange) onStepChange('Asignando credenciales seguras...');
      // 2. Crear cliente en Portal y obtener Client Session Token
      // IMPORTANTE: Según la documentación de Portal, debemos usar Client Session Token
      // en el SDK, NO la Portal API Key directamente
      let clientSessionToken: string;
      let portalClientId: string;
      try {
        console.log('🔄 Creando cliente en Portal para obtener Client Session Token...');
        const portalClient = await createPortalClient();
        clientSessionToken = portalClient.clientSessionToken;
        portalClientId = portalClient.clientId;
        console.log('✅ Client Session Token obtenido:', {
          clientId: portalClientId,
          hasToken: !!clientSessionToken
        });
      } catch (error) {
        console.error('❌ Error obteniendo Client Session Token:', error);
        setIsLoading(false);
        throw new Error('No se pudo obtener Client Session Token de Portal. Revisa la consola para más detalles.');
      }
      
      // Guardar el clientId de Portal en la base de datos (diferente del client_id que generamos)
      // El clientId de Portal es el ID real del cliente en Portal
      if (onStepChange) onStepChange('Creando wallet segura...');
      // 3. Crear wallet de Portal usando Client Session Token
      let wallet;
      try {
        wallet = await portalService.createWallet({
          apiKey: clientSessionToken, // Usar Client Session Token, NO Portal API Key
          clientId: portalClientId // Usar el clientId de Portal
        });
        console.log('Wallet creada:', wallet);
      } catch (error) {
        console.error('Error al crear wallet:', error);
        setIsLoading(false);
        throw new Error('No se pudo crear la wallet. Revisa la consola para más detalles.');
      }
      const address = wallet.address || (await portalService.getWalletAddress());
      // Backup automático de la wallet usando la contraseña del registro
      if (onStepChange) onStepChange('Respaldando tu wallet...');
      try {
        await portalService.backupWallet(password);
        console.log('✅ Backup de wallet realizado correctamente');
      } catch (error) {
        console.warn('⚠️ No se pudo respaldar la wallet, pero se continuará con el registro:', error);
        // NO lanzamos error, solo avisamos
      }
      if (onStepChange) onStepChange('Creando cuenta CLABE...');
      // 4. Crear la cuenta CLABE
      let clabe: string | undefined = undefined;
      try {
        const clabeResult = await junoService.createUserClabe();
        clabe = clabeResult.clabe;
      } catch (e) {
        console.error('No se pudo crear la CLABE:', e);
        setIsLoading(false);
        throw new Error('No se pudo crear la cuenta CLABE. Revisa la consola para más detalles.');
      }
      if (onStepChange) onStepChange('Finalizando registro...');
      // 5. Actualizar el usuario en Supabase con wallet, clabe, client_session_token y portal_client_id
      // IMPORTANTE: Guardar client_session_token y portal_client_id para que el usuario pueda hacer login después
      // NOTA: El client_session_token expira después de 24 horas, pero se puede refrescar
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          wallet_address: address, 
          clabe,
          client_session_token: clientSessionToken, // Guardar Client Session Token
          portal_client_id: portalClientId // Guardar el clientId de Portal
        })
        .eq('id', userId);
      
      if (updateError) {
        console.warn('⚠️ Error actualizando usuario con api_key y client_id:', updateError);
        // Si la columna client_id no existe, intentar solo con api_key
        if (updateError.code === '42703') {
          console.log('ℹ️ Columna client_id no existe, intentando solo con api_key...');
          const { error: apiKeyError } = await supabase
            .from('usuarios')
            .update({ 
              wallet_address: address, 
              clabe,
              api_key: apiKeyObj.api_key
            })
            .eq('id', userId);
          
          if (apiKeyError) {
            console.error('❌ Error actualizando usuario con api_key:', apiKeyError);
            // No lanzamos error, continuamos con el registro
          }
        } else {
          console.error('❌ Error actualizando usuario:', updateError);
          // No lanzamos error, continuamos con el registro
        }
      } else {
        console.log('✅ Usuario actualizado correctamente con api_key y client_id');
      }
      // 6. Guardar usuario autenticado en localStorage
      const userData: User = {
        email,
        name: nombre,
        address,
        authMethod: 'traditional',
        clabe,
        apiKey: clientSessionToken, // Guardar Client Session Token (no Portal API Key)
        clientId: portalClientId // Guardar clientId de Portal
      };
      updateUser(userData);
      setIsLoading(false);
      return { address, clabe };
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    portalService.logout();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      loginWithPortal,
      logout,
      createAccount,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}; 

// NOTA: Durante el signup, el usuario solo verá el spinner. Todo el proceso de registro, asignación de API Key, creación de wallet y CLABE ocurre en background antes de navegar a /home o mostrar el éxito. 