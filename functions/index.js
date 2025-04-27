const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Inicializar Firebase Admin
admin.initializeApp();

// Función para sincronizar datos manualmente desde Poster
exports.syncPosterDataManual = functions.https.onCall(async (data, context) => {
  // Código simple de prueba
  return {
    success: true,
    message: 'Función de prueba desplegada correctamente',
    data: data,
    user: context.auth ? context.auth.uid : null
  };
});