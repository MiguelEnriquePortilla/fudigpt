# ADR-001: Integración con Poster POS

## Fecha: 2025-02-15

## Estado

Aceptada

## Contexto

FudiGPT necesita acceder a datos reales de los restaurantes para proporcionar respuestas e insights contextualizados. Los restaurantes utilizan sistemas POS (Point of Sale) para gestionar su operación diaria, y estos sistemas contienen datos valiosos sobre ventas, inventario, menús y más.

Necesitamos seleccionar un sistema POS inicial para integración que:
1. Sea utilizado por una cantidad significativa de restaurantes
2. Ofrezca una API robusta y bien documentada
3. Permita la sincronización regular de datos
4. Tenga buena presencia en América Latina

El acceso a estos datos debe ser seguro, confiable y minimizar la fricción para el usuario.

## Opciones Consideradas

### Opción 1: Integración directa con Poster POS

Implementar una integración directa con Poster POS utilizando su API REST y flujo de OAuth para autorización.

**Pros:**
- API bien documentada y estructurada
- Fuerte presencia en mercados objetivo
- Soporte para OAuth que facilita la autorización segura
- Exposición de datos completos (menú, inventario, transacciones)
- No requiere intermediarios

**Contras:**
- Dependencia de un solo proveedor de POS
- Requiere mantenimiento si la API de Poster cambia
- Necesidad de manejar tokens de autorización y su renovación
- La estructura de datos es específica de Poster

### Opción 2: Uso de un middleware de integración (como Brink POS Connect)

Utilizar un servicio intermediario que ya se integra con múltiples sistemas POS.

**Pros:**
- Una sola integración para múltiples sistemas POS
- Estructura de datos estandarizada
- Menos mantenimiento cuando cambian las APIs individuales

**Contras:**
- Costo adicional por el servicio intermediario
- Otra capa de complejidad y posibles puntos de fallo
- Posible limitación en el acceso a datos específicos
- Latencia adicional en la sincronización de datos

### Opción 3: Solución de carga manual de datos

Permitir a los restaurantes exportar datos de su POS y cargarlos manualmente en FudiGPT.

**Pros:**
- Sin limitaciones de integración técnica
- Funciona con cualquier sistema POS
- Sin necesidad de manejar autorizaciones externas

**Contras:**
- Alta fricción para el usuario
- Datos desactualizados rápidamente
- Inconsistencia en formatos de datos
- Contradicción con el valor principal de FudiGPT (funcionar con datos "tal como vienen")

## Decisión

Hemos decidido implementar la **Opción 1: Integración directa con Poster POS** por las siguientes razones:

1. Proporciona acceso directo a datos en tiempo real sin fricción para el usuario
2. Se alinea con nuestra propuesta de valor de trabajar con datos sin intervención manual
3. La API de Poster es robusta y bien documentada, reduciendo riesgos técnicos
4. Poster tiene una presencia significativa en nuestros mercados objetivo
5. El flujo OAuth proporciona un método seguro y estándar para la autorización

Esta decisión nos permite entregar la propuesta de valor central de FudiGPT: análisis contextualizado sobre datos reales del restaurante sin requerir limpieza o manipulación previa.

## Consecuencias

### Positivas

- Acceso inmediato a datos completos y actualizados del restaurante
- Experiencia de usuario fluida con mínima configuración
- Capacidad para proporcionar insights en tiempo real
- Alineación con la propuesta de valor principal del producto

### Negativas

- Limitación inicial a restaurantes que utilizan Poster POS
- Necesidad de mantener la integración cuando la API de Poster evolucione
- Gestión de tokens de autorización y su seguridad
- Dependencia de la disponibilidad del servicio de Poster

### Neutrales

- Necesidad de normalizar los datos específicos de Poster en nuestro modelo interno
- Requisito de documentación detallada del flujo de integración
- Posible necesidad de integraciones adicionales en el futuro

## Implementación

La implementación seguirá estos componentes principales:

1. **Servicio de Autorización OAuth**:
   - Implementación del flujo de autorización OAuth 2.0
   - Almacenamiento seguro de tokens en Firebase
   - Manejo de renovación de tokens

2. **Servicios de Sincronización**:
   - Funciones para obtener datos de productos, inventario y transacciones
   - Lógica de transformación para normalizar datos
   - Almacenamiento en estructura definida en Firestore

3. **Gestión de Errores**:
   - Estrategias de reintentos con backoff exponencial
   - Manejo de tokens expirados o revocados
   - Notificaciones al usuario sobre problemas de sincronización

4. **Interfaz de Usuario**:
   - Página de onboarding para iniciar la conexión
   - Indicadores de estado de sincronización
   - Controles para sincronización manual

## Referencias

- [Documentación de la API de Poster](https://dev.joinposter.com/docs/api)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Análisis de mercado de sistemas POS en LATAM](link-interno-al-documento)
- [Estructura de datos propuesta](link-interno-al-documento)

## Notas Adicionales

Aunque comenzamos con Poster, la arquitectura debe diseñarse pensando en futuras integraciones con otros sistemas POS. Los datos sincronizados deben normalizarse a un modelo interno que permita agregar más fuentes sin cambiar la lógica principal de la aplicación.