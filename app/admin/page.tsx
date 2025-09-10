
'use client';
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Admin() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/stats');
      const js = await res.json();
      if (!res.ok) { setError(js.error || 'Failed to load'); return; }
      setData(js);
    })();
  }, []);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  const chartData = (data.q7_breakdown || []).map((d: any) => ({ name: d.label, count: Number(d.count) }));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <div className="text-sm text-gray-600">Total Responses</div>
          <div className="text-3xl font-bold">{data.totals?.responses ?? 0}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-gray-600">Survey</div>
          <div className="text-lg">{data.survey?.title}</div>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Q7: AI Usage Breakdown</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
