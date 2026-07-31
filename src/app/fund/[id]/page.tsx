import { getSchemeDetails } from '@/app/actions/schemes';
import { calculateCAGR, calculateMaxDrawdown } from '@/domain/math';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import FundChart from '@/components/FundChart';
import RollingSipAnalysis from '@/components/RollingSipAnalysis';
import RollingLumpsumAnalysis from '@/components/RollingLumpsumAnalysis';
import RefreshDataButton from '@/components/RefreshDataButton';
import ShortlistButton from '@/components/ShortlistButton';

type Props = {
  params: Promise<{ id: string }>
};

export default async function FundPage(props: Props) {
  const params = await props.params;
  const schemeCode = parseInt(params.id, 10);
  
  if (isNaN(schemeCode)) {
    return <div>Invalid Fund ID</div>;
  }

  // This will lazily fetch NAV history if not in DB
  const scheme = await getSchemeDetails(schemeCode);

  if (!scheme || scheme.navs.length === 0) {
    return <div>No data available for this fund.</div>;
  }

  const sortedNavs = [...scheme.navs].sort((a, b) => a.navDate.getTime() - b.navDate.getTime());
  const firstNav = sortedNavs[0];
  const latestNav = sortedNavs[sortedNavs.length - 1];

  // Calculate CAGR & Max Drawdown
  const cagr = calculateCAGR(
    { date: firstNav.navDate, nav: firstNav.nav },
    { date: latestNav.navDate, nav: latestNav.nav }
  );
  
  const maxDrawdown = calculateMaxDrawdown(
    sortedNavs.map(n => ({ date: n.navDate, nav: n.nav }))
  );

  return (
    <div className="max-w-6xl mx-auto pt-6 pb-20">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/" className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{scheme.name}</h1>
          <div className="flex items-center space-x-3 mt-2 text-sm text-zinc-400">
            <span>Code: {scheme.schemeCode}</span>
            {scheme.category && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 bg-zinc-800 text-teal-400 rounded-md">
                  {scheme.category}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex-1" />
        <ShortlistButton schemeCode={scheme.schemeCode} name={scheme.name} />
        <RefreshDataButton schemeCode={schemeCode} lastSyncedAt={scheme.lastSyncedAt} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-zinc-400 text-sm font-medium">Latest NAV</h3>
          <p className="text-3xl font-bold text-white mt-2">₹{latestNav.nav.toFixed(2)}</p>
          <p className="text-xs text-zinc-500 mt-1">As of {latestNav.navDate.toLocaleDateString()}</p>
        </div>
        
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-zinc-400 text-sm font-medium">Since Inception CAGR</h3>
          <p className="text-3xl font-bold text-teal-400 mt-2">{(cagr * 100).toFixed(2)}%</p>
          <p className="text-xs text-zinc-500 mt-1">From {firstNav.navDate.toLocaleDateString()}</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-zinc-400 text-sm font-medium">Max Drawdown</h3>
          <p className="text-3xl font-bold text-red-400 mt-2">{(maxDrawdown * 100).toFixed(2)}%</p>
          <p className="text-xs text-zinc-500 mt-1">Maximum historical loss</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-xl font-bold text-white mb-6">Historical NAV</h2>
        <FundChart data={sortedNavs.map(n => ({ date: n.navDate.toISOString(), nav: n.nav }))} />
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-white mb-2">Rolling SIP Returns (XIRR)</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Calculate the actual returns (XIRR) you would have made if you invested a fixed amount every month for a specific duration.
        </p>
        
        <RollingSipAnalysis 
          navs={sortedNavs.map(n => ({ date: n.navDate.toISOString(), nav: n.nav }))} 
        />
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-white mb-2">Rolling Lumpsum Returns (CAGR)</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Calculate the actual returns (CAGR) you would have made if you invested a single lumpsum amount for a specific duration.
        </p>
        
        <RollingLumpsumAnalysis 
          navs={sortedNavs.map(n => ({ date: n.navDate.toISOString(), nav: n.nav }))} 
        />
      </div>
    </div>
  );
}
