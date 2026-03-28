'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  role: "citizen" | "admin" | "worker";
  displayName?: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;

  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<UserCredential>;

  login: (
    email: string,
    password: string
  ) => Promise<UserCredential>;

  loginWithGoogle: () => Promise<User | null>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        setUser(authUser);

        if (authUser) {
          const profileRef = doc(db, 'users', authUser.uid);
          const profileDoc = await getDoc(profileRef);

          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }

      } catch (error) {
        console.error('Auth listener error:', error);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 📝 REGISTER (renamed)
  const register = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<UserCredential> => {

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const newUser = userCredential.user;

    const profile: UserProfile = {
      uid: newUser.uid,
      email: newUser.email || email,
      role: 'citizen',
      displayName,
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'users', newUser.uid), profile);
    setUserProfile(profile);

    return userCredential;
  };

  // 🔐 LOGIN
  const login = async (
    email: string,
    password: string
  ): Promise<UserCredential> => {

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const authUser = userCredential.user;

    const profileDoc = await getDoc(doc(db, 'users', authUser.uid));

    if (profileDoc.exists()) {
      setUserProfile(profileDoc.data() as UserProfile);
    } else {
      setUserProfile(null);
    }

    return userCredential;
  };

  // 🔥 GOOGLE LOGIN (FIXED + INSIDE COMPONENT)
  const loginWithGoogle = async (): Promise<User | null> => {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const authUser = result.user;

      const userRef = doc(db, 'users', authUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: authUser.uid,
          email: authUser.email || '',
          role: 'citizen',
          displayName: authUser.displayName || 'User',
          createdAt: Date.now(),
        };

        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);

      } else {
        setUserProfile(docSnap.data() as UserProfile);
      }

      return authUser;

    } catch (error) {
      console.error('Google login error:', error);
      return null;
    }
  };

  // 🚪 LOGOUT
  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        register,
        login,
        loginWithGoogle,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 🔑 Hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}