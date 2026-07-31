import xirr from 'xirr';

export interface CashFlow {
  amount: number;
  date: Date;
}

export interface NavPoint {
  date: Date;
  nav: number;
}

/**
 * Calculates Compound Annual Growth Rate (CAGR)
 * Uses exact elapsed days divided by 365.2425 as per technical requirements.
 */
export function calculateCAGR(startPoint: NavPoint, endPoint: NavPoint): number {
  if (startPoint.nav <= 0) return 0;
  if (startPoint.date.getTime() >= endPoint.date.getTime()) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsedDays = (endPoint.date.getTime() - startPoint.date.getTime()) / msPerDay;
  const elapsedYears = elapsedDays / 365.2425;

  return Math.pow(endPoint.nav / startPoint.nav, 1 / elapsedYears) - 1;
}

/**
 * Calculates internal rate of return for irregular cash flows using XIRR.
 * Often used for SIP (Systematic Investment Plan) returns.
 */
export function calculateXIRR(cashFlows: CashFlow[]): number {
  if (cashFlows.length < 2) return 0;
  
  // Format for xirr library is an array of objects: { amount, when }
  const formattedFlows = cashFlows.map(cf => ({
    amount: cf.amount,
    when: cf.date
  }));

  try {
    const rate = xirr(formattedFlows);
    return isNaN(rate) ? 0 : rate;
  } catch (error) {
    // xirr throws an error if it fails to converge
    return 0;
  }
}

/**
 * Calculates Maximum Drawdown from a series of NAV points.
 */
export function calculateMaxDrawdown(navs: NavPoint[]): number {
  if (navs.length === 0) return 0;

  const firstValue = navs[0].nav;
  let runningPeak = 1.0;
  let maxDrawdown = 0;

  for (const point of navs) {
    const wealth = point.nav / firstValue;
    if (wealth > runningPeak) {
      runningPeak = wealth;
    }
    
    const drawdown = wealth / runningPeak - 1;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Helper to generate SIP CashFlows array given a monthly SIP amount and historical NAV points.
 * Assuming SIP occurs on the dates provided in the `navs` array.
 */
export function generateSipCashFlows(sipAmount: number, navs: NavPoint[]): CashFlow[] {
  if (navs.length === 0) return [];

  let totalUnits = 0;
  const cashFlows: CashFlow[] = [];

  for (let i = 0; i < navs.length - 1; i++) {
    const point = navs[i];
    const unitsBought = sipAmount / point.nav;
    totalUnits += unitsBought;
    
    cashFlows.push({
      amount: -sipAmount, // Investment is negative cash flow
      date: point.date
    });
  }

  // Terminal value at the very last date
  const terminalPoint = navs[navs.length - 1];
  const terminalValue = totalUnits * terminalPoint.nav;
  
  cashFlows.push({
    amount: terminalValue, // Withdrawal is positive cash flow
    date: terminalPoint.date
  });

  return cashFlows;
}

export type FundHistory = {
  schemeCode: number;
  name: string;
  navs: { date: Date; nav: number }[];
};

export function normalizeNavsForComparison(
  fundsData: FundHistory[],
  baseAmount: number = 10000
) {
  if (fundsData.length === 0) return [];

  const startDates = fundsData.map(f => {
    if (f.navs.length === 0) return new Date(0);
    return f.navs[0].date;
  });
  
  // Latest common start date
  const maxStartDate = new Date(Math.max(...startDates.map(d => d.getTime())));
  
  const filteredFunds = fundsData.map(f => {
    return {
      ...f,
      navs: f.navs.filter(n => n.date.getTime() >= maxStartDate.getTime())
    }
  });

  const initialUnits = new Map<number, number>();
  for (const f of filteredFunds) {
    if (f.navs.length > 0) {
      initialUnits.set(f.schemeCode, baseAmount / f.navs[0].nav);
    } else {
      initialUnits.set(f.schemeCode, 0);
    }
  }

  const allDates = new Set<number>();
  const navMaps = new Map<number, Map<number, number>>();

  for (const f of filteredFunds) {
    const map = new Map<number, number>();
    for (const n of f.navs) {
      const time = n.date.getTime();
      allDates.add(time);
      map.set(time, n.nav);
    }
    navMaps.set(f.schemeCode, map);
  }

  const sortedDates = Array.from(allDates).sort((a, b) => a - b);
  const lastKnownValue = new Map<number, number>();
  
  const chartData = sortedDates.map(timestamp => {
    const point: any = { date: new Date(timestamp).toISOString() };
    
    for (const f of filteredFunds) {
      const navMap = navMaps.get(f.schemeCode);
      const nav = navMap?.get(timestamp);
      
      if (nav !== undefined) {
        const value = nav * initialUnits.get(f.schemeCode)!;
        point[f.name] = value;
        lastKnownValue.set(f.schemeCode, value);
      } else {
        point[f.name] = lastKnownValue.get(f.schemeCode) || baseAmount;
      }
    }
    return point;
  });

  return chartData;
}
