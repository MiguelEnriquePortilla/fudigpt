import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut as firebaseSignOut 
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Suscripción a cambios de estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Iniciar sesión anónimamente
  const signInAnon = async () => {
    return signInAnonymously(auth);
  };

  // Cerrar sesión
  const signOut = async () => {
    return firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    signInAnon,
    signOut,
    isAnonymous: currentUser?.isAnonymous
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}