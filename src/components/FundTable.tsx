'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { filterSchemes, FilterOptions } from '@/app/actions/filter';
import { useDebounce } from '@/hooks/useDebounce';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'fincurate_active_filters';

const POPULAR_CATEGORIES = [
  { key: 'all', label: 'All Categories' },
  { key: 'equity', label: 'Equity' },
  { key: 'debt', label: 'Debt' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'large_cap', label: 'Large Cap' },
  { key: 'mid_cap', label: 'Mid Cap' },
  { key: 'small_cap', label: 'Small Cap' },
  { key: 'flexi_cap', label: 'Flexi Cap' },
  { key: 'elss', label: 'ELSS' },
  { key: 'index_etf', label: 'Index / ETF' },
];

const EQUITY_OPTIONS = [
  { key: '', label: 'Select Equity Category...' },
  { key: 'equity', label: 'All Equity' },
  { key: 'large_cap', label: 'Large Cap Fund' },
  { key: 'mid_cap', label: 'Mid Cap Fund' },
  { key: 'small_cap', label: 'Small Cap Fund' },
  { key: 'flexi_cap', label: 'Flexi Cap Fund' },
  { key: 'large_mid_cap', label: 'Large & Mid Cap Fund' },
  { key: 'multi_cap', label: 'Multi Cap Fund' },
  { key: 'elss', label: 'ELSS (Tax Saver)' },
  { key: 'sectoral_thematic', label: 'Sectoral / Thematic' },
  { key: 'value_contra', label: 'Value / Contra Fund' },
  { key: 'focused', label: 'Focused Fund' },
  { key: 'dividend_yield', label: 'Dividend Yield Fund' },
];

const DEBT_OPTIONS = [
  { key: '', label: 'Select Debt Category...' },
  { key: 'debt', label: 'All Debt & Income' },
  { key: 'liquid', label: 'Liquid Fund' },
  { key: 'overnight', label: 'Overnight Fund' },
  { key: 'money_market', label: 'Money Market Fund' },
  { key: 'ultra_short', label: 'Ultra Short Duration' },
  { key: 'low_duration', label: 'Low Duration Fund' },
  { key: 'short_duration', label: 'Short Duration Fund' },
  { key: 'medium_duration', label: 'Medium Duration Fund' },
  { key: 'long_duration', label: 'Long Duration Fund' },
  { key: 'corporate_bond', label: 'Corporate Bond Fund' },
  { key: 'banking_psu', label: 'Banking & PSU Fund' },
  { key: 'gilt', label: 'Gilt Fund' },
  { key: 'dynamic_bond', label: 'Dynamic Bond' },
  { key: 'floater', label: 'Floater Fund' },
  { key: 'credit_risk', label: 'Credit Risk Fund' },
];

const HYBRID_OPTIONS = [
  { key: '', label: 'Select Hybrid Category...' },
  { key: 'hybrid', label: 'All Hybrid' },
  { key: 'aggressive_hybrid', label: 'Aggressive Hybrid Fund' },
  { key: 'conservative_hybrid', label: 'Conservative Hybrid Fund' },
  { key: 'balanced_advantage', label: 'Balanced Advantage / Dynamic' },
  { key: 'arbitrage', label: 'Arbitrage Fund' },
  { key: 'equity_savings', label: 'Equity Savings' },
  { key: 'multi_asset', label: 'Multi Asset Allocation' },
];

const OTHER_OPTIONS = [
  { key: '', label: 'Select Passive / Other...' },
  { key: 'index_etf', label: 'All Passive & Other' },
  { key: 'index_funds', label: 'Index Funds' },
  { key: 'etf', label: 'Exchange Traded Funds (ETFs)' },
  { key: 'fof', label: 'Fund of Funds (FoF)' },
  { key: 'solution_oriented', label: 'Solution Oriented (Retirement/Child)' },
];

