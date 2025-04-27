// Componente para manejar la autorización de Poster
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import * as posterService from '../services/poster/posterService';

// Componente de botón de conexión con Poster
const PosterConnector = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Verificar estado de conexión al cargar
  useEffect(() => {
    if (!user) return;
    
    async function checkConnection() {
      try {
        setLoading(true);
        const status = await posterService.checkConnection(user.uid);
        setConnected(status.connected);
        setLastSync(status.lastSync);
        setSyncInProgress(status.syncInProgress || false);
      } catch (error) {
        console.error('Error verificando conexión con Poster:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkConnection();
  }, [user]);

  // Iniciar flujo de autenticación con Poster
  const connectToPoster = () => {
    posterService.initiateAuth();
  };

  // Formatear fecha última sincronización
  const formatLastSync = (date) => {
    if (!date) return 'Nunca';

    // Si es hoy, mostrar hora
    const today = new Date();
    const syncDate = new Date(date);

    if (today.toDateString() === syncDate.toDateString()) {
      return `Hoy a las ${syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Si es ayer
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === syncDate.toDateString()) {
      return `Ayer a las ${syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Si es en los últimos 7 días
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (syncDate > sevenDaysAgo) {
      return syncDate.toLocaleDateString([], { weekday: 'long' }) +
             ` a las ${syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Para fechas más antiguas
    return syncDate.toLocaleDateString();
  };

  // Manejar clic en botón de sincronización
  const handleSync = async () => {
    if (!user) return;

    setSyncMessage({ type: 'info', text: 'Sincronizando datos...' });
    setSyncInProgress(true);

    try {
      const result = await posterService.syncData(user.uid);

      if (result.success) {
        setSyncMessage({
          type: 'success',
          text: `Sincronización completada. Se importaron ${result.counts.products} productos, ${result.counts.inventory} inventarios y ${result.counts.sales} ventas.`
        });
        
        // Actualizar estado local
        setLastSync(new Date());

        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setSyncMessage(null), 5000);
      } else {
        setSyncMessage({ type: 'error', text: result.message || 'Error al sincronizar' });
      }
    } catch (error) {
      setSyncMessage({ type: 'error', text: 'Error al sincronizar: ' + error.message });
    } finally {
      setSyncInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
          <p>Verificando conexión con Poster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
        Conectar con Poster
      </h3>

      {connected ? (
        <>
          <div className="flex items-center mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Conectado a Poster
            </p>
          </div>

          <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Última sincronización: {formatLastSync(lastSync)}
          </p>

          <button
            onClick={handleSync}
            disabled={syncInProgress}
            className={`px-4 py-2 rounded-md ${
              syncInProgress
                ? `${isDark ? 'bg-gray-600' : 'bg-gray-300'} cursor-not-allowed`
                : `${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
            } transition-colors`}
          >
            {syncInProgress ? 'Sincronizando...' : 'Sincronizar datos ahora'}
          </button>

          {syncMessage && (
            <div className={`mt-3 p-2 rounded text-sm ${
              syncMessage.type === 'success'
                ? `${isDark ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'}`
                : syncMessage.type === 'error'
                  ? `${isDark ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'}`
                  : `${isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`
            }`}>
              {syncMessage.text}
            </div>
          )}
        </>
      ) : (
        <>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Conecta tu cuenta de Poster para sincronizar datos de ventas, inventario y productos.
          </p>

          <button
            onClick={connectToPoster}
            className={`px-4 py-2 rounded-md ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            Conectar con Poster
          </button>
        </>
      )}
    </div>
  );
};

export default PosterConnector;