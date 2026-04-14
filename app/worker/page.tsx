'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";

export default function WorkerDashboard() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (!loading && userProfile?.role !== 'worker') router.push('/');
  }, [user, userProfile, loading]);

  useEffect(() => {
    if (user) loadComplaints();
  }, [user]);

  const loadComplaints = async () => {

    const q = query(
      collection(db, "complaints"),
      where("workerId", "==", user?.uid)
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setComplaints(data);
    setPageLoading(false);
  };

  const handleComplete = async (id: string) => {
    await updateDoc(doc(db, "complaints", id), {
      status: "resolved"
    });
    loadComplaints();
  };

  // 📊 STATS
  const total = complaints.length;
  const completed = complaints.filter(c => c.status === 'resolved').length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (loading || pageLoading) {
    return <p className="p-10 text-white">Loading worker...</p>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* 🌆 BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/mumbai.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* 🔥 GLOW */}
      <div className="absolute inset-0 bg-sky-500/10 blur-3xl" />

      <div className="relative z-10">

        <Navigation />

        <div className="max-w-6xl mx-auto p-6 text-white">

          {/* TITLE */}
          <h1 className="text-4xl font-bold mb-6 
          bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Worker Dashboard 🛠
          </h1>

          {/* 👤 PROFILE + PROGRESS */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-6 mb-6 shadow-xl">

            <div className="flex justify-between items-center flex-wrap gap-4">

              <div>
                <h2 className="text-xl font-bold">
                  {userProfile?.displayName || user?.email}
                </h2>
                <p className="text-gray-300 text-sm">Field Worker</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400">Completion Rate</p>
                <h2 className="text-2xl font-bold text-emerald-400">
                  {progress}%
                </h2>
              </div>

            </div>

            {/* PROGRESS BAR */}
            <div className="mt-4 w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-emerald-400 to-green-500"
                style={{ width: `${progress}%` }}
              />
            </div>

          </div>

          {/* 📊 STATS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">

            <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-center">
              <p>Total Tasks</p>
              <h2 className="text-2xl font-bold">{total}</h2>
            </div>

            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 text-center">
              <p>Completed</p>
              <h2 className="text-2xl font-bold">{completed}</h2>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4 text-center">
              <p>Pending</p>
              <h2 className="text-2xl font-bold">{pending}</h2>
            </div>

          </div>

          {/* TASK LIST */}
          <div className="space-y-6">

            {complaints.map((c) => (

              <div
                key={c.id}
                className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:scale-[1.02] transition"
              >

                <h3 className="text-xl font-bold text-emerald-400 mb-2">
                  {c.title}
                </h3>

                <p className="text-sm text-gray-300 mb-3">
                  📍 {c.location?.address}
                </p>

                {/* STATUS */}
                <span className={`px-3 py-1 rounded-full text-xs border
                  ${c.status === 'resolved'
                    ? 'bg-green-500/20 text-green-400 border-green-400/30'
                    : 'bg-sky-500/20 text-sky-400 border-sky-400/30'}
                `}>
                  {c.status === 'resolved' ? 'Done ✅' : 'Pending'}
                </span>

                {/* ACTIONS */}
                <div className="flex gap-3 mt-4 flex-wrap">

                  <Button
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:scale-105"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?q=${c.location.latitude},${c.location.longitude}`
                      )
                    }
                  >
                    📍 View Location
                  </Button>

                  <Button
                    disabled={c.status === 'resolved'}
                    className={`hover:scale-105 ${
                      c.status === 'resolved'
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600'
                    }`}
                    onClick={() => handleComplete(c.id)}
                  >
                    {c.status === 'resolved' ? 'Done ✅' : 'Mark Complete'}
                  </Button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </main>
  );
}