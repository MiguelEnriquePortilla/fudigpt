// src/models/Restaurant.js

/**
 * Modelo de datos común para restaurantes independiente del proveedor de datos
 * @class Restaurant
 */
export class Restaurant {
    /**
     * Constructor para el modelo Restaurant
     * @param {Object} data - Datos iniciales
     */
    constructor(data = {}) {
      this.id = data.id || '';
      this.name = data.name || '';
      this.address = data.address || '';
      this.phone = data.phone || '';
      this.email = data.email || '';
      this.timezone = data.timezone || '';
      this.country = data.country || '';
      this.currency = data.currency || '';
      this.logoUrl = data.logoUrl || '';
      this.openingHours = data.openingHours || {};
      this.features = data.features || [];
      this.userId = data.userId || '';
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = data.updatedAt || new Date();
      
      // Campos específicos según proveedor - mantenidos para compatibilidad
      // pero no utilizados directamente por el core
      this.sourceSystem = data.sourceSystem || 'poster'; // 'poster', 'manual', etc.
      this.sourceId = data.sourceId || '';
      this.sourceData = data.sourceData || {}; // Datos específicos del proveedor
    }
    
    /**
     * Convierte datos de Poster a formato común de Restaurant
     * @param {Object} posterData - Datos obtenidos de la API de Poster
     * @param {string} userId - ID del usuario actual
     * @returns {Restaurant} Una instancia de Restaurant con datos de Poster
     */
    static fromPoster(posterData, userId) {
      const restaurant = new Restaurant({
        id: userId, // Usamos el userId como id del restaurante por ahora
        name: posterData.name,
        address: posterData.address,
        phone: posterData.phone,
        email: posterData.email,
        timezone: posterData.timezone,
        country: posterData.country,
        currency: posterData.currency,
        userId: userId,
        updatedAt: new Date(),
        sourceSystem: 'poster',
        sourceId: posterData.posterAccountId.toString(),
        sourceData: { 
          posterAccountId: posterData.posterAccountId,
          // Otros datos específicos de Poster que queramos conservar
        }
      });
      
      return restaurant;
    }
    
    /**
     * Convierte el modelo a un objeto plano para guardar en Firestore
     * @returns {Object} Objeto plano para Firestore
     */
    toFirestore() {
      return {
        id: this.id,
        name: this.name,
        address: this.address,
        phone: this.phone,
        email: this.email,
        timezone: this.timezone,
        country: this.country,
        currency: this.currency,
        logoUrl: this.logoUrl,
        openingHours: this.openingHours,
        features: this.features,
        userId: this.userId,
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
     * @returns {Restaurant} Instancia de Restaurant
     */
    static fromFirestore(data) {
      return new Restaurant({
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      });
    }
  }