'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors shadow-sm"
      title="Go back to previous page"
      type="button"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
