'use client';

import Link from 'next/link';
import { LayoutDashboard, TrendingUp, Search, Settings } from 'lucide-react';
import { useShortlistStore } from '@/store/useShortlistStore';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const shortlistCount = useShortlistStore(state => state.shortlist.length);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl flex flex-col z-50 text-zinc-300">
      <Link href="/" className="p-6 flex items-center space-x-3 cursor-pointer group">
        <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xl group-hover:bg-teal-500/30 transition-colors">
          F
        </div>
        <span className="font-semibold text-lg tracking-wide text-white group-hover:text-teal-400 transition-colors">FinCurate 2.0</span>
      </Link>

      <nav className="flex-1 px-4 space-y-2 mt-2">
        <Link href="/" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-teal-500/10 text-teal-400 font-medium transition-colors">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        
        <div className="relative">
          <Link href="/compare" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 hover:text-white transition-colors relative">
            <TrendingUp size={20} />
            <span>Compare Funds</span>
            {mounted && shortlistCount > 0 && (
              <span className="absolute right-3 bg-teal-500 text-zinc-950 text-xs font-bold px-2 py-0.5 rounded-full">
                {shortlistCount}
              </span>
            )}
          </Link>
          {mounted && shortlistCount > 0 && (
            <button 
              onClick={() => useShortlistStore.getState().clearShortlist()}
              className="mt-1 ml-10 text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              Clear Shortlist
            </button>
          )}
        </div>

        <Link href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 hover:text-white transition-colors">
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-zinc-800/50 text-xs text-zinc-500">
        <p>Built with Next.js & Prisma</p>
      </div>
    </aside>
  );
}
