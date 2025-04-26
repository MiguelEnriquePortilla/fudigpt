// Servicio para manejar las operaciones con la API de Poster
import { db } from '../../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Credenciales de la aplicación Poster
const POSTER_APP_ID = '4021';
const POSTER_APP_SECRET = 'bce702a7b394b9962165bf55c12b8ddc';
const POSTER_REDIRECT_URI = window.location.origin + '/auth-callback';

// URLs de la API de Poster
const POSTER_AUTH_URL = 'https://joinposter.com/api/v2/auth';
const POSTER_API_URL = 'https://joinposter.com/api';

/**
 * Inicia el flujo de autorización de Poster
 */
export function initiatePosterAuth() {
  // Generar URL de autorización
  const authUrl = `${POSTER_AUTH_URL}?application_id=${POSTER_APP_ID}&redirect_uri=${encodeURIComponent(POSTER_REDIRECT_URI)}&response_type=code`;
  
  // Redirigir al usuario a la página de autorización de Poster
  window.location.href = authUrl;
}

/**
 * Procesa el código de autorización recibido de Poster
 * @param {string} authCode - Código de autorización recibido
 * @param {string} userId - ID del usuario en Firebase
 */
export async function handlePosterAuthCallback(authCode, userId) {
  try {
    // Intercambiar código de autorización por token de acceso
    const response = await fetch(`${POSTER_API_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        application_id: POSTER_APP_ID,
        application_secret: POSTER_APP_SECRET,
        code: authCode,
        redirect_uri: POSTER_REDIRECT_URI
      })
    });

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('No se recibió token de acceso');
    }

    // Guardar token en Firestore
    await setDoc(doc(db, 'users', userId, 'integration', 'poster'), {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
      last_sync: null,
      connected: true,
      updated_at: serverTimestamp()
    });

    return {
      success: true,
      message: 'Conexión con Poster establecida correctamente'
    };
  } catch (error) {
    console.error('Error en autorización de Poster:', error);
    return {
      success: false,
      message: 'Error al conectar con Poster',
      error: error.message
    };
  }
}

/**
 * Sincroniza datos desde Poster a Firebase
 * @param {string} userId - ID del usuario en Firebase
 */
export async function syncPosterData(userId) {
  try {
    // Verificar si hay un token válido
    const posterDoc = await getDoc(doc(db, 'users', userId, 'integration', 'poster'));
    
    if (!posterDoc.exists() || !posterDoc.data().access_token) {
      throw new Error('No hay conexión con Poster');
    }

    const posterData = posterDoc.data();
    const accessToken = posterData.access_token;

    // Iniciar transacción de sincronización
    await updateDoc(doc(db, 'users', userId, 'integration', 'poster'), {
      sync_in_progress: true,
      sync_started_at: serverTimestamp()
    });

    // Obtener datos de Poster (productos, inventario, ventas)
    const [products, inventory, sales] = await Promise.all([
      fetchPosterProducts(accessToken),
      fetchPosterInventory(accessToken),
      fetchPosterSales(accessToken)
    ]);

    // Guardar datos en Firestore
    await Promise.all([
      saveDataToFirestore(userId, 'products', products),
      saveDataToFirestore(userId, 'inventory', inventory),
      saveDataToFirestore(userId, 'sales', sales)
    ]);

    // Actualizar información de sincronización
    await updateDoc(doc(db, 'users', userId, 'integration', 'poster'), {
      last_sync: serverTimestamp(),
      sync_in_progress: false,
      sync_error: null,
      sync_counts: {
        products: products.length || 0,
        inventory: inventory.length || 0,
        sales: sales.length || 0
      }
    });

    return {
      success: true,
      message: 'Datos sincronizados correctamente',
      counts: {
        products: products.length || 0,
        inventory: inventory.length || 0,
        sales: sales.length || 0
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
 * Obtiene productos del menú desde Poster
 * @param {string} accessToken - Token de acceso de Poster
 */
async function fetchPosterProducts(accessToken) {
  try {
    const response = await fetch(`${POSTER_API_URL}/menu.getProducts?token=${accessToken}`);
    const data = await response.json();
    
    if (!data.response) {
      throw new Error('Error al obtener productos de Poster');
    }
    
    return data.response;
  } catch (error) {
    console.error('Error obteniendo productos de Poster:', error);
    throw error;
  }
}

/**
 * Obtiene datos de inventario desde Poster
 * @param {string} accessToken - Token de acceso de Poster
 */
async function fetchPosterInventory(accessToken) {
  try {
    const response = await fetch(`${POSTER_API_URL}/storage.getStorageInventory?token=${accessToken}`);
    const data = await response.json();
    
    if (!data.response) {
      throw new Error('Error al obtener inventario de Poster');
    }
    
    return data.response;
  } catch (error) {
    console.error('Error obteniendo inventario de Poster:', error);
    throw error;
  }
}

/**
 * Obtiene datos de ventas desde Poster
 * @param {string} accessToken - Token de acceso de Poster
 */
async function fetchPosterSales(accessToken) {
  // Calcular fecha de hace 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
  
  try {
    const response = await fetch(`${POSTER_API_URL}/transactions.getTransactions?token=${accessToken}&date_from=${dateFrom}`);
    const data = await response.json();
    
    if (!data.response) {
      throw new Error('Error al obtener ventas de Poster');
    }
    
    return data.response;
  } catch (error) {
    console.error('Error obteniendo ventas de Poster:', error);
    throw error;
  }
}

/**
 * Guarda datos en Firestore
 * @param {string} userId - ID del usuario
 * @param {string} collection - Nombre de la colección
 * @param {Array} data - Datos a guardar
 */
async function saveDataToFirestore(userId, collectionName, data) {
  if (!data || data.length === 0) {
    return;
  }
  
  // Crear referencia a la colección
  const collectionRef = collection(db, `users/${userId}/poster_data/${collectionName}/items`);
  
  // Guardar cada elemento en la colección
  const savePromises = data.map(item => {
    const docId = item.id ? item.id.toString() : new Date().getTime().toString();
    return setDoc(doc(collectionRef, docId), {
      ...item,
      synced_at: serverTimestamp()
    });
  });
  
  return Promise.all(savePromises);
}

/**
 * Comprueba el estado de la conexión con Poster
 * @param {string} userId - ID del usuario
 */
export async function checkPosterConnection(userId) {
  try {
    const posterDoc = await getDoc(doc(db, 'users', userId, 'integration', 'poster'));
    
    if (!posterDoc.exists()) {
      return {
        connected: false,
        message: 'No hay conexión con Poster'
      };
    }
    
    const posterData = posterDoc.data();
    
    // Comprobar si el token ha expirado
    if (posterData.expires_at && new Date(posterData.expires_at) < new Date()) {
      return {
        connected: false,
        message: 'La conexión con Poster ha expirado',
        needsReconnect: true
      };
    }
    
    return {
      connected: posterData.connected === true,
      lastSync: posterData.last_sync ? posterData.last_sync.toDate() : null,
      syncInProgress: posterData.sync_in_progress === true,
      syncCounts: posterData.sync_counts || {}
    };
  } catch (error) {
    console.error('Error comprobando conexión con Poster:', error);
    return {
      connected: false,
      error: error.message
    };
  }
}