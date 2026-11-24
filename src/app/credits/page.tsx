'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Check, Copy, ExternalLink, ArrowLeft, Sparkles, Database, BarChart3, ShieldCheck } from 'lucide-react';

export default function CreditsPage() {
  const [copied, setCopied] = useState(false);
  const email = 'soham.kulkarni.1905@gmail.com';

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pt-6 px-4 pb-20">
      {/* Navigation Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link 
          href="/" 
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors shadow-sm"
          title="Back to Dashboard"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Credits & Contact</h1>
          <p className="text-sm text-zinc-400 mt-1">Creator profile and technical architectural details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Creator Profile Card (spans 2 cols) */}
        <div className="md:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-zinc-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              SK
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Soham Kulkarni</h2>
              <p className="text-xs text-teal-400 font-medium tracking-wide uppercase">Creator & Lead Developer</p>
            </div>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed mb-6">
            FinCurate 2.0 was designed and engineered to provide modern, institutional-grade analytics for Indian mutual fund schemes. It replaces traditional surface-level returns with rigorous risk-adjusted metrics like the Sortino ratio, rolling SIP/Lumpsum horizons, and market capture ratios.
          </p>

          {/* Contact Details & Actions */}
          <div className="p-4 bg-zinc-950/70 border border-zinc-800/90 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Email Address</span>
                <a 
                  href={`mailto:${email}`}
                  className="text-sm font-medium text-white hover:text-teal-400 transition-colors truncate block"
                >
                  {email}
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={copyEmail}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-all shadow-sm"
                title="Copy email to clipboard"
              >
                {copied ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={`mailto:${email}`}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 text-zinc-950 hover:bg-teal-400 text-xs font-semibold transition-all shadow-sm shadow-teal-500/20"
              >
                <span>Write Mail</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Highlights Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-teal-400 mb-4">
              <Sparkles size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Project Scope</h3>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300">
              <li className="flex items-start space-x-2">
                <span className="text-teal-400 font-bold">•</span>
                <span><strong>37,000+ schemes</strong> tracked across all AMCs in India.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-teal-400 font-bold">•</span>
                <span><strong>Multi-Year Rolling SIP</strong> with dynamic XIRR convergence.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-teal-400 font-bold">•</span>
                <span><strong>Downside Deviation</strong> based on strict MAR calculations.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/60">
            <span className="text-[11px] text-zinc-500">Version 2.0 • Active Build</span>
          </div>
        </div>
      </div>

      {/* Technical Architecture & Data Credits */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 sm:p-8 rounded-2xl shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
          <Database size={19} className="text-teal-400" />
          <span>Data Sources & Stack Architecture</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-4 bg-zinc-950/60 border border-zinc-800/70 rounded-xl">
            <div className="flex items-center space-x-2.5 mb-2 text-teal-400 font-semibold text-sm">
              <BarChart3 size={16} />
              <span>NAV & Scheme Master</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real-time and historical net asset values sourced directly from <strong>api.mfapi.in</strong> (AMFI daily publication feed).
            </p>
          </div>

          <div className="p-4 bg-zinc-950/60 border border-zinc-800/70 rounded-xl">
            <div className="flex items-center space-x-2.5 mb-2 text-teal-400 font-semibold text-sm">
              <ShieldCheck size={16} />
              <span>Benchmark Market Data</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Historical benchmark quotes (Nifty 50 Index / ^NSEI) synchronized via Yahoo Finance API for beta and alpha correlation.
            </p>
          </div>

          <div className="p-4 bg-zinc-950/60 border border-zinc-800/70 rounded-xl">
            <div className="flex items-center space-x-2.5 mb-2 text-teal-400 font-semibold text-sm">
              <Sparkles size={16} />
              <span>Core Technologies</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Built on <strong>Next.js 16</strong>, <strong>React 19</strong>, <strong>Prisma ORM (v7)</strong>, <strong>PostgreSQL</strong>, <strong>Tailwind CSS</strong>, and <strong>Recharts</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
