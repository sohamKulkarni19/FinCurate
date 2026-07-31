'use client';

import { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';

type FundChartProps = {
  data: { date: string, nav: number }[]
};

export default function FundChart({ data }: FundChartProps) {
  // We may want to downsample if the data is massive (e.g. 5000 points) to avoid lag, 
  // but Recharts usually handles a few thousand points okay.
  const chartData = useMemo(() => {
    // If more than 2000 points, take every Nth point to speed up rendering
    if (data.length > 2000) {
      const step = Math.ceil(data.length / 2000);
      return data.filter((_, i) => i % step === 0);
    }
    return data;
  }, [data]);

  const minNav = Math.min(...chartData.map(d => d.nav));
  const maxNav = Math.max(...chartData.map(d => d.nav));
  
  // Pad the domain slightly
  const domain = [Math.max(0, minNav * 0.9), maxNav * 1.1];

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            tickFormatter={(val) => format(new Date(val), 'MMM yyyy')}
            minTickGap={50}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#94a3b8"
            domain={domain}
            tickFormatter={(val) => `₹${val.toFixed(0)}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
            itemStyle={{ color: '#2dd4bf' }}
            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
            labelFormatter={(label: any) => format(new Date(label), 'dd MMM yyyy')}
            formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'NAV']}
          />
          <Area 
            type="monotone" 
            dataKey="nav" 
            stroke="#2dd4bf" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorNav)" 
            activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#0f172a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
