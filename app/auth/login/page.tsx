'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LoginPage() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, userProfile } = useAuth();
  const router = useRouter();

  // Email login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  // Google login + register
  const loginWithGoogle = async () => {

    try {

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      // allow only Gmail
      if (!user.email || !user.email.endsWith("@gmail.com")) {
        alert("Only Gmail accounts allowed");
        return;
      }

      const userRef = doc(db, "users", user.uid);

      const userSnap = await getDoc(userRef);

      // if user does not exist → create account
      if (!userSnap.exists()) {

        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: "citizen",
          createdAt: Date.now()
        });

      }

      console.log("Google login success:", user.email);

    } catch (error) {
      console.log(error);
    }

  };

  // Role redirect
  useEffect(() => {

  

  if (!userProfile) return;

  if (userProfile.role === "admin") {
    router.push("/admin");
  } else if (userProfile.role === "worker") {
    router.push("/worker");
  } else {
    router.push("/complaints");
  }

}, [userProfile, router]);
  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4">

      <Card className="w-full max-w-md shadow-xl border-gray-200">

        <CardHeader className="space-y-2">

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">W</span>
            </div>

            <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              WasteTrack
            </span>
          </div>

          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>

        </CardHeader>

        <CardContent>

          {/* Email login */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

          </form>

          <div className="my-4 text-center text-gray-400 text-sm">
            OR
          </div>

          {/* Google login */}
          <Button
            onClick={loginWithGoogle}
            variant="outline"
            className="w-full"
          >
            Sign in with Google
          </Button>

          <div className="mt-6 text-center text-sm">
            Don’t have an account?{' '}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Register here
            </Link>
          </div>

        </CardContent>

      </Card>

    </div>
  );
}