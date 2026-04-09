'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ComplaintForm } from '@/components/ComplaintForm';
import { Navigation } from '@/components/Navigation';

export default function NewComplaintPage() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {

    if (!loading && !user) {
      router.push('/auth/login');
    }

    if (!loading && userProfile?.role === 'worker') {
      router.replace('/worker');
    }

  }, [user, userProfile, loading, router]);

  // 🔄 LOADING UI (UPGRADED)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-[#0f172a] to-[#020617] text-white">

        <div className="text-center">

          <div className="w-14 h-14 border-4 border-white/20 border-t-sky-400 
          rounded-full animate-spin mx-auto mb-6"></div>

          <p className="text-lg tracking-wide text-gray-300">
            Loading Dashboard...
          </p>

        </div>
      </div>
    );
  }

  if (!user || userProfile?.role === 'worker') {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* 🌌 BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      {/* 🌑 DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* ✨ GLOW EFFECT */}
      <div className="absolute inset-0 bg-sky-500/10 blur-3xl" />

      {/* 🔥 CONTENT */}
      <div className="relative z-10">

        <Navigation />

        {/* PAGE HEADER */}
        <div className="max-w-4xl mx-auto px-6 pt-12 text-white">

          <h1 className="text-4xl md:text-5xl font-bold mb-3 
          bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Report Waste Issue 🚨
          </h1>

          <p className="text-gray-300 text-lg">
            Help keep your city clean by reporting problems instantly.
          </p>

        </div>

        {/* FORM CONTAINER */}
        <div className="max-w-4xl mx-auto px-6 py-10">

          <div className="p-6 md:p-8 rounded-3xl 
          bg-white/10 backdrop-blur-xl border border-white/20 
          shadow-2xl hover:shadow-sky-500/10 transition">

            <ComplaintForm />

          </div>

        </div>

      </div>
    </main>
  );
}