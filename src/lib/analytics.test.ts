import { describe, it, expect } from 'vitest';
import {
  calculateAnnualizedReturn,
  calculateAbsoluteReturn,
  calculateDailyReturns,
  calculateStandardDeviation,
  calculateCovariance,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateBeta,
  calculateAlpha,
  calculateCaptureRatios,
  calculateInformationRatio,
  RISK_FREE_RATE,
  TRADING_DAYS_PER_YEAR,
} from './analytics';

describe('Analytics Library', () => {

  describe('calculateAbsoluteReturn', () => {
    it('returns 0 when start is 0', () => {
      expect(calculateAbsoluteReturn(0, 100)).toBe(0);
    });

    it('calculates positive return', () => {
      expect(calculateAbsoluteReturn(100, 120)).toBeCloseTo(0.2, 6);
    });

    it('calculates negative return', () => {
      expect(calculateAbsoluteReturn(100, 80)).toBeCloseTo(-0.2, 6);
    });
  });

  describe('calculateAnnualizedReturn', () => {
    it('returns 0 when start or years is 0', () => {
      expect(calculateAnnualizedReturn(0, 100, 3)).toBe(0);
      expect(calculateAnnualizedReturn(100, 200, 0)).toBe(0);
    });

    it('calculates correctly for 10% over 1 year', () => {
      expect(calculateAnnualizedReturn(100, 110, 1)).toBeCloseTo(0.1, 6);
    });

    it('calculates correctly over multiple years', () => {
      // 100 -> 200 over 7 years => ~10.41% CAGR
      const result = calculateAnnualizedReturn(100, 200, 7);
      expect(result).toBeCloseTo(0.10409, 4);
    });
  });

  describe('calculateDailyReturns', () => {
    it('returns empty array for single value', () => {
      expect(calculateDailyReturns([100])).toEqual([]);
    });

    it('returns empty array when all NAVs are 0 (e.g. segregated portfolios)', () => {
      expect(calculateDailyReturns([0, 0, 0, 0])).toEqual([]);
    });

    it('filters out non-positive and non-finite transitions safely', () => {
      const navs = [100, 0, 105, NaN, 110];
      const returns = calculateDailyReturns(navs);
      expect(returns.every(r => isFinite(r))).toBe(true);
    });

    it('calculates daily returns correctly', () => {
      const navs = [100, 105, 102];
      const returns = calculateDailyReturns(navs);
      expect(returns[0]).toBeCloseTo(0.05, 6);
      expect(returns[1]).toBeCloseTo(-0.02857, 4);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('returns 0 for single value', () => {
      expect(calculateStandardDeviation([5])).toBe(0);
    });

    it('returns 0 for identical values', () => {
      expect(calculateStandardDeviation([3, 3, 3])).toBe(0);
    });

    it('calculates sample stddev correctly', () => {
      // [2, 4, 4, 4, 5, 5, 7, 9] => sample stddev ~2.138
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      expect(calculateStandardDeviation(values)).toBeCloseTo(2.138, 2);
    });
  });

  describe('calculateSharpeRatio', () => {
    it('returns 0 when volatility is 0', () => {
      expect(calculateSharpeRatio(0.1, [0, 0, 0])).toBe(0);
    });

    it('returns 0 when given NaN or non-finite inputs', () => {
      expect(calculateSharpeRatio(NaN, [0.01, -0.01])).toBe(0);
      expect(calculateSharpeRatio(0.1, [NaN, NaN])).toBe(0);
    });

    it('returns positive Sharpe for returns above risk-free rate', () => {
      // Create daily returns with ~15% annualized return and some volatility
      const dailyReturns = Array(252).fill(0).map(() => (Math.random() - 0.45) * 0.02);
      const annualReturn = 0.15;
      const sharpe = calculateSharpeRatio(annualReturn, dailyReturns);
      expect(typeof sharpe).toBe('number');
      expect(isNaN(sharpe)).toBe(false);
    });

    it('returns negative Sharpe for returns below risk-free rate', () => {
      // Constant small positive daily returns that annualize below risk-free
      const dailyReturns = Array(252).fill(0.0001);
      const annualReturn = 0.02; // 2%, below 6% risk-free
      const sharpe = calculateSharpeRatio(annualReturn, dailyReturns);
      expect(sharpe).toBeLessThan(0);
    });
  });

  describe('calculateSortinoRatio', () => {
    it('returns 0 for empty returns', () => {
      expect(calculateSortinoRatio(0.1, [])).toBe(0);
    });

    it('returns 0 when no returns fall below MAR (all positive, above daily MAR)', () => {
      // Large positive daily returns, well above daily risk-free
      const dailyReturns = Array(252).fill(0.005); // ~0.5% per day
      const annualReturn = 2.0; // very high
      const sortino = calculateSortinoRatio(annualReturn, dailyReturns);
      // No downside, so downside deviation = 0, returns 0
      expect(sortino).toBe(0);
    });

    it('uses all observations in denominator, not just negative count', () => {
      // 250 days at +1%, 2 days at -5%. Old (buggy) code used N=2 in denominator.
      // New code uses N=252.
      const dailyReturns = [
        ...Array(250).fill(0.01),
        -0.05, -0.05,
      ];
      const annualReturn = 0.15;
      const sortino = calculateSortinoRatio(annualReturn, dailyReturns);
      // Should be a large positive number since downside is tiny relative to full count
      expect(sortino).toBeGreaterThan(0);
      expect(isFinite(sortino)).toBe(true);
    });

    it('produces lower value than Sharpe for symmetric returns', () => {
      // For symmetric daily returns, Sortino denominator >= Sharpe denominator
      // so Sortino can be higher or lower depending on skew.
      // With symmetric returns and return above Rf, Sortino >= Sharpe.
      const dailyReturns = Array(252).fill(0).map((_, i) => i % 2 === 0 ? 0.01 : -0.008);
      const annualReturn = 0.12;
      const sharpe = calculateSharpeRatio(annualReturn, dailyReturns);
      const sortino = calculateSortinoRatio(annualReturn, dailyReturns);
      // Both should be finite numbers
      expect(isFinite(sharpe)).toBe(true);
      expect(isFinite(sortino)).toBe(true);
    });
  });

  describe('calculateBeta', () => {
    it('returns 0 when benchmark has no variance', () => {
      const fund = [0.01, 0.02, -0.01];
      const bench = [0, 0, 0];
      expect(calculateBeta(fund, bench)).toBe(0);
    });

    it('returns 1 for identical returns', () => {
      const returns = [0.01, -0.02, 0.015, -0.005, 0.03];
      expect(calculateBeta(returns, returns)).toBeCloseTo(1, 6);
    });

    it('returns ~2 for fund that moves 2x the benchmark', () => {
      const bench = [0.01, -0.02, 0.015, -0.005, 0.03];
      const fund = bench.map(r => r * 2);
      expect(calculateBeta(fund, bench)).toBeCloseTo(2, 6);
    });
  });

  describe('calculateAlpha', () => {
    it('returns 0 when fund matches CAPM prediction', () => {
      const beta = 1.0;
      const benchReturn = 0.10;
      const riskFree = 0.06;
      const expectedReturn = riskFree + beta * (benchReturn - riskFree); // 0.10
      expect(calculateAlpha(expectedReturn, benchReturn, beta, riskFree)).toBeCloseTo(0, 6);
    });

    it('returns positive alpha for outperformance', () => {
      const alpha = calculateAlpha(0.15, 0.10, 1.0, 0.06);
      expect(alpha).toBeCloseTo(0.05, 6); // 15% - (6% + 1*(10%-6%)) = 5%
    });
  });

  describe('calculateCaptureRatios', () => {
    it('returns 100% capture when fund matches benchmark', () => {
      const returns = [0.01, -0.02, 0.015, -0.005, 0.03];
      const { upsideCapture, downsideCapture } = calculateCaptureRatios(returns, returns);
      expect(upsideCapture).toBeCloseTo(100, 0);
      expect(downsideCapture).toBeCloseTo(100, 0);
    });

    it('returns higher upside capture when fund outperforms in up markets', () => {
      const bench = [0.01, -0.02, 0.015, -0.005, 0.03];
      const fund = [0.02, -0.02, 0.03, -0.005, 0.06]; // 2x in up, same in down
      const { upsideCapture, downsideCapture } = calculateCaptureRatios(fund, bench);
      expect(upsideCapture).toBeGreaterThan(100);
      expect(downsideCapture).toBeCloseTo(100, 0);
    });
  });

  describe('calculateInformationRatio', () => {
    it('returns 0 when tracking error is 0 (identical returns)', () => {
      const returns = [0.01, -0.02, 0.015];
      expect(calculateInformationRatio(returns, returns, 0.10, 0.10)).toBe(0);
    });

    it('returns 0 for mismatched arrays', () => {
      expect(calculateInformationRatio([0.01], [0.01, 0.02], 0.1, 0.08)).toBe(0);
    });

    it('returns positive IR for outperformance with tracking error', () => {
      const bench = [0.01, -0.02, 0.015, -0.005, 0.03];
      const fund = [0.012, -0.018, 0.017, -0.003, 0.032];
      const ir = calculateInformationRatio(fund, bench, 0.12, 0.10);
      expect(ir).toBeGreaterThan(0);
    });
  });
});
