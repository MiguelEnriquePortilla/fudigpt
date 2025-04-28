// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkConnection, getTokens } from '../services/poster/posterAuth';
import { syncAllData } from '../services/poster/posterSync';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState({
    inProgress: false,
    message: '',
    showProgress: false
  });

  // Verificar si el usuario ya está logueado
  useEffect(() => {
    if (currentUser) {
      handleDataSync(currentUser.uid);
    }
  }, [currentUser]);

  // Manejar envío de formulario de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor ingresa email y contraseña');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Intentar iniciar sesión
      const userCredential = await login(email, password);
      
      // Después de iniciar sesión, intentar sincronizar datos
      await handleDataSync(userCredential.user.uid);
    } catch (error) {
      setError('Error al iniciar sesión: ' + error.message);
      console.error('Error en login:', error);
      setIsLoading(false);
    }
  };

  // Función para manejar la sincronización de datos
  const handleDataSync = async (userId) => {
    try {
      // Verificar si hay conexión con Poster
      setSyncStatus({
        inProgress: true,
        message: 'Verificando conexión con Poster...',
        showProgress: false
      });
      
      const connectionStatus = await checkConnection(userId);
      
      if (connectionStatus.connected) {
        // Si está conectado, intentar sincronizar datos
        setSyncStatus({
          inProgress: true,
          message: 'Sincronizando datos de Poster...',
          showProgress: true,
          progress: 10
        });
        
        // Obtener tokens
        const tokens = await getTokens(userId);
        
        // Simulación de progreso mientras se sincronizan los datos
        const interval = setInterval(() => {
          setSyncStatus(prev => {
            if (prev.progress >= 90) {
              clearInterval(interval);
              return prev;
            }
            return { 
              ...prev, 
              progress: prev.progress + 10 
            };
          });
        }, 300);
        
        // Sincronizar datos
        const syncResult = await syncAllData(userId, tokens.accessToken);
        
        clearInterval(interval);
        
        if (syncResult.success) {
          setSyncStatus({
            inProgress: true,
            message: 'Datos sincronizados correctamente',
            showProgress: true,
            progress: 100
          });
          
          // Redirigir al chat después de un breve retraso
          setTimeout(() => {
            navigate('/chat');
            setSyncStatus({ inProgress: false });
          }, 1000);
        } else {
          // Si hay error en sincronización, mostrar mensaje pero continuar
          console.warn('Error en sincronización:', syncResult.message);
          setSyncStatus({
            inProgress: false,
            message: 'Advertencia: No se pudieron sincronizar todos los datos'
          });
          setTimeout(() => {
            navigate('/chat');
          }, 2000);
        }
      } else {
        // Si no hay conexión, simplemente redirigir al chat
        console.log('No hay conexión con Poster, omitiendo sincronización');
        setSyncStatus({ inProgress: false });
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      setSyncStatus({ inProgress: false });
      // En caso de error, continuar con la navegación al chat
      navigate('/chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar visibilidad de contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-xl">
        {/* Imagen de Fudi */}
        <div className="bg-white p-6 flex justify-center">
          <img 
            src="/images/fudigpt-logo.png" 
            alt="Fudi Bot" 
            className="w-48 h-48"
          />
        </div>
        
        {/* Título */}
        <div className="text-center pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-800">["HOLA FUDI"]</h2>
        </div>
        
        {/* Estado de sincronización */}
        {syncStatus.inProgress && (
          <div className="px-8">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
              <p>{syncStatus.message}</p>
              
              {syncStatus.showProgress && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${syncStatus.progress || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-blue-600">{syncStatus.progress || 0}%</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Formulario */}
        <div className="px-8 py-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || syncStatus.inProgress}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
            >
              {isLoading || syncStatus.inProgress ? 'Procesando...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            <a href="#" className="text-gray-600 hover:text-gray-800">
              Forgot Password?
            </a>
          </div>
          
          <div className="mt-2 text-center text-sm">
            <span className="text-gray-600">Not registered yet? </span>
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;