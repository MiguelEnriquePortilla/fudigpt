// src/pages/ChatPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ChatPage = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [activeConversation, setActiveConversation] = useState('new');

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
          content: '👋 ¡Hola! Soy Fudi, tu asistente virtual para gestión de restaurantes. Pregúntame sobre ventas, inventario, costos o cualquier aspecto de tu negocio.',
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
        content: '👋 ¡Hola! Soy Fudi, tu asistente virtual para gestión de restaurantes. Pregúntame sobre ventas, inventario, costos o cualquier aspecto de tu negocio.',
        timestamp: new Date()
      }
    ]);
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

    // Simular respuesta del bot
    setTimeout(() => {
      const botReply = {
        id: messages.length + 2,
        sender: 'bot',
        content: `Estoy procesando tu consulta sobre "${inputMessage}". En breve, esta integración se conectará con los datos reales de tu restaurante.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botReply]);
      setIsTyping(false);
    }, 1500);
  };

  // Función para manejar clicks en preguntas sugeridas
  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    // Opcionalmente, enviar el mensaje automáticamente
    // setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-cyan-400">FudiGPT</h1>
        </div>
        
        {/* Botón de nueva conversación */}
        <button
          onClick={handleNewConversation}
          className="m-4 p-3 bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-medium rounded-lg flex items-center justify-center transition-colors"
        >
          <span className="mr-2">+</span> Nueva conversación
        </button>
        
        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto py-2">
          <h2 className="px-4 py-2 text-xs text-gray-400 uppercase">Mis conversaciones</h2>
          {conversations.filter(conv => conv.id !== 'new').map(conversation => (
            <button
              key={conversation.id}
              onClick={() => setActiveConversation(conversation.id)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-700 ${activeConversation === conversation.id ? 'bg-gray-700' : ''}`}
            >
              <div className="truncate font-medium">{conversation.title}</div>
              <div className="text-xs text-gray-400">{conversation.date.toLocaleDateString()}</div>
            </button>
          ))}
        </div>
        
        {/* Información de usuario */}
        <div className="p-4 border-t border-gray-700 flex items-center">
          <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center mr-3">
            <span className="text-gray-900 font-bold">{currentUser?.email?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1">
            <div className="truncate">Mi Restaurante</div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-cyan-400"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <header className="py-3 px-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {activeConversation === 'new' ? 'Nueva conversación' : conversations.find(c => c.id === activeConversation)?.title}
          </h2>
        </header>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 1 && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-8 w-32 h-32">
                <img
                  src="/My ChatGPT image.svg"
                  alt="Fudi Bot"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"%3E%3Crect width="128" height="128" fill="%23152238"%3E%3C/rect%3E%3Crect x="32" y="32" width="64" height="40" fill="%2350E6FF" rx="5"%3E%3C/rect%3E%3Crect x="40" y="80" width="48" height="24" fill="%2350E6FF" rx="3"%3E%3C/rect%3E%3Crect x="45" y="42" width="10" height="10" fill="%23152238"%3E%3C/rect%3E%3Crect x="73" y="42" width="10" height="10" fill="%23152238"%3E%3C/rect%3E%3Cpath d="M 45 65 Q 64 75, 83 65" stroke="%23152238" stroke-width="3" fill="none"%3E%3C/path%3E%3Ctext x="64" y="93" font-size="12" text-anchor="middle" font-family="sans-serif" fill="%23FF3E89"%3Efudi%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold text-cyan-400 mb-2">FudiGPT</h2>
              <p className="text-gray-400 text-center max-w-md mb-8">
                Tu asistente virtual para gestión de restaurantes. Pregúntame sobre ventas, inventario, costos o cualquier aspecto de tu negocio.
              </p>
              
              {/* Preguntas sugeridas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                <button 
                  onClick={() => handleSuggestedQuestion("¿Cómo van mis ventas esta semana?")}
                  className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700"
                >
                  ¿Cómo van mis ventas esta semana?
                </button>
                <button 
                  onClick={() => handleSuggestedQuestion("¿Qué ingredientes están por agotarse?")}
                  className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700"
                >
                  ¿Qué ingredientes están por agotarse?
                </button>
                <button 
                  onClick={() => handleSuggestedQuestion("¿Cuáles son mis platos más rentables?")}
                  className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700"
                >
                  ¿Cuáles son mis platos más rentables?
                </button>
                <button 
                  onClick={() => handleSuggestedQuestion("Muestra un análisis de costos")}
                  className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700"
                >
                  Muestra un análisis de costos
                </button>
              </div>
            </div>
          )}
          
          {messages.length > 0 && messages.length !== 1 && (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-cyan-500 mr-3 flex-shrink-0 self-end">
                      <img
                        src="/My ChatGPT image.svg"
                        alt="Fudi"
                        className="w-full h-full rounded-full"
                      />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-purple-700'
                        : 'bg-cyan-500 text-gray-900'
                    }`}
                  >
                    <div className={message.sender === 'user' ? 'text-white' : 'text-gray-900'}>
                      {message.content}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-purple-300' : 'text-cyan-800'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-purple-600 ml-3 flex-shrink-0 self-end flex items-center justify-center">
                      <span className="text-white font-medium">
                        {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 mr-3 flex-shrink-0">
                    <img
                      src="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2350E6FF'%3E%3C/rect%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' alignment-baseline='middle' font-family='monospace' fill='%23152238'%3EF%3C/text%3E%3C/svg%3E"
                      alt="Fudi"
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  <div className="bg-cyan-500 text-gray-900 rounded-lg px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-800 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-800 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-800 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message input */}
        <div className="px-6 py-4 border-t border-gray-700">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="¿Qué deseas saber sobre tu restaurante hoy?"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-medium rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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