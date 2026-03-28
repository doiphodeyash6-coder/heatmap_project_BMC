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
    <nav className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="logo"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <span className="text-xl font-bold text-white">
              WasteTrack
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">

            {/* Citizen */}
            {user && !isAdmin && !isWorker && (
              <>
                <Link href="/complaints/new" className="text-gray-300 hover:text-white transition">
                  Report Issue
                </Link>

                <Link href="/complaints" className="text-gray-300 hover:text-white transition">
                  My Reports
                </Link>
              </>
            )}

            {/* Admin */}
            {user && isAdmin && (
              <Link href="/admin" className="text-amber-400 font-medium">
                Admin Dashboard
              </Link>
            )}

            {/* Worker */}
            {user && isWorker && (
              <Link href="/worker">
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30 hover:bg-sky-500/30 transition">
                  Worker Dashboard
                </span>
              </Link>
            )}

          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-4">

            {!user ? (
              <Link href="/auth/login">
                <Button className="bg-sky-600 hover:bg-sky-700">
                  Login
                </Button>
              </Link>
            ) : (
              <>
                <span className="text-sm text-gray-300">
                  {user.email}
                </span>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white hover:text-black"
                >
                  Logout
                </Button>
              </>
            )}

          </div>

          {/* Mobile Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>

        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-3 text-white">

            {/* Citizen */}
            {user && !isAdmin && !isWorker && (
              <>
                <Link href="/complaints/new" className="block px-4 py-2">
                  Report Issue
                </Link>

                <Link href="/complaints" className="block px-4 py-2">
                  My Reports
                </Link>
              </>
            )}

            {/* Admin */}
            {user && isAdmin && (
              <Link href="/admin" className="block px-4 py-2">
                Admin Dashboard
              </Link>
            )}

            {/* Worker */}
            {user && isWorker && (
              <Link href="/worker" className="block px-4 py-2">
                Worker Dashboard
              </Link>
            )}

            {/* User Section */}
            <div className="border-t border-white/10 pt-4 px-4">

              {!user ? (
                <Link href="/auth/login">
                  <Button className="w-full bg-sky-600">
                    Login
                  </Button>
                </Link>
              ) : (
                <>
                  <p className="text-sm mb-3">{user.email}</p>

                  <Button
                    onClick={handleLogout}
                    className="w-full bg-white text-black"
                  >
                    Logout
                  </Button>
                </>
              )}

            </div>

          </div>
        )}

      </div>
    </nav>
  );
}