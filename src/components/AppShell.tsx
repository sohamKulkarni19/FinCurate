'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebarStore } from '@/store/useSidebarStore';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / hydration, default to expanded ml-64 to avoid mismatch
  const marginLeftClass = mounted && isCollapsed ? 'ml-16 sm:ml-20' : 'ml-64';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={`flex-1 ${marginLeftClass} p-4 sm:p-6 md:p-8 relative transition-[margin] duration-300 ease-in-out min-w-0`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/20 via-zinc-950 to-zinc-950 -z-10 pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
