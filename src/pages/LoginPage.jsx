// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import posterConnector from '../services/poster/PosterConnector';
import { db } from '../firebase';
import { collection, doc, getDoc } from 'firebase/firestore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState({
    needsSync: false,
    inProgress: false,
    progress: 0,
    lastSync: null
  });

  // Verificar si el usuario ya está logueado
  useEffect(() => {
    if (currentUser) {
      checkSyncStatus();
    }
  }, [currentUser]);

  // Verificar si se necesita sincronizar datos
  const checkSyncStatus = async () => {
    try {
      // Verificar conexión con Poster
      const isConnected = await posterConnector.isConnected();
      
      if (!isConnected) {
        return; // Si no está conectado, no intentar sincronizar
      }
      
      // Verificar si necesita sincronización (datos más antiguos de 24 horas)
      const needsSync = await posterConnector.dataService.needsSync(24);
      
      if (needsSync) {
        setSyncStatus({
          ...syncStatus,
          needsSync: true,
          lastSync: await getLastSyncTime()
        });
      } else {
        // Si no necesita sincronización, redirigir al chat
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error verificando sincronización:', error);
      // Si hay error, igualmente permitir acceso al chat
      navigate('/chat');
    }
  };

  // Obtener la última hora de sincronización
  const getLastSyncTime = async () => {
    try {
      const docRef = doc(db, 'poster_sync', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().lastSync.toDate();
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo tiempo de sincronización:', error);
      return null;
    }
  };

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
      await login(email, password);
      
      // La redirección se manejará en el useEffect cuando currentUser cambie
    } catch (error) {
      setError('Error al iniciar sesión: ' + error.message);
      console.error('Error en login:', error);
      setIsLoading(false);
    }
  };

  // Iniciar sincronización de datos
  const handleSync = async () => {
    setSyncStatus({
      ...syncStatus,
      inProgress: true,
      progress: 10
    });
    
    // Simular progreso de sincronización
    const interval = setInterval(() => {
      setSyncStatus(prev => {
        if (prev.progress >= 90) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, progress: prev.progress + 10 };
      });
    }, 500);
    
    try {
      // Sincronizar datos desde Poster
      await posterConnector.syncData();
      
      setSyncStatus(prev => ({
        ...prev,
        inProgress: true,
        progress: 100
      }));
      
      // Esperar un momento para mostrar el 100% antes de redirigir
      setTimeout(() => {
        navigate('/chat');
      }, 500);
    } catch (error) {
      setError('Error sincronizando datos: ' + error.message);
      console.error('Error en sincronización:', error);
      setSyncStatus(prev => ({
        ...prev,
        inProgress: false
      }));
    }
  };

  // Si se está sincronizando, mostrar el progreso
  if (syncStatus.inProgress) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Sincronizando Datos</h2>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4 text-center">
              Estamos sincronizando tus datos desde Poster. Esto puede tomar unos momentos.
            </p>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${syncStatus.progress}%` }}
              ></div>
            </div>
            <p className="text-right text-sm text-gray-600 mt-1">{syncStatus.progress}%</p>
          </div>
        </div>
      </div>
    );
  }

  // Si se necesita sincronización pero no está en progreso, mostrar pantalla de sincronización
  if (syncStatus.needsSync) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Actualización de Datos</h2>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Tus datos de Poster no se han actualizado en más de 24 horas. Para obtener los mejores insights, recomendamos sincronizar ahora.
            </p>
            
            {syncStatus.lastSync && (
              <p className="text-sm text-gray-600 mb-4">
                Última sincronización: {syncStatus.lastSync.toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleSync}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Sincronizar Ahora
            </button>
            
            <button
              onClick={() => navigate('/chat')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Continuar sin Sincronizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de login normal
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">FUDIVERSE</h1>
        <p className="text-lg text-gray-600">Potencia tu restaurante con inteligencia artificial</p>
      </div>
      
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm">Recordarme</span>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                {isLoading ? 'Iniciando...' : 'Talk to Fudi'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <a
              href="/register"
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              ¿No tienes cuenta? Regístrate aquí
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;