'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { getUserComplaints, Complaint } from '@/lib/firebase-service';
import { Navigation } from '@/components/Navigation';

export default function ComplaintsPage() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<(Complaint & { id: string })[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {

    if (loading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!userProfile) return;

    if (userProfile.role === "worker") {
      router.replace('/worker');
      return;
    }

    if (userProfile.role === "admin") {
      router.replace('/admin');
      return;
    }

  }, [user, userProfile, loading]);

  useEffect(() => {

    if (!user) return;

    const loadData = async () => {
      const data = await getUserComplaints(user.uid);
      setComplaints(data);
      setDataLoading(false);
    };

    loadData();

  }, [user?.uid]);

  // 🔥 LOADING UI (DARK)
  if (loading || dataLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#020617] text-white">
        <Navigation />
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-sky-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Loading complaints...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* 🌌 BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      {/* 🌑 OVERLAY */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10">

        <Navigation />

        <div className="max-w-5xl mx-auto p-6 text-white">

          {/* TITLE */}
          <h1 className="text-4xl font-bold mb-8 
          bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            My Complaints 📋
          </h1>

          {complaints.length === 0 ? (

            <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-xl p-10 text-center shadow-xl">
              <p className="text-gray-300">No complaints found 🚀</p>
            </div>

          ) : (

            <div className="space-y-6">

              {complaints.map((c) => (

                <div
                  key={c.id}
                  className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl 
                  border border-white/20 shadow-xl hover:scale-[1.02] transition"
                >

                  {/* TITLE */}
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">
                    {c.title}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="text-gray-300 text-sm mb-3">
                    {c.description}
                  </p>

                  {/* LOCATION */}
                  <p className="text-sm text-gray-400 mb-3">
                    📍 {c.location.address}
                  </p>

                  {/* STATUS + SEVERITY */}
                  <div className="flex gap-3 flex-wrap">

                    {/* STATUS */}
                    <span className={`px-3 py-1 rounded-full text-xs border
                      ${c.status === 'resolved'
                        ? 'bg-green-500/20 text-green-400 border-green-400/30'
                        : c.status === 'assigned'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                        : 'bg-sky-500/20 text-sky-400 border-sky-400/30'}
                    `}>
                      {c.status === 'resolved' ? 'Done ✅' : c.status}
                    </span>

                    {/* SEVERITY */}
                    <span className={`px-3 py-1 rounded-full text-xs border
                      ${c.severity === 'high'
                        ? 'bg-red-500/20 text-red-400 border-red-400/30'
                        : c.severity === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                        : 'bg-green-500/20 text-green-400 border-green-400/30'}
                    `}>
                      {c.severity}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </main>
  );
}