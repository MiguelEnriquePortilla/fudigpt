// Contexto para manejar la conexión y estado de Poster
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import PosterService from '../services/poster/posterService';

// Crear contexto
const PosterContext = createContext();

// Hook personalizado para usar el contexto de Poster
export function usePoster() {
  return useContext(PosterContext);
}

// Proveedor del contexto
export function PosterProvider({ children }) {
  const { currentUser } = useAuth();
  const [posterStatus, setPosterStatus] = useState({
    connected: false,
    lastSync: null,
    loading: true,
    error: null,
    syncInProgress: false
  });
  
  // Comprobar estado de la conexión con Poster cuando cambia el usuario
  useEffect(() => {
    if (!currentUser) {
      setPosterStatus({
        connected: false,
        lastSync: null,
        loading: false,
        error: null,
        syncInProgress: false
      });
      return;
    }
    
    const checkConnection = async () => {
      try {
        setPosterStatus(prev => ({ ...prev, loading: true }));
        const status = await PosterService.auth.checkConnection(currentUser.uid);
        
        setPosterStatus({
          connected: status.connected,
          lastSync: status.lastSync,
          loading: false,
          error: status.error,
          syncInProgress: status.syncInProgress,
          syncCounts: status.syncCounts,
          needsReconnect: status.needsReconnect
        });
      } catch (error) {
        console.error('Error al comprobar conexión con Poster:', error);
        setPosterStatus({
          connected: false,
          lastSync: null,
          loading: false,
          error: error.message,
          syncInProgress: false
        });
      }
    };
    
    checkConnection();
  }, [currentUser]);
  
  // Función para iniciar conexión con Poster
  const connectToPoster = () => {
    if (!currentUser) {
      return;
    }
    
    PosterService.auth.initiate();
  };
  
  // Función para sincronizar datos de Poster
  const synchronizePosterData = async (options = {}) => {
    if (!currentUser || !posterStatus.connected) {
      return {
        success: false,
        message: 'No hay conexión con Poster'
      };
    }
    
    try {
      setPosterStatus(prev => ({ ...prev, syncInProgress: true }));
      
      // Si hay opciones específicas, usar sincronización selectiva
      let result;
      if (Object.keys(options).length > 0) {
        result = await PosterService.sync.selective(currentUser.uid, options);
      } else {
        result = await PosterService.sync.all(currentUser.uid);
      }
      
      // Actualizar estado con la información de la sincronización
      setPosterStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date(),
        syncCounts: result.counts,
        error: result.success ? null : result.error
      }));
      
      return result;
    } catch (error) {
      console.error('Error en sincronización de Poster:', error);
      
      setPosterStatus(prev => ({
        ...prev,
        syncInProgress: false,
        error: error.message
      }));
      
      return {
        success: false,
        message: 'Error al sincronizar datos de Poster',
        error: error.message
      };
    }
  };
  
  // Funciones para sincronización selectiva
  const synchronizeProducts = () => {
    return synchronizePosterData({ products: true, inventory: false, sales: false });
  };
  
  const synchronizeInventory = () => {
    return synchronizePosterData({ products: false, inventory: true, sales: false });
  };
  
  const synchronizeSales = () => {
    return synchronizePosterData({ products: false, inventory: false, sales: true });
  };
  
  // Función para obtener datos
  const getPosterData = {
    products: () => PosterService.data.getProducts(currentUser?.uid),
    inventory: () => PosterService.data.getInventory(currentUser?.uid),
    sales: (filters) => PosterService.data.getSales(currentUser?.uid, filters)
  };
  
  // Valor del contexto
  const value = {
    ...posterStatus,
    connectToPoster,
    synchronizePosterData,
    synchronizeProducts,
    synchronizeInventory,
    synchronizeSales,
    getPosterData
  };
  
  return (
    <PosterContext.Provider value={value}>
      {children}
    </PosterContext.Provider>
  );
}