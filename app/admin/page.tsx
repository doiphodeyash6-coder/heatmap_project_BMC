'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getAllComplaints, updateComplaint, Complaint } from '@/lib/firebase-service';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (!loading && userProfile?.role !== 'admin') router.push('/');
  }, [user, userProfile, loading, router]);

  useEffect(() => {
    if (userProfile?.role === 'admin') loadData();
  }, [userProfile]);

  const loadData = async () => {

    const c = await getAllComplaints();

    const usersSnapshot = await getDocs(collection(db, "users"));

    const workerList = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      // ✅ FIXED FILTER
      .filter((u:any) => u.role?.toLowerCase().trim() === "worker");

    setComplaints(c);
    setWorkers(workerList);

    setPageLoading(false);
  };

  const handleStatusUpdate = async (
    complaintId: string,
    newStatus: 'open' | 'assigned' | 'resolved'
  ) => {

    setUpdatingId(complaintId);

    await updateComplaint(complaintId, {
      status: newStatus,
      adminNotes: adminNotes[complaintId] || '',
    });

    setComplaints(prev =>
      prev.map(c =>
        c.id === complaintId
          ? { ...c, status: newStatus }
          : c
      )
    );

    setUpdatingId(null);
  };

  const handleAssignWorker = async (complaintId:string, workerId:string) => {

    await updateComplaint(complaintId, {
      workerId,
      status: "assigned"
    });

    loadData();
  };

  if (loading || pageLoading) return <p className="p-10">Loading admin...</p>;
  if (userProfile?.role !== 'admin') return null;

  const filteredComplaints = complaints.filter(c => {

    const searchMatch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.location.address.toLowerCase().includes(search.toLowerCase());

    const statusMatch =
      statusFilter === 'all' || c.status === statusFilter;

    const severityMatch =
      severityFilter === 'all' || c.severity === severityFilter;

    return searchMatch && statusMatch && severityMatch;
  });

  return (
    <main className="min-h-screen bg-gray-50">

      <Navigation />

      <div className="max-w-6xl mx-auto p-6">

        <h1 className="text-3xl font-bold mb-6">
          BMC Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{complaints.length}</p>
              <p className="text-sm text-gray-600">Total Complaints</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-red-600">
                {complaints.filter(c => c.status === 'open').length}
              </p>
              <p className="text-sm text-gray-600">Open</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {complaints.filter(c => c.severity === 'high').length}
              </p>
              <p className="text-sm text-gray-600">High Severity</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">
                {complaints.filter(c => c.status === 'resolved').length}
              </p>
              <p className="text-sm text-gray-600">Resolved</p>
            </CardContent>
          </Card>

        </div>

        <div className="flex gap-4 mb-6">
          {['overview', 'complaints', 'zones'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <AdminCharts complaints={complaints} />
        )}

        {activeTab === 'complaints' && (

          <div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">

              <Input
                placeholder="Search complaints..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <select
                className="border rounded p-2"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                className="border rounded p-2"
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

            </div>

            <div className="space-y-4">

              {filteredComplaints.map(c => (

                <Card key={c.id}>
                  <CardContent className="p-4">

                    <h3 className="font-semibold">{c.title}</h3>

                    <p className="text-sm text-gray-600">
                      {c.location.address}
                    </p>

                    <div className="flex gap-2 mt-2">
                      <Badge>{c.status}</Badge>
                      <Badge>{c.severity}</Badge>
                    </div>

                    <textarea
                      className="w-full border rounded p-2 mt-2"
                      placeholder="Admin notes..."
                      value={adminNotes[c.id] || ''}
                      onChange={e =>
                        setAdminNotes(prev => ({
                          ...prev,
                          [c.id]: e.target.value,
                        }))
                      }
                    />

                    <select
                      className="border p-2 rounded mt-2"
                      onChange={(e) => handleAssignWorker(c.id, e.target.value)}
                    >
                      <option value="">Assign Worker</option>

                      {workers.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}

                    </select>

                    <div className="flex gap-2 mt-3">

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === c.id}
                        onClick={() => handleStatusUpdate(c.id, 'assigned')}
                      >
                        Assign
                      </Button>

                      <Button
                        size="sm"
                        disabled={updatingId === c.id}
                        onClick={() => handleStatusUpdate(c.id, 'resolved')}
                      >
                        Resolve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `https://maps.google.com/?q=${c.location.latitude},${c.location.longitude}`
                          )
                        }
                      >
                        View Map
                      </Button>

                    </div>

                  </CardContent>
                </Card>

              ))}

            </div>

          </div>
        )}

        {activeTab === 'zones' && (
          <div>

            <h2 className="text-xl font-semibold mb-4">
              Waste Complaint Heatmap
            </h2>

            <Heatmap />

          </div>
        )}

      </div>

    </main>
  );
}