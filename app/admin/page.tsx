'use client';

import { useEffect, useState, useRef } from 'react';
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
import { useJsApiLoader } from '@react-google-maps/api';

export default function AdminDashboard() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const mapRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<any>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['visualization']
  });

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

  // 🔥 FILTER ACTIVE (IMPORTANT)
  const activeComplaints = complaints.filter(c => c.status !== 'cancelled');

  // 📊 STATS
  const total = activeComplaints.length;
  const open = activeComplaints.filter(c => c.status === 'open');
  const assigned = activeComplaints.filter(c => c.status === 'assigned');
  const done = activeComplaints.filter(c => c.status === 'resolved');
  const cancelled = complaints.filter(c => c.status === 'cancelled');

  // 🔥 HEATMAP
  useEffect(() => {

    if (!isLoaded || !mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 19.0760, lng: 72.8777 },
      zoom: 12,
      styles: [{ stylers: [{ saturation: -100 }] }]
    });

    const points = activeComplaints.map(c =>
      new google.maps.LatLng(c.location.latitude, c.location.longitude)
    );

    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: points
    });

    heatmap.setMap(map);
    heatmapRef.current = heatmap;

  }, [isLoaded, activeComplaints]);

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

      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/mumbai.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10">

        <Navigation />

        <div className="max-w-6xl mx-auto p-6 text-white">

          <h1 className="text-4xl font-bold mb-6 
          bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Admin Analytics Dashboard 📊
          </h1>

          {/* 📊 STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

            <div className="p-4 bg-white/10 rounded-xl text-center">
              <p>Total</p>
              <h2 className="text-2xl font-bold">{total}</h2>
            </div>

            <div className="p-4 bg-sky-500/20 rounded-xl text-center">
              <p>Open</p>
              <h2 className="text-2xl font-bold">{open.length}</h2>
            </div>

            <div className="p-4 bg-yellow-500/20 rounded-xl text-center">
              <p>Assigned</p>
              <h2 className="text-2xl font-bold">{assigned.length}</h2>
            </div>

            <div className="p-4 bg-green-500/20 rounded-xl text-center">
              <p>Done</p>
              <h2 className="text-2xl font-bold">{done.length}</h2>
            </div>

          </div>

          {/* 🔥 HEATMAP */}
          <div className="mb-8 rounded-xl overflow-hidden border border-white/20">
            <div ref={mapRef} className="w-full h-[400px]" />
          </div>

          {/* EXISTING CARDS */}
          <div className="space-y-6">

            {activeComplaints.map((c) => (

              <div
                key={c.id}
                className="p-6 rounded-2xl bg-white/10 border border-white/20"
              >

                <h3 className="text-xl font-bold text-emerald-400">
                  {c.title}
                </h3>

                <p className="text-gray-300 text-sm">
                  {c.description}
                </p>

                <p className="text-gray-400 text-sm">
                  📍 {c.location?.address}
                </p>

                <span className={`px-3 py-1 rounded-full text-xs border
                  ${getStatusStyle(c.status)}
                `}>
                  {getStatusUI(c.status)}
                </span>

                <div className="flex gap-3 mt-3">

                  {c.status === 'open' && (
                    <select
                      onChange={(e) => assignWorker(c.id, e.target.value)}
                      className="bg-black border border-white/20 rounded px-2 py-1"
                    >
                      <option value="">Assign</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.displayName || w.email}
                        </option>
                      ))}
                    </select>
                  )}

                  {c.status === 'assigned' && (
                    <Button onClick={() => updateStatus(c.id, 'resolved')}>
                      Done
                    </Button>
                  )}

                  <Button
                    className="bg-red-600"
                    onClick={() => updateStatus(c.id, 'cancelled')}
                  >
                    Cancel
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