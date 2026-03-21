'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getWorkerComplaints, updateComplaint, Complaint } from '@/lib/firebase-service';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function WorkerDashboard() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<(Complaint & { id: string })[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const [error, setError] = useState('');

  // ✅ Protect route
  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (!loading && userProfile?.role !== "worker") router.push('/');
  }, [user, userProfile, loading, router]);

  // ✅ Load worker complaints
  useEffect(() => {
    if (user) {
      loadComplaints();
    }
  }, [user]);

  const loadComplaints = async () => {
    try {
      if (!user) return;

      const data = await getWorkerComplaints(user.uid);
      setComplaints(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints');
    } finally {
      setPageLoading(false);
    }
  };

  // ✅ Mark resolved
  const markResolved = async (id: string) => {
    await updateComplaint(id, { status: "resolved" });
    loadComplaints();
  };

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[600px]">
          <p className="text-gray-600">Loading worker dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    assigned: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const filteredComplaints = complaints.filter((c) => {

    const searchMatch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());

    const statusMatch =
      statusFilter === 'all' || c.status === statusFilter;

    const severityMatch =
      severityFilter === 'all' || c.severity === severityFilter;

    return searchMatch && statusMatch && severityMatch;

  });

  return (
    <main className="min-h-screen bg-gray-50">

      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ✅ TITLE CHANGE */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Worker Dashboard</h1>
          <p className="text-gray-600">Your assigned complaints</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <Input
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            className="border rounded px-3 py-2"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* List */}
        {filteredComplaints.length === 0 ? (

          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-gray-600">No assigned complaints</p>
            </CardContent>
          </Card>

        ) : (

          <div className="space-y-4">

            {filteredComplaints.map((c) => (

              <Card key={c.id} className="hover:shadow-md transition">

                <CardHeader>
                  <div className="flex justify-between items-center">

                    <CardTitle>{c.title}</CardTitle>

                    <div className="flex gap-2">
                      <Badge className={severityColors[c.severity]}>
                        {c.severity}
                      </Badge>

                      <Badge className={statusColors[c.status]}>
                        {c.status}
                      </Badge>
                    </div>

                  </div>
                </CardHeader>

                <CardContent>

                  <p className="text-gray-700 mb-3">
                    {c.description}
                  </p>

                  <p className="text-sm text-gray-600">
                    📍 {c.location.address}
                  </p>

                  <div className="mt-4 flex gap-2">

                    <Button
                      size="sm"
                      onClick={() => markResolved(c.id)}
                    >
                      Mark Resolved
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

        )}

      </div>

    </main>
  );
}