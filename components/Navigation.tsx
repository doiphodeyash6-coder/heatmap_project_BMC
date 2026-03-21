'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {

  const { user, logout, userProfile } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const isAdmin = userProfile?.role === 'admin';
  const isWorker = userProfile?.role === 'worker';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>

            <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              WasteTrack
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">

            {/* 👷 WORKER */}
            {isWorker && (
              <span className="font-bold text-lg text-blue-600">
                Worker Dashboard
              </span>
            )}

            {/* 👤 CITIZEN */}
            {!isAdmin && !isWorker && (
              <>
                <Link href="/complaints/new" className="text-gray-700 hover:text-sky-600 font-medium text-sm">
                  Report Issue
                </Link>

                <Link href="/complaints" className="text-gray-700 hover:text-sky-600 font-medium text-sm">
                  My Reports
                </Link>
              </>
            )}

            {/* 👨‍💼 ADMIN */}
            {isAdmin && (
              <Link href="/admin" className="text-gray-700 hover:text-sky-600 font-medium text-sm">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Admin Dashboard
                </span>
              </Link>
            )}

          </div>

          {/* User section */}
          <div className="hidden md:flex items-center gap-4">

            <span className="text-sm text-gray-600">
              {user?.email}
            </span>

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              Logout
            </Button>

          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>

        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-3">

            {/* 👷 WORKER */}
            {isWorker && (
              <div className="px-4 py-2 font-bold text-blue-600">
                Worker Dashboard
              </div>
            )}

            {/* 👤 CITIZEN */}
            {!isAdmin && !isWorker && (
              <>
                <Link href="/complaints/new" className="block px-4 py-2 hover:bg-gray-50">
                  Report Issue
                </Link>

                <Link href="/complaints" className="block px-4 py-2 hover:bg-gray-50">
                  My Reports
                </Link>
              </>
            )}

            {/* 👨‍💼 ADMIN */}
            {isAdmin && (
              <Link href="/admin" className="block px-4 py-2 hover:bg-gray-50">
                Admin Dashboard
              </Link>
            )}

            <div className="border-t border-gray-200 pt-4 px-4">

              <p className="text-sm mb-3">{user?.email}</p>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full"
              >
                Logout
              </Button>

            </div>

          </div>
        )}

      </div>
    </nav>
  );
}