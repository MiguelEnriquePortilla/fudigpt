// src/services/poster/posterAuth.js
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import axios from 'axios';
import { 
  POSTER_AUTH_URL, 
  POSTER_API_URL,
  POSTER_APP_ID, 
  POSTER_APP_SECRET, 
  POSTER_REDIRECT_URI,
  COLLECTION_USERS,
  COLLECTION_INTEGRATION,
  COLLECTION_POSTER,
  getPosterIntegrationPath
} from './constants';
import { handleApiError, handleFirestoreError, logErrorToFirestore } from '../errorHandler';

/**
 * Inicia el flujo de OAuth con Poster
 */
export function initiatePosterAuth() {
  const authUrl = `${POSTER_AUTH_URL}?application_id=${POSTER_APP_ID}&redirect_uri=${encodeURIComponent(POSTER_REDIRECT_URI)}&response_type=code`;
  window.location.href = authUrl;
}

/**
 * Maneja el callback de autorización de Poster
 * @param {string} code - Código de autorización
 * @param {string} userId - ID del usuario
 */
export async function handlePosterAuthCallback(code, userId) {
  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeTokens(tokens, userId);
    return {
      success: true,
      message: 'Conexión con Poster establecida correctamente'
    };
  } catch (error) {
    return handleApiError(error, 'posterAuth', 'handlePosterAuthCallback', { userId });
  }
}

/**
 * Intercambia el código de autorización por tokens de acceso
 * @param {string} code - El código recibido del callback de OAuth
 */
async function exchangeCodeForTokens(code) {
  try {
    const response = await axios.post(`${POSTER_API_URL}/auth/token`, {
      application_id: POSTER_APP_ID,
      application_secret: POSTER_APP_SECRET,
      code,
      redirect_uri: POSTER_REDIRECT_URI
    });
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
      accountId: response.data.account_id
    };
  } catch (error) {
    throw handleApiError(error, 'posterAuth', 'exchangeCodeForTokens');
  }
}

/**
 * Almacena tokens en Firebase
 * @param {Object} tokens - Tokens obtenidos de Poster
 * @param {string} userId - ID del usuario
 */
async function storeTokens(tokens, userId) {
  try {
    const docPath = getPosterIntegrationPath(userId);
    await setDoc(doc(db, docPath), {
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
    // Registrar error en Firestore para monitoreo
    await logErrorToFirestore(db, userId, handleFirestoreError(error, 'posterAuth', 'storeTokens', { userId }));
    throw handleFirestoreError(error, 'posterAuth', 'storeTokens', { userId });
  }
}

/**
 * Verifica el estado de la conexión con Poster
 * @param {string} userId - ID del usuario
 */
export async function checkPosterConnection(userId) {
  try {
    const docPath = getPosterIntegrationPath(userId);
    const posterDoc = await getDoc(doc(db, docPath));

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
      syncInProgress: posterData.sync_in_progress === true,
      syncCounts: posterData.sync_counts || {}
    };
  } catch (error) {
    return handleFirestoreError(error, 'posterAuth', 'checkPosterConnection', { userId });
  }
}

/**
 * Refresca los tokens usando el refresh token
 * @param {string} refreshToken - Token de actualización
 * @param {string} userId - ID del usuario
 */
async function refreshTokens(refreshToken, userId) {
  try {
    const response = await axios.post(`${POSTER_API_URL}/auth/refresh`, {
      grant_type: 'refresh_token',
      application_id: POSTER_APP_ID,
      application_secret: POSTER_APP_SECRET,
      refresh_token: refreshToken
    });
    
    const tokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: new Date(Date.now() + response.data.expires_in * 1000).toISOString(),
      updated_at: new Date()
    };
    
    const docPath = getPosterIntegrationPath(userId);
    await updateDoc(doc(db, docPath), tokens);
    
    return true;
  } catch (error) {
    throw handleApiError(error, 'posterAuth', 'refreshTokens', { userId });
  }
}

/**
 * Obtiene los tokens de acceso para un usuario
 * @param {string} userId - ID del usuario
 */
export async function getPosterTokens(userId) {
  try {
    const docPath = getPosterIntegrationPath(userId);
    const posterDoc = await getDoc(doc(db, docPath));
    
    if (!posterDoc.exists()) {
      throw new Error('No hay tokens almacenados');
    }
    
    const data = posterDoc.data();
    
    // Verificar si necesitan refrescarse
    if (new Date(data.expires_at) < new Date()) {
      await refreshTokens(data.refresh_token, userId);
      // Llamada recursiva para obtener tokens actualizados
      return getPosterTokens(userId);
    }
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at)
    };
  } catch (error) {
    throw handleApiError(error, 'posterAuth', 'getPosterTokens', { userId });
  }
}

/**
 * Revoca los tokens y elimina la conexión con Poster
 * @param {string} userId - ID del usuario
 */
export async function revokePosterAccess(userId) {
  try {
    const docPath = getPosterIntegrationPath(userId);
    const posterDoc = await getDoc(doc(db, docPath));
    
    if (posterDoc.exists()) {
      const data = posterDoc.data();
      
      // Intentar revocar en Poster
      try {
        await axios.post(`${POSTER_API_URL}/auth/revoke`, {
          application_id: POSTER_APP_ID,
          application_secret: POSTER_APP_SECRET,
          token: data.access_token
        });
      } catch (error) {
        console.warn('Error revocando tokens en Poster:', error);
        // Continuamos incluso si falla la revocación en Poster
      }
      
      // Marcar como desconectado pero mantener el registro
      await updateDoc(doc(db, docPath), {
        connected: false,
        disconnected_at: new Date()
      });
    }
    
    return {
      success: true,
      message: 'Desconexión de Poster completada'
    };
  } catch (error) {
    return handleApiError(error, 'posterAuth', 'revokePosterAccess', { userId });
  }
}

// Compatibilidad con código existente
export const checkConnection = checkPosterConnection;
export const getTokens = getPosterTokens;
export const initiateAuth = initiatePosterAuth;
export const handleAuthCallback = handlePosterAuthCallback;
export const revokeAccess = revokePosterAccess;