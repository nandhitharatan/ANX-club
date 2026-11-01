"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';

const data = [
  { name: 'Jan', events: 1, projects: 0 },
  { name: 'Feb', events: 2, projects: 1 },
  { name: 'Mar', events: 1, projects: 1 },
  { name: 'Apr', events: 4, projects: 2 },
  { name: 'May', events: 3, projects: 4 },
  { name: 'Jun', events: 6, projects: 5 },
];

export function ActivityChart() {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(true);
  }, []);

  return (
    <div style={{ width: '100%', height: 300 }}>
      {chartReady && <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-main)' }} 
            itemStyle={{ color: 'var(--text-main)' }} 
          />
          <Area type="monotone" dataKey="projects" stroke="var(--accent-color)" fillOpacity={1} fill="url(#colorProjects)" />
          <Area type="monotone" dataKey="events" stroke="var(--primary-color)" fillOpacity={1} fill="url(#colorEvents)" />
        </AreaChart>
      </ResponsiveContainer>}
    </div>
  );
}
