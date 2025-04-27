const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Usamos la aplicación de admin existente o la inicializamos si no existe
try {
  admin.app();
} catch (e) {
  admin.initializeApp();
}

/**
 * Función para sincronizar datos manualmente desde Poster
 */
exports.syncPosterDataManual = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debe estar autenticado para realizar esta acción'
    );
  }

  const { restaurantId } = data || {};
  
  // Si no se proporciona restaurantId, intentamos obtenerlo de los tokens existentes
  let targetRestaurantId = restaurantId;
  
  if (!targetRestaurantId) {
    try {
      // Intentar encontrar un token disponible
      const tokensSnapshot = await admin.firestore().collection('poster_tokens').limit(1).get();
      if (!tokensSnapshot.empty) {
        targetRestaurantId = tokensSnapshot.docs[0].id;
      } else {
        throw new functions.https.HttpsError(
          'not-found',
          'No se encontró ningún restaurante con token de Poster'
        );
      }
    } catch (error) {
      console.error("Error al buscar restaurante por defecto:", error);
      throw new functions.https.HttpsError(
        'internal',
        'Error al buscar restaurante: ' + error.message
      );
    }
  }

  try {
    // Registrar inicio de sincronización
    await admin.firestore().collection('fudi_logs').add({
      action: 'sync_poster_manual_initiated',
      userId: context.auth.uid,
      restaurantId: targetRestaurantId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Obtener token de acceso para el restaurante
    const tokenDoc = await admin.firestore().collection('poster_tokens').doc(targetRestaurantId).get();
    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'No se encontró token de acceso para este restaurante'
      );
    }

    const accessToken = tokenDoc.data().access_token;
    if (!accessToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Token de acceso no válido'
      );
    }

    // Ejecutar sincronización
    const result = await syncPosterData(targetRestaurantId, accessToken);

    // Registrar finalización exitosa
    await admin.firestore().collection('fudi_logs').add({
      action: 'sync_poster_manual_completed',
      userId: context.auth.uid,
      restaurantId: targetRestaurantId,
      result,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      message: 'Sincronización completada exitosamente',
      details: result
    };
  } catch (error) {
    console.error(`Error en sincronización manual para restaurante ${targetRestaurantId}:`, error);

    // Registrar error
    await admin.firestore().collection('fudi_logs').add({
      action: 'sync_poster_manual_error',
      userId: context.auth.uid,
      restaurantId: targetRestaurantId,
      error: error.message || 'Error desconocido',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    throw new functions.https.HttpsError(
      'internal',
      'Error al sincronizar datos: ' + error.message
    );
  }
});

/**
 * Función principal para sincronizar datos de Poster
 */
async function syncPosterData(restaurantId, accessToken) {
  try {
    const baseUrl = 'https://joinposter.com/api';
    
    // Configuración común para las peticiones a Poster
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'X-Auth': accessToken
      }
    };
    
    // 1. Sincronizar menú
    console.log("Obteniendo productos del menú...");
    const menuResponse = await axios.get(`${baseUrl}/menu.getProducts`, config);
    const menuItems = menuResponse.data.response;
    
    // 2. Sincronizar ventas (últimos 30 días)
    console.log("Obteniendo datos de ventas...");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFrom = formatDate(thirtyDaysAgo);
    const dateTo = formatDate(new Date());
    
    const salesResponse = await axios.get(
      `${baseUrl}/dash.getAnalytics?date_from=${dateFrom}&date_to=${dateTo}`, 
      config
    );
    const salesData = salesResponse.data.response;
    
    // 3. Sincronizar inventario
    console.log("Obteniendo datos de inventario...");
    const inventoryResponse = await axios.get(`${baseUrl}/storage.getInventory`, config);
    const inventoryData = inventoryResponse.data.response;
    
    // Almacenar datos en Firestore
    console.log("Almacenando datos en Firestore...");
    const results = await Promise.all([
      // Guardar productos del menú
      storeMenuItems(restaurantId, menuItems),
      
      // Guardar datos de ventas
      storeSalesData(restaurantId, salesData),
      
      // Guardar datos de inventario
      storeInventoryData(restaurantId, inventoryData)
    ]);
    
    // Actualizar timestamp de última sincronización
    await admin.firestore().collection('restaurants').doc(restaurantId).set({
      lastPosterSync: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    return { 
      menuItems: menuItems.length,
      salesData: Object.keys(salesData).length,
      inventoryItems: inventoryData.length
    };
  } catch (error) {
    console.error('Error sincronizando datos de Poster:', error);
    throw error;
  }
}

/**
 * Almacena los productos del menú en Firestore
 */
