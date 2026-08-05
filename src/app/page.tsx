import FundTable from "@/components/FundTable";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto pt-16 px-4 pb-20">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Discover <span className="text-teal-400">Better</span> Returns.
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Filter and analyze top-performing mutual funds with advanced metrics like Sharpe ratio, Sortino ratio, and Beta.
        </p>
      </header>

      <FundTable />
    </div>
  );
}
