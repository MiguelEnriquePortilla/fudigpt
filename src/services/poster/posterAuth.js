// src/services/poster/posterAuth.js
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import axios from 'axios';
import { 
  POSTER_OAUTH_URL, 
  POSTER_CLIENT_ID, 
  POSTER_CLIENT_SECRET, 
  POSTER_REDIRECT_URI,
  COLLECTION_TOKENS
} from './constants';

/**
 * Inicia el flujo de OAuth con Poster
 */
export function initiateOAuthFlow() {
  const authUrl = `${POSTER_OAUTH_URL}?application_id=${POSTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(POSTER_REDIRECT_URI)}&response_type=code`;
  window.location.href = authUrl;
}

/**
 * Maneja el callback de autorización de Poster
 * @param {string} code - Código de autorización
 * @param {string} userId - ID del usuario
 */
export async function handleAuthCallback(code, userId) {
  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeTokens(tokens, userId);
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
 * Intercambia el código de autorización por tokens de acceso
 * @param {string} code - El código recibido del callback de OAuth
 */
async function exchangeCodeForTokens(code) {
  try {
    const response = await axios.post('https://joinposter.com/api/v2/auth/token', {
      grant_type: 'authorization_code',
      client_id: POSTER_CLIENT_ID,
      client_secret: POSTER_CLIENT_SECRET,
      redirect_uri: POSTER_REDIRECT_URI,
      code
    });
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
      accountId: response.data.account_id
    };
  } catch (error) {
    console.error('Error intercambiando código por tokens:', error);
    throw new Error('No se pudo obtener tokens de acceso. Por favor intenta nuevamente.');
  }
}

/**
 * Almacena tokens en Firebase
 * @param {Object} tokens - Tokens obtenidos de Poster
 * @param {string} userId - ID del usuario
 */
async function storeTokens(tokens, userId) {
  try {
    await setDoc(doc(db, 'users', userId, 'integration', 'poster'), {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: new Date(tokens.expiresAt).toISOString(),
      account_id: tokens.accountId,
      last_sync: null,
      connected: true,
      updated_at: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error guardando tokens:', error);
    throw new Error('No se pudieron almacenar los tokens. Por favor intenta nuevamente.');
  }
}

/**
 * Verifica el estado de la conexión con Poster
 * @param {string} userId - ID del usuario
 */
export async function checkConnection(userId) {
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
      // Intentar refrescar el token
      try {
        await refreshTokens(posterData.refresh_token, userId);
        // Si llegamos aquí, el token se refrescó correctamente
        return {
          connected: true,
          lastSync: posterData.last_sync ? new Date(posterData.last_sync.seconds * 1000) : null,
          syncInProgress: posterData.sync_in_progress === true
        };
      } catch (refreshError) {
        return {
          connected: false,
          message: 'La conexión con Poster ha expirado',
          needsReconnect: true
        };
      }
    }

    return {
      connected: posterData.connected === true,
      lastSync: posterData.last_sync ? new Date(posterData.last_sync.seconds * 1000) : null,
      syncInProgress: posterData.sync_in_progress === true
    };
  } catch (error) {
    console.error('Error comprobando conexión con Poster:', error);
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Refresca los tokens usando el refresh token
 * @param {string} refreshToken - Token de actualización
 * @param {string} userId - ID del usuario
 */
async function refreshTokens(refreshToken, userId) {
  try {
    const response = await axios.post('https://joinposter.com/api/v2/auth/refresh', {
      grant_type: 'refresh_token',
      client_id: POSTER_CLIENT_ID,
      client_secret: POSTER_CLIENT_SECRET,
      refresh_token: refreshToken
    });
    
    const tokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: new Date(Date.now() + response.data.expires_in * 1000).toISOString(),
      updated_at: new Date()
    };
    
    await updateDoc(doc(db, 'users', userId, 'integration', 'poster'), tokens);
    
    return true;
  } catch (error) {
    console.error('Error refrescando tokens:', error);
    throw error;
  }
}

/**
 * Obtiene los tokens de acceso para un usuario
 * @param {string} userId - ID del usuario
 */
export async function getTokens(userId) {
  try {
    const posterDoc = await getDoc(doc(db, 'users', userId, 'integration', 'poster'));
    
    if (!posterDoc.exists()) {
      throw new Error('No hay tokens almacenados');
    }
    
    const data = posterDoc.data();
    
    // Verificar si necesitan refrescarse
    if (new Date(data.expires_at) < new Date()) {
      await refreshTokens(data.refresh_token, userId);
      // Llamada recursiva para obtener tokens actualizados
      return getTokens(userId);
    }
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at)
    };
  } catch (error) {
    console.error('Error obteniendo tokens:', error);
    throw new Error('No se pudieron obtener los tokens. Por favor reconecta tu cuenta de Poster.');
  }
}

/**
 * Revoca los tokens y elimina la conexión con Poster
 * @param {string} userId - ID del usuario
 */
export async function revokeAccess(userId) {
  try {
    const posterDoc = await getDoc(doc(db, 'users', userId, 'integration', 'poster'));
    
    if (posterDoc.exists()) {
      const data = posterDoc.data();
      
      // Intentar revocar en Poster
      try {
        await axios.post('https://joinposter.com/api/v2/auth/revoke', {
          client_id: POSTER_CLIENT_ID,
          client_secret: POSTER_CLIENT_SECRET,
          token: data.access_token
        });
      } catch (error) {
        console.warn('Error revocando tokens en Poster:', error);
        // Continuamos incluso si falla la revocación en Poster
      }
      
      // Marcar como desconectado pero mantener el registro
      await updateDoc(doc(db, 'users', userId, 'integration', 'poster'), {
        connected: false,
        disconnected_at: new Date()
      });
    }
    
    return {
      success: true,
      message: 'Desconexión de Poster completada'
    };
  } catch (error) {
    console.error('Error revocando acceso:', error);
    return {
      success: false,
      message: 'Error al desconectar la cuenta de Poster',
      error: error.message
    };
  }
}