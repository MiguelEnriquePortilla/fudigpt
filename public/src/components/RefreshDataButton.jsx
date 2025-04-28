// src/components/RefreshDataButton.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTokens } from '../services/poster/posterAuth';
import { syncAllData, updateLastSyncTimestamp } from '../services/poster/posterSync';

const RefreshDataButton = ({ onSyncComplete }) => {
  const { currentUser } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState(null);

  const handleRefreshData = async () => {
    if (!currentUser || syncing) return;

    setSyncing(true);
    setSyncProgress(10);
    setSyncResult(null);

    try {
      // Obtener tokens actuales
      const tokens = await getTokens(currentUser.uid);
      
      // Actualizar progreso para mejor UX
      setSyncProgress(25);
      
      // Iniciar sincronización
      const result = await syncAllData(currentUser.uid, tokens.accessToken);
      
      setSyncProgress(90);
      
      if (result.success) {
        // Actualizar timestamp de última sincronización
        await updateLastSyncTimestamp(currentUser.uid);
        setSyncProgress(100);
        
        setSyncResult({
          success: true,
          message: `Datos sincronizados correctamente. Se actualizaron ${result.counts.products || 0} productos, ${result.counts.inventory || 0} ingredientes y ${result.counts.sales || 0} transacciones.`
        });
        
        // Informar al componente padre sobre la sincronización exitosa
        if (onSyncComplete) {
          onSyncComplete(result);
        }
      } else {
        setSyncResult({
          success: false,
          message: result.message || 'Error al sincronizar datos'
        });
      }
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
      setSyncResult({
        success: false,
        message: `Error al sincronizar: ${error.message}`
      });
    } finally {
      // Limpiar estado después de un momento
      setTimeout(() => {
        setSyncing(false);
        setSyncProgress(0);
      }, 2000);
      
      // Limpiar mensaje de resultado después de unos segundos
      if (syncResult && syncResult.success) {
        setTimeout(() => {
          setSyncResult(null);
        }, 5000);
      }
    }
  };

  return (
    <div className="mb-4">
      {syncResult && (
        <div className={`p-3 rounded-lg text-sm mb-2 ${
          syncResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {syncResult.message}
        </div>
      )}
      
      <button
        onClick={handleRefreshData}
        disabled={syncing}
        className={`flex items-center justify-center w-full px-4 py-2 rounded-lg transition-colors ${
          syncing 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300'
        }`}
      >
        {syncing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {syncProgress < 100 ? 'Sincronizando datos...' : 'Sincronización completada'}
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refrescar datos de Poster
          </>
        )}
      </button>
      
      {syncing && (
        <div className="mt-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefreshDataButton;