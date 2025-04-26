// src/services/poster/PosterDataService.js
import { db, auth } from '../../firebase';
import axios from 'axios';

/**
 * Servicio que maneja todas las operaciones de datos con Poster POS
 */
export class PosterDataService {
  constructor() {
    this.apiBaseUrl = 'https://joinposter.com/api';
    this.syncCollection = 'posterSync';
    this.restaurantCollection = 'restaurants';
    this.menuCollection = 'menu';
    this.transactionsCollection = 'transactions';
    this.inventoryCollection = 'inventory';
  }

  /**
   * Realiza una llamada a la API de Poster
   * @param {string} endpoint - Endpoint de la API sin la URL base
   * @param {Object} tokens - Tokens de acceso
   * @param {Object} params - Parámetros para la llamada
   */
  async callPosterApi(endpoint, tokens, params = {}) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error llamando a la API de Poster (${endpoint}):`, error);
      throw new Error(`Error obteniendo datos de Poster: ${error.message}`);
    }
  }

  /**
   * Sincroniza información del restaurante desde Poster
   * @param {Object} tokens - Tokens de acceso
   */
  async syncRestaurantInfo(tokens) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');

    // Obtener información del spot (restaurante)
    const spotResponse = await this.callPosterApi('settings/spot', tokens);
    const spot = spotResponse.response;
    
    // Obtener información de la cuenta
    const accountResponse = await this.callPosterApi('access/account', tokens);
    const account = accountResponse.response;
    
    // Combinar y transformar datos al modelo común
    const restaurantData = {
      id: spot.id.toString(),
      name: spot.name,
      address: spot.address || '',
      phone: spot.phone || '',
      email: account.email || '',
      timezone: spot.timezone || '',
      country: spot.country || '',
      currency: spot.currency || '',
      posterAccountId: tokens.accountId,
      updatedAt: new Date(),
      userId: currentUser.uid
    };
    
    // Guardar en Firestore
    await db.collection(this.restaurantCollection).doc(currentUser.uid).set(restaurantData, { merge: true });
    
    return restaurantData;
  }

  /**
   * Sincroniza elementos del menú desde Poster
   * @param {Object} tokens - Tokens de acceso
   */
  async syncMenu(tokens) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    // Obtener categorías
    const categoriesResponse = await this.callPosterApi('menu/categories', tokens);
    const categories = categoriesResponse.response;
    
    // Obtener productos
    const productsResponse = await this.callPosterApi('menu/products', tokens);
    const products = productsResponse.response;
    
    // Transformar al modelo común
    const menuItems = products.map(product => ({
      id: product.product_id.toString(),
      name: product.product_name,
      description: product.product_description || '',
      price: parseFloat(product.price),
      categoryId: product.menu_category_id.toString(),
      categoryName: categories.find(c => c.category_id === product.menu_category_id)?.category_name || 'Sin categoría',
      imageUrl: product.photo_origin || '',
      isActive: product.hidden === 0,
      modifiers: [], // Se procesarían los modificadores si se requiere
      posterProductId: product.product_id,
      updatedAt: new Date(),
      userId: currentUser.uid
    }));
    
    // Guardar en Firestore (operación por lotes para mejor rendimiento)
    const batch = db.batch();
    
    // Primero, crear un documento maestro para el menú
    const menuRef = db.collection(this.menuCollection).doc(currentUser.uid);
    batch.set(menuRef, {
      userId: currentUser.uid,
      restaurantId: currentUser.uid,
      itemCount: menuItems.length,
      updatedAt: new Date()
    });
    
    // Luego, añadir cada elemento como subdocumento
    menuItems.forEach(item => {
      const itemRef = menuRef.collection('items').doc(item.id);
      batch.set(itemRef, item);
    });
    
    await batch.commit();
    
    return { itemCount: menuItems.length };
  }

  /**
   * Sincroniza transacciones recientes desde Poster
   * @param {Object} tokens - Tokens de acceso
   */
  async syncTransactions(tokens) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    // Obtener fecha de inicio (últimos 30 días por defecto)
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);
    
    // Obtener transacciones
    const ordersResponse = await this.callPosterApi('transactions', tokens, {
      date_from: Math.floor(dateFrom.getTime() / 1000),
      date_to: Math.floor(Date.now() / 1000)
    });
    
    const orders = ordersResponse.response;
    
    // Transformar al modelo común
    const transactions = orders.map(order => ({
      id: order.transaction_id.toString(),
      date: new Date(order.date_close * 1000), // Convertir timestamp Unix a Date
      amount: parseFloat(order.sum),
      status: order.status === 2 ? 'completed' : 'pending',
      paymentMethod: order.payment_method_name || 'No especificado',
      items: [], // Detalles que se obtendrían con una llamada adicional si se requiere
      posterTransactionId: order.transaction_id,
      updatedAt: new Date(),
      userId: currentUser.uid
    }));
    
    // Guardar en Firestore (operación por lotes)
    const batch = db.batch();
    
    // Documento maestro
    const transactionsRef = db.collection(this.transactionsCollection).doc(currentUser.uid);
    batch.set(transactionsRef, {
      userId: currentUser.uid,
      restaurantId: currentUser.uid,
      transactionCount: transactions.length,
      dateFrom: dateFrom,
      dateTo: new Date(),
      updatedAt: new Date()
    });
    
    // Subdocumentos para cada transacción
    transactions.forEach(transaction => {
      const transactionRef = transactionsRef.collection('items').doc(transaction.id);
      batch.set(transactionRef, transaction);
    });
    
    await batch.commit();
    
    return { transactionCount: transactions.length };
  }

  /**
   * Sincroniza datos de inventario desde Poster
   * @param {Object} tokens - Tokens de acceso
   */
  async syncInventory(tokens) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    // Obtener ingredientes
    const ingredientsResponse = await this.callPosterApi('storage/ingredients', tokens);
    const ingredients = ingredientsResponse.response;
    
    // Transformar al modelo común
    const inventoryItems = ingredients.map(ingredient => ({
      id: ingredient.ingredient_id.toString(),
      name: ingredient.ingredient_name,
      category: ingredient.category_name || 'Sin categoría',
      unit: ingredient.unit_name || 'unidad',
      stock: parseFloat(ingredient.storage_left) || 0,
      cost: parseFloat(ingredient.cost) || 0,
      posterIngredientId: ingredient.ingredient_id,
      updatedAt: new Date(),
      userId: currentUser.uid
    }));
    
    // Guardar en Firestore (operación por lotes)
    const batch = db.batch();
    
    // Documento maestro
    const inventoryRef = db.collection(this.inventoryCollection).doc(currentUser.uid);
    batch.set(inventoryRef, {
      userId: currentUser.uid,
      restaurantId: currentUser.uid,
      itemCount: inventoryItems.length,
      updatedAt: new Date()
    });
    
    // Subdocumentos por cada item
    inventoryItems.forEach(item => {
      const itemRef = inventoryRef.collection('items').doc(item.id);
      batch.set(itemRef, item);
    });
    
    await batch.commit();
    
    return { itemCount: inventoryItems.length };
  }

  /**
   * Actualiza el timestamp de la última sincronización
   */
  async updateLastSyncTimestamp() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    await db.collection(this.syncCollection).doc(currentUser.uid).set({
      lastSync: new Date(),
      userId: currentUser.uid
    });
    
    return { lastSync: new Date() };
  }

  /**
   * Verifica si se necesita sincronización
   * @param {number} maxAgeHours - Horas máximas desde la última sincronización
   */
  async needsSync(maxAgeHours = 24) {
    const currentUser = auth.currentUser;
    if (!currentUser) return true;
    
    try {
      const doc = await db.collection(this.syncCollection).doc(currentUser.uid).get();
      
      if (!doc.exists) return true;
      
      const data = doc.data();
      const lastSync = data.lastSync.toDate();
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceSync > maxAgeHours;
    } catch (error) {
      console.error('Error verificando sincronización:', error);
      return true;
    }
  }

  /**
   * Obtiene información del restaurante
   */
  async getRestaurantInfo() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    const doc = await db.collection(this.restaurantCollection).doc(currentUser.uid).get();
    
    if (!doc.exists) {
      throw new Error('No hay información de restaurante. Por favor sincroniza primero.');
    }
    
    return doc.data();
  }

  /**
   * Obtiene elementos del menú
   */
  async getMenu() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    const menuDoc = await db.collection(this.menuCollection).doc(currentUser.uid).get();
    
    if (!menuDoc.exists) {
      throw new Error('No hay información de menú. Por favor sincroniza primero.');
    }
    
    const itemsSnapshot = await menuDoc.ref.collection('items').get();
    const items = [];
    
    itemsSnapshot.forEach(doc => {
      items.push(doc.data());
    });
    
    return {
      ...menuDoc.data(),
      items
    };
  }

  /**
   * Obtiene transacciones con opciones de filtrado
   * @param {Object} filters - Filtros a aplicar
   */
  async getTransactions(filters = {}) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    const transactionsDoc = await db.collection(this.transactionsCollection).doc(currentUser.uid).get();
    
    if (!transactionsDoc.exists) {
      throw new Error('No hay información de transacciones. Por favor sincroniza primero.');
    }
    
    let query = transactionsDoc.ref.collection('items');
    
    // Aplicar filtros si existen
    if (filters.dateFrom) {
      query = query.where('date', '>=', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.where('date', '<=', filters.dateTo);
    }
    
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    // Ordenar por fecha descendente por defecto
    query = query.orderBy('date', 'desc');
    
    // Aplicar límite si existe
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    const snapshot = await query.get();
    const transactions = [];
    
    snapshot.forEach(doc => {
      transactions.push(doc.data());
    });
    
    return {
      ...transactionsDoc.data(),
      transactions
    };
  }

  /**
   * Obtiene datos de inventario
   */
  async getInventory() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');
    
    const inventoryDoc = await db.collection(this.inventoryCollection).doc(currentUser.uid).get();
    
    if (!inventoryDoc.exists) {
      throw new Error('No hay información de inventario. Por favor sincroniza primero.');
    }
    
    const itemsSnapshot = await inventoryDoc.ref.collection('items').get();
    const items = [];
    
    itemsSnapshot.forEach(doc => {
      items.push(doc.data());
    });
    
    return {
      ...inventoryDoc.data(),
      items
    };
  }
}