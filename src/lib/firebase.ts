import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, initializeFirestore, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { useState, useEffect } from 'react';

export const app = initializeApp(firebaseConfig);

// Use initializeFirestore with long-polling setting to guarantee robust connection in sandboxed iframe or VPN/proxy networks
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId); // CRITICAL

export const auth = getAuth(app);
export const storage = getStorage(app);

// Validate Firestore connection initially
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Firestore client is offline.");
    }
  }
}
testConnection();

export const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  email: string;
  name: string;
  role: 'customer' | 'admin';
  createdAt: any;
}

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDocRefSnap = await getDoc(userDocRef);
    
    if (!userDocRefSnap.exists()) {
      // Create new user profile
      const newUser: UserProfile = {
        email: user.email || '',
        name: user.displayName || 'Usuario',
        role: (user.email === 'jarp.199x@gmail.com' || user.email === 'yahairapipiti4@gmail.com') ? 'admin' : 'customer',
        createdAt: new Date(),
      };
      
      await setDoc(userDocRef, newUser);
    }
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Hook for using auth state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfile(userDocSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, profile, loading, isAdmin: profile?.role === 'admin' || user?.email === 'jarp.199x@gmail.com' || user?.email === 'yahairapipiti4@gmail.com' };
}