async function storeMenuItems(restaurantId, menuItems) {
  // Usamos un conjunto de operaciones en lote para eficiencia
  const batch = admin.firestore().batch();
  const menuCollection = admin.firestore().collection('poster_menu_items');
  
  // Crear un documento de control para esta operación
  const controlRef = admin.firestore().collection('sync_control').doc(`menu_${restaurantId}_${Date.now()}`);
  batch.set(controlRef, {
    restaurantId,
    operation: 'menu_sync',
    status: 'processing',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    itemCount: menuItems.length
  });
  
  // Procesar cada ítem del menú
  for (const item of menuItems) {
    // Usamos el ID del producto como parte del ID del documento para evitar duplicados
    const docRef = menuCollection.doc(`${restaurantId}_${item.product_id}`);
    
    batch.set(docRef, {
      restaurantId,
      posterId: item.product_id,
      name: item.product_name,
      price: parseFloat(item.price || 0),
      category: item.category_name,
      categoryId: item.category_id,
      photo: item.photo || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true }); // Usamos merge para actualizar en lugar de sobrescribir
  }
  
  // Actualizar el documento de control
  batch.update(controlRef, {
    status: 'completed',
    completedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Ejecutar todas las operaciones en una transacción
  await batch.commit();
  
  return menuItems.length;
}

/**
 * Almacena datos de ventas en Firestore
 */
async function storeSalesData(restaurantId, salesData) {
  // Crear un documento de control para esta operación
  const controlRef = admin.firestore().collection('sync_control').doc(`sales_${restaurantId}_${Date.now()}`);
  await controlRef.set({
    restaurantId,
    operation: 'sales_sync',
    status: 'processing',
    startedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  try {
    // Procesar y almacenar datos agregados por día
    const ventasCollection = admin.firestore().collection('ventas');
    
    // Procesar datos diarios si están disponibles
    if (salesData.day_revenue) {
      const batch = admin.firestore().batch();
      
      for (const [date, revenue] of Object.entries(salesData.day_revenue)) {
        const docRef = ventasCollection.doc(`${restaurantId}_${date}`);
        batch.set(docRef, {
          restaurantId,
          fecha: date,
          total: parseFloat(revenue || 0),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
      
      await batch.commit();
    }
    
    // Almacenar datos adicionales según sea necesario
    // Por ejemplo, ventas por categoría si están disponibles
    if (salesData.category_revenue) {
      const categoriesCollection = admin.firestore().collection('ventas_categorias');
      const batch = admin.firestore().batch();
      
      for (const [categoryId, revenue] of Object.entries(salesData.category_revenue)) {
        const docRef = categoriesCollection.doc(`${restaurantId}_${categoryId}`);
        batch.set(docRef, {
          restaurantId,
          categoriaId: categoryId,
          total: parseFloat(revenue || 0),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
      
      await batch.commit();
    }
    
    // Actualizar el documento de control
    await controlRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      dataPoints: Object.keys(salesData).length
    });
    
    return Object.keys(salesData).length;
  } catch (error) {
    // En caso de error, actualizar el documento de control
    await controlRef.update({
      status: 'error',
      error: error.message,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error;
  }
}

/**
 * Almacena datos de inventario en Firestore
 */
async function storeInventoryData(restaurantId, inventoryData) {
  // Crear un documento de control para esta operación
  const controlRef = admin.firestore().collection('sync_control').doc(`inventory_${restaurantId}_${Date.now()}`);
  await controlRef.set({
    restaurantId,
    operation: 'inventory_sync',
    status: 'processing',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    itemCount: inventoryData.length
  });
  
  try {
    const batch = admin.firestore().batch();
    const ingredientesCollection = admin.firestore().collection('ingredientes');
    
    // Procesamos cada ítem del inventario
    for (const item of inventoryData) {
      const docRef = ingredientesCollection.doc(`${restaurantId}_${item.ingredient_id}`);
      
      batch.set(docRef, {
        restaurantId,
        ingredientId: item.ingredient_id,
        nombre: item.ingredient_name,
        cantidad: parseFloat(item.storage || 0),
        unidad: item.unit,
        nivelMinimo: parseFloat(item.critical_storage || 0),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Crear alerta si el nivel está por debajo del crítico
      if (item.critical_storage && item.storage < item.critical_storage) {
        const alertRef = admin.firestore().collection('inventoryalerts').doc(`${restaurantId}_${item.ingredient_id}`);
        batch.set(alertRef, {
          restaurantId,
          ingredientId: item.ingredient_id,
          ingredientName: item.ingredient_name,
          currentLevel: parseFloat(item.storage || 0),
          minimumLevel: parseFloat(item.critical_storage || 0),
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }
    
    await batch.commit();
    
    // Actualizar el documento de control
    await controlRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return inventoryData.length;
  } catch (error) {
    // En caso de error, actualizar el documento de control
    await controlRef.update({
      status: 'error',
      error: error.message,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error;
  }
}

/**
 * Formatea una fecha en el formato YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Exportar la función programada (comentada por ahora)
/*
exports.scheduledPosterSync = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context) => {
    // Código de sincronización programada...
  });
*/