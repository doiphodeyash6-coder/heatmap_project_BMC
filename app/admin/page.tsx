'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getAllComplaints, updateComplaint, Complaint } from '@/lib/firebase-service';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminCharts from '@/components/admin/AdminCharts';
import Heatmap from '@/components/Heatmap';

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboard() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<(Complaint & { id: string })[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [workers, setWorkers] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'zones'>('overview');

  // 🔐 protect route
  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (!loading && userProfile?.role !== 'admin') router.push('/');
  }, [user, userProfile, loading]);

  useEffect(() => {
    if (userProfile?.role === 'admin') loadData();
  }, [userProfile]);

  const loadData = async () => {

    const c = await getAllComplaints();

    const usersSnapshot = await getDocs(collection(db, "users"));

    const workerList = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((u:any) => u.role?.toLowerCase().trim() === "worker");

    setComplaints(c);
    setWorkers(workerList);
    setPageLoading(false);
  };

  // ✅ ASSIGN WORKER FUNCTION
  const handleAssignWorker = async (complaintId: string, workerId: string) => {

    if (!workerId) return;

    await updateComplaint(complaintId, {
      workerId,
      status: "assigned"
    });

    loadData();
  };

  // ✅ RESOLVE FUNCTION
  const handleResolve = async (id: string) => {
    await updateComplaint(id, { status: 'resolved' });
    loadData();
  };

  if (loading || pageLoading) return <p className="p-10 text-white">Loading admin...</p>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#020617] text-white">

      <Navigation />

      <div className="max-w-6xl mx-auto p-6">

        <h1 className="text-4xl font-bold mb-10 bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
          Admin Dashboard 🚀
        </h1>

        {/* STATS */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
            <p>Total</p>
            <h2 className="text-3xl">{complaints.length}</h2>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
            <p>Open</p>
            <h2 className="text-3xl text-red-400">
              {complaints.filter(c => c.status === 'open').length}
            </h2>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
            <p>High</p>
            <h2 className="text-3xl text-orange-400">
              {complaints.filter(c => c.severity === 'high').length}
            </h2>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
            <p>Resolved</p>
            <h2 className="text-3xl text-green-400">
              {complaints.filter(c => c.status === 'resolved').length}
            </h2>
          </div>

        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('overview')} className="px-4 py-2 bg-sky-500 rounded">overview</button>
          <button onClick={() => setActiveTab('complaints')} className="px-4 py-2 bg-gray-700 rounded">complaints</button>
          <button onClick={() => setActiveTab('zones')} className="px-4 py-2 bg-gray-700 rounded">zones</button>
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <AdminCharts complaints={complaints} />
        )}

        {/* COMPLAINTS */}
        {activeTab === 'complaints' && (

          <div className="space-y-4">

            {complaints.map(c => (

              <div key={c.id} className="p-5 rounded-xl bg-white/10 border border-white/20">

                <h3 className="font-bold">{c.title}</h3>
                <p className="text-sm text-gray-400">{c.location.address}</p>

                <div className="flex gap-2 mt-2">
                  <span className="bg-sky-500/20 px-2 rounded">{c.status}</span>
                  <span className="bg-red-500/20 px-2 rounded">{c.severity}</span>
                </div>

                <div className="flex gap-3 mt-4 items-center flex-wrap">

                  {/* 🔥 ASSIGN DROPDOWN */}
                  <select
                    className="bg-black/50 border border-white/20 rounded px-3 py-2"
                    onChange={(e) => handleAssignWorker(c.id, e.target.value)}
                  >
                    <option value="">Assign Worker</option>

                    {workers.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.displayName || w.email}
                      </option>
                    ))}
                  </select>

                  {/* ✅ RESOLVE */}
                  <Button onClick={() => handleResolve(c.id)}>
                    Resolve
                  </Button>

                  {/* 📍 MAP */}
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?q=${c.location.latitude},${c.location.longitude}`
                      )
                    }
                  >
                    Map
                  </Button>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* ZONES */}
        {activeTab === 'zones' && (
          <Heatmap />
        )}

      </div>

    </main>
  );
}