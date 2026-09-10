'use client';

import { useState, useMemo } from 'react';
import { generateSipCashFlows, calculateXIRR } from '@/domain/math';
import { format } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

type RollingSipAnalysisProps = {
  navs: { date: string, nav: number }[]
};

export default function RollingSipAnalysis({ navs }: RollingSipAnalysisProps) {
  const [sipAmount, setSipAmount] = useState<number>(10000);
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
    
    // We step by 30 days to avoid calculating XIRR for every single day (too slow)
    // 30 days roughly = 1 month rolling step
    const step = 30; 

    for (let i = 0; i < parsedNavs.length; i += step) {
      const startDate = parsedNavs[i].date;
      const targetEndDate = new Date(startDate.getTime() + durationDays * msPerDay);
      
      // Find the end index
      let endIndex = i;
      while (endIndex < parsedNavs.length && parsedNavs[endIndex].date < targetEndDate) {
        endIndex++;
      }

      if (endIndex >= parsedNavs.length) {
        // Not enough data for this window
        break;
      }

      // We have a window from `i` to `endIndex`
      // For SIP, we assume monthly investments. Let's slice the navs and pick one day per month
      const windowNavs = parsedNavs.slice(i, endIndex + 1);
      
      // Downsample to monthly points for the SIP simulation
      const monthlyNavs = [];
      let currentMonth = -1;
      for (const pt of windowNavs) {
        if (pt.date.getMonth() !== currentMonth) {
          monthlyNavs.push(pt);
          currentMonth = pt.date.getMonth();
        }
      }

      const flows = generateSipCashFlows(sipAmount, monthlyNavs);
      const xirr = calculateXIRR(flows);
      
      // XIRR is an annualized decimal. Convert to percentage.
      // Ignore crazy outliers from bad convergence
      if (xirr > -0.99 && xirr < 2.0) { 
        results.push({
          endDate: parsedNavs[endIndex].date.toISOString(),
          xirr: xirr * 100,
          finalAmount: flows[flows.length - 1].amount
        });
      }
    }

    return results;
  }, [parsedNavs, sipAmount, durationYears]);

  const avgXirr = rollingData.length > 0 ? rollingData.reduce((sum, d) => sum + d.xirr, 0) / rollingData.length : 0;
  const maxXirr = rollingData.length > 0 ? Math.max(...rollingData.map(d => d.xirr)) : 0;
  const minXirr = rollingData.length > 0 ? Math.min(...rollingData.map(d => d.xirr)) : 0;
  const avgFinalAmount = rollingData.length > 0 ? rollingData.reduce((sum, d) => sum + d.finalAmount, 0) / rollingData.length : 0;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Monthly SIP (₹)</label>
          <input 
            type="number" 
            value={sipAmount}
            onChange={(e) => setSipAmount(Number(e.target.value) || 0)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Duration</label>
          <div className="flex bg-zinc-900 border border-zinc-700 rounded-lg p-1">
            {[0.25, 0.5, 1, 3, 5, 10].map(years => (
              <button
                key={years}
                onClick={() => setDurationYears(years)}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                  durationYears === years 
                    ? 'bg-teal-500 text-zinc-950' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {years === 0.25 ? '3M' : years === 0.5 ? '6M' : `${years}Y`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rollingData.length === 0 ? (
        <div className="text-zinc-500 text-center py-10">
          Not enough historical data for a {durationYears}-year rolling analysis.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <div className="text-zinc-500 text-xs">Average XIRR</div>
              <div className={`text-xl font-bold mt-1 ${avgXirr >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>{avgXirr.toFixed(2)}%</div>
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <div className="text-zinc-500 text-xs">Max XIRR</div>
              <div className={`text-xl font-bold mt-1 ${maxXirr >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>{maxXirr.toFixed(2)}%</div>
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <div className="text-zinc-500 text-xs">Min XIRR</div>
              <div className={`text-xl font-bold mt-1 ${minXirr >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>{minXirr.toFixed(2)}%</div>
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <div className="text-zinc-500 text-xs">Avg Final Amount</div>
              <div className="text-xl font-bold text-teal-400 mt-1">₹{avgFinalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
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
              width={80}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              itemStyle={{ color: '#2dd4bf' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
              labelFormatter={(label: any) => format(new Date(label), 'MMM yyyy')}
              formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Rolling XIRR']}
            />
            <Line 
              type="monotone" 
              dataKey="xirr" 
              stroke="#2dd4bf" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      </>
      )}
    </div>
  );
}
