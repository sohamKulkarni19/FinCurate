import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { 
  calculateAbsoluteReturn, 
  calculateAnnualizedReturn, 
  calculateSharpeRatio, 
  calculateSortinoRatio, 
  calculateBeta, 
  calculateAlpha, 
  calculateCaptureRatios,
  calculateInformationRatio,
  calculateDailyReturns 
} from '../src/lib/analytics';
import { syncSchemeNavData } from '../src/app/actions/schemes';

async function main() {
  // 1. Fetch benchmark data
  console.log('Fetching benchmark data from DB...');
  const benchmarkNavs = await prisma.benchmarkObservation.findMany({
    orderBy: { date: 'asc' }
  });

  if (benchmarkNavs.length === 0) {
    console.error('No benchmark data found. Run fetch-benchmark.ts first.');
    return;
  }

  const benchmarkDateMap = new Map(benchmarkNavs.map(b => [b.date.toISOString().split('T')[0], b.value]));

  // For this script, we'll only calculate metrics for funds that have NAV data synced,
  // OR we can fetch NAV data for a subset of popular funds if they are empty.
  // For now, let's just process schemes that already have NAV observations.
  const schemes = await prisma.scheme.findMany({
    where: {
      navs: {
        some: {} // Only funds with NAV data
      }
    }
  });

  console.log(`Found ${schemes.length} schemes with NAV data to process...`);

  const today = new Date();
  const date3MAgo = new Date(today); date3MAgo.setMonth(today.getMonth() - 3);
  const date1YAgo = new Date(today); date1YAgo.setFullYear(today.getFullYear() - 1);
  const date3YAgo = new Date(today); date3YAgo.setFullYear(today.getFullYear() - 3);
  const date5YAgo = new Date(today); date5YAgo.setFullYear(today.getFullYear() - 5);

  let processedCount = 0;

  for (const scheme of schemes) {
    const navs = await prisma.navObservation.findMany({
      where: { schemeId: scheme.id },
      orderBy: { navDate: 'asc' }
    });

    if (navs.length < 2) continue; // Not enough data

    const currentNav = navs[navs.length - 1];
    
    // Find closest NAVs for the time periods
    const getClosestNav = (targetDate: Date) => {
      let closest = navs[0];
      let minDiff = Infinity;
      for (const nav of navs) {
        const diff = Math.abs(nav.navDate.getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closest = nav;
        }
      }
      // If the closest is more than 30 days away, assume no data for that period
      if (minDiff > 30 * 24 * 60 * 60 * 1000) return null;
      return closest;
    };

    const nav3M = getClosestNav(date3MAgo);
    const nav1Y = getClosestNav(date1YAgo);
    const nav3Y = getClosestNav(date3YAgo);
    const nav5Y = getClosestNav(date5YAgo);

    const return3M = nav3M ? calculateAbsoluteReturn(nav3M.nav, currentNav.nav) : null;
    const return1Y = nav1Y ? calculateAbsoluteReturn(nav1Y.nav, currentNav.nav) : null;
    const return3Y = nav3Y ? calculateAnnualizedReturn(nav3Y.nav, currentNav.nav, 3) : null;
    const return5Y = nav5Y ? calculateAnnualizedReturn(nav5Y.nav, currentNav.nav, 5) : null;

    // Ratios (using 1Y daily returns)
    let sharpeRatio = null, sortinoRatio = null, beta = null, alpha = null;
    let upsideCapture = null, downsideCapture = null, informationRatio = null;

    if (nav1Y) {
      // Get last 1 year of daily returns
      const oneYearNavs = navs.filter(n => n.navDate >= nav1Y.navDate);
      const dailyFundReturns = calculateDailyReturns(oneYearNavs.map(n => n.nav));
      
      // Match benchmark returns for the exact same dates
      const dailyBenchReturns: number[] = [];
      const matchedFundReturns: number[] = [];
      
      for (let i = 1; i < oneYearNavs.length; i++) {
        const prevDateStr = oneYearNavs[i-1].navDate.toISOString().split('T')[0];
        const currDateStr = oneYearNavs[i].navDate.toISOString().split('T')[0];
        const benchPrev = benchmarkDateMap.get(prevDateStr);
        const benchCurr = benchmarkDateMap.get(currDateStr);
        
        if (benchPrev && benchCurr) {
          dailyBenchReturns.push((benchCurr - benchPrev) / benchPrev);
          matchedFundReturns.push(dailyFundReturns[i-1]);
        }
      }

      const oneYearAnnualizedFundReturn = return1Y ?? 0;
      
      if (dailyFundReturns.length > 0) {
        sharpeRatio = calculateSharpeRatio(oneYearAnnualizedFundReturn, dailyFundReturns);
        sortinoRatio = calculateSortinoRatio(oneYearAnnualizedFundReturn, dailyFundReturns);
      }

      if (matchedFundReturns.length > 0) {
        beta = calculateBeta(matchedFundReturns, dailyBenchReturns);
        
        // Bench return over 1Y
        const bench1YStart = benchmarkDateMap.get(oneYearNavs[0].navDate.toISOString().split('T')[0]);
        const bench1YEnd = benchmarkDateMap.get(oneYearNavs[oneYearNavs.length-1].navDate.toISOString().split('T')[0]);
        let benchAnnualReturn = 0;
        if (bench1YStart && bench1YEnd) {
          benchAnnualReturn = (bench1YEnd - bench1YStart) / bench1YStart;
        }

        alpha = calculateAlpha(oneYearAnnualizedFundReturn, benchAnnualReturn, beta);
        
        const captures = calculateCaptureRatios(matchedFundReturns, dailyBenchReturns);
        upsideCapture = captures.upsideCapture;
        downsideCapture = captures.downsideCapture;
        
        informationRatio = calculateInformationRatio(matchedFundReturns, dailyBenchReturns, oneYearAnnualizedFundReturn, benchAnnualReturn);
      }
    }

    // Update in DB
    await prisma.scheme.update({
      where: { id: scheme.id },
      data: {
        return3M,
        return1Y,
        return3Y,
        return5Y,
        sharpeRatio,
        sortinoRatio,
        beta,
        alpha,
        upsideCapture,
        downsideCapture,
        informationRatio
      }
    });

    processedCount++;
    if (processedCount % 100 === 0) console.log(`Processed ${processedCount} schemes...`);
  }

  console.log(`Successfully processed all ${processedCount} schemes.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
