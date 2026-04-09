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

  // 🔐 protect route
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

  // ✅ MARK COMPLETE FUNCTION
  const handleComplete = async (id: string) => {
    try {
      await updateDoc(doc(db, "complaints", id), {
        status: "resolved"
      });

      loadComplaints(); // refresh UI
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading || pageLoading) {
    return <p className="p-10 text-white">Loading worker...</p>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#020617] text-white">

      <Navigation />

      <div className="max-w-5xl mx-auto p-6">

        {/* TITLE */}
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
          Worker Dashboard 🛠
        </h1>

        {/* EMPTY */}
        {complaints.length === 0 && (
          <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-xl p-6 text-center">
            <p className="text-gray-300">No complaints assigned yet 🚀</p>
          </div>
        )}

        {/* CARDS */}
        <div className="space-y-6">

          {complaints.map((c) => (

            <div
              key={c.id}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:scale-[1.02] transition"
            >

              {/* TITLE */}
              <h3 className="text-xl font-bold text-emerald-400 mb-2">
                {c.title}
              </h3>

              {/* LOCATION */}
              <p className="text-sm text-gray-300 mb-3">
                📍 {c.location?.address || `${c.location.latitude}, ${c.location.longitude}`}
              </p>

              {/* STATUS */}
              <div className="flex gap-2 mb-4">

                {/* STATUS BADGE */}
                <span className={`px-3 py-1 rounded-full text-xs border
                  ${c.status === 'resolved'
                    ? 'bg-green-500/20 text-green-400 border-green-400/30'
                    : 'bg-sky-500/20 text-sky-400 border-sky-400/30'}
                `}>
                  {c.status === 'resolved' ? 'Done ✅' : c.status}
                </span>

                {/* SEVERITY */}
                <span className={`px-3 py-1 rounded-full text-xs border
                  ${c.severity === 'high'
                    ? 'bg-red-500/20 text-red-400 border-red-400/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'}
                `}>
                  {c.severity}
                </span>

              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 flex-wrap">

                {/* MAP */}
                <Button
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:scale-105 transition"
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${c.location.latitude},${c.location.longitude}`
                    )
                  }
                >
                  📍 View Location
                </Button>

                {/* COMPLETE */}
                <Button
                  disabled={c.status === 'resolved'}
                  className={`hover:scale-105 transition ${
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

    </main>
  );
}