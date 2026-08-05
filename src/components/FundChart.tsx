'use client';

import { useMemo, useState } from 'react';
import { calculateCAGR } from '@/domain/math';
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
  const [duration, setDuration] = useState<string>('ALL');

  const chartData = useMemo(() => {
    let filteredData = data;
    if (duration !== 'ALL' && data.length > 0) {
      const lastDate = new Date(data[data.length - 1].date);
      let startDate = new Date(lastDate);
      
      if (duration === '3M') startDate.setMonth(startDate.getMonth() - 3);
      else if (duration === '6M') startDate.setMonth(startDate.getMonth() - 6);
      else if (duration === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
      else if (duration === '3Y') startDate.setFullYear(startDate.getFullYear() - 3);
      else if (duration === '5Y') startDate.setFullYear(startDate.getFullYear() - 5);
      
      filteredData = data.filter(d => new Date(d.date) >= startDate);
    }

    if (filteredData.length > 2000) {
      const step = Math.ceil(filteredData.length / 2000);
      return filteredData.filter((_, i) => i % step === 0);
    }
    return filteredData;
  }, [data, duration]);

  const minNav = chartData.length > 0 ? Math.min(...chartData.map(d => d.nav)) : 0;
  const maxNav = chartData.length > 0 ? Math.max(...chartData.map(d => d.nav)) : 0;
  
  // Pad the domain slightly
  const domain = [Math.max(0, minNav * 0.9), maxNav * 1.1];

  const isPositive = chartData.length > 1 ? chartData[chartData.length - 1].nav >= chartData[0].nav : true;
  const color = isPositive ? "#2dd4bf" : "#ef4444";
  
  const isAnnualized = duration !== '3M' && duration !== '6M';
  
  let displayReturn = 0;
  if (chartData.length > 1) {
    if (isAnnualized) {
      displayReturn = calculateCAGR(
        { date: new Date(chartData[0].date), nav: chartData[0].nav },
        { date: new Date(chartData[chartData.length - 1].date), nav: chartData[chartData.length - 1].nav }
      ) * 100;
    } else {
      displayReturn = ((chartData[chartData.length - 1].nav - chartData[0].nav) / chartData[0].nav) * 100;
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium">
          <span className="text-zinc-400 mr-2">{isAnnualized ? "Annualized Return:" : "Absolute Return:"}</span>
          <span className={isPositive ? "text-teal-400" : "text-red-400"}>
            {displayReturn > 0 ? "+" : ""}{displayReturn.toFixed(2)}%
          </span>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-700 rounded-lg p-1">
          {['3M', '6M', '1Y', '3Y', '5Y', 'ALL'].map(dur => (
            <button
              key={dur}
              onClick={() => setDuration(dur)}
              className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                duration === dur 
                  ? 'bg-zinc-700 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {dur}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
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
              width={80}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              itemStyle={{ color: color }}
              labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
              labelFormatter={(label: any) => format(new Date(label), 'dd MMM yyyy')}
              formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'NAV']}
            />
            <Area 
              type="monotone" 
              dataKey="nav" 
              stroke={color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorNav)" 
              activeDot={{ r: 6, fill: color, stroke: '#0f172a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
