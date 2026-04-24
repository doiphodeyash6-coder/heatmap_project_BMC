'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc
} from 'firebase/firestore';

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useJsApiLoader } from '@react-google-maps/api';
import { googleMapsLibraries } from '@/lib/googleMapsLoader';
import { getUserStats, blacklistUser, unblacklistUser } from '@/lib/firebase-service';
import { getUserEmail, sendComplaintResolvedEmail } from '@/lib/email-service';
import { toast } from 'sonner';
import AdminCharts from '@/components/admin/AdminCharts';
import {
  groupByArea,
  groupByCategory,
  groupByDate,
  getWorkerPerformance,
} from '@/lib/analytics-utils';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface UserStatEntry {
  userid: string;
  totalComplaints: number;
  fakeComplaints: number;
  isBlacklisted: boolean;
  isFlagged: boolean;
}

const DARK_COLORS = ['#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#f472b6'];

export default function AdminDashboard() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [blacklistedUsers, setBlacklistedUsers] = useState<any[]>([]);
  const [userStatsMap, setUserStatsMap] = useState<Record<string, UserStatEntry>>({});
  const [activeTab, setActiveTab] = useState('overview');

  const mapRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<any>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: googleMapsLibraries as any,
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
    })) as any[];
    setComplaints(data);

    const usersSnapshot = await getDocs(collection(db, "users"));
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const workerList = allUsers.filter((u:any) => u.role === "worker");
    setWorkers(workerList);

    // Load ALL user stats (for every registered user)
    const statsMap: Record<string, UserStatEntry> = {};
    for (const u of allUsers) {
      const stats = await getUserStats(u.id);
      statsMap[u.id] = {
        userid: u.id,
        totalComplaints: stats.totalComplaints,
        fakeComplaints: stats.fakeComplaints,
        isBlacklisted: stats.isBlacklisted,
        isFlagged: stats.isFlagged,
      };
    }
    setUserStatsMap(statsMap);

    // Load blacklisted users
    const statsSnapshot = await getDocs(collection(db, "userStats"));
    const blacklisted = [];
    for (const s of statsSnapshot.docs) {
      const stats = s.data();
      if (stats.isBlacklisted) {
        const userDoc = await getDoc(doc(db, "users", s.id));
        const userData = userDoc.exists() ? userDoc.data() : {};
        blacklisted.push({
          id: s.id,
          ...stats,
          displayName: userData.displayName || 'Unknown User',
          email: userData.email || 'No email',
          role: userData.role || 'citizen',
        });
      }
    }
    setBlacklistedUsers(blacklisted);
  };

  // FILTER ACTIVE
  const activeComplaints = complaints.filter(c => c.status !== 'cancelled');

  // STATS
  const total = activeComplaints.length;
  const open = activeComplaints.filter(c => c.status === 'open');
  const assigned = activeComplaints.filter(c => c.status === 'assigned');
  const done = activeComplaints.filter(c => c.status === 'resolved');
  const fake = complaints.filter(c => c.status === 'fake');
  const cancelled = complaints.filter(c => c.status === 'cancelled');

  // ANALYTICS DATA
  const areaData = groupByArea(activeComplaints).slice(0, 10);
  const categoryData = groupByCategory(activeComplaints);
  const timeData = groupByDate(activeComplaints, 30);
  const workerPerfData = getWorkerPerformance(activeComplaints, workers);

  // HEATMAP
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

    if (status === 'resolved') {
      const complaint = complaints.find((c) => c.id === id);
      if (complaint) {
        try {
          const userEmail = await getUserEmail(complaint.userid);
          if (userEmail) {
            const result = await sendComplaintResolvedEmail(userEmail, complaint.title, id);
            if (result.preview) {
              toast.warning('Email preview logged to console — SMTP not configured. Check terminal.');
            } else {
              toast.success('Resolution email sent to complainant!');
            }
          } else {
            toast.error('No email found for this user.');
            console.warn('No email found for user:', complaint.userid);
          }
        } catch (err: any) {
          toast.error(`Email failed: ${err.message || 'Unknown error'}`);
          console.error('Failed to send resolution email:', err);
        }
      }
    }

    loadData();
  };

  const handleBlacklist = async (userid: string) => {
    const confirm = window.confirm("Are you sure you want to BLACKLIST this user? They will be permanently blocked.");
    if (!confirm) return;
    await blacklistUser(userid);
    alert("🚫 User has been blacklisted.");
    loadData();
  };

  const handleUnblacklist = async (userid: string) => {
    const confirm = window.confirm("Are you sure you want to UNBLACKLIST this user? They will be able to log in again.");
    if (!confirm) return;
    await unblacklistUser(userid);
    alert("✅ User has been removed from blacklist.");
    loadData();
  };

  const assignWorker = async (complaintId: string, workerId: string, complaint: any) => {
    if (!workerId) return;

    const stats = userStatsMap[complaint.userid];
    if (stats && stats.fakeComplaints >= 3) {
      const confirm = window.confirm(
        `⚠️ WARNING: This user has ${stats.fakeComplaints} fake complaints out of ${stats.totalComplaints} total.\n\nDo you still want to assign this worker?`
      );
      if (!confirm) return;
    }

    await updateDoc(doc(db, 'complaints', complaintId), {
      workerId,
      status: 'assigned'
    });

    loadData();
  };

  const getStatusUI = (status: string) => {
    if (status === 'resolved') return 'Done ✅';
    if (status === 'fake') return 'Fake 🚫';
    return status;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'assigned':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'fake':
        return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
      default:
        return 'bg-sky-500/20 text-sky-400 border-sky-400/30';
    }
  };

  const getUserRiskBadge = (userid: string) => {
    const stats = userStatsMap[userid];
    if (!stats) return null;

    if (stats.isBlacklisted) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-400/30">
          🚫 BLACKLISTED ({stats.fakeComplaints}/{stats.totalComplaints} fake)
        </span>
      );
    }

    if (stats.fakeComplaints >= 4) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-400/30">
          ⚠️ HIGH RISK: {stats.fakeComplaints}/{stats.totalComplaints} fake
        </span>
      );
    }

    if (stats.fakeComplaints >= 3) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-400/30">
          ⚠️ WARNING: {stats.fakeComplaints}/{stats.totalComplaints} fake
        </span>
      );
    }

    if (stats.fakeComplaints > 0) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">
          {stats.fakeComplaints}/{stats.totalComplaints} fake
        </span>
      );
    }

    return null;
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

          {/* TABS */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'overview'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-400/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              📋 Complaints
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              📈 Analytics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'users'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              👤 All Users
            </button>
            <button
              onClick={() => setActiveTab('blacklist')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'blacklist'
                  ? 'bg-red-500/20 text-red-400 border border-red-400/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              🚫 Blacklisted Users ({blacklistedUsers.length})
            </button>
          </div>

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-white/10 rounded-xl text-center border border-white/10">
                  <p className="text-gray-300 text-sm">Total</p>
                  <h2 className="text-2xl font-bold">{total}</h2>
                </div>
                <div className="p-4 bg-sky-500/20 rounded-xl text-center border border-sky-400/20">
                  <p className="text-gray-300 text-sm">Open</p>
                  <h2 className="text-2xl font-bold">{open.length}</h2>
                </div>
                <div className="p-4 bg-yellow-500/20 rounded-xl text-center border border-yellow-400/20">
                  <p className="text-gray-300 text-sm">Assigned</p>
                  <h2 className="text-2xl font-bold">{assigned.length}</h2>
                </div>
                <div className="p-4 bg-green-500/20 rounded-xl text-center border border-green-400/20">
                  <p className="text-gray-300 text-sm">Done</p>
                  <h2 className="text-2xl font-bold">{done.length}</h2>
                </div>
                <div className="p-4 bg-red-500/20 rounded-xl text-center border border-red-400/20">
                  <p className="text-gray-300 text-sm">Fake</p>
                  <h2 className="text-2xl font-bold">{fake.length}</h2>
                </div>
              </div>

              {/* AdminCharts: Severity + Status */}
              <AdminCharts complaints={activeComplaints} />

              {/* Complaints by Area */}
              <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
                <h2 className="font-semibold mb-4 text-white">📍 Complaints by Area (Top 10)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={areaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                    <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill={DARK_COLORS[3]} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category + Time Trend Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Complaints by Category */}
                <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
                  <h2 className="font-semibold mb-4 text-white">📂 Complaints by Category</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={DARK_COLORS[i % DARK_COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Complaints Over Time */}
                <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
                  <h2 className="font-semibold mb-4 text-white">📅 Complaints Over Time (Last 30 Days)</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={timeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                      <Line type="monotone" dataKey="total" stroke={DARK_COLORS[3]} strokeWidth={2} dot={false} name="Total" />
                      <Line type="monotone" dataKey="resolved" stroke={DARK_COLORS[0]} strokeWidth={2} dot={false} name="Resolved" />
                      <Line type="monotone" dataKey="pending" stroke={DARK_COLORS[1]} strokeWidth={2} dot={false} name="Pending" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Worker Performance */}
              <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
                <h2 className="font-semibold mb-4 text-white">👷 Worker Performance</h2>
                {workerPerfData.length === 0 ? (
                  <p className="text-gray-400">No worker data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workerPerfData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="workerName" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                      <Bar dataKey="assigned" fill={DARK_COLORS[3]} radius={[4, 4, 0, 0]} name="Assigned" />
                      <Bar dataKey="resolved" fill={DARK_COLORS[0]} radius={[4, 4, 0, 0]} name="Resolved" />
                      <Bar dataKey="pending" fill={DARK_COLORS[1]} radius={[4, 4, 0, 0]} name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>
          )}

          {/* BLACKLIST TAB */}
          {activeTab === 'blacklist' && (
            <div className="mb-8 space-y-4">
              <h2 className="text-2xl font-bold text-white">Blacklisted Users</h2>
              {blacklistedUsers.length === 0 ? (
                <p className="text-gray-400">No blacklisted users.</p>
              ) : (
                <div className="space-y-4">
                  {blacklistedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex justify-between items-center flex-wrap gap-4"
                    >
                      <div>
                        <p className="font-bold text-white">{u.displayName || 'Unknown User'}</p>
                        <p className="text-sm text-gray-400">{u.email}</p>
                        <p className="text-sm text-red-400 mt-1">
                          Fake Complaints: {u.fakeComplaints} | Total: {u.totalComplaints}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Role: {u.role} | ID: {u.id.slice(0, 8)}...</p>
                      </div>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleUnblacklist(u.id)}
                      >
                        ✅ Unblacklist User
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ALL USERS TAB */}
          {activeTab === 'users' && (
            <div className="mb-8 space-y-4">
              <h2 className="text-2xl font-bold text-white">All Users</h2>
              <p className="text-gray-400 text-sm">
                Showing all registered users. Blacklisted users are shown in red. Click "Blacklist" to manually block a user.
              </p>
              {Object.values(userStatsMap).length === 0 ? (
                <p className="text-gray-400">No user data available.</p>
              ) : (
                <div className="space-y-3">
                  {Object.values(userStatsMap)
                    .sort((a, b) => b.fakeComplaints - a.fakeComplaints)
                    .map((stats) => (
                    <div
                      key={stats.userid}
                      className={`p-4 rounded-xl border flex justify-between items-center flex-wrap gap-4 ${
                        stats.isBlacklisted
                          ? 'bg-red-500/10 border-red-500/20'
                          : stats.fakeComplaints >= 3
                          ? 'bg-orange-500/10 border-orange-500/20'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-white">User ID: {stats.userid.slice(0, 8)}...</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-gray-400">Total: {stats.totalComplaints}</span>
                          <span className="text-sm text-red-400">Fake: {stats.fakeComplaints}</span>
                          <span className="text-sm text-gray-400">
                            Rate: {stats.totalComplaints > 0 ? Math.round((stats.fakeComplaints / stats.totalComplaints) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {stats.isBlacklisted ? (
                          <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-400/30">
                            🚫 BLACKLISTED
                          </span>
                        ) : stats.fakeComplaints >= 3 ? (
                          <span className="px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-400/30">
                            ⚠️ Near Threshold
                          </span>
                        ) : null}
                        {!stats.isBlacklisted && (
                          <Button
                            className="bg-red-600 hover:bg-red-700 text-xs"
                            onClick={() => handleBlacklist(stats.userid)}
                          >
                            🚫 Blacklist
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
          <>

          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">

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

            <div className="p-4 bg-red-500/20 rounded-xl text-center">
              <p>Fake</p>
              <h2 className="text-2xl font-bold">{fake.length}</h2>
            </div>

          </div>

          {/* HEATMAP */}
          <div className="mb-8 rounded-xl overflow-hidden border border-white/20">
            <div ref={mapRef} className="w-full h-[400px]" />
          </div>

          {/* COMPLAINT CARDS */}
          <div className="space-y-6">

            {activeComplaints.map((c) => (

                <div
                key={c.id}
                className="p-6 rounded-2xl bg-white/10 border border-white/20"
              >

                <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                  <h3 className="text-xl font-bold text-emerald-400">
                    {c.title}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {getUserRiskBadge(c.userid)}
                    {c.workerVerifiedFake && (
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-400/30">
                        🚫 Worker Verified Fake
                      </span>
                    )}
                  </div>
                </div>

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

                <div className="flex gap-3 mt-3 flex-wrap">

                  {c.status === 'open' && (
                    <select
                      onChange={(e) => assignWorker(c.id, e.target.value, c)}
                      className="bg-black border border-white/20 rounded px-2 py-1"
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
                    <Button onClick={() => updateStatus(c.id, 'resolved')}>
                      Mark Resolved
                    </Button>
                  )}

                  {userStatsMap[c.userid]?.isBlacklisted ? (
                    <span className="px-3 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-400/30">
                      🚫 User Blacklisted
                    </span>
                  ) : (
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleBlacklist(c.userid)}
                    >
                      🚫 Blacklist User
                    </Button>
                  )}

                  <Button
                    className="bg-gray-600 hover:bg-gray-700"
                    onClick={() => updateStatus(c.id, 'cancelled')}
                  >
                    Cancel
                  </Button>

                </div>

              </div>

            ))}

          </div>

          </>
          )}

        </div>

      </div>

    </main>
  );
}

