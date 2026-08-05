'use client';

import { useEffect, useState, useMemo } from 'react';
import { useShortlistStore } from '@/store/useShortlistStore';
import { getMultipleSchemesDetails } from '@/app/actions/schemes';
import { normalizeNavsForComparison, calculateCAGR, calculateMaxDrawdown } from '@/domain/math';
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

export default function ComparePage() {
  const shortlist = useShortlistStore(state => state.shortlist);
  const [loading, setLoading] = useState(true);
  const [fundsData, setFundsData] = useState<any[]>([]);

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

  const chartData = useMemo(() => {
    if (fundsData.length === 0) return [];
    const formattedInput = fundsData.map(f => ({
      schemeCode: f.schemeCode,
      name: f.name,
      navs: [...f.navs].sort((a, b) => a.navDate.getTime() - b.navDate.getTime()).map(n => ({
        date: n.navDate,
        nav: n.nav
      }))
    }));
    
    return normalizeNavsForComparison(formattedInput, 10000);
  }, [fundsData]);

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
    <div className="max-w-6xl mx-auto pt-6 pb-20">
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

      {/* Metrics Table */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Performance Metrics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-sm border-b border-zinc-800">
                <th className="px-6 py-4 font-medium">Fund Name</th>
                <th className="px-6 py-4 font-medium">1Y Return</th>
                <th className="px-6 py-4 font-medium">3Y Return</th>
                <th className="px-6 py-4 font-medium">Sharpe</th>
                <th className="px-6 py-4 font-medium">Sortino</th>
                <th className="px-6 py-4 font-medium">Beta</th>
                <th className="px-6 py-4 font-medium">Max Drawdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {metrics.map((m: any) => (
                <tr key={m.schemeCode} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/fund/${m.schemeCode}`} className="flex items-center space-x-3 group">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="text-white font-medium group-hover:text-teal-400 transition-colors">{m.name}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{m.return1Y != null ? (m.return1Y * 100).toFixed(2) + '%' : '-'}</td>
                  <td className="px-6 py-4 text-zinc-300">{m.return3Y != null ? (m.return3Y * 100).toFixed(2) + '%' : '-'}</td>
                  <td className="px-6 py-4 text-zinc-300">{m.sharpeRatio != null ? m.sharpeRatio.toFixed(2) : '-'}</td>
                  <td className="px-6 py-4 text-zinc-300">{m.sortinoRatio != null ? m.sortinoRatio.toFixed(2) : '-'}</td>
                  <td className="px-6 py-4 text-zinc-300">{m.beta != null ? m.beta.toFixed(2) : '-'}</td>
                  <td className="px-6 py-4 font-medium text-red-400">{m.maxDrawdown.toFixed(2)}%</td>
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
