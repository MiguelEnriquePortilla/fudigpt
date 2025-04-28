// src/services/errorHandler.js
// Servicio centralizado para manejo de errores

/**
 * Función para manejar errores de API de forma consistente
 * @param {Error} error - Error original
 * @param {string} source - Fuente del error (ej: 'posterAuth', 'posterSync')
 * @param {string} operation - Operación que falló (ej: 'initiate', 'syncProducts')
 * @param {Object} details - Detalles adicionales relevantes
 * @returns {Object} Error formateado
 */
export function handleApiError(error, source, operation, details = {}) {
    // Registrar en consola para depuración
    console.error(`Error en ${source}.${operation}:`, error, details);
    
    // Determinar mensaje de error amigable
    let friendlyMessage;
    
    if (error.response) {
      // Error de respuesta de API
      const statusCode = error.response.status;
      
      switch (statusCode) {
        case 401:
          friendlyMessage = 'No autorizado. Por favor, reconecta tu cuenta de Poster.';
          break;
        case 403:
          friendlyMessage = 'Acceso denegado. Tu cuenta no tiene permisos suficientes.';
          break;
        case 404:
          friendlyMessage = 'Recurso no encontrado. Por favor, verifica la configuración.';
          break;
        case 429:
          friendlyMessage = 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          friendlyMessage = 'Error del servidor. Por favor, intenta de nuevo más tarde.';
          break;
        default:
          friendlyMessage = `Error de API (${statusCode}): ${error.response.data?.message || 'Error desconocido'}`;
      }
    } else if (error.request) {
      // No se recibió respuesta
      friendlyMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    } else {
      // Error al configurar la solicitud
      friendlyMessage = error.message || 'Error desconocido';
    }
    
    // Crear objeto de error estandarizado
    return {
      success: false,
      message: friendlyMessage,
      originalError: error.message,
      source,
      operation,
      details,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Función para manejar errores de Firestore de forma consistente
   * @param {Error} error - Error original
   * @param {string} source - Fuente del error
   * @param {string} operation - Operación que falló
   * @param {Object} details - Detalles adicionales relevantes
   * @returns {Object} Error formateado
   */
  export function handleFirestoreError(error, source, operation, details = {}) {
    console.error(`Error de Firestore en ${source}.${operation}:`, error, details);
    
    // Determinar mensaje de error amigable
    let friendlyMessage;
    
    switch (error.code) {
      case 'permission-denied':
        friendlyMessage = 'Permisos insuficientes para realizar esta operación.';
        break;
      case 'not-found':
        friendlyMessage = 'El documento no existe.';
        break;
      case 'already-exists':
        friendlyMessage = 'El documento ya existe.';
        break;
      case 'resource-exhausted':
        friendlyMessage = 'Se ha excedido la cuota de Firestore. Intenta más tarde.';
        break;
      case 'failed-precondition':
        friendlyMessage = 'No se cumplen las condiciones previas para esta operación.';
        break;
      case 'cancelled':
        friendlyMessage = 'La operación fue cancelada.';
        break;
      default:
        friendlyMessage = `Error de base de datos: ${error.message}`;
    }
    
    return {
      success: false,
      message: friendlyMessage,
      originalError: error.message,
      code: error.code,
      source,
      operation,
      details,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Función para registrar errores en Firestore
   * @param {Object} db - Referencia a Firestore
   * @param {string} userId - ID del usuario
   * @param {Object} errorInfo - Información del error
   */
  export async function logErrorToFirestore(db, userId, errorInfo) {
    try {
      const { collection, doc, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, 'users', userId, 'error_logs'), {
        ...errorInfo,
        logged_at: serverTimestamp()
      });
    } catch (logError) {
      // Si falla el registro de error, solo lo registramos en consola pero no elevamos este error
      console.error('Error al registrar error en Firestore:', logError);
    }
  }