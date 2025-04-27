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
  COLLECTION_RESTAURANT_DATA,
  COLLECTION_MENU,
  COLLECTION_INVENTORY,
  COLLECTION_TRANSACTIONS
} from './constants';

/**
 * Sincroniza todos los datos desde Poster
 * @param {string} userId - ID del usuario
 * @param {string} accessToken - Token de acceso de Poster
 */
export async function syncAllData(userId, accessToken) {
  try {
    // Marcar sincronización en progreso
    await updateDoc(doc(db, 'users', userId, 'integration', 'poster'), {
      sync_in_progress: true,
      sync_started_at: serverTimestamp()
    });

    // Sincronizar cada tipo de datos
    const menuPromise = syncMenu(userId, accessToken);
    const inventoryPromise = syncInventory(userId, accessToken);
    const transactionsPromise = syncTransactions(userId, accessToken);

    // Ejecutar sincronizaciones en paralelo
    const [menuResult, inventoryResult, transactionsResult] = await Promise.all([
      menuPromise,
      inventoryPromise,
      transactionsPromise
    ]);

    // Actualizar estado de sincronización
    await updateDoc(doc(db, 'users', userId, 'integration', 'poster'), {
      last_sync: serverTimestamp(),
      sync_in_progress: false,
      sync_error: null,
      sync_counts: {
        menu: menuResult.count,
        inventory: inventoryResult.count,
        transactions: transactionsResult.count
      }
    });

    return {
      success: true,
      counts: {
        products: menuResult.count,
        inventory: inventoryResult.count,
        sales: transactionsResult.count
      }
    };
  } catch (error) {
    console.error('Error sincronizando datos de Poster:', error);

    // Registrar error
    await updateDoc(doc(db, 'users', userId, 'integration', 'poster'), {
      sync_in_progress: false,
      sync_error: error.message,
      sync_error_at: serverTimestamp()
    });

    return {
      success: false,
      message: 'Error al sincronizar datos de Poster',
      error: error.message
    };
  }
}

/**
 * Sincroniza datos del menú desde Poster
 * @param {string} userId - ID del usuario
 * @param {string} accessToken - Token de acceso
 */
async function syncMenu(userId, accessToken) {
  try {
    const products = await fetchWithRetry(`${POSTER_API_URL}/menu.getProducts?token=${accessToken}`);
    
    if (!products.response) {
      throw new Error('Error al obtener productos del menú');
    }

    await saveCollection(userId, COLLECTION_MENU, products.response);
    
    return {
      success: true,
      count: products.response.length || 0
    };
  } catch (error) {
    console.error('Error sincronizando menú:', error);
    throw error;
  }
}

/**
 * Sincroniza datos de inventario desde Poster
 * @param {string} userId - ID del usuario
 * @param {string} accessToken - Token de acceso
 */
async function syncInventory(userId, accessToken) {
  try {
    const inventory = await fetchWithRetry(`${POSTER_API_URL}/storage.getStorageInventory?token=${accessToken}`);
    
    if (!inventory.response) {
      throw new Error('Error al obtener datos de inventario');
    }

    await saveCollection(userId, COLLECTION_INVENTORY, inventory.response);
    
    return {
      success: true,
      count: inventory.response.length || 0
    };
  } catch (error) {
    console.error('Error sincronizando inventario:', error);
    throw error;
  }
}

/**
 * Sincroniza transacciones desde Poster
 * @param {string} userId - ID del usuario
 * @param {string} accessToken - Token de acceso
 */
async function syncTransactions(userId, accessToken) {
  try {
    // Calcular fecha de hace N días
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - MAX_SYNC_DAYS);
    const dateFrom = startDate.toISOString().split('T')[0];

    const transactions = await fetchWithRetry(
      `${POSTER_API_URL}/transactions.getTransactions?token=${accessToken}&date_from=${dateFrom}`
    );
    
    if (!transactions.response) {
      throw new Error('Error al obtener transacciones');
    }

    await saveCollection(userId, COLLECTION_TRANSACTIONS, transactions.response);
    
    return {
      success: true,
      count: transactions.response.length || 0
    };
  } catch (error) {
    console.error('Error sincronizando transacciones:', error);
    throw error;
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

  throw lastError;
}

/**
 * Guarda una colección de datos en Firestore
 * @param {string} userId - ID del usuario
 * @param {string} collectionName - Nombre de la colección
 * @param {Array} data - Datos a guardar
 */
async function saveCollection(userId, collectionName, data) {
  if (!data || data.length === 0) {
    return;
  }

  // Crear ruta de la colección 
  const collectionPath = `users/${userId}/${COLLECTION_RESTAURANT_DATA}/${collectionName}`;
  
  // Utilizar un lote para operaciones múltiples
  const savePromises = data.map(item => {
    const docId = item.id ? item.id.toString() : Date.now().toString();
    return setDoc(doc(db, collectionPath, docId), {
      ...item,
      synced_at: serverTimestamp()
    });
  });

  await Promise.all(savePromises);
}

/**
 * Obtiene datos del menú desde Firestore
 * @param {string} userId - ID del usuario
 */
export async function getMenuData(userId) {
  const collectionPath = `users/${userId}/${COLLECTION_RESTAURANT_DATA}/${COLLECTION_MENU}`;
  
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
    console.error('Error obteniendo datos de menú:', error);
    return {
      success: false,
      message: 'Error al obtener datos del menú',
      error: error.message
    };
  }
}

/**
 * Obtiene datos de inventario desde Firestore
 * @param {string} userId - ID del usuario
 */
export async function getInventoryData(userId) {
  const collectionPath = `users/${userId}/${COLLECTION_RESTAURANT_DATA}/${COLLECTION_INVENTORY}`;
  
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
    console.error('Error obteniendo datos de inventario:', error);
    return {
      success: false,
      message: 'Error al obtener datos de inventario',
      error: error.message
    };
  }
}

/**
 * Obtiene datos de transacciones desde Firestore
 * @param {string} userId - ID del usuario
 * @param {Object} filters - Filtros a aplicar
 */
export async function getTransactionData(userId, filters = {}) {
  const collectionPath = `users/${userId}/${COLLECTION_RESTAURANT_DATA}/${COLLECTION_TRANSACTIONS}`;
  
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
    console.error('Error obteniendo transacciones:', error);
    return {
      success: false,
      message: 'Error al obtener transacciones',
      error: error.message
    };
  }
}

/**
 * Actualiza la marca de tiempo de última sincronización
 * @param {string} userId - ID del usuario
 */
export async function updateLastSyncTimestamp(userId) {
  try {
    await updateDoc(doc(db, 'users', userId, 'integration', 'poster'), {
      last_sync: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error actualizando timestamp de sincronización:', error);
    return false;
  }
}