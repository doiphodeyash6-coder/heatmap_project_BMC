'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface Props {
  complaints: any[];
}

export default function AdminCharts({ complaints }: Props) {
  // 📊 Severity data
  const severityData = [
    { name: 'Low', value: complaints.filter(c => c.severity === 'low').length },
    { name: 'Medium', value: complaints.filter(c => c.severity === 'medium').length },
    { name: 'High', value: complaints.filter(c => c.severity === 'high').length },
  ];

  // 📊 Status data
  const statusData = [
    { name: 'Open', value: complaints.filter(c => c.status === 'open').length },
    { name: 'Assigned', value: complaints.filter(c => c.status === 'assigned').length },
    { name: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length },
  ];

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="grid md:grid-cols-2 gap-6">

      {/* Severity Pie */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3">Severity Distribution</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={severityData} dataKey="value" outerRadius={80}>
              {severityData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3">Complaint Status</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
