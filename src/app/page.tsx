import { Suspense } from "react";
import FundTable from "@/components/FundTable";

export default function Home() {
  return (
    <div className="w-full max-w-[1520px] mx-auto pt-6 px-2 sm:px-4 md:px-6 pb-20">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3">
          Discover <span className="text-teal-400">Better</span> Returns.
        </h1>
        <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto">
          Filter and analyze top-performing mutual funds with advanced metrics like Sharpe, Sortino, Beta, Alpha, and Capture Ratios.
        </p>
      </header>

      <Suspense fallback={
        <div className="flex justify-center items-center py-20 text-zinc-500">
          <div className="w-5 h-5 rounded-full border-2 border-t-teal-500 border-zinc-700 animate-spin mr-3"></div>
          Loading funds...
        </div>
      }>
        <FundTable />
      </Suspense>
    </div>
  );
}
