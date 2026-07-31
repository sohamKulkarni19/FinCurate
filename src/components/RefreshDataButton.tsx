'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshSchemeAction } from '@/app/actions/schemes';

export default function RefreshDataButton({ schemeCode, lastSyncedAt }: { schemeCode: number, lastSyncedAt: Date | null }) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshSchemeAction(schemeCode);
    } catch (error) {
      console.error("Failed to refresh data", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end">
      <button 
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center space-x-2 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
      </button>
      {mounted && lastSyncedAt && (
        <span className="text-xs text-zinc-500 mt-2">
          Last updated: {lastSyncedAt.toLocaleString()}
        </span>
      )}
    </div>
  );
}