/** Parse URL search params into FilterOptions */
function parseSearchParams(params: URLSearchParams): FilterOptions {
  const opts: FilterOptions = {
    page: parseInt(params.get('page') || '1', 10) || 1,
    pageSize: parseInt(params.get('pageSize') || '20', 10) || 20,
    sortBy: (params.get('sortBy') as FilterOptions['sortBy']) || 'return3Y',
    sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };
  const q = params.get('q');
  if (q) opts.query = q;
  const plan = params.get('plan') as 'all' | 'direct' | 'regular' | null;
  if (plan && ['direct', 'regular'].includes(plan)) opts.plan = plan;
  const cat = params.get('category');
  if (cat && cat !== 'all') opts.category = cat;
  const minR1Y = params.get('minReturn1Y');
  if (minR1Y) opts.minReturn1Y = parseFloat(minR1Y);
  const minR3Y = params.get('minReturn3Y');
  if (minR3Y) opts.minReturn3Y = parseFloat(minR3Y);
  const minR5Y = params.get('minReturn5Y');
  if (minR5Y) opts.minReturn5Y = parseFloat(minR5Y);
  const minSharpe = params.get('minSharpe');
  if (minSharpe) opts.minSharpeRatio = parseFloat(minSharpe);
  const minSortino = params.get('minSortino');
  if (minSortino) opts.minSortinoRatio = parseFloat(minSortino);
  const minBeta = params.get('minBeta');
  if (minBeta) opts.minBeta = parseFloat(minBeta);
  const maxBeta = params.get('maxBeta');
  if (maxBeta) opts.maxBeta = parseFloat(maxBeta);
  return opts;
}

/** Convert FilterOptions into URLSearchParams string */
function toSearchString(opts: FilterOptions): string {
  const p = new URLSearchParams();
  if (opts.query) p.set('q', opts.query);
  if (opts.plan && opts.plan !== 'all') p.set('plan', opts.plan);
  if (opts.category && opts.category !== 'all') p.set('category', opts.category);
  if (opts.minReturn1Y !== undefined) p.set('minReturn1Y', String(opts.minReturn1Y));
  if (opts.minReturn3Y !== undefined) p.set('minReturn3Y', String(opts.minReturn3Y));
  if (opts.minReturn5Y !== undefined) p.set('minReturn5Y', String(opts.minReturn5Y));
  if (opts.minSharpeRatio !== undefined) p.set('minSharpe', String(opts.minSharpeRatio));
  if (opts.minSortinoRatio !== undefined) p.set('minSortino', String(opts.minSortinoRatio));
  if (opts.minBeta !== undefined) p.set('minBeta', String(opts.minBeta));
  if (opts.maxBeta !== undefined) p.set('maxBeta', String(opts.maxBeta));
  if (opts.page && opts.page !== 1) p.set('page', String(opts.page));
  if (opts.pageSize && opts.pageSize !== 20) p.set('pageSize', String(opts.pageSize));
  if (opts.sortBy && opts.sortBy !== 'return3Y') p.set('sortBy', opts.sortBy);
  if (opts.sortOrder && opts.sortOrder !== 'desc') p.set('sortOrder', opts.sortOrder);
  const str = p.toString();
  return str ? `?${str}` : '';
}

