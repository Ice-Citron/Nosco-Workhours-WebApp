import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/firebase_config';
import { firestore } from '../firebase/firebase_config'; // Assuming you have Firestore set up

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDoc = await firestore.collection('users').doc(firebaseUser.uid).get();
          const userData = userDoc.data();
          
          const user = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || userData?.name,
            email: firebaseUser.email,
            role: userData?.role,
            profilePic: firebaseUser.photoURL || userData?.profilePic || '../assets/images/default-pfp.png'
          };
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password, role) => {
    try {
      setLoading(true);
      const { user: firebaseUser } = await auth.signInWithEmailAndPassword(email, password);
      
      await firestore.collection('users').doc(firebaseUser.uid).set({
        email: firebaseUser.email,
        role: role
      }, { merge: true });

      // The user state will be set by the onAuthStateChanged listener
    } catch (error) {
      console.error("Error logging in:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await auth.signOut();
      // The user state will be set to null by the onAuthStateChanged listener
    } catch (error) {
      console.error("Error logging out:", error);
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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