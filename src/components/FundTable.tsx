'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { filterSchemes, FilterOptions } from '@/app/actions/filter';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';

export default function FundTable() {
  const router = useRouter();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [options, setOptions] = useState<FilterOptions>({
    page: 1,
    pageSize: 20,
    sortBy: 'return3Y',
    sortOrder: 'desc'
  });

  useEffect(() => {
    let isMounted = true;
    const fetchFunds = async () => {
      setLoading(true);
      try {
        const result = await filterSchemes(options);
        if (isMounted) {
          setSchemes(result.schemes);
          setTotalPages(Math.max(1, Math.ceil(result.total / (options.pageSize || 20))));
        }
      } catch (error) {
        console.error('Failed to fetch schemes:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFunds();
    return () => { isMounted = false; };
  }, [options]);

  const handleSort = (field: FilterOptions['sortBy']) => {
    setOptions(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ field }: { field: FilterOptions['sortBy'] }) => {
    if (options.sortBy !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-600 inline ml-1" />;
    return options.sortOrder === 'desc' 
      ? <ArrowDown className="w-3 h-3 text-teal-400 inline ml-1" />
      : <ArrowUp className="w-3 h-3 text-teal-400 inline ml-1" />;
  };

  const formatPct = (val?: number | null) => {
    if (val == null) return '-';
    return (val * 100).toFixed(2) + '%';
  };

  const formatNum = (val?: number | null) => {
    if (val == null) return '-';
    return val.toFixed(2);
  };

  return (
    <div className="w-full mt-10">
      {/* Search & Filter Toggle */}
      <div className="flex items-center justify-between mb-6">
        <input 
          type="text" 
          placeholder="Search by name..." 
          className="bg-zinc-800 text-zinc-100 rounded-lg px-4 py-2 border border-zinc-700 outline-none focus:border-teal-500 w-full max-w-md"
          value={options.query || ""}
          onChange={(e) => setOptions(p => ({ ...p, query: e.target.value, page: 1 }))}
        />
        
        <div className="flex items-center space-x-2 shrink-0 ml-4">
          <button 
            onClick={() => setOptions({ page: 1, pageSize: 20, sortBy: 'return3Y', sortOrder: 'desc', query: '' })}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors hidden sm:flex"
          >
            <span>Reset</span>
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-teal-500/10 border-teal-500/50 text-teal-400' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
          <div className="flex flex-col space-y-1">
            <label className="text-zinc-400 text-xs">Min 1Y Return</label>
            <select 
              className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700 outline-none text-sm"
              onChange={(e) => setOptions(p => ({ ...p, minReturn1Y: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
              value={options.minReturn1Y !== undefined ? options.minReturn1Y : ""}
            >
              <option value="">Any</option>
              <option value="0.1">&gt; 10%</option>
              <option value="0.15">&gt; 15%</option>
              <option value="0.2">&gt; 20%</option>
              <option value="0.3">&gt; 30%</option>
            </select>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-zinc-400 text-xs">Min 3Y Return</label>
            <select 
              className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700 outline-none text-sm"
              onChange={(e) => setOptions(p => ({ ...p, minReturn3Y: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
              value={options.minReturn3Y !== undefined ? options.minReturn3Y : ""}
            >
              <option value="">Any</option>
              <option value="0.1">&gt; 10%</option>
              <option value="0.15">&gt; 15%</option>
              <option value="0.2">&gt; 20%</option>
              <option value="0.3">&gt; 30%</option>
            </select>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-zinc-400 text-xs">Min 5Y Return</label>
            <select 
              className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700 outline-none text-sm"
              onChange={(e) => setOptions(p => ({ ...p, minReturn5Y: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
              value={options.minReturn5Y !== undefined ? options.minReturn5Y : ""}
            >
              <option value="">Any</option>
              <option value="0.1">&gt; 10%</option>
              <option value="0.15">&gt; 15%</option>
              <option value="0.2">&gt; 20%</option>
              <option value="0.3">&gt; 30%</option>
            </select>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-zinc-400 text-xs">Min Sharpe</label>
            <select 
              className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700 outline-none text-sm"
              onChange={(e) => setOptions(p => ({ ...p, minSharpeRatio: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
              value={options.minSharpeRatio !== undefined ? options.minSharpeRatio : ""}
            >
              <option value="">Any</option>
              <option value="0.5">&gt; 0.5</option>
              <option value="1">&gt; 1.0</option>
              <option value="1.5">&gt; 1.5</option>
              <option value="2">&gt; 2.0</option>
            </select>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-zinc-400 text-xs">Min Sortino</label>
            <select 
              className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700 outline-none text-sm"
              onChange={(e) => setOptions(p => ({ ...p, minSortinoRatio: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
              value={options.minSortinoRatio !== undefined ? options.minSortinoRatio : ""}
            >
              <option value="">Any</option>
              <option value="0.5">&gt; 0.5</option>
              <option value="1">&gt; 1.0</option>
              <option value="1.5">&gt; 1.5</option>
              <option value="2">&gt; 2.0</option>
            </select>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-zinc-400 text-xs">Beta Filter</label>
            <select 
              className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700 outline-none text-sm"
              onChange={(e) => {
                const val = e.target.value;
                setOptions(p => {
                  const updated = { ...p, page: 1 };
                  delete updated.minBeta;
                  delete updated.maxBeta;
                  if (val === 'defensive') updated.maxBeta = 0.8;
                  if (val === 'low') updated.maxBeta = 1.0;
                  if (val === 'high') updated.minBeta = 1.0;
                  if (val === 'aggressive') updated.minBeta = 1.2;
                  return updated;
                });
              }}
              value={
                options.maxBeta === 0.8 ? 'defensive' : 
                options.maxBeta === 1.0 ? 'low' : 
                options.minBeta === 1.0 ? 'high' : 
                options.minBeta === 1.2 ? 'aggressive' : ''
              }
            >
              <option value="">Any</option>
              <option value="defensive">&lt; 0.8</option>
              <option value="low">&lt; 1.0</option>
              <option value="high">&gt; 1.0</option>
              <option value="aggressive">&gt; 1.2</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-zinc-900/40 rounded-xl border border-zinc-800/60 backdrop-blur-sm">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/80 border-b border-zinc-800/80">
            <tr>
              <th className="px-6 py-4 font-medium">Fund Name</th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('return1Y')}>1Y Ret <SortIcon field="return1Y" /></th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('return3Y')}>3Y Ret <SortIcon field="return3Y" /></th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('return5Y')}>5Y Ret <SortIcon field="return5Y" /></th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('sharpeRatio')}>Sharpe <SortIcon field="sharpeRatio" /></th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('sortinoRatio')}>Sortino <SortIcon field="sortinoRatio" /></th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('beta')}>Beta <SortIcon field="beta" /></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-zinc-500">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-4 h-4 rounded-full border-2 border-t-teal-500 border-zinc-700 animate-spin"></div>
                    <span>Loading funds...</span>
                  </div>
                </td>
              </tr>
            ) : schemes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-zinc-500">No funds found matching criteria.</td>
              </tr>
            ) : (
              schemes.map((scheme) => (
                <tr 
                  key={scheme.id} 
                  onClick={() => router.push(`/fund/${scheme.schemeCode}`)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  style={{ cursor: 'pointer' }}
                >
                  <td className="px-6 py-4 font-medium text-white group" title="Click to view details">
                    <span className="hover:text-teal-400">
                      {scheme.name}
                    </span>
                    <div className="text-xs text-zinc-500 mt-1">{scheme.category}</div>
                  </td>
                  <td className={`px-6 py-4 ${scheme.return1Y && scheme.return1Y > 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                    {formatPct(scheme.return1Y)}
                  </td>
                  <td className={`px-6 py-4 ${scheme.return3Y && scheme.return3Y > 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                    {formatPct(scheme.return3Y)}
                  </td>
                  <td className={`px-6 py-4 ${scheme.return5Y && scheme.return5Y > 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                    {formatPct(scheme.return5Y)}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{formatNum(scheme.sharpeRatio)}</td>
                  <td className="px-6 py-4 text-zinc-300">{formatNum(scheme.sortinoRatio)}</td>
                  <td className="px-6 py-4 text-zinc-300">{formatNum(scheme.beta)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button 
          onClick={() => setOptions(p => ({ ...p, page: Math.max(1, p.page! - 1) }))}
          disabled={options.page === 1}
          className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg disabled:opacity-50 hover:bg-zinc-700 transition-colors"
        >
          Previous
        </button>
        <span className="text-zinc-500 text-sm">Page {options.page} of {totalPages}</span>
        <button 
          onClick={() => setOptions(p => ({ ...p, page: p.page! + 1 }))}
          disabled={options.page! >= totalPages}
          className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg disabled:opacity-50 hover:bg-zinc-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
