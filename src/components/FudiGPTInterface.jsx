import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ChefHat, User, Send, Menu, X, MessageSquare, PlusCircle, Moon, Sun, LogOut } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

// Componente principal de FudiGPT
const FudiGPTInterface = () => {
  // Acceder al contexto de tema
  const { isDark, toggleTheme } = useTheme();
  
  // Estados
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      content: '¡Bienvenido a FudiGPT! Soy tu asistente virtual especializado en gestión de restaurantes. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [inputRows, setInputRows] = useState(1);
  const maxRows = 5;

  // Ajustar altura del textarea
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Contar líneas
    const lines = e.target.value.split('\n').length;
    const calculatedRows = Math.min(lines, maxRows);
    setInputRows(calculatedRows);
  };

  // Simulación de envío de mensaje
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Agregar mensaje del usuario
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    setInputValue('');
    setInputRows(1);
    setIsLoading(true);
    setChatStarted(true);
    
    // Simular respuesta del asistente (después de 1-3 segundos)
    setTimeout(() => {
      let response;
      
      if (inputValue.toLowerCase().includes('venta')) {
        response = "Las ventas de la última semana aumentaron un 12.5% respecto a la semana anterior, alcanzando $45,782.50. El viernes fue tu mejor día con $9,876.30 en ventas. ¿Quieres ver el desglose por categoría de producto?";
      } else if (inputValue.toLowerCase().includes('inventario') || inputValue.toLowerCase().includes('stock')) {
        response = "Tengo 3 alertas de inventario para ti: El nivel de tomate está en 5kg (por debajo del mínimo de 15kg), la mozzarella está en 2kg (mínimo 8kg) y el aceite de oliva está en 1L (mínimo 5L). ¿Quieres generar una orden de compra automática?";
      } else if (inputValue.toLowerCase().includes('costo') || inputValue.toLowerCase().includes('gasto')) {
        response = "Los gastos representan el 68.5% de tus ventas totales en el último mes, un aumento del 14.2% respecto al mes anterior. La categoría con mayor incremento fue 'ingredientes frescos'. ¿Te gustaría un análisis detallado?";
      } else if (inputValue.toLowerCase().includes('menu') || inputValue.toLowerCase().includes('plato')) {
        response = "Basado en los datos del último trimestre, tus 3 platos más rentables son la 'Pasta Carbonara' (72% de margen), 'Ensalada César' (68% de margen) y 'Tiramisú' (65% de margen). Los productos con menor rotación son 'Sopa de mariscos', 'Risotto de hongos' y 'Tarta de espinacas'.";
      } else if (inputValue.toLowerCase().includes('ayuda') || inputValue.toLowerCase().includes('puedes hacer')) {
        response = `Puedo ayudarte con varias tareas relacionadas con tu restaurante:

- Analizar tendencias de ventas y comportamiento de clientes
- Gestionar y alertar sobre niveles de inventario
- Identificar tus productos más y menos rentables
- Ofrecer recomendaciones para reducir costos
- Generar pronósticos de demanda y ventas
- Sugerir estrategias de marketing basadas en datos
- Optimizar precios y composición del menú
- Monitorear indicadores clave de rendimiento (KPIs)

¿Sobre cuál de estos aspectos te gustaría saber más?`;
      } else {
        response = "Entiendo. Para ayudarte mejor con eso, ¿podrías darme más detalles sobre lo que buscas específicamente? Puedo mostrarte datos de ventas, inventario, costos o tendencias de rendimiento.";
      }
      
      const assistantMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setIsLoading(false);
    }, 1500 + Math.random() * 1500); // Entre 1.5 y 3 segundos
  };

  // Toggle para el sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Nueva conversación
  const startNewConversation = () => {
    setMessages([
      { 
        id: 1, 
        role: 'assistant', 
        content: '¡Bienvenido a FudiGPT! Soy tu asistente virtual especializado en gestión de restaurantes. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      }
    ]);
    setChatStarted(false);
    setInputValue('');
    setInputRows(1);
  };

  // Manejar tecla Enter para enviar (con Shift+Enter para nueva línea)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus en el input cuando se carga la página
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div 
        className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} 
          border-r transition-all duration-300 flex flex-col
          ${sidebarOpen ? 'w-64' : 'w-0 md:w-16'} overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && <h1 className={`text-xl font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>FudiGPT</h1>}
          <button 
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} 
            onClick={toggleSidebar}
          >
            {sidebarOpen ? 
              <X className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} /> : 
              <Menu className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            }
          </button>
        </div>
        
        {/* Nueva conversación */}
        <button 
          className={`mx-3 mb-2 flex items-center ${sidebarOpen ? 'justify-start' : 'justify-center md:justify-center'} 
            gap-2 px-3 py-2 rounded-lg border ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'} transition-colors mt-3`}
          onClick={startNewConversation}
        >
          <PlusCircle className="w-5 h-5" />
          {sidebarOpen && <span>Nueva conversación</span>}
        </button>
        
        {/* Navegación */}
        <nav className="mt-2 flex-1 overflow-y-auto">
          <button 
            className={`w-full flex items-center py-3 px-4 
              ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}
          >
            <MessageSquare className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3 text-sm font-medium">Mis conversaciones</span>}
          </button>
        </nav>
        
        {/* Footer del sidebar */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center`}>
                <ChefHat className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              {sidebarOpen && <span className="font-medium">Mi Restaurante</span>}
            </div>
            
            {sidebarOpen && (
              <div className="flex space-x-2">
                <button 
                  className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  onClick={toggleTheme}
                >
                  {isDark ? 
                    <Sun className="w-4 h-4 text-gray-400" /> : 
                    <Moon className="w-4 h-4 text-gray-500" />
                  }
                </button>
                <button className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <LogOut className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!chatStarted ? (
          // Pantalla inicial tipo Claude
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-center max-w-2xl">
              <div className={`w-24 h-24 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mx-auto mb-8 border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                <ChefHat className={`w-12 h-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              
              <h1 className={`text-3xl font-light mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                FudiGPT
              </h1>
              
              <p className={`text-lg mb-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Tu asistente virtual para gestión de restaurantes. Pregúntame sobre ventas, inventario, costos o cualquier aspecto de tu negocio.
              </p>
              
              {/* Cambia el diseño del input */}
              <div className={`${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-lg max-w-2xl mx-auto p-6 shadow-sm mb-12`}>
                <form onSubmit={handleSubmit} className="flex flex-col">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="¿Qué deseas saber sobre tu restaurante hoy?"
                    className={`w-full p-4 ${isDark ? 'bg-gray-800 text-gray-100 placeholder-gray-400' : 'bg-white text-gray-800 placeholder-gray-400'} 
                      rounded-md outline-none resize-none min-h-[60px] focus:ring-1 ${isDark ? 'focus:ring-gray-600' : 'focus:ring-gray-300'}`}
                    rows={inputRows}
                  />
                  <div className="flex justify-end mt-4">
                    <button 
                      type="submit"
                      disabled={inputValue.trim() === ''}
                      className={`px-4 py-2 rounded-md ${
                        inputValue.trim() === '' 
                          ? `${isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed` 
                          : `${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-700 hover:bg-gray-800'} text-white`
                      } flex items-center transition-colors duration-200`}
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Enviar
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4">
                <SuggestionButton isDark={isDark} onClick={() => setInputValue("¿Cómo van mis ventas esta semana?")}>
                  ¿Cómo van mis ventas esta semana?
                </SuggestionButton>
                <SuggestionButton isDark={isDark} onClick={() => setInputValue("¿Qué ingredientes están por agotarse?")}>
                  ¿Qué ingredientes están por agotarse?
                </SuggestionButton>
                <SuggestionButton isDark={isDark} onClick={() => setInputValue("¿Cuáles son mis platos más rentables?")}>
                  ¿Cuáles son mis platos más rentables?
                </SuggestionButton>
                <SuggestionButton isDark={isDark} onClick={() => setInputValue("Muestra un análisis de costos")}>
                  Muestra un análisis de costos
                </SuggestionButton>
              </div>
            </div>
          </div>
        ) : (
          // Interfaz de chat
          <>
            {/* Área de chat */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
              <div className="max-w-3xl mx-auto">
                {messages.map((message) => (
                  <MessageBubble 
                    key={message.id} 
                    message={message}
                    isDark={isDark}
                  />
                ))}
                
                {/* Indicador de carga */}
                {isLoading && (
                  <div className="flex justify-start mb-6">
                    <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mr-3 mt-1 flex-shrink-0`}>
                      <ChefHat className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    </div>
                    <div className={`px-4 py-3 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Formulario de entrada */}
            <div className={`fixed bottom-0 left-0 right-0 p-6 ${isDark ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-50 border-t border-gray-200'}`}>
              <form 
                onSubmit={handleSubmit}
                className="max-w-3xl mx-auto"
              >
                <div className="flex space-x-3">
                  <div className={`flex-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border rounded-lg shadow-sm flex items-center p-3`}>
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe tu consulta aquí..."
                      className={`flex-1 p-1 ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} outline-none resize-none min-h-[24px] placeholder-gray-400`}
                      rows={inputRows}
                    />
                    <button 
                      type="submit"
                      className={`p-2 rounded-full ${
                        inputValue.trim() && !isLoading
                          ? `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                          : `${isDark ? 'text-gray-600' : 'text-gray-400'} cursor-not-allowed`
                      }`}
                      disabled={!inputValue.trim() || isLoading}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>
              <div className={`text-xs text-center mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-3xl mx-auto`}>
                FudiGPT está optimizado para asistencia en gestión de restaurantes.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Componente para los botones de sugerencia
const SuggestionButton = ({ children, isDark, onClick }) => {
  return (
    <button 
      className={`px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
        isDark 
          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' 
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Componente para cada burbuja de mensaje
const MessageBubble = ({ message, isDark }) => {
  const isUser = message.role === 'user';
  
  // Formato de hora
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      {/* Avatar del Asistente (solo si no es usuario) */}
      {!isUser && (
        <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mr-3 mt-1 flex-shrink-0`}>
          <ChefHat className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </div>
      )}
      
      {/* Contenido del mensaje */}
      <div className={`px-5 py-4 rounded-lg ${
        isUser 
          ? isDark 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-700 text-white'
          : isDark
              ? 'bg-gray-800 text-gray-100 border border-gray-700'
              : 'bg-white border border-gray-200 text-gray-800'
      } max-w-[75%]`}>
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <MarkdownRenderer content={message.content} isDark={isDark} />
        )}
        <div className={`text-xs mt-2 ${
          isUser 
            ? 'text-gray-300' 
            : isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
      
      {/* Avatar del usuario (solo si es usuario) */}
      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center ml-3 mt-1 flex-shrink-0">
          <User className="w-6 h-6 text-gray-600" />
        </div>
      )}
    </div>
  );
};

export default FudiGPTInterface;