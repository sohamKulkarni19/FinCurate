'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  UserCheck, 
  PanelLeftClose, 
  PanelLeftOpen,
  Trash2
} from 'lucide-react';
import { useShortlistStore } from '@/store/useShortlistStore';
import { useSidebarStore } from '@/store/useSidebarStore';

export default function Sidebar() {
  const pathname = usePathname();
  const shortlistCount = useShortlistStore((state) => state.shortlist.length);
  const clearShortlist = useShortlistStore((state) => state.clearShortlist);
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const collapsed = mounted && isCollapsed;
  const sidebarWidthClass = collapsed ? 'w-16 sm:w-20' : 'w-64';

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      name: 'Compare Funds',
      href: '/compare',
      icon: TrendingUp,
      active: pathname.startsWith('/compare'),
      badge: mounted && shortlistCount > 0 ? shortlistCount : undefined,
    },
    {
      name: 'Credits & Contact',
      href: '/credits',
      icon: UserCheck,
      active: pathname.startsWith('/credits') || pathname.startsWith('/contact'),
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen ${sidebarWidthClass} border-r border-zinc-800/90 bg-zinc-950/90 backdrop-blur-2xl flex flex-col z-50 text-zinc-300 transition-[width] duration-300 ease-in-out shadow-2xl overflow-hidden`}
    >
      {/* Header / Brand & Toggle */}
      <div className={`p-4 flex items-center border-b border-zinc-800/60 ${collapsed ? 'flex-col justify-center gap-3' : 'justify-between'}`}>
        <Link 
          href="/" 
          className="flex items-center space-x-3 cursor-pointer group"
          title="FinCurate 2.0"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold text-lg group-hover:bg-teal-500/30 transition-all shadow-sm shrink-0">
            F
          </div>
          {!collapsed && (
            <span className="font-bold text-base tracking-wide text-white group-hover:text-teal-400 transition-colors truncate">
              FinCurate 2.0
            </span>
          )}
        </Link>

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/60 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} className="text-zinc-400 hover:text-teal-400 transition-colors" />
          ) : (
            <PanelLeftClose size={18} className="text-zinc-400 hover:text-teal-400 transition-colors" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 ${collapsed ? 'px-2 py-4 space-y-3' : 'px-3 py-4 space-y-1.5'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center ${
                  collapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2.5'
                } rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon size={19} className={isActive ? 'text-teal-400' : 'text-zinc-400 group-hover:text-zinc-200'} />
                  {/* Collapsed Badge Dot */}
                  {collapsed && item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-teal-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>

                {!collapsed && (
                  <span className="truncate flex-1">{item.name}</span>
                )}

                {/* Expanded Badge */}
                {!collapsed && item.badge !== undefined && (
                  <span className="bg-teal-500 text-zinc-950 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm ml-auto">
                    {item.badge}
                  </span>
                )}
              </Link>

              {/* Clear shortlist helper when expanded under Compare Funds */}
              {!collapsed && item.name === 'Compare Funds' && mounted && shortlistCount > 0 && (
                <div className="flex items-center justify-between px-3 pt-1 text-[11px]">
                  <span className="text-zinc-500">{shortlistCount} shortlisted</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      clearShortlist();
                    }}
                    className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Clear all shortlisted funds"
                  >
                    <Trash2 size={11} />
                    <span>Clear</span>
                  </button>
                </div>
              )}

              {/* Tooltip on hover when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-lg shadow-xl border border-zinc-700/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.name}
                  {item.badge !== undefined && ` (${item.badge})`}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className={`p-3.5 border-t border-zinc-800/60 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed ? (
          <div className="text-[11px] text-zinc-500 leading-tight">
            <p className="font-medium text-zinc-400">FinCurate 2.0</p>
            <p className="mt-0.5 text-zinc-500">Built with Next.js & Prisma</p>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-teal-500/60 mx-auto" title="FinCurate 2.0 Online" />
        )}
      </div>
    </aside>
  );
}