export default function FundTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Primary options derived directly from reactive searchParams
  const options = useMemo(() => parseSearchParams(searchParams), [searchParams]);

  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Search input state with debouncing
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');
  const debouncedQuery = useDebounce(searchInput, 300);

  // Sync external searchParam 'q' changes into local input (e.g. back navigation or reset)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== searchInput) {
      setSearchInput(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Auto-restore saved filters from sessionStorage if arriving at clean dashboard without params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentQuery = searchParams.toString();
    if (!currentQuery) {
      const savedQuery = sessionStorage.getItem(STORAGE_KEY);
      if (savedQuery) {
        router.replace(`/${savedQuery}`, { scroll: false });
      }
    }
  }, [searchParams, router]);

  // Fetch data whenever options change
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

  /** Update options, push to URL, and persist to sessionStorage outside of render */
  const updateOptions = useCallback((updater: (prev: FilterOptions) => FilterOptions) => {
    const current = parseSearchParams(searchParams);
    const next = updater(current);
    const searchStr = toSearchString(next);
    if (typeof window !== 'undefined') {
      if (searchStr) {
        sessionStorage.setItem(STORAGE_KEY, searchStr);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    router.replace(`/${searchStr}`, { scroll: false });
  }, [searchParams, router]);

  // Push debounced query to URL when user finishes typing
  useEffect(() => {
    const currentUrlQ = searchParams.get('q') || '';
    const cleanDebounced = debouncedQuery.trim();
    if (cleanDebounced !== currentUrlQ) {
      updateOptions(p => ({
        ...p,
        query: cleanDebounced || undefined,
        page: 1
      }));
    }
  }, [debouncedQuery, searchParams, updateOptions]);

  const handleSort = (field: FilterOptions['sortBy']) => {
    updateOptions(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const resetFilters = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setSearchInput('');
    router.replace('/', { scroll: false });
  };

  const SortIcon = ({ field }: { field: FilterOptions['sortBy'] }) => {
    if (options.sortBy !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-600 inline ml-1 opacity-70 group-hover:opacity-100" />;
    return options.sortOrder === 'desc' 
      ? <ArrowDown className="w-3 h-3 text-teal-400 inline ml-1" />
      : <ArrowUp className="w-3 h-3 text-teal-400 inline ml-1" />;
  };

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

  // Check if any filters are active (beyond defaults)
  const hasActiveFilters = !!(
    options.query ||
    (options.plan && options.plan !== 'all') ||
    (options.category && options.category !== 'all') ||
    options.minReturn1Y !== undefined ||
    options.minReturn3Y !== undefined ||
    options.minReturn5Y !== undefined ||
    options.minSharpeRatio !== undefined ||
    options.minSortinoRatio !== undefined ||
    options.minBeta !== undefined ||
    options.maxBeta !== undefined
  );

  const currentCategory = options.category || 'all';
  const currentPlan = options.plan || 'all';

  // Determine which dropdown currently holds the active selection (if any)
  const isEquitySelected = EQUITY_OPTIONS.some(o => o.key && o.key === currentCategory);
  const isDebtSelected = DEBT_OPTIONS.some(o => o.key && o.key === currentCategory);
  const isHybridSelected = HYBRID_OPTIONS.some(o => o.key && o.key === currentCategory);
  const isOtherSelected = OTHER_OPTIONS.some(o => o.key && o.key === currentCategory);

  return (
    <div className="w-full">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Search by fund name or code..." 
            className="bg-zinc-900/90 text-zinc-100 rounded-xl px-4 py-2.5 border border-zinc-700/80 outline-none focus:border-teal-500 w-full placeholder-zinc-500 text-sm shadow-inner transition-colors"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          {hasActiveFilters && (
            <button 
              onClick={resetFilters}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-zinc-700/80 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 text-xs font-medium transition-colors shadow-sm"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-semibold tracking-wide transition-all shadow-sm ${
              showFilters || hasActiveFilters
                ? 'bg-teal-500/15 border-teal-500/60 text-teal-300 shadow-teal-500/5' 
                : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-teal-400 ml-0.5 inline-block animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="space-y-4 mb-6 p-4 sm:p-5 bg-zinc-900/80 rounded-2xl border border-zinc-800/90 shadow-2xl backdrop-blur-xl">
          
          {/* Top Row: Plan Selector & Popular Categories */}
          <div className="space-y-3 pb-3.5 border-b border-zinc-800/80">
            {/* Plan Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mr-2">Plan:</span>
              {(['all', 'direct', 'regular'] as const).map(planKey => (
                <button
                  key={planKey}
                  onClick={() => updateOptions(p => ({
                    ...p,
                    plan: planKey === 'all' ? undefined : planKey,
                    page: 1
                  }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    currentPlan === planKey
                      ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-sm'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40'
                  }`}
                >
                  {planKey === 'all' ? 'All Plans' : planKey === 'direct' ? 'Direct Plan' : 'Regular Plan'}
                </button>
              ))}
            </div>

            {/* Popular Categories */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mr-2">Popular:</span>
              {POPULAR_CATEGORIES.map(pop => (
                <button
                  key={pop.key}
                  onClick={() => updateOptions(p => ({
                    ...p,
                    category: pop.key === 'all' ? undefined : pop.key,
                    page: 1
                  }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    currentCategory === pop.key
                      ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-sm'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40'
                  }`}
                >
                  {pop.label}
                </button>
              ))}
            </div>
          </div>

          {/* Middle Row: Categorized Category Dropdowns */}
          <div>
            <label className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider block mb-2">
              Browse Categories
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Equity */}
              <div className="flex flex-col space-y-1">
                <span className="text-zinc-400 text-xs font-medium">Equity Categories</span>
                <select 
                  className={`bg-zinc-800/90 text-zinc-200 rounded-lg px-2.5 py-1.5 border outline-none text-xs transition-colors ${
                    isEquitySelected ? 'border-teal-500/60 text-teal-300 bg-teal-500/10' : 'border-zinc-700/80 hover:border-zinc-600'
                  }`}
                  value={isEquitySelected ? currentCategory : ""}
                  onChange={(e) => updateOptions(p => ({
                    ...p,
                    category: e.target.value || undefined,
                    page: 1
                  }))}
                >
                  {EQUITY_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Debt */}
              <div className="flex flex-col space-y-1">
                <span className="text-zinc-400 text-xs font-medium">Debt & Fixed Income</span>
                <select 
                  className={`bg-zinc-800/90 text-zinc-200 rounded-lg px-2.5 py-1.5 border outline-none text-xs transition-colors ${
                    isDebtSelected ? 'border-teal-500/60 text-teal-300 bg-teal-500/10' : 'border-zinc-700/80 hover:border-zinc-600'
                  }`}
                  value={isDebtSelected ? currentCategory : ""}
                  onChange={(e) => updateOptions(p => ({
                    ...p,
                    category: e.target.value || undefined,
                    page: 1
                  }))}
                >
                  {DEBT_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Hybrid */}
              <div className="flex flex-col space-y-1">
                <span className="text-zinc-400 text-xs font-medium">Hybrid Categories</span>
                <select 
                  className={`bg-zinc-800/90 text-zinc-200 rounded-lg px-2.5 py-1.5 border outline-none text-xs transition-colors ${
                    isHybridSelected ? 'border-teal-500/60 text-teal-300 bg-teal-500/10' : 'border-zinc-700/80 hover:border-zinc-600'
                  }`}
                  value={isHybridSelected ? currentCategory : ""}
                  onChange={(e) => updateOptions(p => ({
                    ...p,
                    category: e.target.value || undefined,
                    page: 1
                  }))}
                >
                  {HYBRID_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Other */}
              <div className="flex flex-col space-y-1">
                <span className="text-zinc-400 text-xs font-medium">Passive & Others</span>
                <select 
                  className={`bg-zinc-800/90 text-zinc-200 rounded-lg px-2.5 py-1.5 border outline-none text-xs transition-colors ${
                    isOtherSelected ? 'border-teal-500/60 text-teal-300 bg-teal-500/10' : 'border-zinc-700/80 hover:border-zinc-600'
                  }`}
                  value={isOtherSelected ? currentCategory : ""}
                  onChange={(e) => updateOptions(p => ({
                    ...p,
                    category: e.target.value || undefined,
                    page: 1
                  }))}
                >
                  {OTHER_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Row: Return & Risk Metric Filters */}
          <div className="pt-3 border-t border-zinc-800/80">
            <label className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider block mb-2">
              Performance & Risk Thresholds
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-400 text-xs">Min 1Y Return</label>
                <select 
                  className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700/80 outline-none text-xs"
                  onChange={(e) => updateOptions(p => ({ ...p, minReturn1Y: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
                  value={options.minReturn1Y !== undefined ? options.minReturn1Y : ""}
                >
                  <option value="">Any</option>
                  <option value="0.10">&gt; 10%</option>
                  <option value="0.15">&gt; 15%</option>
                  <option value="0.20">&gt; 20%</option>
                  <option value="0.30">&gt; 30%</option>
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-400 text-xs">Min 3Y Return</label>
                <select 
                  className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700/80 outline-none text-xs"
                  onChange={(e) => updateOptions(p => ({ ...p, minReturn3Y: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
                  value={options.minReturn3Y !== undefined ? options.minReturn3Y : ""}
                >
                  <option value="">Any</option>
                  <option value="0.10">&gt; 10%</option>
                  <option value="0.15">&gt; 15%</option>
                  <option value="0.20">&gt; 20%</option>
                  <option value="0.30">&gt; 30%</option>
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-400 text-xs">Min 5Y Return</label>
                <select 
                  className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700/80 outline-none text-xs"
                  onChange={(e) => updateOptions(p => ({ ...p, minReturn5Y: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
                  value={options.minReturn5Y !== undefined ? options.minReturn5Y : ""}
                >
                  <option value="">Any</option>
                  <option value="0.10">&gt; 10%</option>
                  <option value="0.15">&gt; 15%</option>
                  <option value="0.20">&gt; 20%</option>
                  <option value="0.30">&gt; 30%</option>
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-400 text-xs">Min Sharpe</label>
                <select 
                  className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700/80 outline-none text-xs"
                  onChange={(e) => updateOptions(p => ({ ...p, minSharpeRatio: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
                  value={options.minSharpeRatio !== undefined ? options.minSharpeRatio : ""}
                >
                  <option value="">Any</option>
                  <option value="0.5">&gt; 0.5</option>
                  <option value="1.0">&gt; 1.0</option>
                  <option value="1.5">&gt; 1.5</option>
                  <option value="2.0">&gt; 2.0</option>
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-400 text-xs">Min Sortino</label>
                <select 
                  className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700/80 outline-none text-xs"
                  onChange={(e) => updateOptions(p => ({ ...p, minSortinoRatio: e.target.value ? parseFloat(e.target.value) : undefined, page: 1 }))}
                  value={options.minSortinoRatio !== undefined ? options.minSortinoRatio : ""}
                >
                  <option value="">Any</option>
                  <option value="0.5">&gt; 0.5</option>
                  <option value="1.0">&gt; 1.0</option>
                  <option value="1.5">&gt; 1.5</option>
                  <option value="2.0">&gt; 2.0</option>
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-400 text-xs">Beta Filter</label>
                <select 
                  className="bg-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700/80 outline-none text-xs"
                  onChange={(e) => {
                    const val = e.target.value;
                    updateOptions(p => {
                      const updated: FilterOptions = { ...p, page: 1 };
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
                  <option value="defensive">&lt; 0.8 (Defensive)</option>
                  <option value="low">&lt; 1.0 (Low Beta)</option>
                  <option value="high">&gt; 1.0 (High Beta)</option>
                  <option value="aggressive">&gt; 1.2 (Aggressive)</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Modern Financial Dashboard Table */}
      <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-900/90 border-b border-zinc-800/90 select-none">
                {/* Pinned / Sticky Left Column for Fund Name */}
                <th className="sticky left-0 bg-zinc-900 z-20 py-3.5 px-4 min-w-[220px] max-w-[260px] md:min-w-[280px] md:max-w-[320px] border-r border-zinc-800/80">
                  Fund Name
                </th>
                
                {/* Returns Group */}
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors"
                  onClick={() => handleSort('return1Y')}
                >
                  1Y Ret <SortIcon field="return1Y" />
                </th>
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors"
                  onClick={() => handleSort('return3Y')}
                >
                  3Y Ret <SortIcon field="return3Y" />
                </th>
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors"
                  onClick={() => handleSort('return5Y')}
                >
                  5Y Ret <SortIcon field="return5Y" />
                </th>

                {/* Risk-Adjusted Ratios Group */}
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors border-l border-zinc-800/40"
                  onClick={() => handleSort('sharpeRatio')}
                >
                  Sharpe <SortIcon field="sharpeRatio" />
                </th>
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors"
                  onClick={() => handleSort('sortinoRatio')}
                >
                  Sortino <SortIcon field="sortinoRatio" />
                </th>
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors"
                  onClick={() => handleSort('beta')}
                >
                  Beta <SortIcon field="beta" />
                </th>
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors"
                  onClick={() => handleSort('alpha')}
                >
                  Alpha <SortIcon field="alpha" />
                </th>

                {/* Market Benchmark Capture Group */}
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors border-l border-zinc-800/40"
                  onClick={() => handleSort('upsideCapture')}
                >
                  Up Cap <SortIcon field="upsideCapture" />
                </th>
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors"
                  onClick={() => handleSort('downsideCapture')}
                >
                  Down Cap <SortIcon field="downsideCapture" />
                </th>
                <th 
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white whitespace-nowrap group transition-colors"
                  onClick={() => handleSort('informationRatio')}
                >
                  Info Ratio <SortIcon field="informationRatio" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-zinc-500">
                    <div className="flex justify-center items-center space-x-2.5">
                      <div className="w-4 h-4 rounded-full border-2 border-t-teal-500 border-zinc-700 animate-spin"></div>
                      <span className="text-sm">Loading funds...</span>
                    </div>
                  </td>
                </tr>
              ) : schemes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-zinc-500 text-sm">
                    No funds found matching your criteria. Try loosening the filters.
                  </td>
                </tr>
              ) : (
                schemes.map((scheme) => (
                  <tr 
                    key={scheme.id} 
                    onClick={() => router.push(`/fund/${scheme.schemeCode}`)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Sticky Fund Name Column */}
                    <td className="sticky left-0 bg-zinc-950/95 group-hover:bg-zinc-900/95 z-10 py-3 px-4 border-r border-zinc-800/80 transition-colors">
                      <div className="font-medium text-white group-hover:text-teal-400 transition-colors line-clamp-1 leading-snug">
                        {scheme.name}
                      </div>
                      {scheme.category && (
                        <div className="text-[11px] text-zinc-500 truncate mt-0.5 max-w-[260px]">
                          {scheme.category}
                        </div>
                      )}
                    </td>

                    {/* Returns */}
                    <td className={`py-3 px-3 text-right font-medium tabular-nums ${
                      isValidNumber(scheme.return1Y) && scheme.return1Y > 0 ? 'text-teal-400' : isValidNumber(scheme.return1Y) && scheme.return1Y < 0 ? 'text-rose-400' : 'text-zinc-400'
                    }`}>
                      {formatPct(scheme.return1Y)}
                    </td>
                    <td className={`py-3 px-3 text-right font-medium tabular-nums ${
                      isValidNumber(scheme.return3Y) && scheme.return3Y > 0 ? 'text-teal-400' : isValidNumber(scheme.return3Y) && scheme.return3Y < 0 ? 'text-rose-400' : 'text-zinc-400'
                    }`}>
                      {formatPct(scheme.return3Y)}
                    </td>
                    <td className={`py-3 px-3 text-right font-medium tabular-nums ${
                      isValidNumber(scheme.return5Y) && scheme.return5Y > 0 ? 'text-teal-400' : isValidNumber(scheme.return5Y) && scheme.return5Y < 0 ? 'text-rose-400' : 'text-zinc-400'
                    }`}>
                      {formatPct(scheme.return5Y)}
                    </td>

                    {/* Ratios */}
                    <td className="py-3 px-3 text-right text-zinc-300 tabular-nums border-l border-zinc-800/40">
                      {formatNum(scheme.sharpeRatio)}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">
                      {formatNum(scheme.sortinoRatio)}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">
                      {formatNum(scheme.beta)}
                    </td>
                    <td className={`py-3 px-3 text-right font-medium tabular-nums ${
                      isValidNumber(scheme.alpha) && scheme.alpha > 0 ? 'text-teal-400' : isValidNumber(scheme.alpha) && scheme.alpha < 0 ? 'text-rose-400' : 'text-zinc-400'
                    }`}>
                      {formatPct(scheme.alpha)}
                    </td>

                    {/* Capture Ratios & IR */}
                    <td className="py-3 px-3 text-right text-zinc-300 tabular-nums border-l border-zinc-800/40">
                      {isValidNumber(scheme.upsideCapture) ? scheme.upsideCapture.toFixed(1) + '%' : '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">
                      {isValidNumber(scheme.downsideCapture) ? scheme.downsideCapture.toFixed(1) + '%' : '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">
                      {formatNum(scheme.informationRatio)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/60 border-t border-zinc-800/80 text-xs">
          <button 
            onClick={() => updateOptions(p => ({ ...p, page: Math.max(1, p.page! - 1) }))}
            disabled={options.page === 1}
            className="px-3.5 py-1.5 bg-zinc-800/90 text-zinc-300 rounded-lg font-medium disabled:opacity-40 hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Previous
          </button>
          <span className="text-zinc-400 font-medium">
            Page <span className="text-white font-semibold">{options.page}</span> of {totalPages}
          </span>
          <button 
            onClick={() => updateOptions(p => ({ ...p, page: p.page! + 1 }))}
            disabled={options.page! >= totalPages}
            className="px-3.5 py-1.5 bg-zinc-800/90 text-zinc-300 rounded-lg font-medium disabled:opacity-40 hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
