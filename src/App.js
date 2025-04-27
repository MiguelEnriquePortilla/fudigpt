// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import ChatPage from './pages/ChatPage';
import './App.css';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Verificación de variables de entorno - Solo para desarrollo
console.log("Variables de entorno cargadas:");
console.log("Firebase API Key:", process.env.REACT_APP_FIREBASE_API_KEY ? "✓ Configurada" : "✗ Falta");
console.log("Firebase Auth Domain:", process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? "✓ Configurada" : "✗ Falta");
console.log("Firebase Project ID:", process.env.REACT_APP_FIREBASE_PROJECT_ID ? "✓ Configurada" : "✗ Falta");
console.log("Firebase Storage Bucket:", process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? "✓ Configurada" : "✗ Falta");
console.log("Firebase Messaging Sender ID:", process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? "✓ Configurada" : "✗ Falta");
console.log("Firebase App ID:", process.env.REACT_APP_FIREBASE_APP_ID ? "✓ Configurada" : "✗ Falta");
console.log("Firebase Measurement ID:", process.env.REACT_APP_FIREBASE_MEASUREMENT_ID ? "✓ Configurada" : "✗ Falta");
console.log("Poster Client ID:", process.env.REACT_APP_POSTER_CLIENT_ID ? "✓ Configurada" : "✗ Falta");
console.log("Poster Client Secret:", process.env.REACT_APP_POSTER_CLIENT_SECRET ? "✓ Configurada" : "✗ Falta");
console.log("Poster Redirect URI:", process.env.REACT_APP_POSTER_REDIRECT_URI ? "✓ Configurada" : "✗ Falta");

// Componente para redireccionar si ya está autenticado
const RedirectIfAuthenticated = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    return <Navigate to="/chat" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Ruta raíz que redirige según estado de autenticación */}
            <Route 
              path="/" 
              element={
                <RouteSelector />
              } 
            />
            
            {/* Rutas públicas */}
            <Route 
              path="/login" 
              element={
                <RedirectIfAuthenticated>
                  <LoginPage />
                </RedirectIfAuthenticated>
              } 
            />
            
            <Route 
              path="/register" 
              element={
                <RedirectIfAuthenticated>
                  <OnboardingPage />
                </RedirectIfAuthenticated>
              } 
            />
            
            {/* Rutas protegidas */}
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Ruta para cualquier otra URL no definida */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

// Componente auxiliar para decidir a dónde redirigir desde la ruta raíz
const RouteSelector = () => {
  const { currentUser, isLoading } = useAuth();
  
  // Si está cargando la autenticación, mostrar algún indicador
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirigir según estado de autenticación
  if (currentUser) {
    return <Navigate to="/chat" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default App;