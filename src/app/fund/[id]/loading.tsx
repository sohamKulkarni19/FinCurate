import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto pt-6 pb-20 animate-pulse">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-10 h-10 bg-zinc-800 rounded-full"></div>
        <div>
          <div className="h-8 bg-zinc-800 rounded w-64 mb-2"></div>
          <div className="flex space-x-3">
            <div className="h-4 bg-zinc-800 rounded w-20"></div>
            <div className="h-4 bg-zinc-800 rounded w-24"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl h-32 flex flex-col justify-between">
            <div className="h-4 bg-zinc-800 rounded w-24"></div>
            <div className="h-8 bg-zinc-800 rounded w-32"></div>
            <div className="h-3 bg-zinc-800 rounded w-40"></div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl h-64 mb-8">
        <div className="h-6 bg-zinc-800 rounded w-48 mb-6"></div>
        <div className="h-40 bg-zinc-800 rounded w-full"></div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl h-96">
        <div className="h-6 bg-zinc-800 rounded w-64 mb-6"></div>
        <div className="flex space-x-4 mb-8">
          <div className="h-10 bg-zinc-800 rounded w-32"></div>
          <div className="h-10 bg-zinc-800 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-zinc-800 rounded"></div>
          ))}
        </div>
        <div className="h-48 bg-zinc-800 rounded w-full"></div>
      </div>
    </div>
  );
}
