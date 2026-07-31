'use client';

import { useState, useMemo } from 'react';
import { calculateCAGR } from '@/domain/math';
import { format } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

type RollingLumpsumAnalysisProps = {
  navs: { date: string, nav: number }[]
};

export default function RollingLumpsumAnalysis({ navs }: RollingLumpsumAnalysisProps) {
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(100000);
  const [durationYears, setDurationYears] = useState<number>(3);

  // Convert string dates to Date objects once
  const parsedNavs = useMemo(() => {
    return navs.map(n => ({ date: new Date(n.date), nav: n.nav }));
  }, [navs]);

  const rollingData = useMemo(() => {
    if (parsedNavs.length === 0) return [];

    const durationDays = durationYears * 365.25;
    const msPerDay = 1000 * 60 * 60 * 24;
    const results = [];
    
    // We step by 30 days
    const step = 30; 

    for (let i = 0; i < parsedNavs.length; i += step) {
      const startPt = parsedNavs[i];
      const targetEndDate = new Date(startPt.date.getTime() + durationDays * msPerDay);
      
      let endIndex = i;
      while (endIndex < parsedNavs.length && parsedNavs[endIndex].date < targetEndDate) {
        endIndex++;
      }

      if (endIndex >= parsedNavs.length) {
        break;
      }

      const endPt = parsedNavs[endIndex];
      
      const cagr = calculateCAGR(
        { date: startPt.date, nav: startPt.nav },
        { date: endPt.date, nav: endPt.nav }
      );
      
      // Calculate final value
      const units = lumpsumAmount / startPt.nav;
      const finalValue = units * endPt.nav;

      // Ignore extreme outliers due to data glitches
      if (cagr > -0.99 && cagr < 2.0) { 
        results.push({
          endDate: endPt.date.toISOString(),
          cagr: cagr * 100,
          finalValue: finalValue
        });
      }
    }

    return results;
  }, [parsedNavs, lumpsumAmount, durationYears]);

  if (rollingData.length === 0) {
    return (
      <div className="text-zinc-500 text-center py-10">
        Not enough historical data for a {durationYears}-year rolling analysis.
      </div>
    );
  }

  const avgCagr = rollingData.reduce((sum, d) => sum + d.cagr, 0) / rollingData.length;
  const maxCagr = Math.max(...rollingData.map(d => d.cagr));
  const minCagr = Math.min(...rollingData.map(d => d.cagr));
  
  const avgValue = rollingData.reduce((sum, d) => sum + d.finalValue, 0) / rollingData.length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Lumpsum Amount (₹)</label>
          <input 
            type="number" 
            value={lumpsumAmount}
            onChange={(e) => setLumpsumAmount(Number(e.target.value) || 0)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Duration</label>
          <div className="flex bg-zinc-900 border border-zinc-700 rounded-lg p-1">
            {[1, 3, 5, 10].map(years => (
              <button
                key={years}
                onClick={() => setDurationYears(years)}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                  durationYears === years 
                    ? 'bg-teal-500 text-zinc-950' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {years}Y
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-500 text-xs">Average CAGR</div>
          <div className="text-xl font-bold text-white mt-1">{avgCagr.toFixed(2)}%</div>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-500 text-xs">Max CAGR</div>
          <div className="text-xl font-bold text-teal-400 mt-1">{maxCagr.toFixed(2)}%</div>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-500 text-xs">Min CAGR</div>
          <div className="text-xl font-bold text-red-400 mt-1">{minCagr.toFixed(2)}%</div>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div className="text-zinc-500 text-xs">Avg Final Value</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">₹{avgValue.toFixed(0)}</div>
        </div>
      </div>

      <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rollingData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="endDate" 
              stroke="#94a3b8" 
              tickFormatter={(val) => format(new Date(val), 'MMM yy')}
              minTickGap={30}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#94a3b8"
              tickFormatter={(val) => `${val.toFixed(0)}%`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              itemStyle={{ color: '#818cf8' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
              labelFormatter={(label: any) => format(new Date(label), 'MMM yyyy')}
              formatter={(value: any, name: any) => {
                if (name === 'cagr') return [`${Number(value).toFixed(2)}%`, 'Rolling CAGR'];
                if (name === 'finalValue') return [`₹${Number(value).toFixed(0)}`, 'Final Value'];
                return [value, name];
              }}
            />
            <Line 
              type="monotone" 
              dataKey="cagr" 
              stroke="#818cf8" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
