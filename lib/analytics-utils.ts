/**
 * Pure utility functions for aggregating complaint data into chart-friendly formats.
 */

export interface ChartPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface TimeSeriesPoint {
  date: string;
  total: number;
  resolved: number;
  pending: number;
}

export interface WorkerPerformance {
  workerId: string;
  workerName: string;
  assigned: number;
  resolved: number;
  pending: number;
}

/**
 * Extract a simple area/ward name from a Mumbai address string.
 * Falls back to "Other" if no known area is found.
 */
export function extractArea(address: string): string {
  if (!address) return "Other";
  const lower = address.toLowerCase();

  // Common Mumbai areas / wards
  const areas = [
    "andheri", "bandra", "borivali", "dadar", "matunga", "wadala",
    "colaba", "churchgate", "nariman point", "malad", "kandivali",
    "goregaon", "jogeshwari", "vile parle", "santacruz", "khar",
    "mahim", "sion", "chembur", "govandi", "mankhurd", "kurla",
    "vikhroli", "ghatkopar", "bhandup", "mulund", "thane", "powai",
    "marol", "saki naka", "chakala", "seepz", "mira road", "bhayandar",
    "dahisar", "kharodi", "parel", "lower parel", "worli", "prabhadevi",
    "mazgaon", "byculla", "nagpada", "mumbai central", "grant road",
    "charni road", "marine lines", "girgaon", "tardeo", "mahalaxmi",
    "bkc", "kalina", "vidyavihar", "kanjurmarg", "nahur", "airoli",
    "nerul", "vashi", "sanpada", "kopar khairane", "juinagar"
  ];

  for (const area of areas) {
    if (lower.includes(area)) {
      // Title-case the area
      return area
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  // Try to extract anything before the first comma as a fallback
  const firstPart = address.split(",")[0].trim();
  if (firstPart && firstPart.length < 30) return firstPart;

  return "Other";
}

/**
 * Group complaints by extracted area/ward.
 */
export function groupByArea(complaints: any[]): ChartPoint[] {
  const counts: Record<string, number> = {};
  for (const c of complaints) {
    const area = extractArea(c.location?.address || "");
    counts[area] = (counts[area] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Group complaints by category.
 */
export function groupByCategory(complaints: any[]): ChartPoint[] {
  const counts: Record<string, number> = {};
  for (const c of complaints) {
    const cat = c.category || "other";
    const label = cat
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
    counts[label] = (counts[label] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Group complaints by severity.
 */
export function groupBySeverity(complaints: any[]): ChartPoint[] {
  const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
  for (const c of complaints) {
    const sev = (c.severity || "low").toLowerCase();
    const key = sev.charAt(0).toUpperCase() + sev.slice(1);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

/**
 * Group complaints by status (excluding cancelled).
 */
export function groupByStatus(complaints: any[]): ChartPoint[] {
  const counts: Record<string, number> = { Open: 0, Assigned: 0, Resolved: 0 };
  for (const c of complaints) {
    const st = (c.status || "open").toLowerCase();
    const key = st.charAt(0).toUpperCase() + st.slice(1);
    if (counts[key] !== undefined) {
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

/**
 * Build a time-series of complaints over the last N days.
 */
export function groupByDate(
  complaints: any[],
  days: number = 30
): TimeSeriesPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result: TimeSeriesPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    result.push({ date: label, total: 0, resolved: 0, pending: 0 });
  }

  for (const c of complaints) {
    const created = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
    const diffTime = today.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < days) {
      const idx = days - 1 - diffDays;
      result[idx].total += 1;
      if (c.status === "resolved") {
        result[idx].resolved += 1;
      } else if (c.status !== "cancelled") {
        result[idx].pending += 1;
      }
    }
  }

  return result;
}

/**
 * Build a time-series for a single worker over the last N days.
 */
export function groupByDateForWorker(
  complaints: any[],
  days: number = 30
): TimeSeriesPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result: TimeSeriesPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    result.push({ date: label, total: 0, resolved: 0, pending: 0 });
  }

  for (const c of complaints) {
    const created = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
    const diffTime = today.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < days) {
      const idx = days - 1 - diffDays;
      result[idx].total += 1;
      if (c.status === "resolved") {
        result[idx].resolved += 1;
      } else {
        result[idx].pending += 1;
      }
    }
  }

  return result;
}

/**
 * Calculate worker performance metrics.
 */
export function getWorkerPerformance(
  complaints: any[],
  workers: any[]
): WorkerPerformance[] {
  const map: Record<
    string,
    { assigned: number; resolved: number; name: string }
  > = {};

  for (const w of workers) {
    map[w.id] = { assigned: 0, resolved: 0, name: w.displayName || w.email || "Worker" };
  }

  for (const c of complaints) {
    const wid = c.workerId;
    if (!wid || !map[wid]) continue;
    map[wid].assigned += 1;
    if (c.status === "resolved") {
      map[wid].resolved += 1;
    }
  }

  return Object.entries(map)
    .map(([workerId, data]) => ({
      workerId,
      workerName: data.name,
      assigned: data.assigned,
      resolved: data.resolved,
      pending: data.assigned - data.resolved,
    }))
    .sort((a, b) => b.assigned - a.assigned);
}

/**
 * Calculate basic worker stats for the worker dashboard.
 */
export function getWorkerStats(complaints: any[]) {
  const total = complaints.length;
  const completed = complaints.filter((c) => c.status === "resolved").length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Weekly stats
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const thisWeek = complaints.filter((c) => {
    const d = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
    return d >= weekAgo;
  });

  const completedThisWeek = thisWeek.filter(
    (c) => c.status === "resolved"
  ).length;

  return {
    total,
    completed,
    pending,
    progress,
    completedThisWeek,
  };
}

