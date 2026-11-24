'use client';

import { useEffect, useState, useMemo } from 'react';
import { useShortlistStore } from '@/store/useShortlistStore';
import { getMultipleSchemesDetails } from '@/app/actions/schemes';
import { normalizeNavsForComparison, calculateCAGR, calculateMaxDrawdown, generateSipCashFlows, calculateXIRR } from '@/domain/math';
import { format } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import AutoAnalysis from '@/components/AutoAnalysis';
import SearchAutocomplete from '@/components/SearchAutocomplete';

// Pre-defined contrasting colors for lines
const CHART_COLORS = ['#2dd4bf', '#818cf8', '#fbbf24', '#f87171', '#a78bfa', '#34d399'];

const isValidNumber = (val: any): val is number => {
  return val != null && typeof val === 'number' && !isNaN(val) && isFinite(val);
};

const formatPct = (val?: number | null) => {
  if (!isValidNumber(val)) return '-';
  return (val * 100).toFixed(2) + '%';
};

const formatNum = (val?: number | null) => {
  if (!isValidNumber(val)) return '-';
  return val.toFixed(2);
};

export default function ComparePage() {
  const shortlist = useShortlistStore(state => state.shortlist);
  const [loading, setLoading] = useState(true);
  const [fundsData, setFundsData] = useState<any[]>([]);
  const [rollingDuration, setRollingDuration] = useState<number>(3);

  useEffect(() => {
    async function fetchData() {
      if (shortlist.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const schemeCodes = shortlist.map(f => f.schemeCode);
        const data = await getMultipleSchemesDetails(schemeCodes);
        setFundsData(data);
      } catch (error) {
        console.error("Failed to fetch compare data", error);
      } finally {
        setLoading(false);
      }
    }

    // Since shortlist comes from localStorage, wait for it to hydrate
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [shortlist]);

  const formattedFunds = useMemo(() => {
    return fundsData.map(f => ({
      schemeCode: f.schemeCode,
      name: f.name,
      navs: [...f.navs].sort((a, b) => a.navDate.getTime() - b.navDate.getTime()).map(n => ({
        date: n.navDate,
        nav: n.nav
      }))
    }));
  }, [fundsData]);

  const chartData = useMemo(() => {
    return normalizeNavsForComparison(formattedFunds, 10000);
  }, [formattedFunds]);

  const rollingChartData = useMemo(() => {
    if (formattedFunds.length === 0) return [];

    const durationDays = rollingDuration * 365.25;
    const msPerDay = 1000 * 60 * 60 * 24;
    const sipAmount = 10000;

    // Find the latest common inception date
    const startDates = formattedFunds.map(f => f.navs.length > 0 ? f.navs[0].date : new Date(0));
    const commonStart = new Date(Math.max(...startDates.map(d => d.getTime())));

    // The first window ends at commonStart + duration
    const firstWindowEnd = new Date(commonStart.getTime() + durationDays * msPerDay);
    
    // Find the earliest common end date
    const endDates = formattedFunds.map(f => f.navs.length > 0 ? f.navs[f.navs.length - 1].date : new Date(0));
    const commonEnd = new Date(Math.min(...endDates.map(d => d.getTime())));

    if (firstWindowEnd > commonEnd) return []; // Not enough data for this duration

    // Generate monthly evaluation dates
    const evalDates: Date[] = [];
    let curr = new Date(firstWindowEnd);
    while (curr <= commonEnd) {
      evalDates.push(new Date(curr));
      curr.setDate(curr.getDate() + 30);
    }

    const results = [];

    for (const evalDate of evalDates) {
      const windowStart = new Date(evalDate.getTime() - durationDays * msPerDay);
      const point: any = { date: evalDate.toISOString() };

      for (const f of formattedFunds) {
        // Find the NAVs for this window
        const windowNavs = f.navs.filter(n => n.date >= windowStart && n.date <= evalDate);
        if (windowNavs.length < 2) continue;

        // Downsample to monthly points
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

        if (xirr > -0.99 && xirr < 2.0) {
          point[f.name] = xirr * 100;
        }
      }
      
      if (Object.keys(point).length > 1) {
        results.push(point);
      }
    }

    return results;
  }, [formattedFunds, rollingDuration]);

  const winRateStat = useMemo(() => {
    if (rollingChartData.length === 0 || formattedFunds.length < 2) return null;
    
    // Compare the first two funds in the shortlist
    const f1 = formattedFunds[0].name;
    const f2 = formattedFunds[1].name;
    
    let f1Wins = 0;
    let totalValid = 0;
    
    for (const pt of rollingChartData) {
      if (pt[f1] !== undefined && pt[f2] !== undefined) {
        totalValid++;
        if (pt[f1] > pt[f2]) f1Wins++;
      }
    }
    
    if (totalValid === 0) return null;
    
    const winRate = (f1Wins / totalValid) * 100;
    
    if (winRate === 50) {
      return `${f1} and ${f2} have matched performance over ${rollingDuration}-year rolling periods.`;
    }
    
    const winner = winRate > 50 ? f1 : f2;
    const loser = winRate > 50 ? f2 : f1;
    const rate = winRate > 50 ? winRate : 100 - winRate;
    
    return `**${winner}** outperformed **${loser}** in **${rate.toFixed(0)}%** of all ${rollingDuration}-year rolling periods.`;
  }, [rollingChartData, formattedFunds, rollingDuration]);

  // Compute metrics for the table
  const metrics = useMemo(() => {
    return fundsData.map((f, index) => {
      const sortedNavs = [...f.navs].sort((a, b) => a.navDate.getTime() - b.navDate.getTime());
      if (sortedNavs.length === 0) return null;

      const firstNav = sortedNavs[0];
      const latestNav = sortedNavs[sortedNavs.length - 1];

      const cagr = calculateCAGR(
        { date: firstNav.navDate, nav: firstNav.nav },
        { date: latestNav.navDate, nav: latestNav.nav }
      );
      
      const maxDrawdown = calculateMaxDrawdown(
        sortedNavs.map(n => ({ date: n.navDate, nav: n.nav }))
      );

      return {
        ...f,
        color: CHART_COLORS[index % CHART_COLORS.length],
        latestNav: latestNav.nav,
        cagr: cagr * 100,
        maxDrawdown: maxDrawdown * 100,
        inceptionDate: firstNav.navDate,
      };
    }).filter(Boolean);
  }, [fundsData]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (shortlist.length < 2) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Shortlist Empty</h2>
        <p className="text-zinc-400 max-w-md mb-8">
          Search to add funds here directly, or see more details on the dashboard to build your shortlist.
        </p>
        <div className="w-full max-w-md mx-auto relative z-50">
          <SearchAutocomplete />
        </div>
        <Link href="/" className="mt-8 px-6 py-3 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto pt-6 px-3 sm:px-6 pb-20">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white">Compare Funds</h1>
        <p className="text-zinc-400 mt-2">Apples-to-apples performance comparison</p>
      </header>

      {/* Main Chart */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-xl font-bold text-white mb-2">Growth of ₹10,000</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Simulated investment from the latest common inception date.
        </p>
        
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
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
                domain={['auto', 'auto']}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                itemStyle={{ fontWeight: 500 }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                labelFormatter={(label: any) => format(new Date(label), 'dd MMM yyyy')}
                formatter={(value: any, name: any) => [`₹${Number(value).toFixed(0)}`, name]}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              
              {fundsData.map((f, i) => (
                <Line 
                  key={f.schemeCode}
                  type="monotone" 
                  dataKey={f.name} 
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#0f172a', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rolling SIP Chart */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Rolling SIP Returns (XIRR)</h2>
            <p className="text-zinc-400 text-sm">
              Comparing systematic investment performance over rolling {rollingDuration}-year windows.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex bg-zinc-900 border border-zinc-700 rounded-lg p-1 shrink-0">
            {[1, 3, 5, 10].map(years => (
              <button
                key={years}
                onClick={() => setRollingDuration(years)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  rollingDuration === years 
                    ? 'bg-teal-500 text-zinc-950' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {years}Y
              </button>
            ))}
          </div>
        </div>

        {winRateStat && (
          <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
            <p className="text-teal-400 text-sm font-medium" dangerouslySetInnerHTML={{ __html: winRateStat.replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-bold">$1</span>') }} />
          </div>
        )}

        <div className="h-[400px] w-full">
          {rollingChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Not enough historical data for a {rollingDuration}-year rolling analysis across all funds.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rollingChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  tickFormatter={(val) => format(new Date(val), 'MMM yy')}
                  minTickGap={50}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8"
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `${val.toFixed(0)}%`}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ fontWeight: 500 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                  labelFormatter={(label: any) => format(new Date(label), 'MMM yyyy')}
                  formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                
                {formattedFunds.map((f, i) => (
                  <Line 
                    key={f.schemeCode}
                    type="monotone" 
                    dataKey={f.name} 
                    stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, stroke: '#0f172a', strokeWidth: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-xl overflow-hidden mb-8">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Comprehensive Metric Comparison</h2>
            <p className="text-xs text-zinc-400 mt-1">Side-by-side risk, return, and benchmark capture comparison.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800 select-none">
                <th className="sticky left-0 bg-zinc-900 z-10 py-3.5 px-4 min-w-[220px] max-w-[280px] font-semibold border-r border-zinc-800">
                  Fund Name
                </th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">1Y Ret</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">3Y Ret</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">5Y Ret</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap border-l border-zinc-800/40">Sharpe</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">Sortino</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">Beta</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">Alpha</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap border-l border-zinc-800/40">Up Cap</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">Down Cap</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">Info Ratio</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap border-l border-zinc-800/40">Max DD</th>
                <th className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">Inception CAGR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-[13px]">
              {metrics.map((m: any) => (
                <tr key={m.schemeCode} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="sticky left-0 bg-zinc-950/95 group-hover:bg-zinc-900/95 z-10 py-3 px-4 border-r border-zinc-800 transition-colors">
                    <Link href={`/fund/${m.schemeCode}`} className="flex items-start space-x-2.5">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: m.color }} />
                      <div className="min-w-0">
                        <span className="text-white font-medium group-hover:text-teal-400 transition-colors line-clamp-1">
                          {m.name}
                        </span>
                        {m.category && (
                          <span className="text-[11px] text-zinc-500 block truncate mt-0.5">
                            {m.category}
                          </span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className={`py-3 px-3 text-right font-medium tabular-nums ${
                    isValidNumber(m.return1Y) && m.return1Y > 0 ? 'text-teal-400' : isValidNumber(m.return1Y) && m.return1Y < 0 ? 'text-rose-400' : 'text-zinc-400'
                  }`}>
                    {formatPct(m.return1Y)}
                  </td>
                  <td className={`py-3 px-3 text-right font-medium tabular-nums ${
                    isValidNumber(m.return3Y) && m.return3Y > 0 ? 'text-teal-400' : isValidNumber(m.return3Y) && m.return3Y < 0 ? 'text-rose-400' : 'text-zinc-400'
                  }`}>
                    {formatPct(m.return3Y)}
                  </td>
                  <td className={`py-3 px-3 text-right font-medium tabular-nums ${
                    isValidNumber(m.return5Y) && m.return5Y > 0 ? 'text-teal-400' : isValidNumber(m.return5Y) && m.return5Y < 0 ? 'text-rose-400' : 'text-zinc-400'
                  }`}>
                    {formatPct(m.return5Y)}
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-300 tabular-nums border-l border-zinc-800/40">
                    {formatNum(m.sharpeRatio)}
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">
                    {formatNum(m.sortinoRatio)}
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">
                    {formatNum(m.beta)}
                  </td>
                  <td className={`py-3 px-3 text-right font-medium tabular-nums ${
                    isValidNumber(m.alpha) && m.alpha > 0 ? 'text-teal-400' : isValidNumber(m.alpha) && m.alpha < 0 ? 'text-rose-400' : 'text-zinc-400'
                  }`}>
                    {formatPct(m.alpha)}
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-300 tabular-nums border-l border-zinc-800/40">
                    {isValidNumber(m.upsideCapture) ? m.upsideCapture.toFixed(1) + '%' : '-'}
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">
                    {isValidNumber(m.downsideCapture) ? m.downsideCapture.toFixed(1) + '%' : '-'}
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">
                    {formatNum(m.informationRatio)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-rose-400 tabular-nums border-l border-zinc-800/40">
                    {isValidNumber(m.maxDrawdown) ? m.maxDrawdown.toFixed(2) + '%' : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-teal-400 tabular-nums">
                    {isValidNumber(m.cagr) ? m.cagr.toFixed(2) + '%' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <AutoAnalysis funds={metrics} />
    </div>
  );
}
