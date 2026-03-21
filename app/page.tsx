'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

export default function Home() {

  // ✅ ADD userProfile
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {

    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    // ✅ NEW ROLE-BASED REDIRECT
    if (!loading && userProfile) {

      if (userProfile.role === "admin") {
        router.replace('/admin');

      } else if (userProfile.role === "worker") {
        router.replace('/worker');   // 🔥 MAIN FIX

      } else {
        router.replace('/complaints');
      }
    }

  }, [user, userProfile, loading, router]);

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ❌ THIS PAGE SHOULD NOT RENDER FOR WORKER / ADMIN
  if (userProfile.role === "worker" || userProfile.role === "admin") {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-sky-50 text-sky-700 rounded-full text-sm font-semibold">
              Smart Waste Management
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Track Waste Issues<br />
            <span className="bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              in Your Community
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Report waste collection problems and help authorities resolve issues faster
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

          <div className="group bg-white rounded-xl border border-gray-200 p-8 hover:border-sky-300 hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-sky-50 rounded-lg flex items-center justify-center mb-6 group-hover:from-sky-200 transition-colors">
              <svg className="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-3">Report Issue</h2>

            <p className="text-gray-600 mb-6">
              Submit a complaint with location details and photos to document waste collection problems
            </p>

            <Link href="/complaints/new">
              <Button className="w-full bg-sky-600 hover:bg-sky-700">
                Report Now
              </Button>
            </Link>
          </div>

          <div className="group bg-white rounded-xl border border-gray-200 p-8 hover:border-cyan-300 hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-lg flex items-center justify-center mb-6 group-hover:from-cyan-200 transition-colors">
              <svg className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-3">My Complaints</h2>

            <p className="text-gray-600 mb-6">
              Track the status of your submissions and receive updates when issues are resolved
            </p>

            <Link href="/complaints">
              <Button variant="outline" className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                View Reports
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}