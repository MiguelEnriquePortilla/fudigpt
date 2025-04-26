// src/pages/OnboardingPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import posterConnector from '../services/poster/PosterConnector';
import { Restaurant } from '../models/Restaurant';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { signup, currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState({ inProgress: false, progress: 0 });
  
  // Formulario para información del restaurante
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Maneja cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRestaurantInfo({
      ...restaurantInfo,
      [name]: value
    });
  };

  // Alternar visibilidad de contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Función para validar el formulario
  const validateForm = () => {
    if (!restaurantInfo.name) {
      setError('El nombre del restaurante es obligatorio');
      return false;
    }
    if (!restaurantInfo.email) {
      setError('El email es obligatorio');
      return false;
    }
    if (!restaurantInfo.password) {
      setError('La contraseña es obligatoria');
      return false;
    }
    if (restaurantInfo.password !== restaurantInfo.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  // Registra al usuario y avanza al siguiente paso
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Crear cuenta de usuario
      const userCredential = await signup(restaurantInfo.email, restaurantInfo.password);
      
      // Guardar información inicial del restaurante en Firestore
      const restaurant = new Restaurant({
        name: restaurantInfo.name,
        address: restaurantInfo.address,
        phone: restaurantInfo.phone,
        email: restaurantInfo.email,
        userId: userCredential.uid,
      });
      
      await setDoc(doc(db, 'restaurants', userCredential.uid), restaurant.toFirestore());
      
      setSuccessMessage('Registro exitoso! Ahora vamos a conectar con Poster.');
      setCurrentStep(2);
    } catch (error) {
      setError('Error al registrar: ' + error.message);
      console.error('Error en registro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Inicia el proceso de autenticación con Poster
  const handleConnectPoster = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { authUrl } = await posterConnector.initiateAuth();
      
      // Abre la URL de autorización de Poster en una nueva ventana
      const authWindow = window.open(authUrl, 'PosterAuth', 'width=600,height=600');
      
      // Configurar listener para recibir el código de autorización
      window.addEventListener('message', handleAuthCallback, false);
      
      function handleAuthCallback(event) {
        // Verificar origen del mensaje por seguridad
        // En producción, asegúrate de verificar que el origen sea confiable
        
        if (event.data && event.data.type === 'poster_auth_callback') {
          authWindow.close();
          window.removeEventListener('message', handleAuthCallback);
          
          // Procesar el código de autorización
          processAuthCode(event.data.code);
        }
      }
    } catch (error) {
      setError('Error al conectar con Poster: ' + error.message);
      console.error('Error conectando con Poster:', error);
      setIsLoading(false);
    }
  };

  // Procesa el código de autorización recibido de Poster
  const processAuthCode = async (code) => {
    try {
      // Intercambiar código por tokens
      await posterConnector.handleAuthCallback(code);
      
      // Iniciar sincronización de datos
      setCurrentStep(3);
      setSyncStatus({ inProgress: true, progress: 10 });
      
      // Simular progreso de sincronización
      const interval = setInterval(() => {
        setSyncStatus(prev => {
          if (prev.progress >= 90) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 500);
      
      // Sincronizar datos desde Poster
      await posterConnector.syncData();
      
      setSyncStatus({ inProgress: true, progress: 100 });
      setTimeout(() => {
        setCurrentStep(4);
        setSyncStatus({ inProgress: false, progress: 0 });
      }, 500);
      
    } catch (error) {
      setError('Error al procesar autorización: ' + error.message);
      console.error('Error procesando autorización:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Finaliza el proceso de onboarding y redirige al chat
  const handleFinishOnboarding = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-xl">
        {/* Imagen de Fudi */}
        <div className="bg-blue-900 p-6 flex justify-center">
          <img 
            src="/My ChatGPT image.svg" 
            alt="Fudi Bot" 
            className="w-48 h-48"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"%3E%3Crect width="240" height="240" fill="%23152238"%3E%3C/rect%3E%3Crect x="60" y="60" width="120" height="80" fill="%2350E6FF" rx="10"%3E%3C/rect%3E%3Crect x="80" y="150" width="80" height="40" fill="%2350E6FF" rx="5"%3E%3C/rect%3E%3Crect x="90" y="80" width="20" height="20" fill="%23152238"%3E%3C/rect%3E%3Crect x="130" y="80" width="20" height="20" fill="%23152238"%3E%3C/rect%3E%3Cpath d="M 90 120 Q 120 140, 150 120" stroke="%23152238" stroke-width="6" fill="none"%3E%3C/path%3E%3Ctext x="115" y="175" font-size="20" text-anchor="middle" font-family="sans-serif" fill="%23FF3E89"%3Efudi%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
        
        {/* Título */}
        <div className="text-center pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-700">[join_FudiGPT™]</h2>
          <p className="text-sm text-gray-500 mt-1">Una visión inteligente de tu restaurante</p>
        </div>
        
        {/* Formulario o contenido según paso actual */}
        <div className="px-8 py-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          
          {successMessage && currentStep === 2 && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
              {successMessage}
            </div>
          )}
          
          {currentStep === 1 && (
            <form onSubmit={handleRegisterSubmit}>
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Email"
                    value={restaurantInfo.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Password"
                    value={restaurantInfo.password}
                    onChange={handleInputChange}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Confirm Password"
                    value={restaurantInfo.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Restaurant Name"
                    value={restaurantInfo.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? 'Registrando...' : 'SIGN UP'}
              </button>
              
              <div className="mt-4">
                <select
                  className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-500"
                >
                  <option value="">¿Qué rol tienes dentro de la organización?</option>
                  <option value="owner">Dueño</option>
                  <option value="manager">Gerente</option>
                  <option value="chef">Chef</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </form>
          )}
          
          {currentStep === 2 && (
            <div>
              <p className="text-gray-700 mb-4">
                Para obtener insights valiosos de tu restaurante, necesitamos conectarnos a tu cuenta de Poster POS.
              </p>
              <p className="text-gray-700 mb-4">
                Una vez conectados, sincronizaremos automáticamente tu menú, transacciones e inventario.
              </p>
              
              <button
                onClick={handleConnectPoster}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? 'Conectando...' : 'Conectar con Poster'}
              </button>
            </div>
          )}
          
          {currentStep === 3 && (
            <div>
              <p className="text-gray-700 mb-4 text-center">
                Estamos sincronizando tus datos desde Poster. Esto puede tomar unos momentos.
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${syncStatus.progress}%` }}
                ></div>
              </div>
              <p className="text-right text-sm text-gray-600 mb-4">{syncStatus.progress}%</p>
            </div>
          )}
          
          {currentStep === 4 && (
            <div>
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Integración exitosa</p>
                <p>Tu restaurante ha sido registrado y conectado con Poster.</p>
              </div>
              
              <p className="text-gray-700 mb-4">
                Hemos sincronizado tus datos correctamente y estamos listos para ayudarte a obtener insights valiosos para tu negocio.
              </p>
              
              <button
                onClick={handleFinishOnboarding}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Talk to Fudi
              </button>
            </div>
          )}
          
          {currentStep === 1 && (
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;