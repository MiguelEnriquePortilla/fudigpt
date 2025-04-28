// src/services/poster/posterService.js
// Servicio unificado para manejar las operaciones con la API de Poster

// Importar funciones de autenticación
import { 
  initiatePosterAuth,
  handlePosterAuthCallback,
  checkPosterConnection,
  getPosterTokens,
  revokePosterAccess
} from './posterAuth';

// Importar funciones de sincronización
import {
  syncPosterData,
  syncPosterDataSelective,
  getPosterProducts,
  getPosterInventory,
  getPosterSales,
  updatePosterSyncTimestamp
} from './posterSync';

// Importar constantes
import { 
  POSTER_API_URL,
  POSTER_AUTH_URL,
  POSTER_APP_ID,
  POSTER_REDIRECT_URI
} from './constants';

/**
 * Servicio para integración con Poster
 */
const PosterService = {
  // Funciones de autenticación
  auth: {
    /**
     * Inicia el flujo de autorización de Poster
     */
    initiate: initiatePosterAuth,
    
    /**
     * Procesa el código de autorización recibido de Poster
     * @param {string} authCode - Código de autorización recibido
     * @param {string} userId - ID del usuario en Firebase
     */
    handleCallback: handlePosterAuthCallback,
    
    /**
     * Comprueba el estado de la conexión con Poster
     * @param {string} userId - ID del usuario
     */
    checkConnection: checkPosterConnection,
    
    /**
     * Obtiene los tokens de acceso para un usuario
     * @param {string} userId - ID del usuario
     */
    getTokens: getPosterTokens,
    
    /**
     * Revoca los tokens y elimina la conexión con Poster
     * @param {string} userId - ID del usuario
     */
    revoke: revokePosterAccess
  },
  
  // Funciones de sincronización
  sync: {
    /**
     * Sincroniza todos los datos desde Poster a Firebase
     * @param {string} userId - ID del usuario en Firebase
     */
    all: async (userId) => {
      try {
        const tokens = await getPosterTokens(userId);
        return syncPosterData(userId, tokens.accessToken);
      } catch (error) {
        console.error('Error en sincronización completa:', error);
        return {
          success: false,
          message: 'Error al sincronizar datos de Poster',
          error: error.message
        };
      }
    },
    
    /**
     * Sincroniza selectivamente datos desde Poster
     * @param {string} userId - ID del usuario
     * @param {Object} options - Opciones de sincronización (products, inventory, sales)
     */
    selective: async (userId, options) => {
      try {
        const tokens = await getPosterTokens(userId);
        return syncPosterDataSelective(userId, tokens.accessToken, options);
      } catch (error) {
        console.error('Error en sincronización selectiva:', error);
        return {
          success: false,
          message: 'Error al sincronizar datos de Poster',
          error: error.message
        };
      }
    },
    
    /**
     * Sincroniza solo productos
     * @param {string} userId - ID del usuario
     */
    products: async (userId) => {
      return PosterService.sync.selective(userId, { products: true, inventory: false, sales: false });
    },
    
    /**
     * Sincroniza solo inventario
     * @param {string} userId - ID del usuario
     */
    inventory: async (userId) => {
      return PosterService.sync.selective(userId, { products: false, inventory: true, sales: false });
    },
    
    /**
     * Sincroniza solo ventas
     * @param {string} userId - ID del usuario
     */
    sales: async (userId) => {
      return PosterService.sync.selective(userId, { products: false, inventory: false, sales: true });
    },
    
    /**
     * Actualiza el timestamp de última sincronización
     * @param {string} userId - ID del usuario
     */
    updateTimestamp: updatePosterSyncTimestamp
  },
  
  // Funciones para obtener datos
  data: {
    /**
     * Obtiene productos del menú
     * @param {string} userId - ID del usuario
     */
    getProducts: getPosterProducts,
    
    /**
     * Obtiene datos de inventario
     * @param {string} userId - ID del usuario
     */
    getInventory: getPosterInventory,
    
    /**
     * Obtiene datos de ventas/transacciones
     * @param {string} userId - ID del usuario
     * @param {Object} filters - Filtros a aplicar
     */
    getSales: getPosterSales
  }
};

// Exportaciones
export default PosterService;

// También exportar funciones individualmente para compatibilidad hacia atrás
export {
  initiatePosterAuth,
  handlePosterAuthCallback,
  checkPosterConnection,
  syncPosterData
};