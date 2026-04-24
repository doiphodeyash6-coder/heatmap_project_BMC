'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { markComplaintAsFake } from "@/lib/firebase-service";
import { getUserEmail, sendComplaintResolvedEmail } from "@/lib/email-service";
import { toast } from "sonner";
import {
  groupByArea,
  groupByCategory,
  groupByDateForWorker,
  getWorkerStats,
} from "@/lib/analytics-utils";

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
} from "recharts";

const DARK_COLORS = ['#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#f472b6'];

export default function WorkerDashboard() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

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

  const handleComplete = async (id: string, complaint: any) => {
    await updateDoc(doc(db, "complaints", id), {
      status: "resolved"
    });

    try {
      const userEmail = await getUserEmail(complaint.userid);
      if (userEmail) {
        const result = await sendComplaintResolvedEmail(userEmail, complaint.title, id);
        if (result.preview) {
          toast.warning("Email preview logged to console — SMTP not configured. Check terminal.");
        } else {
          toast.success("Resolution email sent to complainant!");
        }
      } else {
        toast.error("No email found for this user.");
        console.warn("No email found for user:", complaint.userid);
      }
    } catch (err: any) {
      toast.error(`Email failed: ${err.message || "Unknown error"}`);
      console.error("Failed to send resolution email:", err);
    }

    loadComplaints();
  };

  const handleFake = async (id: string, userid: string) => {
    const confirm = window.confirm("Are you sure you want to mark this complaint as FAKE?");
    if (!confirm) return;

    const stats = await markComplaintAsFake(id, userid);
    
    if (stats.isBlacklisted) {
      alert(`🚫 Complaint marked as fake.\n\n⚠️ USER AUTO-BLACKLISTED!\nThis user now has ${stats.fakeComplaints} fake complaints out of ${stats.totalComplaints} total. They can no longer log in.`);
    } else if (stats.fakeComplaints >= 3) {
      alert(`🚫 Complaint marked as fake.\n\n⚠️ WARNING: This user has ${stats.fakeComplaints} fake complaints out of ${stats.totalComplaints} total. One more fake complaint will auto-blacklist them.`);
    } else {
      alert(`🚫 Complaint marked as fake.\n\nUser stats: ${stats.fakeComplaints} fake / ${stats.totalComplaints} total complaints.`);
    }
    
    loadComplaints();
  };

  // 📊 ANALYTICS DATA
  const stats = getWorkerStats(complaints);
  const areaData = groupByArea(complaints).slice(0, 8);
  const categoryData = groupByCategory(complaints);
  const timeData = groupByDateForWorker(complaints, 30);

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
                  {stats.progress}%
                </h2>
              </div>

            </div>

            {/* PROGRESS BAR */}
            <div className="mt-4 w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-emerald-400 to-green-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>

          </div>

          {/* TABS */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'tasks'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-400/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              📝 My Tasks
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              📈 My Analytics
            </button>
          </div>

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <>
              {/* 📊 STATS */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">

                <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-center">
                  <p>Total Tasks</p>
                  <h2 className="text-2xl font-bold">{stats.total}</h2>
                </div>

                <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 text-center">
                  <p>Completed</p>
                  <h2 className="text-2xl font-bold">{stats.completed}</h2>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4 text-center">
                  <p>Pending</p>
                  <h2 className="text-2xl font-bold">{stats.pending}</h2>
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
                        : c.status === 'fake'
                        ? 'bg-red-500/20 text-red-400 border-red-400/30'
                        : 'bg-sky-500/20 text-sky-400 border-sky-400/30'}
                    `}>
                      {c.status === 'resolved' ? 'Done ✅' : c.status === 'fake' ? 'Fake 🚫' : 'Pending'}
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
                        disabled={c.status === 'resolved' || c.status === 'fake'}
                        className={`hover:scale-105 ${
                          c.status === 'resolved' || c.status === 'fake'
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-green-600'
                        }`}
                        onClick={() => handleComplete(c.id, c)}
                      >
                        {c.status === 'resolved' ? 'Done ✅' : c.status === 'fake' ? 'Fake 🚫' : 'Mark Complete'}
                      </Button>

                      <Button
                        disabled={c.status === 'resolved' || c.status === 'fake'}
                        className={`hover:scale-105 ${
                          c.status === 'resolved' || c.status === 'fake'
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-500 to-rose-600'
                        }`}
                        onClick={() => handleFake(c.id, c.userid)}
                      >
                        {c.status === 'fake' ? 'Marked Fake' : 'Mark as Fake'}
                      </Button>

                    </div>

                  </div>

                ))}

              </div>
            </>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-center">
                  <p className="text-gray-300 text-sm">Total Tasks</p>
                  <h2 className="text-2xl font-bold">{stats.total}</h2>
                </div>
                <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 text-center">
                  <p className="text-gray-300 text-sm">Completed</p>
                  <h2 className="text-2xl font-bold">{stats.completed}</h2>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4 text-center">
                  <p className="text-gray-300 text-sm">Pending</p>
                  <h2 className="text-2xl font-bold">{stats.pending}</h2>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-4 text-center">
                  <p className="text-gray-300 text-sm">Done This Week</p>
                  <h2 className="text-2xl font-bold">{stats.completedThisWeek}</h2>
                </div>
              </div>

              {/* Completion Rate Big Card */}
              <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Overall Completion Rate</h3>
                    <p className="text-gray-400 text-sm">Based on all assigned tasks</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-4xl font-bold text-emerald-400">{stats.progress}%</h2>
                  </div>
                </div>
                <div className="mt-4 w-full bg-white/10 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 bg-gradient-to-r from-emerald-400 to-green-500"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
              </div>

              {/* Tasks Over Time + Category Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Tasks Over Time */}
                <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
                  <h2 className="font-semibold mb-4 text-white">📅 Tasks Over Time (Last 30 Days)</h2>
                  {timeData.every(d => d.total === 0) ? (
                    <p className="text-gray-400">No task data for this period.</p>
                  ) : (
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
                        <Line type="monotone" dataKey="total" stroke={DARK_COLORS[3]} strokeWidth={2} dot={false} name="Total Assigned" />
                        <Line type="monotone" dataKey="resolved" stroke={DARK_COLORS[0]} strokeWidth={2} dot={false} name="Completed" />
                        <Line type="monotone" dataKey="pending" stroke={DARK_COLORS[1]} strokeWidth={2} dot={false} name="Pending" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Tasks by Category */}
                <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
                  <h2 className="font-semibold mb-4 text-white">📂 Tasks by Category</h2>
                  {categoryData.length === 0 ? (
                    <p className="text-gray-400">No category data available.</p>
                  ) : (
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
                  )}
                </div>
              </div>

              {/* Tasks by Area */}
              <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
                <h2 className="font-semibold mb-4 text-white">📍 Tasks by Area</h2>
                {areaData.length === 0 ? (
                  <p className="text-gray-400">No area data available.</p>
                ) : (
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
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </main>
  );
}

