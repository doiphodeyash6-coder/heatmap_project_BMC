'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
role: "user" | "admin" | "worker"
  displayName?: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;

  signup: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<UserCredential>;

  login: (
    email: string,
    password: string
  ) => Promise<UserCredential>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Listen to auth state
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
            console.warn('User profile not found');
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

  // 📝 SIGNUP
  const signup = async (
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
      role: 'citizen', // default role
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

    try {

      const profileDoc = await getDoc(doc(db, 'users', authUser.uid));

      if (profileDoc.exists()) {
        setUserProfile(profileDoc.data() as UserProfile);
      } else {
        console.warn('User profile missing');
        setUserProfile(null);
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }

    return userCredential;
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
        signup,
        login,
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