// Página para manejar el callback de autenticación de Poster
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handlePosterAuthCallback } from '../services/poster/posterService';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState({ loading: true, message: 'Procesando autorización...' });
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // Si no hay usuario autenticado, redirigir al login
        if (!currentUser) {
          setStatus({ loading: false, error: 'Debes iniciar sesión para conectar Poster' });
          setTimeout(() => navigate('/'), 3000);
          return;
        }
        
        // Obtener código de autorización de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        
        if (!authCode) {
          setStatus({ loading: false, error: 'No se recibió código de autorización' });
          setTimeout(() => navigate('/'), 3000);
          return;
        }
        
        // Procesar código de autorización
        const result = await handlePosterAuthCallback(authCode, currentUser.uid);
        
        if (result.success) {
          setStatus({ loading: false, message: 'Conexión establecida correctamente' });
          setTimeout(() => navigate('/'), 2000);
        } else {
          setStatus({ loading: false, error: result.message });
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (error) {
        console.error('Error en callback de autenticación:', error);
        setStatus({ loading: false, error: 'Error procesando autorización' });
        setTimeout(() => navigate('/'), 3000);
      }
    };
    
    processAuthCallback();
  }, [currentUser, navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-100">
          Conexión con Poster
        </h1>
        
        {status.loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">{status.message}</p>
          </div>
        ) : status.error ? (
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-red-600 dark:text-red-400 mb-2">{status.error}</p>
            <p className="text-gray-500 dark:text-gray-400">Redirigiendo a la página principal...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <p className="text-green-600 dark:text-green-400 mb-2">{status.message}</p>
            <p className="text-gray-500 dark:text-gray-400">Redirigiendo a la página principal...</p>
          </div>
        )}
      </div>
    </div>
  );
}