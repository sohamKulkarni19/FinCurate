import SearchAutocomplete from "@/components/SearchAutocomplete";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto pt-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Discover <span className="text-teal-400">Better</span> Returns.
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Analyze mutual funds, visualize rolling SIP returns with XIRR, and compare drawdowns to make smarter investment decisions.
        </p>
      </header>

      <div className="flex flex-col items-center justify-center">
        <SearchAutocomplete />
        
        <div className="mt-8 flex items-center space-x-6 text-sm text-zinc-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            <span>40,000+ Funds Indexed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            <span>Rolling SIP Analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            <span>Real-time NAVs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
