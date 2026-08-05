export const RISK_FREE_RATE = 0.06; // 6% assumed risk free rate
export const TRADING_DAYS_PER_YEAR = 252;

export function calculateAnnualizedReturn(startValue: number, endValue: number, years: number): number {
  if (startValue === 0 || years === 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function calculateAbsoluteReturn(startValue: number, endValue: number): number {
  if (startValue === 0) return 0;
  return (endValue / startValue) - 1;
}

export function calculateDailyReturns(navs: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < navs.length; i++) {
    returns.push((navs[i] - navs[i - 1]) / navs[i - 1]);
  }
  return returns;
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function calculateCovariance(values1: number[], values2: number[]): number {
  if (values1.length <= 1 || values1.length !== values2.length) return 0;
  const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
  const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
  let covariance = 0;
  for (let i = 0; i < values1.length; i++) {
    covariance += (values1[i] - mean1) * (values2[i] - mean2);
  }
  return covariance / (values1.length - 1);
}

export function calculateSharpeRatio(annualizedReturn: number, dailyReturns: number[], riskFreeRate: number = RISK_FREE_RATE): number {
  const dailyVolatility = calculateStandardDeviation(dailyReturns);
  const annualizedVolatility = dailyVolatility * Math.sqrt(TRADING_DAYS_PER_YEAR);
  if (annualizedVolatility === 0) return 0;
  return (annualizedReturn - riskFreeRate) / annualizedVolatility;
}

export function calculateSortinoRatio(annualizedReturn: number, dailyReturns: number[], riskFreeRate: number = RISK_FREE_RATE): number {
  const negativeReturns = dailyReturns.filter(r => r < 0);
  const downsideDeviation = calculateStandardDeviation(negativeReturns) * Math.sqrt(TRADING_DAYS_PER_YEAR);
  if (downsideDeviation === 0) return 0;
  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

export function calculateBeta(fundReturns: number[], benchmarkReturns: number[]): number {
  const covariance = calculateCovariance(fundReturns, benchmarkReturns);
  const benchmarkVariance = Math.pow(calculateStandardDeviation(benchmarkReturns), 2);
  if (benchmarkVariance === 0) return 0;
  return covariance / benchmarkVariance;
}

export function calculateAlpha(fundReturn: number, benchmarkReturn: number, beta: number, riskFreeRate: number = RISK_FREE_RATE): number {
  return fundReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
}

export function calculateCaptureRatios(fundReturns: number[], benchmarkReturns: number[]) {
  let fundUp = 1;
  let benchUp = 1;
  let fundDown = 1;
  let benchDown = 1;

  for (let i = 0; i < fundReturns.length; i++) {
    if (benchmarkReturns[i] >= 0) {
      fundUp *= (1 + fundReturns[i]);
      benchUp *= (1 + benchmarkReturns[i]);
    } else {
      fundDown *= (1 + fundReturns[i]);
      benchDown *= (1 + benchmarkReturns[i]);
    }
  }

  const upsideCapture = (benchUp - 1) === 0 ? 0 : ((fundUp - 1) / (benchUp - 1)) * 100;
  const downsideCapture = (benchDown - 1) === 0 ? 0 : ((fundDown - 1) / (benchDown - 1)) * 100;

  return { upsideCapture, downsideCapture };
}

export function calculateInformationRatio(fundReturns: number[], benchmarkReturns: number[], fundAnnualReturn: number, benchAnnualReturn: number): number {
  if (fundReturns.length !== benchmarkReturns.length) return 0;
  const activeReturns = fundReturns.map((fr, i) => fr - benchmarkReturns[i]);
  const trackingError = calculateStandardDeviation(activeReturns) * Math.sqrt(TRADING_DAYS_PER_YEAR);
  if (trackingError === 0) return 0;
  return (fundAnnualReturn - benchAnnualReturn) / trackingError;
}
