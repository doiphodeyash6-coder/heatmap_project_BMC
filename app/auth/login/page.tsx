'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {

  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: any) => {
    e.preventDefault();
    await login(email, password);
    router.push('/');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* 🎥 VIDEO BACKGROUND */}
      <video
        autoPlay
        loop
        muted
        className="absolute w-full h-full object-cover"
      >
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl 
      bg-white/10 backdrop-blur-xl border border-white/20 
      shadow-2xl text-white animate-fadeIn">

        {/* LOGO */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center font-bold">
            W
          </div>
          <h1 className="text-xl font-bold">WasteTrack</h1>
        </div>

        {/* TITLE */}
        <h2 className="text-2xl font-bold mb-2">Welcome Back 👋</h2>
        <p className="text-gray-300 mb-6">Sign in to continue</p>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 
            focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 
            focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 
            hover:scale-105 transition shadow-lg font-semibold"
          >
            Sign In 🚀
          </button>

        </form>

        {/* DIVIDER */}
        <div className="text-center my-4 text-gray-400">OR</div>

        {/* GOOGLE BUTTON */}
        <button className="w-full py-3 rounded-lg bg-white text-black hover:scale-105 transition">
          Sign in with Google
        </button>

        {/* REGISTER */}
        <p className="text-center mt-4 text-gray-300">
          Don’t have an account?{' '}
          <Link href="/auth/signup" className="text-sky-400 hover:underline">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}