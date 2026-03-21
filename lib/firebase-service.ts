import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
  QueryConstraint,
  onSnapshot
} from "firebase/firestore";

import { db } from "./firebase";

/* ================================
   INTERFACES
================================ */

export interface Complaint {
  id?: string;

  userid: string;

  title: string;
  description: string;

  location: {
    latitude: number;
    longitude: number;
    address: string;
  };

  ward?: string;
workerId?: string;
  category:
    | "trash_overflow"
    | "missed_collection"
    | "improper_disposal"
    | "other";

  severity: "low" | "medium" | "high";

  photos?: string[];

  status: "open" | "assigned" | "resolved";

  createdAt: Timestamp;
  updatedAt: Timestamp;

  adminNotes?: string;
}

export interface Zone {
  id?: string;

  name: string;

  centerLat: number;
  centerLng: number;

  radius: number;

  complaintCount: number;

  lastUpdated: Timestamp;

  status: "active" | "resolved";
}

/* ================================
   CREATE COMPLAINT
================================ */

export async function createComplaint(
  complaint: Omit<Complaint, "id" | "createdAt" | "updatedAt">
) {
  const docRef = await addDoc(collection(db, "complaints"), {
    ...complaint,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  return docRef.id;
}

/* ================================
   USER COMPLAINTS
================================ */

export async function getUserComplaints(userid: string) {
  const q = query(
    collection(db, "complaints"),
    where("userid", "==", userid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Complaint)
  }));
}

/* ================================
   ALL COMPLAINTS (ADMIN / HEATMAP)
================================ */

export async function getAllComplaints(constraints?: QueryConstraint[]) {
  const baseConstraints: QueryConstraint[] = [
    orderBy("createdAt", "desc")
  ];

  if (constraints) {
    baseConstraints.push(...constraints);
  }

  const q = query(collection(db, "complaints"), ...baseConstraints);

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Complaint)
  }));
}

/* ================================
   GET COMPLAINT BY ID
================================ */

export async function getComplaintById(id: string) {
  const ref = doc(db, "complaints", id);

  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Complaint)
  };
}

/* ================================
   UPDATE COMPLAINT
================================ */

export async function updateComplaint(
  id: string,
  updates: Partial<Complaint>
) {
  const ref = doc(db, "complaints", id);

  await updateDoc(ref, {
    ...updates,
    updatedAt: Timestamp.now()
  });
}

/* ================================
   DELETE COMPLAINT
================================ */

export async function deleteComplaint(id: string) {
  await deleteDoc(doc(db, "complaints", id));
}

/* ================================
   COMPLAINT FILTER BY STATUS
================================ */

export async function getComplaintsByStatus(
  status: "open" | "assigned" | "resolved"
) {
  const q = query(
    collection(db, "complaints"),
    where("status", "==", status),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Complaint)
  }));
}

/* ================================
   REALTIME COMPLAINT LISTENER
================================ */

export function listenToComplaints(
  callback: (data: (Complaint & { id: string })[]) => void
) {
  const q = query(
    collection(db, "complaints"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Complaint)
    }));

    callback(data);
  });
}

/* ================================
   ADMIN ANALYTICS
================================ */

export async function getComplaintAnalytics() {
  const complaints = await getAllComplaints();

  const analytics = {
    total: complaints.length,
    open: 0,
    assigned: 0,
    resolved: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  complaints.forEach(c => {
    if (c.status === "open") analytics.open++;
    if (c.status === "assigned") analytics.assigned++;
    if (c.status === "resolved") analytics.resolved++;

    if (c.severity === "high") analytics.high++;
    if (c.severity === "medium") analytics.medium++;
    if (c.severity === "low") analytics.low++;
  });

  return analytics;
}

/* ================================
   ZONE FUNCTIONS
================================ */

export async function createZone(zone: Omit<Zone, "id">) {
  const docRef = await addDoc(collection(db, "zones"), zone);
  return docRef.id;
}

export async function getZones() {
  const q = query(
    collection(db, "zones"),
    orderBy("complaintCount", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Zone)
  }));
}

export async function updateZone(
  id: string,
  updates: Partial<Zone>
) {
  const ref = doc(db, "zones", id);

  await updateDoc(ref, {
    ...updates,
    lastUpdated: Timestamp.now()
  });
}

/* ================================
   ZONE DETECTION
================================ */

export async function detectZones() {

  const complaints = await getAllComplaints();

  const zones = new Map<
    string,
    { lat: number; lng: number; complaints: Complaint[] }
  >();

  const CLUSTER_RADIUS = 500;
  const MIN_COMPLAINTS = 5;

  for (const complaint of complaints) {

    let found = false;

    for (const zone of zones.values()) {

      const dist = haversineDistance(
        complaint.location.latitude,
        complaint.location.longitude,
        zone.lat,
        zone.lng
      );

      if (dist <= CLUSTER_RADIUS) {
        zone.complaints.push(complaint);
        found = true;
        break;
      }

    }

    if (!found) {

      const key =
        complaint.location.latitude +
        "-" +
        complaint.location.longitude;

      zones.set(key, {
        lat: complaint.location.latitude,
        lng: complaint.location.longitude,
        complaints: [complaint]
      });

    }

  }

  const existingZones = await getZones();

  for (const zone of zones.values()) {

    if (zone.complaints.length >= MIN_COMPLAINTS) {

      const existing = existingZones.find(
        z =>
          Math.abs(z.centerLat - zone.lat) < 0.01 &&
          Math.abs(z.centerLng - zone.lng) < 0.01
      );

      if (existing) {

        await updateZone(existing.id!, {
          complaintCount: zone.complaints.length
        });

      } else {

        await createZone({
          name: "Zone " + new Date().toISOString().slice(0, 10),
          centerLat: zone.lat,
          centerLng: zone.lng,
          radius: CLUSTER_RADIUS,
          complaintCount: zone.complaints.length,
          lastUpdated: Timestamp.now(),
          status: "active"
        });

      }

    }

  }

}

/* ================================
   DISTANCE CALCULATION
================================ */

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {

  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;

}
/* ================================
   WORKER COMPLAINTS
================================ */

export async function getWorkerComplaints(workerId: string) {

  const q = query(
    collection(db, "complaints"),
    where("workerId", "==", workerId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Complaint)
  }));
}