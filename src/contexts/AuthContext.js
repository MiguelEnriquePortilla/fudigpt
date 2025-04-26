// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  onAuthStateChanged 
} from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Signup function
  async function signup(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Crear perfil inicial en Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      return userCredential.user;
    } catch (error) {
      console.error("Error en signup:", error);
      throw error;
    }
  }

  // Login function
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Actualizar último login
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLogin: serverTimestamp()
      });
      return userCredential.user;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    return signOut(auth);
  }

  // Reset password function
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Update email function
  async function updateEmail(email) {
    try {
      await firebaseUpdateEmail(currentUser, email);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        email: email
      });
    } catch (error) {
      console.error("Error actualizando email:", error);
      throw error;
    }
  }

  // Update password function
  function updatePassword(password) {
    return firebaseUpdatePassword(currentUser, password);
  }

  // Fetch user profile from Firestore
  async function fetchUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      } else {
        console.log("No se encontró perfil de usuario");
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      setUserProfile(null);
    }
  }

  // Effect to handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    isLoading,
    signup,
    login,
    logout,
    resetPassword,
    updateEmail,
    updatePassword,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}