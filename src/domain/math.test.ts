import { describe, it, expect } from 'vitest';
import { calculateCAGR, calculateXIRR, calculateMaxDrawdown, generateSipCashFlows, NavPoint } from './math';

describe('Domain Math Kernel', () => {

  describe('calculateCAGR', () => {
    it('returns 0 if start and end dates are the same', () => {
      const point: NavPoint = { date: new Date('2023-01-01'), nav: 100 };
      expect(calculateCAGR(point, point)).toBe(0);
    });

    it('calculates 10% annual return exactly over 1 year', () => {
      const start: NavPoint = { date: new Date('2023-01-01'), nav: 100 };
      // 1 year exactly
      const end: NavPoint = { date: new Date('2024-01-01'), nav: 110 };
      
      const cagr = calculateCAGR(start, end);
      // Roughly 10%
      expect(cagr).toBeCloseTo(0.10, 2); 
    });

    it('calculates zero return for flat NAV', () => {
      const start: NavPoint = { date: new Date('2020-01-01'), nav: 150 };
      const end: NavPoint = { date: new Date('2024-01-01'), nav: 150 };
      expect(calculateCAGR(start, end)).toBe(0);
    });
  });

  describe('calculateMaxDrawdown', () => {
    it('returns 0 for a flat NAV sequence', () => {
      const navs: NavPoint[] = [
        { date: new Date('2023-01-01'), nav: 100 },
        { date: new Date('2023-02-01'), nav: 100 },
        { date: new Date('2023-03-01'), nav: 100 },
      ];
      expect(calculateMaxDrawdown(navs)).toBe(0);
    });

    it('returns 0 for a constantly rising NAV sequence', () => {
      const navs: NavPoint[] = [
        { date: new Date('2023-01-01'), nav: 100 },
        { date: new Date('2023-02-01'), nav: 110 },
        { date: new Date('2023-03-01'), nav: 120 },
      ];
      expect(calculateMaxDrawdown(navs)).toBe(0);
    });

    it('correctly calculates maximum drawdown during a crash', () => {
      const navs: NavPoint[] = [
        { date: new Date('2020-01-01'), nav: 100 },
        { date: new Date('2020-02-01'), nav: 150 }, // Peak
        { date: new Date('2020-03-01'), nav: 120 }, // Drawdown -20%
        { date: new Date('2020-04-01'), nav: 75 },  // Drawdown -50% from Peak
        { date: new Date('2020-05-01'), nav: 90 },
      ];
      // Formula: 75 / 150 - 1 = -0.5
      expect(calculateMaxDrawdown(navs)).toBeCloseTo(-0.5, 4);
    });
  });

  describe('calculateXIRR & generateSipCashFlows (Rolling SIP)', () => {
    it('returns 0 for flat NAV sequence SIP', () => {
      const navs: NavPoint[] = [
        { date: new Date('2023-01-01'), nav: 100 },
        { date: new Date('2023-02-01'), nav: 100 },
        { date: new Date('2023-03-01'), nav: 100 },
        { date: new Date('2023-04-01'), nav: 100 }, // Terminal
      ];
      
      const flows = generateSipCashFlows(1000, navs);
      const xirr = calculateXIRR(flows);
      
      expect(xirr).toBeCloseTo(0, 4);
    });

    it('calculates positive XIRR for rising NAV sequence', () => {
      const navs: NavPoint[] = [
        { date: new Date('2023-01-01'), nav: 100 },
        { date: new Date('2024-01-01'), nav: 110 },
        { date: new Date('2025-01-01'), nav: 121 }, 
      ];
      
      const flows = generateSipCashFlows(1000, navs);
      
      // Expected flows: 
      // 2023-01-01: -1000 (bought 10 units @ 100)
      // 2024-01-01: -1000 (bought ~9.09 units @ 110)
      // 2025-01-01: +2309.9 (19.0909 units * 121)
      
      const xirr = calculateXIRR(flows);
      expect(xirr).toBeGreaterThan(0.05); // Should be a positive annual rate
    });
  });
});
