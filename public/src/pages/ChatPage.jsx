// src/pages/ChatPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RefreshDataButton from '../components/RefreshDataButton';

const ChatPage = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [activeConversation, setActiveConversation] = useState('new');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataRefreshed, setDataRefreshed] = useState(false);

  // Simular historial de conversaciones
  const [conversations, setConversations] = useState([
    { id: 'new', title: 'Nueva conversación', date: new Date() }
  ]);

  // Inicializar primera conversación
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          id: 1, 
          sender: 'bot', 
          content: '👋 JOIN THE FUDIVERSE. Soy Fudi, tu Ai para gestión de restaurantes. Pregúntame sobre ventas, inventario, costos o cualquier aspecto de tu negocio.',
          timestamp: new Date()
        }
      ]);
    }
  }, [messages]);

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Desplazarse al mensaje más reciente cuando se añaden mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Crear nueva conversación
  const handleNewConversation = () => {
    const newConversation = {
      id: `conv-${Date.now()}`,
      title: 'Nueva conversación',
      date: new Date()
    };
    
    setConversations(prev => [newConversation, ...prev.filter(c => c.id !== 'new')]);
    setActiveConversation(newConversation.id);
    setMessages([
      { 
        id: 1, 
        sender: 'bot', 
        content: '👋 JOIN THE FUDIVERSE. Soy Fudi, tu Ai para gestión de restaurantes. Pregúntame sobre ventas, inventario, costos o cualquier aspecto de tu negocio.',
        timestamp: new Date()
      }
    ]);
    setSidebarOpen(false);
    setDataRefreshed(false);
  };

  // Manejar finalización de sincronización de datos
  const handleSyncComplete = (result) => {
    setDataRefreshed(true);
    
    // Notificar al usuario sobre la sincronización
    const syncMessage = {
      id: messages.length + 1,
      sender: 'bot',
      content: `✅ Datos sincronizados correctamente. Se actualizaron ${result.counts.products || 0} productos, ${result.counts.inventory || 0} ingredientes y ${result.counts.sales || 0} transacciones. Ahora puedes preguntar sobre la información más reciente.`,
      timestamp: new Date(),
      isSystem: true
    };
    
    setMessages(prev => [...prev, syncMessage]);
  };

  // Detectar si la consulta requiere datos frescos
  const detectNeedForFreshData = (query) => {
    const freshDataTerms = [
      'hoy', 'ayer', 'esta semana', 'este mes', 'actual', 'reciente', 'últimas',
      'últimos', 'nuevo', 'nueva', 'ahora', 'actual', 'recién', 'acabo de',
      'recent', 'acaba de', 'recently', 'actualizado', 'updated'
    ];
    
    const lowercaseQuery = query.toLowerCase();
    return freshDataTerms.some(term => lowercaseQuery.includes(term));
  };

  // Manejar envío de mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    // Añadir mensaje del usuario
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Actualizar título de la conversación
    if (messages.length <= 2 && activeConversation !== 'new') {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversation 
            ? {...conv, title: inputMessage.length > 25 ? inputMessage.substring(0, 25) + '...' : inputMessage}
            : conv
        )
      );
    }

    setSidebarOpen(false);

    // Detectar si la consulta podría requerir datos actualizados
    const needsFreshData = detectNeedForFreshData(inputMessage);

    // Simular respuesta del bot
    setTimeout(() => {
      // Si detectamos que necesita datos frescos y no se han refrescado en esta sesión
      if (needsFreshData && !dataRefreshed) {
        const freshDataMessage = {
          id: messages.length + 2,
          sender: 'bot',
          content: `Parece que estás preguntando sobre datos recientes. Para darte la información más actualizada, te recomendaría refrescar los datos de Poster usando el botón "Refrescar datos". Esto asegurará que estoy analizando la información más reciente de tu restaurante.`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, freshDataMessage]);
      } else {
        // Respuesta normal
        let botReply = `Estoy procesando tu consulta sobre "${inputMessage}".`;
        
        // Generar respuesta según el tipo de consulta
        if (inputMessage.toLowerCase().includes('venta')) {
          botReply = "Las ventas de la última semana aumentaron un 12.5% respecto a la semana anterior, alcanzando $45,782.50. El viernes fue tu mejor día con $9,876.30 en ventas. ¿Quieres ver el desglose por categoría de producto?";
        } else if (inputMessage.toLowerCase().includes('inventario') || inputMessage.toLowerCase().includes('stock')) {
          botReply = "Tengo 3 alertas de inventario para ti: El nivel de tomate está en 5kg (por debajo del mínimo de 15kg), la mozzarella está en 2kg (mínimo 8kg) y el aceite de oliva está en 1L (mínimo 5L). ¿Quieres generar una orden de compra automática?";
        } else if (inputMessage.toLowerCase().includes('costo') || inputMessage.toLowerCase().includes('gasto')) {
          botReply = "Los gastos representan el 68.5% de tus ventas totales en el último mes, un aumento del 14.2% respecto al mes anterior. La categoría con mayor incremento fue 'ingredientes frescos'. ¿Te gustaría un análisis detallado?";
        } else if (inputMessage.toLowerCase().includes('menu') || inputMessage.toLowerCase().includes('plato')) {
          botReply = "Basado en los datos del último trimestre, tus 3 platos más rentables son la 'Pasta Carbonara' (72% de margen), 'Ensalada César' (68% de margen) y 'Tiramisú' (65% de margen). Los productos con menor rotación son 'Sopa de mariscos', 'Risotto de hongos' y 'Tarta de espinacas'.";
        } else {
          botReply = "Entiendo. Para ayudarte mejor con eso, ¿podrías darme más detalles sobre lo que buscas específicamente? Puedo mostrarte datos de ventas, inventario, costos o tendencias de rendimiento.";
        }
        
        const botMessage = {
          id: messages.length + 2,
          sender: 'bot',
          content: botReply,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
      
      setIsTyping(false);
    }, 1500);
  };

  // Cerrar sidebar al hacer clic en una conversación
  const handleConversationSelect = (conversationId) => {
    setActiveConversation(conversationId);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Botón Hamburguesa para móviles */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white text-gray-800 rounded-lg border border-gray-300 flex items-center justify-center"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <div className={"w-64 bg-white flex flex-col border-r border-gray-200 md:relative fixed inset-y-0 left-0 transform " + 
           (sidebarOpen ? 'translate-x-0' : '-translate-x-full') + 
           " md:translate-x-0 transition-transform duration-300 ease-in-out z-40"}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">FudiGPT</h1>
        </div>
        
        {/* Botón de nueva conversación */}
        <button
          onClick={handleNewConversation}
          className="m-4 p-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg border border-gray-300 flex items-center justify-center transition-colors"
        >
          <span className="mr-2">+</span> Nueva conversación
        </button>
        
        {/* Botón de refrescar datos */}
        <div className="px-4 pb-2">
          <RefreshDataButton onSyncComplete={handleSyncComplete} />
        </div>
        
        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto py-2">
          <h2 className="px-4 py-2 text-xs text-gray-400 uppercase">Mis conversaciones</h2>
          {conversations.filter(conv => conv.id !== 'new').map(conversation => (
            <button
              key={conversation.id}
              onClick={() => handleConversationSelect(conversation.id)}
              className={"w-full px-4 py-2 text-left hover:bg-gray-100 " + 
                        (activeConversation === conversation.id ? 'bg-gray-100' : '')}
            >
              <div className="truncate font-medium">{conversation.title}</div>
              <div className="text-xs text-gray-400">{conversation.date.toLocaleDateString()}</div>
            </button>
          ))}
        </div>
        
        {/* Información de usuario */}
        <div className="p-4 border-t border-gray-200 flex items-center">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-3">
            <span className="text-white font-bold">{currentUser?.email?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1">
            <div className="truncate">Mi Restaurante</div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-green-500"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay para cerrar el sidebar */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <header className="py-3 px-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold ml-10 md:ml-0">
            {activeConversation === 'new' ? 'Nueva conversación' : conversations.find(c => c.id === activeConversation)?.title}
          </h2>
        </header>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 1 && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-8 w-32 h-32">
                <img
                  src="/images/fudigpt-logo.png"
                  alt="Fudi Bot"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">FudiGPT</h2>
              <p className="text-gray-600 text-center max-w-md mb-8">
                Tu asistente virtual para gestión de restaurantes. Pregúntame sobre ventas, inventario, costos o cualquier aspecto de tu negocio.
              </p>
              
              {/* Botón de refrescar datos en la vista inicial */}
              <div className="w-full max-w-md">
                <RefreshDataButton onSyncComplete={handleSyncComplete} />
              </div>
            </div>
          )}
          
          {messages.length > 0 && messages.length !== 1 && (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={"flex " + (message.sender === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full mr-3 flex-shrink-0 self-end">
                      <img
                        src="/images/fudigpt-face.png"
                        alt="Fudi"
                        className="w-full h-full rounded-full"
                      />
                    </div>
                  )}
                  
                  <div
                    className={"max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg " + 
                              (message.sender === 'user' 
                                ? 'bg-gray-100 text-gray-800' 
                                : message.isSystem
                                  ? 'bg-blue-50 text-blue-800'
                                  : 'bg-white border border-gray-200 text-gray-800')}
                  >
                    <div>
                      {message.content}
                    </div>
                    <div
                      className={"text-xs mt-1 text-gray-400"}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-green-500 ml-3 flex-shrink-0 self-end flex items-center justify-center">
                      <span className="text-white font-medium">
                        {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full mr-3 flex-shrink-0">
                    <img
                      src="/images/fudigpt-face.png"
                      alt="Fudi"
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  <div className="bg-white border border-gray-200 text-gray-800 rounded-lg px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message input */}
        <div className="px-6 py-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="¿Qué deseas saber sobre tu restaurante hoy?"
              className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg border border-gray-300 px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;