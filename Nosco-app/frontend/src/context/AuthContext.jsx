import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, firestore } from '../firebase/firebase_config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed. Firebase user:", firebaseUser);
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.data();
          
          const user = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || userData?.name || 'User',
            email: firebaseUser.email,
            role: userData?.role || 'worker',
            profilePic: firebaseUser.photoURL || userData?.profilePic || '../assets/images/default-pfp.png'
          };
          console.log("Setting user state:", user);
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        console.log("No firebase user, setting user state to null");
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password, role) => {
    try {
      console.log("Attempting login for email:", email, "with role:", role);
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        email: firebaseUser.email,
        role: role
      }, { merge: true });

      console.log("Login successful. Firebase user:", firebaseUser);
      // The user state will be set by the onAuthStateChanged listener
    } catch (error) {
      console.error("Error logging in:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("Attempting logout");
      setLoading(true);
      await signOut(auth);
      console.log("Logout successful");
      // The user state will be set to null by the onAuthStateChanged listener
    } catch (error) {
      console.error("Error logging out:", error);
      setLoading(false);
      throw error;
    }
  };

  const updateUserProfilePic = async (newProfilePicUrl) => {
    if (user) {
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, { profilePic: newProfilePicUrl }, { merge: true });
        
        setUser(prevUser => ({
          ...prevUser,
          profilePic: newProfilePicUrl
        }));
        
        localStorage.setItem('user', JSON.stringify({...user, profilePic: newProfilePicUrl}));
        console.log("Profile picture updated successfully");
      } catch (error) {
        console.error("Error updating profile picture:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserProfilePic }}>
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