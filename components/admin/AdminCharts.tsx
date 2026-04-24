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
  Legend,
} from 'recharts';

interface Props {
  complaints: any[];
}

const DARK_COLORS = ['#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#f472b6'];
const SEVERITY_COLORS = ['#34d399', '#fbbf24', '#f87171'];

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

  return (
    <div className="grid md:grid-cols-2 gap-6">

      {/* Severity Pie */}
      <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
        <h2 className="font-semibold mb-4 text-white">Severity Distribution</h2>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={severityData} dataKey="value" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
              {severityData.map((_, i) => (
                <Cell key={i} fill={SEVERITY_COLORS[i]} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
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

      {/* Status Bar */}
      <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
        <h2 className="font-semibold mb-4 text-white">Complaint Status</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" fill={DARK_COLORS[3]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

