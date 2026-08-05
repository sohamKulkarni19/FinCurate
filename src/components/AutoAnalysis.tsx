import React from 'react';

type FundStats = {
  name: string;
  return1Y?: number | null;
  return3Y?: number | null;
  sharpeRatio?: number | null;
  sortinoRatio?: number | null;
  beta?: number | null;
};

type Props = {
  funds: FundStats[];
};

export default function AutoAnalysis({ funds }: Props) {
  if (funds.length < 2) return null;

  const validReturns = funds.filter(f => f.return3Y != null);
  validReturns.sort((a, b) => (b.return3Y || 0) - (a.return3Y || 0));

  const validSharpe = funds.filter(f => f.sharpeRatio != null);
  validSharpe.sort((a, b) => (b.sharpeRatio || 0) - (a.sharpeRatio || 0));

  const validBeta = funds.filter(f => f.beta != null);
  validBeta.sort((a, b) => (a.beta || 0) - (b.beta || 0)); // Lower beta is less volatile

  const bullets: string[] = [];

  // Performance bullet
  if (validReturns.length > 1) {
    bullets.push(
      `**${validReturns[0].name}** has delivered the highest annualized return over 3 years (${((validReturns[0].return3Y || 0) * 100).toFixed(2)}%), outperforming the others.`
    );
  }

  // Risk-adjusted returns
  if (validSharpe.length > 1) {
    if (validSharpe[0].name === validReturns[0]?.name) {
      bullets.push(
        `It also boasts the best risk-adjusted performance with a Sharpe Ratio of ${validSharpe[0].sharpeRatio?.toFixed(2)}, indicating superior returns for the risk taken.`
      );
    } else {
      bullets.push(
        `However, **${validSharpe[0].name}** offers better risk-adjusted returns (Sharpe Ratio: ${validSharpe[0].sharpeRatio?.toFixed(2)}), making it a potentially smoother ride.`
      );
    }
  }

  // Volatility (Beta)
  if (validBeta.length > 1) {
    if (validBeta[0].beta && validBeta[0].beta < 1) {
      bullets.push(
        `**${validBeta[0].name}** is the least volatile compared to the benchmark index (Beta: ${validBeta[0].beta.toFixed(2)}), making it a defensive choice.`
      );
    } else {
      bullets.push(
        `All compared funds show high sensitivity to market movements, with **${validBeta[validBeta.length - 1].name}** being the most aggressive (Beta: ${validBeta[validBeta.length - 1].beta?.toFixed(2)}).`
      );
    }
  }

  // Downside protection (Sortino)
  const validSortino = funds.filter(f => f.sortinoRatio != null);
  validSortino.sort((a, b) => (b.sortinoRatio || 0) - (a.sortinoRatio || 0));
  if (validSortino.length > 1) {
    bullets.push(
      `For downside protection, **${validSortino[0].name}** stands out with the highest Sortino Ratio (${validSortino[0].sortinoRatio?.toFixed(2)}), meaning it penalizes negative volatility less.`
    );
  }

  if (bullets.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-teal-900/50 p-6 rounded-2xl shadow-lg mt-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <span className="text-teal-400 mr-2">✨</span> AI Summary
      </h2>
      <ul className="space-y-3">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-start text-zinc-300 text-sm">
            <span className="text-teal-500 mr-2 mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
