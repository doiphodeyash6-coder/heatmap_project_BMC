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
  onSnapshot,
  increment,
  setDoc
} from "firebase/firestore";

import { db } from "./firebase";

/* ================================
   INTERFACES
================================ */

export interface UserStats {
  totalComplaints: number;
  fakeComplaints: number;
  isBlacklisted: boolean;
  isFlagged: boolean;
  lastComplaintAt: Timestamp | null;
}

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

/* ================================
   USER STATS & BLACKLIST
================================ */

export async function getUserStats(userid: string): Promise<UserStats> {
  const ref = doc(db, "userStats", userid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const defaultStats: UserStats = {
      totalComplaints: 0,
      fakeComplaints: 0,
      isBlacklisted: false,
      isFlagged: false,
      lastComplaintAt: null,
    };
    await setDoc(ref, defaultStats);
    return defaultStats;
  }

  return snap.data() as UserStats;
}

export async function incrementUserComplaintCount(userid: string) {
  const ref = doc(db, "userStats", userid);
  const snap = await getDoc(ref);
  const now = Timestamp.now();

  if (!snap.exists()) {
    await setDoc(ref, {
      totalComplaints: 1,
      fakeComplaints: 0,
      isBlacklisted: false,
      isFlagged: false,
      lastComplaintAt: now,
    });
  } else {
    await updateDoc(ref, {
      totalComplaints: increment(1),
      lastComplaintAt: now,
    });
  }
}

export async function flagUserAsFake(userid: string) {
  const ref = doc(db, "userStats", userid);
  await updateDoc(ref, {
    isFlagged: true,
    fakeComplaints: increment(1),
  });
}

export async function blacklistUser(userid: string) {
  const ref = doc(db, "userStats", userid);
  await updateDoc(ref, {
    isBlacklisted: true,
  });
}

export async function unblacklistUser(userid: string) {
  const ref = doc(db, "userStats", userid);
  await updateDoc(ref, {
    isBlacklisted: false,
    isFlagged: false,
    fakeComplaints: 0,
  });
}

export async function markComplaintAsFake(complaintId: string, userid: string) {
  const complaintRef = doc(db, "complaints", complaintId);
  await updateDoc(complaintRef, {
    status: "fake",
    workerVerifiedFake: true,
    updatedAt: Timestamp.now(),
  });

  const statsRef = doc(db, "userStats", userid);
  const statsSnap = await getDoc(statsRef);

  let newStats: UserStats;

  if (!statsSnap.exists()) {
    newStats = {
      totalComplaints: 1,
      fakeComplaints: 1,
      isBlacklisted: false,
      isFlagged: true,
      lastComplaintAt: Timestamp.now(),
    };
    await setDoc(statsRef, newStats);

  } else {
    const current = statsSnap.data() as UserStats;
    const newFakeCount = (current.fakeComplaints || 0) + 1;
    const newTotalCount = (current.totalComplaints || 0) + 1;
    
    // 🚫 AUTO-BLACKLIST: if user has >= 4 fake complaints
    const shouldBlacklist = newFakeCount >= 4;
    
    newStats = {
      ...current,
      fakeComplaints: newFakeCount,
      totalComplaints: newTotalCount,
      isFlagged: true,
      isBlacklisted: shouldBlacklist || current.isBlacklisted,
    };
    
    await updateDoc(statsRef, {
      fakeComplaints: newFakeCount,
      totalComplaints: newTotalCount,
      isFlagged: true,
      isBlacklisted: shouldBlacklist || current.isBlacklisted,
    });
  }

  return newStats;
}
