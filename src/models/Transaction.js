// src/models/Transaction.js

/**
 * Modelo de datos común para transacciones independiente del proveedor
 * @class Transaction
 */
export class Transaction {
    /**
     * Constructor para el modelo Transaction
     * @param {Object} data - Datos iniciales
     */
    constructor(data = {}) {
      this.id = data.id || '';
      this.date = data.date || new Date();
      this.amount = data.amount || 0;
      this.tax = data.tax || 0;
      this.tip = data.tip || 0;
      this.discount = data.discount || 0;
      this.status = data.status || 'completed'; // 'completed', 'pending', 'cancelled'
      this.paymentMethod = data.paymentMethod || '';
      this.tableNumber = data.tableNumber || '';
      this.waiterName = data.waiterName || '';
      this.customerName = data.customerName || '';
      this.notes = data.notes || '';
      
      // Artículos de la transacción
      this.items = data.items || [];
      
      this.userId = data.userId || '';
      this.restaurantId = data.restaurantId || '';
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = data.updatedAt || new Date();
      
      // Campos específicos según proveedor
      this.sourceSystem = data.sourceSystem || 'poster';
      this.sourceId = data.sourceId || '';
      this.sourceData = data.sourceData || {};
    }
    
    /**
     * Convierte datos de Poster a formato común de Transaction
     * @param {Object} posterData - Datos de transacción de Poster
     * @param {Array} items - Artículos detallados de la transacción
     * @param {string} userId - ID del usuario actual
     * @returns {Transaction} Una instancia de Transaction con datos de Poster
     */
    static fromPoster(posterData, items = [], userId) {
      const transaction = new Transaction({
        id: posterData.posterTransactionId.toString(),
        date: posterData.date instanceof Date ? posterData.date : new Date(posterData.date),
        amount: posterData.amount,
        status: posterData.status,
        paymentMethod: posterData.paymentMethod,
        items: items,
        userId: userId,
        restaurantId: userId, // Asumiendo que restaurantId es el mismo que userId por ahora
        updatedAt: new Date(),
        sourceSystem: 'poster',
        sourceId: posterData.posterTransactionId.toString(),
        sourceData: {
          posterTransactionId: posterData.posterTransactionId,
          // Otros datos específicos de Poster
        }
      });
      
      return transaction;
    }
    
    /**
     * Calcula el subtotal (sin impuestos, propinas, etc)
     * @returns {number} Subtotal de la transacción
     */
    getSubtotal() {
      return this.amount - this.tax - this.tip + this.discount;
    }
    
    /**
     * Calcula el total de artículos
     * @returns {number} Cantidad total de artículos
     */
    getTotalItems() {
      return this.items.reduce((total, item) => total + (item.quantity || 1), 0);
    }
    
    /**
     * Convierte el modelo a un objeto plano para guardar en Firestore
     * @returns {Object} Objeto plano para Firestore
     */
    toFirestore() {
      return {
        id: this.id,
        date: this.date,
        amount: this.amount,
        tax: this.tax,
        tip: this.tip,
        discount: this.discount,
        status: this.status,
        paymentMethod: this.paymentMethod,
        tableNumber: this.tableNumber,
        waiterName: this.waiterName,
        customerName: this.customerName,
        notes: this.notes,
        items: this.items,
        userId: this.userId,
        restaurantId: this.restaurantId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        sourceSystem: this.sourceSystem,
        sourceId: this.sourceId,
        sourceData: this.sourceData
      };
    }
    
    /**
     * Crea una instancia a partir de datos de Firestore
     * @param {Object} data - Datos de Firestore
     * @returns {Transaction} Instancia de Transaction
     */
    static fromFirestore(data) {
      return new Transaction({
        ...data,
        date: data.date?.toDate ? data.date.toDate() : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      });
    }
  }
  
  /**
   * Modelo para un artículo dentro de una transacción
   * @class TransactionItem
   */
  export class TransactionItem {
    /**
     * Constructor para el modelo TransactionItem
     * @param {Object} data - Datos iniciales
     */
    constructor(data = {}) {
      this.id = data.id || '';
      this.name = data.name || '';
      this.price = data.price || 0;
      this.quantity = data.quantity || 1;
      this.discount = data.discount || 0;
      this.categoryId = data.categoryId || '';
      this.categoryName = data.categoryName || '';
      this.modifiers = data.modifiers || [];
    }
    
    /**
     * Calcula el total para este artículo
     * @returns {number} Total calculado (precio * cantidad - descuento)
     */
    getTotal() {
      return (this.price * this.quantity) - this.discount;
    }
  }