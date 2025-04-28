// src/services/poster/posterSync.js
import { db } from '../../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy,
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import axios from 'axios';
import { 
  POSTER_API_URL,
  MAX_SYNC_DAYS,
  RETRY_ATTEMPTS,
  RETRY_BACKOFF_MS,
  COLLECTION_USERS,
  COLLECTION_INTEGRATION,
  COLLECTION_POSTER,
  COLLECTION_POSTER_DATA,
  COLLECTION_PRODUCTS,
  COLLECTION_INVENTORY,
  COLLECTION_SALES,
  COLLECTION_ITEMS,
  getPosterIntegrationPath,
  getPosterDataPath
} from './constants';
import { handleApiError, handleFirestoreError, logErrorToFirestore } from '../errorHandler';

/**
 * Sincroniza todos los datos desde Poster
 * @param {string} userId - ID del usuario
 * @param {string} accessToken - Token de acceso de Poster
 */
export async function syncPosterData(userId, accessToken) {
  try {
    // Marcar sincronización en progreso
    const posterDocPath = getPosterIntegrationPath(userId);
    await updateDoc(doc(db, posterDocPath), {
      sync_in_progress: true,
      sync_started_at: serverTimestamp()
    });

    // Sincronizar cada tipo de datos
    const productsPromise = syncPosterProducts(userId, accessToken);
    const inventoryPromise = syncPosterInventory(userId, accessToken);
    const salesPromise = syncPosterSales(userId, accessToken);

    // Ejecutar sincronizaciones en paralelo
    const [productsResult, inventoryResult, salesResult] = await Promise.all([
      productsPromise,
      inventoryPromise,
      salesPromise
    ]);

    // Actualizar estado de sincronización
    await updateDoc(doc(db, posterDocPath), {
      last_sync: serverTimestamp(),
      sync_in_progress: false,
      sync_error: null,
      sync_counts: {
        products: productsResult.count,
        inventory: inventoryResult.count,
        sales: salesResult.count
      }
    });

    return {
      success: true,
      counts: {
        products: productsResult.count,
        inventory: inventoryResult.count,
        sales: salesResult.count
      }
    };
  } catch (error) {
    // Registrar error
    const posterDocPath = getPosterIntegrationPath(userId);
    await updateDoc(doc(db, posterDocPath), {
      sync_in_progress: false,
      sync_error: error.message,
      sync_error_at: serverTimestamp()
    });

    // Registrar error detallado en Firestore
    await logErrorToFirestore(db, userId, handleApiError(error, 'posterSync', 'syncPosterData'));

    return handleApiError(error, 'posterSync', 'syncPosterData', { userId });
  }
}

/**
 * Permite sincronizar selectivamente ciertos tipos de datos
 * @param {string} userId - ID del usuario
 * @param {string} accessToken - Token de acceso
 * @param {Object} options - Opciones de sincronización {products: boolean, inventory: boolean, sales: boolean}
 */
export async function syncPosterDataSelective(userId, accessToken, options = {}) {
  const syncOptions = {
    products: options.products !== false, // Por defecto true si no se especifica
    inventory: options.inventory !== false,
    sales: options.sales !== false
  };

  try {
    // Marcar sincronización en progreso
    const posterDocPath = getPosterIntegrationPath(userId);
    await updateDoc(doc(db, posterDocPath), {
      sync_in_progress: true,
      sync_started_at: serverTimestamp(),
      sync_options: syncOptions
    });

    const syncPromises = [];
    const results = { products: 0, inventory: 0, sales: 0 };

    // Añadir las promesas según las opciones
    if (syncOptions.products) {
      syncPromises.push(syncPosterProducts(userId, accessToken).then(result => {
        results.products = result.count;
        return result;
      }));
    }

    if (syncOptions.inventory) {
      syncPromises.push(syncPosterInventory(userId, accessToken).then(result => {
        results.inventory = result.count;
        return result;
      }));
    }

    if (syncOptions.sales) {
      syncPromises.push(syncPosterSales(userId, accessToken).then(result => {
        results.sales = result.count;
        return result;
      }));
    }

    // Ejecutar sincronizaciones en paralelo
    await Promise.all(syncPromises);

    // Actualizar estado de sincronización
    await updateDoc(doc(db, posterDocPath), {
      last_sync: serverTimestamp(),
      sync_in_progress: false,
      sync_error: null,
      sync_counts: results
    });

    return {
      success: true,
      counts: results
    };
  } catch (error) {
    // Registrar error
    const posterDocPath = getPosterIntegrationPath(userId);
    await updateDoc(doc(db, posterDocPath), {
      sync_in_progress: false,
      sync_error: error.message,
      sync_error_at: serverTimestamp()
    });

    // Registrar error detallado en Firestore
    await logErrorToFirestore(db, userId, handleApiError(error, 'posterSync', 'syncPosterDataSelective'));

    return handleApiError(error, 'posterSync', 'syncPosterDataSelective', { userId, options: syncOptions });
  }
}

/**
 * Sincroniza productos del menú desde Poster
 * @param {string} userId - ID del usuario
 * @param {string} accessToken - Token de acceso
 */
async function syncPosterProducts(userId, accessToken) {
  try {
    const products = await fetchWithRetry(`${POSTER_API_URL}/menu.getProducts?token=${accessToken}`);
    
    if (!products.response) {
      throw new Error('Error al obtener productos del menú');
    }

    await savePosterCollection(userId, COLLECTION_PRODUCTS, products.response);
    
    return {
      success: true,
      count: products.response.length || 0
    };
  } catch (error) {
    throw handleApiError(error, 'posterSync', 'syncPosterProducts', { userId });
  }
}

/**
 * Sincroniza datos de inventario desde Poster
 * @param {string} userId - ID del usuario
 * @param {string} accessToken - Token de acceso
 */
