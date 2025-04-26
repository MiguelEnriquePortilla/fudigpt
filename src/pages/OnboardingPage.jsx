// src/pages/OnboardingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Maneja cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRestaurantInfo({
      ...restaurantInfo,
      [name]: value
    });
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

  // Renderizar paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderRegistrationForm();
      case 2:
        return renderPosterConnection();
      case 3:
        return renderSyncProgress();
      case 4:
        return renderSuccess();
      default:
        return renderRegistrationForm();
    }
  };

  // Paso 1: Formulario de registro
  const renderRegistrationForm = () => (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">JOIN THE FUDIVERSE</h2>
      <p className="text-gray-600 mb-6 text-center">Convierte los datos de tu restaurante en insights accionables con IA</p>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleRegisterSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Nombre del Restaurante *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={restaurantInfo.name}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
            Dirección
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={restaurantInfo.address}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={restaurantInfo.phone}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={restaurantInfo.email}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Contraseña *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={restaurantInfo.password}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Confirmar Contraseña *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={restaurantInfo.confirmPassword}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            {isLoading ? 'Registrando...' : 'Registrar Restaurante'}
          </button>
        </div>
      </form>
    </div>
  );

  // Paso 2: Conexión con Poster
  const renderPosterConnection = () => (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Conectar con Poster POS</h2>
      
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{successMessage}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          Para obtener insights valiosos de tu restaurante, necesitamos conectarnos a tu cuenta de Poster POS.
        </p>
        <p className="text-gray-700 mb-4">
          Una vez conectados, sincronizaremos automáticamente tu menú, transacciones e inventario.
        </p>
      </div>
      
      <button
        onClick={handleConnectPoster}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
      >
        {isLoading ? 'Conectando...' : 'Conectar con Poster'}
      </button>
    </div>
  );

  // Paso 3: Progreso de sincronización
  const renderSyncProgress = () => (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Sincronizando Datos</h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4 text-center">
          Estamos sincronizando tus datos desde Poster. Esto puede tomar unos momentos.
        </p>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${syncStatus.progress}%` }}
          ></div>
        </div>
        <p className="text-right text-sm text-gray-600 mt-1">{syncStatus.progress}%</p>
      </div>
    </div>
  );

  // Paso 4: Éxito
  const renderSuccess = () => (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">¡Bienvenido al FUDIVERSE!</h2>
      
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        <p className="font-bold">Integración exitosa</p>
        <p>Tu restaurante ha sido registrado y conectado con Poster.</p>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          Hemos sincronizado tus datos correctamente y estamos listos para ayudarte a obtener insights valiosos para tu negocio.
        </p>
      </div>
      
      <button
        onClick={handleFinishOnboarding}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
      >
        Talk to Fudi
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">FUDIVERSE</h1>
        <p className="text-lg text-gray-600">Potencia tu restaurante con inteligencia artificial</p>
      </div>
      
      {/* Indicador de pasos */}
      <div className="max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>
              1
            </div>
            <div className="text-xs mt-1">Registro</div>
          </div>
          
          <div className={`flex-grow border-t ${currentStep >= 2 ? 'border-blue-600' : 'border-gray-400'} mx-2`}></div>
          
          <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>
              2
            </div>
            <div className="text-xs mt-1">Conexión</div>
          </div>
          
          <div className={`flex-grow border-t ${currentStep >= 3 ? 'border-blue-600' : 'border-gray-400'} mx-2`}></div>
          
          <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>
              3
            </div>
            <div className="text-xs mt-1">Sincronización</div>
          </div>
          
          <div className={`flex-grow border-t ${currentStep >= 4 ? 'border-blue-600' : 'border-gray-400'} mx-2`}></div>
          
          <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${currentStep >= 4 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>
              4
            </div>
            <div className="text-xs mt-1">Listo</div>
          </div>
        </div>
      </div>
      
      {renderStep()}
    </div>
  );
};

export default OnboardingPage;