'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchSchemes } from '@/app/actions/schemes';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

type Scheme = {
  id: number;
  schemeCode: number;
  name: string;
  category: string | null;
};

export default function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchResults() {
      if (debouncedQuery.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const data = await searchSchemes(debouncedQuery);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Failed to fetch schemes", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (schemeCode: number) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/fund/${schemeCode}`);
  };

  return (
    <div className="relative w-full max-w-2xl" ref={wrapperRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-teal-400 transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a mutual fund (e.g. 'Parag Parikh Flexi Cap')"
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-12 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all shadow-sm"
        />
        {loading && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
          <ul className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {results.map((scheme) => (
              <li 
                key={scheme.id}
                onClick={() => handleSelect(scheme.schemeCode)}
                className="px-4 py-3 hover:bg-zinc-800/50 cursor-pointer border-b border-zinc-800/50 last:border-0 transition-colors group"
              >
                <div className="font-medium text-zinc-200 group-hover:text-teal-400 transition-colors">
                  {scheme.name}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
                    Code: {scheme.schemeCode}
                  </span>
                  {scheme.category && (
                    <span className="text-xs text-zinc-500">
                      • {scheme.category}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isOpen && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 text-center text-zinc-400">
          No funds found matching "{query}"
        </div>
      )}
    </div>
  );
}
