// src/services/poster/PosterAuthService.js
import { db, auth } from '../../firebase';
import axios from 'axios';

/**
 * Servicio que maneja toda la autenticación con Poster POS
 */
export class PosterAuthService {
  constructor() {
    this.clientId = process.env.REACT_APP_POSTER_CLIENT_ID;
    this.clientSecret = process.env.REACT_APP_POSTER_CLIENT_SECRET;
    this.redirectUri = process.env.REACT_APP_POSTER_REDIRECT_URI;
    this.tokenCollection = 'posterTokens';
  }
  
  /**
   * Inicia el flujo de OAuth con Poster
   */
  initiateOAuthFlow() {
    const authUrl = `https://joinposter.com/api/v2/auth?application_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code`;
    return { authUrl };
  }
  
  /**
   * Intercambia el código de autorización por tokens de acceso
   * @param {string} code - El código recibido del callback de OAuth
   */
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post('https://joinposter.com/api/v2/auth/token', {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
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
   */
  async storeTokens(tokens) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      await db.collection(this.tokenCollection).doc(currentUser.uid).set({
        ...tokens,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error guardando tokens:', error);
      throw new Error('No se pudieron almacenar los tokens. Por favor intenta nuevamente.');
    }
  }
  
  /**
   * Verifica si existen tokens válidos para el usuario
   * @param {string} userId - ID del usuario actual
   */
  async hasValidTokens(userId) {
    try {
      const doc = await db.collection(this.tokenCollection).doc(userId).get();
      
      if (!doc.exists) return false;
      
      const data = doc.data();
      // Verificar si los tokens están expirados
      if (data.expiresAt < Date.now()) {
        // Intentar refrescar los tokens
        const refreshed = await this.refreshTokens(data.refreshToken);
        return refreshed;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando tokens:', error);
      return false;
    }
  }
  
  /**
   * Obtiene los tokens almacenados
   */
  async getTokens() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const doc = await db.collection(this.tokenCollection).doc(currentUser.uid).get();
      
      if (!doc.exists) {
        throw new Error('No hay tokens almacenados');
      }
      
      const data = doc.data();
      
      // Verificar si necesitan refrescarse
      if (data.expiresAt < Date.now()) {
        await this.refreshTokens(data.refreshToken);
        return this.getTokens(); // Llamada recursiva para obtener tokens actualizados
      }
      
      return data;
    } catch (error) {
      console.error('Error obteniendo tokens:', error);
      throw new Error('No se pudieron obtener los tokens. Por favor reconecta tu cuenta de Poster.');
    }
  }
  
  /**
   * Refresca los tokens usando el refresh token
   * @param {string} refreshToken - Token de actualización
   */
  async refreshTokens(refreshToken) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const response = await axios.post('https://joinposter.com/api/v2/auth/refresh', {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      });
      
      const tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
        updatedAt: new Date()
      };
      
      await db.collection(this.tokenCollection).doc(currentUser.uid).update(tokens);
      
      return true;
    } catch (error) {
      console.error('Error refrescando tokens:', error);
      return false;
    }
  }
  
  /**
   * Revoca los tokens y elimina la conexión con Poster
   */
  async revokeTokens() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const doc = await db.collection(this.tokenCollection).doc(currentUser.uid).get();
      
      if (doc.exists) {
        // Intentar revocar en Poster
        try {
          const data = doc.data();
          await axios.post('https://joinposter.com/api/v2/auth/revoke', {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            token: data.accessToken
          });
        } catch (error) {
          console.warn('Error revocando tokens en Poster:', error);
          // Continuamos incluso si falla la revocación en Poster
        }
        
        // Eliminar tokens localmente
        await db.collection(this.tokenCollection).doc(currentUser.uid).delete();
      }
      
      return true;
    } catch (error) {
      console.error('Error revocando tokens:', error);
      throw new Error('Error al desconectar la cuenta de Poster.');
    }
  }
}