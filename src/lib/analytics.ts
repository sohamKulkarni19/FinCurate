export const RISK_FREE_RATE = 0.06; // 6% assumed risk free rate
export const TRADING_DAYS_PER_YEAR = 252;

export function calculateAnnualizedReturn(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0 || !isFinite(startValue) || !isFinite(endValue)) return 0;
  const result = Math.pow(endValue / startValue, 1 / years) - 1;
  return isFinite(result) ? result : 0;
}

export function calculateAbsoluteReturn(startValue: number, endValue: number): number {
  if (startValue <= 0 || endValue <= 0 || !isFinite(startValue) || !isFinite(endValue)) return 0;
  const result = (endValue / startValue) - 1;
  return isFinite(result) ? result : 0;
}

export function calculateDailyReturns(navs: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < navs.length; i++) {
    const prev = navs[i - 1];
    const curr = navs[i];
    if (prev <= 0 || !isFinite(prev) || !isFinite(curr)) {
      continue;
    }
    const ret = (curr - prev) / prev;
    if (isFinite(ret)) {
      returns.push(ret);
    }
  }
  return returns;
}

export function calculateStandardDeviation(values: number[]): number {
  const valid = values.filter(v => isFinite(v));
  if (valid.length <= 1) return 0;
  const mean = valid.reduce((sum, val) => sum + val, 0) / valid.length;
  const variance = valid.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (valid.length - 1);
  const std = Math.sqrt(variance);
  return isFinite(std) ? std : 0;
}

export function calculateCovariance(values1: number[], values2: number[]): number {
  if (values1.length <= 1 || values1.length !== values2.length) return 0;
  const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
  const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
  let covariance = 0;
  for (let i = 0; i < values1.length; i++) {
    covariance += (values1[i] - mean1) * (values2[i] - mean2);
  }
  const cov = covariance / (values1.length - 1);
  return isFinite(cov) ? cov : 0;
}

export function calculateSharpeRatio(annualizedReturn: number, dailyReturns: number[], riskFreeRate: number = RISK_FREE_RATE): number {
  if (!isFinite(annualizedReturn)) return 0;
  const dailyVolatility = calculateStandardDeviation(dailyReturns);
  const annualizedVolatility = dailyVolatility * Math.sqrt(TRADING_DAYS_PER_YEAR);
  if (annualizedVolatility < 0.001 || !isFinite(annualizedVolatility)) return 0;
  const sharpe = (annualizedReturn - riskFreeRate) / annualizedVolatility;
  return isFinite(sharpe) ? sharpe : 0;
}

export function calculateSortinoRatio(annualizedReturn: number, dailyReturns: number[], riskFreeRate: number = RISK_FREE_RATE): number {
  if (!isFinite(annualizedReturn) || dailyReturns.length === 0) return 0;
  // Convert annual risk-free rate to daily minimum acceptable return (MAR)
  const dailyMAR = Math.pow(1 + riskFreeRate, 1 / TRADING_DAYS_PER_YEAR) - 1;
  // Downside deviation: use ALL returns, but only count shortfall below MAR
  const squaredDownside = dailyReturns.map(r => {
    if (!isFinite(r)) return 0;
    const excess = r - dailyMAR;
    return excess < 0 ? excess * excess : 0;
  });
  const meanSquared = squaredDownside.reduce((sum, val) => sum + val, 0) / dailyReturns.length;
  const downsideDeviation = Math.sqrt(meanSquared) * Math.sqrt(TRADING_DAYS_PER_YEAR);
  if (downsideDeviation < 0.001 || !isFinite(downsideDeviation)) return 0;
  const sortino = (annualizedReturn - riskFreeRate) / downsideDeviation;
  return isFinite(sortino) ? sortino : 0;
}

export function calculateBeta(fundReturns: number[], benchmarkReturns: number[]): number {
  const covariance = calculateCovariance(fundReturns, benchmarkReturns);
  const benchmarkVariance = Math.pow(calculateStandardDeviation(benchmarkReturns), 2);
  if (benchmarkVariance === 0 || !isFinite(benchmarkVariance)) return 0;
  const beta = covariance / benchmarkVariance;
  return isFinite(beta) ? beta : 0;
}

export function calculateAlpha(fundReturn: number, benchmarkReturn: number, beta: number, riskFreeRate: number = RISK_FREE_RATE): number {
  if (!isFinite(fundReturn) || !isFinite(benchmarkReturn) || !isFinite(beta)) return 0;
  const alpha = fundReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
  return isFinite(alpha) ? alpha : 0;
}

export function calculateCaptureRatios(fundReturns: number[], benchmarkReturns: number[]) {
  let fundUp = 1;
  let benchUp = 1;
  let fundDown = 1;
  let benchDown = 1;

  for (let i = 0; i < fundReturns.length; i++) {
    const fr = fundReturns[i];
    const br = benchmarkReturns[i];
    if (!isFinite(fr) || !isFinite(br)) continue;

    if (br >= 0) {
      fundUp *= (1 + fr);
      benchUp *= (1 + br);
    } else {
      fundDown *= (1 + fr);
      benchDown *= (1 + br);
    }
  }

  const upsideCapture = (benchUp - 1) === 0 ? 0 : ((fundUp - 1) / (benchUp - 1)) * 100;
  const downsideCapture = (benchDown - 1) === 0 ? 0 : ((fundDown - 1) / (benchDown - 1)) * 100;

  return {
    upsideCapture: isFinite(upsideCapture) ? upsideCapture : 0,
    downsideCapture: isFinite(downsideCapture) ? downsideCapture : 0
  };
}

export function calculateInformationRatio(fundReturns: number[], benchmarkReturns: number[], fundAnnualReturn: number, benchAnnualReturn: number): number {
  if (fundReturns.length !== benchmarkReturns.length || !isFinite(fundAnnualReturn) || !isFinite(benchAnnualReturn)) return 0;
  const activeReturns = fundReturns.map((fr, i) => fr - benchmarkReturns[i]);
  const trackingError = calculateStandardDeviation(activeReturns) * Math.sqrt(TRADING_DAYS_PER_YEAR);
  if (trackingError < 0.001 || !isFinite(trackingError)) return 0;
  const ir = (fundAnnualReturn - benchAnnualReturn) / trackingError;
  return isFinite(ir) ? ir : 0;
}
