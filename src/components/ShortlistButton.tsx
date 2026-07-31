'use client';

import { useEffect, useState } from 'react';
import { useShortlistStore } from '@/store/useShortlistStore';
import { Bookmark, BookmarkCheck } from 'lucide-react';

type Props = {
  schemeCode: number;
  name: string;
};

export default function ShortlistButton({ schemeCode, name }: Props) {
  // We need to delay rendering until the component is mounted to avoid hydration mismatch
  // since zustand persist uses localStorage.
  const [mounted, setMounted] = useState(false);
  
  const isShortlisted = useShortlistStore(state => state.isShortlisted(schemeCode));
  const addFund = useShortlistStore(state => state.addFund);
  const removeFund = useShortlistStore(state => state.removeFund);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />; // Placeholder
  }

  const toggle = () => {
    if (isShortlisted) {
      removeFund(schemeCode);
    } else {
      addFund({ schemeCode, name });
    }
  };

  return (
    <button 
      onClick={toggle}
      className={`p-2 rounded-full transition-colors ${
        isShortlisted 
          ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' 
          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
      }`}
      title={isShortlisted ? "Remove from Shortlist" : "Add to Shortlist"}
    >
      {isShortlisted ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
    </button>
  );
}
