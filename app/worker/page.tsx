'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // 📥 load assigned complaints
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

  if (loading || pageLoading) return <p className="p-10">Loading worker...</p>;

  return (
    <main className="min-h-screen bg-gray-50">

      <Navigation />

      <div className="max-w-5xl mx-auto p-6">

        <h1 className="text-3xl font-bold mb-6">
          Worker Dashboard
        </h1>

        {complaints.length === 0 && (
          <p>No complaints assigned yet.</p>
        )}

        <div className="space-y-4">

          {complaints.map((c) => (

            <Card key={c.id}>
              <CardContent className="p-4">

                <h3 className="font-semibold">{c.title}</h3>

                <p className="text-sm text-gray-600">
                  {c.location?.address}
                </p>

                <div className="flex gap-2 mt-2">
                  <Badge>{c.status}</Badge>
                  <Badge>{c.severity}</Badge>
                </div>

                <div className="flex gap-2 mt-3">

                  <Button
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?q=${c.location.latitude},${c.location.longitude}`
                      )
                    }
                  >
                    View Location
                  </Button>

                </div>

              </CardContent>
            </Card>

          ))}

        </div>

      </div>

    </main>
  );
}