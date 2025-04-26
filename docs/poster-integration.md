# Integración con Poster POS

Este directorio contiene la implementación de la integración con el sistema Poster POS, permitiendo a FudiGPT sincronizar datos directamente desde el sistema de gestión del restaurante.

## 📁 Estructura de Archivos

```
src/services/poster/
├── posterService.js     # Servicio principal con funciones para interactuar con Poster API
├── posterAuth.js        # Manejo del flujo de autenticación OAuth
├── posterSync.js        # Lógica de sincronización y transformación de datos
└── constants.js         # Constantes y endpoints de la API
```

## 🔄 Flujo de Integración

1. **Autorización**: El usuario inicia el flujo OAuth desde la página de Onboarding o Dashboard
2. **Autenticación**: Poster redirige de vuelta con un código que se intercambia por tokens
3. **Sincronización**: 
   - Sincronización inicial durante el onboarding
   - Sincronización automática al iniciar sesión (si han pasado >24h)
   - Sincronización manual desde el dashboard

4. **Almacenamiento**: Los datos se normalizan y guardan en Firestore en colecciones específicas

## 📊 Datos Sincronizados

| Tipo de Datos | Endpoint de Poster | Colección en Firestore | Frecuencia |
|---------------|-------------------|-----------------------|------------|
| Productos     | menu.getProducts  | poster_data/{restaurantId}/menu | Cada inicio de sesión |
| Inventario    | storage.getStorageInventory | poster_data/{restaurantId}/inventory | Cada inicio de sesión |
| Transacciones | transactions.getTransactions | poster_data/{restaurantId}/transactions | Cada inicio de sesión |

## 🛠️ Proceso de Configuración

### 1. Credenciales de Poster

Para configurar la integración, se necesitan las siguientes credenciales de Poster:

- Client ID
- Client Secret
- Redirect URI (configurada en Poster Developer Portal)

Estas se deben configurar en las variables de entorno:

```
REACT_APP_POSTER_CLIENT_ID=your_client_id
REACT_APP_POSTER_CLIENT_SECRET=your_client_secret
REACT_APP_POSTER_REDIRECT_URI=https://your-app.com/auth/poster/callback
```

### 2. Uso del Servicio

Ejemplo de inicialización del flujo OAuth:

```javascript
import { initiateOAuthFlow } from '../services/poster/posterAuth';

// En tu componente
const handleConnectPoster = () => {
  initiateOAuthFlow();
};
```

Ejemplo de sincronización manual:

```javascript
import { syncPosterData } from '../services/poster/posterSync';

// En tu componente
const handleSync = async () => {
  setIsSyncing(true);
  try {
    await syncPosterData(restaurantId);
    showNotification('Datos sincronizados correctamente');
  } catch (error) {
    showError('Error al sincronizar datos');
    console.error(error);
  } finally {
    setIsSyncing(false);
  }
};
```

## 🚀 Proceso de Desarrollo

1. **Entorno Local**:
   - Utilizar ngrok o similar para pruebas de OAuth
   - Configurar `REACT_APP_POSTER_REDIRECT_URI` con la URL de ngrok

2. **Testing**:
   - `npm run test:poster` ejecuta tests específicos de la integración
   - Utilizar mocks para los endpoints de Poster durante el desarrollo

3. **Despliegue**:
   - Actualizar las URL de redirección en el portal de desarrolladores de Poster
   - Verificar las variables de entorno en el entorno de producción

## 🔄 Manejo de Errores

El sistema implementa las siguientes estrategias para manejo de errores:

- **Token expirado**: Renovación automática con refresh token
- **API no disponible**: Retry con backoff exponencial (3 intentos)
- **Sincronización incompleta**: Almacenamiento de progreso parcial

## 📝 Notas Adicionales

- Los tokens se almacenan encriptados en Firestore
- La conexión debe renovarse cada 60 días según las políticas de Poster
- Se recomienda sincronizar transacciones con un máximo de 30 días de antigüedad

## 📚 Recursos Útiles

- [Documentación de Poster API](https://dev.joinposter.com/docs/api)
- [OAuth2 con Poster](https://dev.joinposter.com/docs/api/auth)
- [Endpoints de datos](https://dev.joinposter.com/docs/api/menu)