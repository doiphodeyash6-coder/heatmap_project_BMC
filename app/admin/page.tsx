'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (!loading && userProfile?.role !== 'admin') router.push('/');
  }, [user, userProfile, loading]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    const snapshot = await getDocs(collection(db, 'complaints'));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setComplaints(data);

    const usersSnapshot = await getDocs(collection(db, "users"));

    const workerList = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((u:any) => u.role === "worker");

    setWorkers(workerList);
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'complaints', id), { status });
    loadData();
  };

  const assignWorker = async (complaintId: string, workerId: string) => {

    if (!workerId) return;

    await updateDoc(doc(db, 'complaints', complaintId), {
      workerId,
      status: 'assigned'
    });

    loadData();
  };

  const open = complaints.filter(c => c.status === 'open');
  const assigned = complaints.filter(c => c.status === 'assigned');
  const done = complaints.filter(c => c.status === 'resolved');
  const cancelled = complaints.filter(c => c.status === 'cancelled');

  const getStatusUI = (status: string) => {
    if (status === 'resolved') return 'Done ✅';
    return status;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'assigned':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-400/30';
      default:
        return 'bg-sky-500/20 text-sky-400 border-sky-400/30';
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* 🌆 MUMBAI BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/mumbai.jpg')" }}
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10">

        <Navigation />

        <div className="max-w-6xl mx-auto p-6 text-white">

          <h1 className="text-4xl font-bold mb-8 
          bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Admin Dashboard ⚡
          </h1>

          {/* TABS */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {['overview','open','assigned','done','cancelled'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full border text-sm transition
                ${activeTab === tab
                  ? 'bg-white text-black'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'}
                `}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* DATA */}
          <div className="space-y-6">

            {(activeTab === 'overview' ? complaints :
              activeTab === 'open' ? open :
              activeTab === 'assigned' ? assigned :
              activeTab === 'done' ? done :
              cancelled
            ).map((c) => (

              <div
                key={c.id}
                className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl 
                border border-white/20 shadow-xl"
              >

                <h3 className="text-xl font-bold text-emerald-400 mb-2">
                  {c.title}
                </h3>

                <p className="text-gray-300 text-sm mb-2">
                  {c.description}
                </p>

                <p className="text-gray-400 text-sm mb-3">
                  📍 {c.location?.address}
                </p>

                <span className={`px-3 py-1 rounded-full text-xs border mr-3
                  ${getStatusStyle(c.status)}
                `}>
                  {getStatusUI(c.status)}
                </span>

                <div className="flex gap-3 mt-4 flex-wrap">

                  {c.status === 'open' && (
                    <select
                      className="bg-black/50 border border-white/20 rounded px-3 py-2 text-sm"
                      onChange={(e) => assignWorker(c.id, e.target.value)}
                    >
                      <option value="">Assign Worker</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.displayName || w.email}
                        </option>
                      ))}
                    </select>
                  )}

                  {c.status === 'assigned' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatus(c.id, 'resolved')}
                    >
                      Mark Done ✅
                    </Button>
                  )}

                  {c.status !== 'resolved' && c.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => updateStatus(c.id, 'cancelled')}
                    >
                      Cancel ❌
                    </Button>
                  )}

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </main>
  );
}