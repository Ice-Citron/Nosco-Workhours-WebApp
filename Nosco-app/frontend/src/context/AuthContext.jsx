import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, firestore } from '../firebase/firebase_config';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const functions = getFunctions();

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed. Firebase user:", firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (!userDocSnap.exists()) {
            console.error("User document doesn't exist");
            setUser(null);
            setAuthError("User data not found");
            setLoading(false);
            return;
          }

          const userData = userDocSnap.data();
          
          const user = {
            uid: firebaseUser.uid,
            name: userData?.name || 'User',
            email: firebaseUser.email,
            role: userData?.role || 'worker',
            profilePic: userData?.profilePic || '../assets/images/default-pfp.png',
            permissions: userData?.permissions || [],
            currentActiveProject: userData?.currentActiveProject || null,
          };
          
          console.log("Setting user state:", user);
          setUser(user);
          setAuthError(null);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          setAuthError("Error loading user data");
        }
      } else {
        console.log("No firebase user, setting user state to null");
        setUser(null);
        setAuthError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password, role) => {
    try {
      console.log("Attempting login for email:", email, "with role:", role);
      setLoading(true);
      setAuthError(null);
      
      // First, just try to log in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user document
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      
      // Verify role matches
      if (role && userData.role !== role) {
        await signOut(auth); // Sign out if role doesn't match
        throw new Error(`Invalid role. Please use the correct login for your role.`);
      }

      return userData;
    } catch (error) {
      console.error("Error logging in:", error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("Attempting logout");
      setLoading(true);
      await signOut(auth);
      console.log("Logout successful");
    } catch (error) {
      console.error("Error logging out:", error);
      setAuthError("Error during logout");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error: authError,
    login,
    logout,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};