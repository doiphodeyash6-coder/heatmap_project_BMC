'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { getUserComplaints, Complaint } from '@/lib/firebase-service';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';

export default function ComplaintsPage() {

  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<(Complaint & { id: string })[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // 🔐 PROTECT ROUTE (NO LOOP)
  useEffect(() => {

    if (loading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!userProfile) return;

    // ✅ redirect only if wrong role
    if (userProfile.role === "worker") {
      router.replace('/worker');
      return;
    }

    if (userProfile.role === "admin") {
      router.replace('/admin');
      return;
    }

  }, [user, userProfile, loading]);

  // 📦 LOAD DATA (ONLY ONCE)
  useEffect(() => {

    if (!user) return;

    const loadData = async () => {
      const data = await getUserComplaints(user.uid);
      setComplaints(data);
      setDataLoading(false);
    };

    loadData();

  }, [user?.uid]); // ✅ IMPORTANT (prevents infinite loop)

  // ⏳ LOADING UI
  if (loading || dataLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-gray-600">Loading complaints...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <Navigation />

      <div className="max-w-5xl mx-auto p-6">

        <h1 className="text-3xl font-bold mb-6">My Complaints</h1>

        {complaints.length === 0 ? (

          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-gray-600">No complaints found</p>
            </CardContent>
          </Card>

        ) : (

          <div className="space-y-4">

            {complaints.map((c) => (

              <Card key={c.id}>
                <CardContent className="p-4">

                  <h3 className="font-semibold text-lg">
                    {c.title}
                  </h3>

                  <p className="text-gray-600 text-sm mt-1">
                    {c.description}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    📍 {c.location.address}
                  </p>

                  <div className="mt-2 text-sm">
                    <span className="mr-3">Status: <b>{c.status}</b></span>
                    <span>Severity: <b>{c.severity}</b></span>
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