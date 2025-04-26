// src/models/MenuItem.js

/**
 * Modelo de datos común para elementos del menú independiente del proveedor
 * @class MenuItem
 */
export class MenuItem {
    /**
     * Constructor para el modelo MenuItem
     * @param {Object} data - Datos iniciales
     */
    constructor(data = {}) {
      this.id = data.id || '';
      this.name = data.name || '';
      this.description = data.description || '';
      this.price = data.price || 0;
      this.categoryId = data.categoryId || '';
      this.categoryName = data.categoryName || '';
      this.imageUrl = data.imageUrl || '';
      this.isActive = data.isActive !== undefined ? data.isActive : true;
      this.tags = data.tags || [];
      this.allergens = data.allergens || [];
      this.nutritionalInfo = data.nutritionalInfo || {};
      this.modifiers = data.modifiers || [];
      this.variants = data.variants || [];
      this.sortOrder = data.sortOrder || 0;
      
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
     * Convierte datos de Poster a formato común de MenuItem
     * @param {Object} posterData - Datos de producto de Poster
     * @param {string} categoryName - Nombre de categoría del producto
     * @param {string} userId - ID del usuario actual
     * @returns {MenuItem} Una instancia de MenuItem con datos de Poster
     */
    static fromPoster(posterData, categoryName, userId) {
      const menuItem = new MenuItem({
        id: posterData.posterProductId.toString(),
        name: posterData.name,
        description: posterData.description,
        price: posterData.price,
        categoryId: posterData.categoryId.toString(),
        categoryName: categoryName,
        imageUrl: posterData.imageUrl,
        isActive: posterData.isActive,
        modifiers: posterData.modifiers || [],
        userId: userId,
        restaurantId: userId, // Asumiendo que restaurantId es el mismo que userId por ahora
        updatedAt: new Date(),
        sourceSystem: 'poster',
        sourceId: posterData.posterProductId.toString(),
        sourceData: {
          posterProductId: posterData.posterProductId,
          // Otros datos específicos de Poster
        }
      });
      
      return menuItem;
    }
    
    /**
     * Convierte el modelo a un objeto plano para guardar en Firestore
     * @returns {Object} Objeto plano para Firestore
     */
    toFirestore() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        price: this.price,
        categoryId: this.categoryId,
        categoryName: this.categoryName,
        imageUrl: this.imageUrl,
        isActive: this.isActive,
        tags: this.tags,
        allergens: this.allergens,
        nutritionalInfo: this.nutritionalInfo,
        modifiers: this.modifiers,
        variants: this.variants,
        sortOrder: this.sortOrder,
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
     * @returns {MenuItem} Instancia de MenuItem
     */
    static fromFirestore(data) {
      return new MenuItem({
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      });
    }
  }