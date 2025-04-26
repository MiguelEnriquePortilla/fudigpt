// src/services/poster/PosterConnector.js
import { db, auth } from '../../firebase';
import { PosterAuthService } from './PosterAuthService';
import { PosterDataService } from './PosterDataService';

/**
 * Clase principal que coordina toda la interacción con Poster POS
 * Actúa como fachada para los servicios específicos
 */
class PosterConnector {
  constructor() {
    this.authService = new PosterAuthService();
    this.dataService = new PosterDataService();
  }

  /**
   * Inicia el proceso de autenticación con Poster
   */
  async initiateAuth() {
    return this.authService.initiateOAuthFlow();
  }
  
  /**
   * Maneja la respuesta de autenticación de Poster
   * @param {string} code - Código de autorización de OAuth
   */
  async handleAuthCallback(code) {
    const tokens = await this.authService.exchangeCodeForTokens(code);
    await this.authService.storeTokens(tokens);
    return tokens;
  }
  
  /**
   * Verifica si el usuario actual está conectado a Poster
   */
  async isConnected() {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    return this.authService.hasValidTokens(currentUser.uid);
  }
  
  /**
   * Sincroniza los datos desde Poster a Firebase
   */
  async syncData() {
    if (!await this.isConnected()) {
      throw new Error('No hay conexión con Poster. Por favor autenticate primero.');
    }
    
    const tokens = await this.authService.getTokens();
    
    // Sincronizar datos secuencialmente para evitar límites de API
    await this.dataService.syncRestaurantInfo(tokens);
    await this.dataService.syncMenu(tokens);
    await this.dataService.syncTransactions(tokens);
    await this.dataService.syncInventory(tokens);
    
    // Actualizar timestamp de última sincronización
    await this.dataService.updateLastSyncTimestamp();
    
    return {
      success: true,
      lastSync: new Date().toISOString()
    };
  }
  
  /**
   * Obtiene información del restaurante
   */
  async getRestaurantInfo() {
    return this.dataService.getRestaurantInfo();
  }
  
  /**
   * Obtiene elementos del menú
   */
  async getMenu() {
    return this.dataService.getMenu();
  }
  
  /**
   * Obtiene transacciones recientes
   * @param {Object} filters - Opciones de filtrado
   */
  async getTransactions(filters = {}) {
    return this.dataService.getTransactions(filters);
  }
  
  /**
   * Desconecta la cuenta de Poster
   */
  async disconnect() {
    await this.authService.revokeTokens();
    return { success: true };
  }
}

// Exportar como singleton para uso consistente en toda la aplicación
const posterConnector = new PosterConnector();
export default posterConnector;