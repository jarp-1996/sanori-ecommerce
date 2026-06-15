import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  initializeFirestore, 
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { useState, useEffect } from 'react';

export const app = initializeApp(firebaseConfig);

// Use initializeFirestore with multi-tab persistent caching and long-polling settings
// to guarantee maximum resilience in various environments (VMs, iframes, and restricted corporate networks)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId); // CRITICAL

export const auth = getAuth(app);
export const storage = getStorage(app);

// Gracefully monitor initial connection status without printing disrupting error stacks
async function checkInitialConnection() {
  try {
    // Try to check connection briefly with a low-priority backend query
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // Ignore server-unreachable/offline errors as they are transparently resolved by local caching
    console.warn("Firestore client working in resilient offline-first mode. Data is cached locally and will sync once connected.");
  }
}
checkInitialConnection();

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
