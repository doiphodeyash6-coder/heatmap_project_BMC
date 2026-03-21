'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ComplaintForm } from '@/components/ComplaintForm';
import { Navigation } from '@/components/Navigation';

export default function NewComplaintPage() {

  const { user, userProfile, loading } = useAuth(); // ✅ added userProfile
  const router = useRouter();

  useEffect(() => {

    // 🔒 Not logged in
    if (!loading && !user) {
      router.push('/auth/login');
    }

    // 🔥 BLOCK WORKER
    if (!loading && userProfile?.role === 'worker') {
      router.replace('/worker');
    }

  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 🚫 extra safety
  if (!user || userProfile?.role === 'worker') {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Navigation />
      <ComplaintForm />
    </main>
  );
}