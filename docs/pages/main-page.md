# Página Principal (ChatPage)

Esta carpeta contiene los componentes de la página principal de FudiGPT, donde ocurre la interacción central entre el usuario y el asistente AI.

## 🎯 Objetivo

Proporcionar una interfaz conversacional intuitiva donde los restauranteros puedan interactuar con el asistente AI, hacer preguntas sobre su negocio y recibir insights valiosos basados en los datos sincronizados de Poster.

## 📁 Estructura de Archivos

```
src/pages/chat/
├── ChatPage.jsx              # Contenedor principal de la página de chat
├── MessageList.jsx           # Componente para mostrar la lista de mensajes
├── MessageInput.jsx          # Componente para entrada de mensajes del usuario
├── SuggestionChips.jsx       # Chips con sugerencias de preguntas comunes
├── ThinkingIndicator.jsx     # Indicador de "pensando" mientras se genera respuesta
├── DataStatusBar.jsx         # Barra de estado sobre la frescura de los datos
├── ChatContext.jsx           # Contexto para manejar el estado de la conversación
└── styles.module.css         # Estilos específicos de la página de chat
```

## 🧩 Componentes Principales

### ChatPage

Componente principal que organiza la interfaz de chat:

```jsx
// Ejemplo de uso
import ChatPage from './ChatPage';

function App() {
  return (
    <Router>
      <Route path="/chat" element={<ChatPage />} />
    </Router>
  );
}
```

### MessageList

Muestra la conversación entre el usuario y el asistente:

```jsx
// Ejemplo de uso
import { MessageList } from './MessageList';

function ChatComponent({ messages }) {
  return (
    <div className="chat-container">
      <MessageList 
        messages={messages}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### MessageInput

Componente para que el usuario ingrese sus preguntas:

```jsx
// Ejemplo de uso
import { MessageInput } from './MessageInput';

function ChatComponent() {
  const handleSend = (message) => {
    // Procesar el mensaje
  };
  
  return (
    <MessageInput 
      onSend={handleSend}
      placeholder="¿Qué deseas saber sobre tu restaurante hoy?"
      isDisabled={isLoading}
    />
  );
}
```

### SuggestionChips

Muestra chips con sugerencias de preguntas frecuentes:

```jsx
// Ejemplo de uso
import { SuggestionChips } from './SuggestionChips';

function ChatComponent() {
  const suggestions = [
    "¿Cómo van mis ventas esta semana?",
    "¿Qué ingredientes están por agotarse?",
    "¿Cuáles son mis platos más rentables?"
  ];
  
  const handleSelectSuggestion = (suggestion) => {
    // Usar la sugerencia seleccionada
  };
  
  return (
    <SuggestionChips 
      suggestions={suggestions}
      onSelect={handleSelectSuggestion}
    />
  );
}
```

### DataStatusBar

Muestra información sobre la frescura de los datos sincronizados de Poster:

```jsx
// Ejemplo de uso
import { DataStatusBar } from './DataStatusBar';

function ChatComponent() {
  const handleSyncData = () => {
    // Iniciar sincronización manual
  };
  
  return (
    <DataStatusBar 
      lastSyncTime={lastSyncTime}
      dataFreshness="recent" // "recent", "moderate", "outdated"
      onSyncRequest={handleSyncData}
    />
  );
}
```

## 🔄 Flujo de Datos

1. **Ingreso de Pregunta**: El usuario escribe una pregunta o selecciona una sugerencia
2. **Procesamiento**: 
   - Se envía la pregunta al servicio de AI
   - El servicio consulta datos sincronizados de Poster en Firestore
   - Se genera una respuesta contextualizada
3. **Visualización**: Se muestra la respuesta en el historial de mensajes
4. **Interacción Continua**: El usuario puede hacer preguntas adicionales

![Diagrama de Flujo de Datos](../../docs/assets/chat-data-flow.png)

## 🎨 Principios de Diseño UI/UX

- **Simplicidad**: Interfaz minimalista centrada en la conversación
- **Contexto Visible**: Estado de datos y opciones de sincronización accesibles
- **Respuestas Enriquecidas**: Soporte para respuestas con formato, tablas y gráficos simples
- **Continuidad**: Las conversaciones se mantienen entre sesiones
- **Ayuda Proactiva**: Sugerencias contextuales basadas en el estado del restaurante

## 🧪 Testing

Para ejecutar las pruebas específicas de la página de chat:

```bash
npm run test:chat
```

## 📊 Integración con Datos de Poster

La página de chat está diseñada para trabajar con los datos sincronizados de Poster:

- Verifica automáticamente la frescura de los datos al cargar
- Sugiere sincronización si los datos tienen más de 24 horas
- Permite actualización manual desde la interfaz
- Adapta las respuestas al contexto actual de los datos disponibles

## 📝 Notas de Implementación

- Se utiliza un enfoque de "streaming" para mostrar respuestas progresivamente
- Las respuestas incluyen referencias a las fuentes de datos utilizadas
- Se implementa manejo de errores gracioso cuando faltan datos
- Soporte para modo oscuro/claro según preferencias del usuario

## 🚀 Optimizaciones de Rendimiento

- Virtualización para listas de mensajes largas
- Carga diferida de gráficos y elementos visuales
- Caché local de respuestas frecuentes
- Prefetching de datos comúnmente consultados

## 📚 Recursos Relacionados

- [Diseños en Figma](https://figma.com/file/your-design-file)
- [Documentación del servicio AI](../../docs/ai-service.md)
- [Guía de UX conversacional](../../docs/conversational-ux.md)