async function syncPosterInventory(userId, accessToken) {
  try {
    const inventory = await fetchWithRetry(`${POSTER_API_URL}/storage.getStorageInventory?token=${accessToken}`);
    
    if (!inventory.response) {
      throw new Error('Error al obtener datos de inventario');
    }

    await savePosterCollection(userId, COLLECTION_INVENTORY, inventory.response);
    
    return {
      success: true,
      count: inventory.response.length || 0
    };
  } catch (error) {
    throw handleApiError(error, 'posterSync', 'syncPosterInventory', { userId });
  }
}

/**
 * Sincroniza datos de ventas desde Poster
 * @param {string} userId - ID del usuario
 * @param {string} accessToken - Token de acceso
 */
async function syncPosterSales(userId, accessToken) {
  try {
    // Calcular fecha de hace N días
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - MAX_SYNC_DAYS);
    const dateFrom = startDate.toISOString().split('T')[0];

    const sales = await fetchWithRetry(
      `${POSTER_API_URL}/transactions.getTransactions?token=${accessToken}&date_from=${dateFrom}`
    );
    
    if (!sales.response) {
      throw new Error('Error al obtener ventas');
    }

    await savePosterCollection(userId, COLLECTION_SALES, sales.response);
    
    return {
      success: true,
      count: sales.response.length || 0
    };
  } catch (error) {
    throw handleApiError(error, 'posterSync', 'syncPosterSales', { userId });
  }
}

/**
 * Función helper para realizar peticiones con reintentos
 * @param {string} url - URL a consultar
 * @param {Object} options - Opciones para fetch
 */
async function fetchWithRetry(url, options = {}) {
  let lastError;
  let delay = RETRY_BACKOFF_MS;

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error) {
      console.warn(`Intento ${attempt + 1} fallido:`, error.message);
      lastError = error;
      
      // Esperar antes del siguiente intento (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Duplicar el tiempo de espera para el próximo intento
    }
  }

  throw handleApiError(lastError, 'posterSync', 'fetchWithRetry', { url, retryAttempts: RETRY_ATTEMPTS });
}

/**
 * Guarda una colección de datos en Firestore
 * @param {string} userId - ID del usuario
 * @param {string} collectionName - Nombre de la colección
 * @param {Array} data - Datos a guardar
 */
async function savePosterCollection(userId, collectionName, data) {
  if (!data || data.length === 0) {
    return;
  }

  try {
    // Obtener la ruta de la colección utilizando la función helper
    const collectionPath = getPosterDataPath(userId, collectionName);
    
    // Utilizar un lote para operaciones múltiples
    const savePromises = data.map(item => {
      const docId = item.id ? item.id.toString() : new Date().getTime().toString();
      return setDoc(doc(db, collectionPath, docId), {
        ...item,
        synced_at: serverTimestamp()
      });
    });

    await Promise.all(savePromises);
  } catch (error) {
    throw handleFirestoreError(error, 'posterSync', 'savePosterCollection', { 
      userId, 
      collectionName,
      dataCount: data.length 
    });
  }
}

/**
 * Obtiene datos de productos desde Firestore
 * @param {string} userId - ID del usuario
 */
export async function getPosterProducts(userId) {
  const collectionPath = getPosterDataPath(userId, COLLECTION_PRODUCTS);
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    const items = [];
    
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      success: true,
      data: items
    };
  } catch (error) {
    return handleFirestoreError(error, 'posterSync', 'getPosterProducts', { userId });
  }
}

/**
 * Obtiene datos de inventario desde Firestore
 * @param {string} userId - ID del usuario
 */
export async function getPosterInventory(userId) {
  const collectionPath = getPosterDataPath(userId, COLLECTION_INVENTORY);
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    const items = [];
    
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      success: true,
      data: items
    };
  } catch (error) {
    return handleFirestoreError(error, 'posterSync', 'getPosterInventory', { userId });
  }
}

/**
 * Obtiene datos de ventas desde Firestore
 * @param {string} userId - ID del usuario
 * @param {Object} filters - Filtros a aplicar
 */
export async function getPosterSales(userId, filters = {}) {
  const collectionPath = getPosterDataPath(userId, COLLECTION_SALES);
  
  try {
    let q = collection(db, collectionPath);
    
    // Aplicar filtros si existen
    if (filters.dateFrom) {
      q = query(q, where('date_start', '>=', filters.dateFrom));
    }
    
    if (filters.dateTo) {
      q = query(q, where('date_start', '<=', filters.dateTo));
    }
    
    // Ordenar por fecha descendente
    q = query(q, orderBy('date_start', 'desc'));
    
    // Limitar cantidad si se especifica
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const items = [];
    
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      success: true,
      data: items
    };
  } catch (error) {
    return handleFirestoreError(error, 'posterSync', 'getPosterSales', { userId, filters });
  }
}

/**
 * Actualiza la marca de tiempo de última sincronización
 * @param {string} userId - ID del usuario
 */
export async function updatePosterSyncTimestamp(userId) {
  try {
    const posterDocPath = getPosterIntegrationPath(userId);
    await updateDoc(doc(db, posterDocPath), {
      last_sync: serverTimestamp()
    });
    return true;
  } catch (error) {
    return handleFirestoreError(error, 'posterSync', 'updatePosterSyncTimestamp', { userId });
  }
}

// Compatibilidad con código existente
export const syncAllData = syncPosterData;
export const syncData = syncPosterData;
export const syncDataSelective = syncPosterDataSelective;
export const getProducts = getPosterProducts;
export const getInventory = getPosterInventory;
export const getSales = getPosterSales;
export const updateLastSyncTimestamp = updatePosterSyncTimestamp;