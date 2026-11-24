import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { fetchSchemeNavHistory } from '../src/infrastructure/mfapi';
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

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log('Fetching benchmark data from DB...');
  const benchmarkNavs = await prisma.benchmarkObservation.findMany({
    orderBy: { date: 'asc' }
  });

  if (benchmarkNavs.length === 0) {
    console.error('No benchmark data found. Run fetch-benchmark.ts first.');
    return;
  }

  const benchmarkDateMap = new Map(benchmarkNavs.map(b => [b.date.toISOString().split('T')[0], b.value]));

  // Get all schemes that DO NOT have return3Y calculated yet.
  // This allows resuming the script if it gets interrupted.
  const schemes = await prisma.scheme.findMany({
    where: {
      return3Y: null
    },
    select: {
      id: true,
      schemeCode: true
    }
  });

  console.log(`Found ${schemes.length} schemes needing analytics backfill...`);

  const today = new Date();
  const date3MAgo = new Date(today); date3MAgo.setMonth(today.getMonth() - 3);
  const date1YAgo = new Date(today); date1YAgo.setFullYear(today.getFullYear() - 1);
  const date3YAgo = new Date(today); date3YAgo.setFullYear(today.getFullYear() - 3);
  const date5YAgo = new Date(today); date5YAgo.setFullYear(today.getFullYear() - 5);

  let processedCount = 0;
  let errorCount = 0;

  for (const scheme of schemes) {
    try {
      // 1. Fetch from API
      const apiData = await fetchSchemeNavHistory(scheme.schemeCode);
      
      if (!apiData || !apiData.data || apiData.data.length < 2) {
        continue;
      }

      // 2. Parse into Date objects and float NAVs, and sort ascending
      const navs = apiData.data.map(item => {
        const [day, month, year] = item.date.split('-');
        return {
          navDate: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
          nav: parseFloat(item.nav)
        };
      }).sort((a, b) => a.navDate.getTime() - b.navDate.getTime());

      if (navs.length < 2) continue;

      const currentNav = navs[navs.length - 1];
      if (currentNav.nav <= 0 || !isFinite(currentNav.nav)) continue;
      
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
        if (minDiff > 30 * 24 * 60 * 60 * 1000) return null; // > 30 days away = no data
        // Target historical NAV must not be the exact same point as currentNav
        if (closest.navDate.getTime() === currentNav.navDate.getTime()) return null;
        if (closest.nav <= 0 || !isFinite(closest.nav)) return null;
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

      const sanitize = (val: any) => {
        if (val == null || typeof val !== 'number' || isNaN(val) || !isFinite(val)) return null;
        return val;
      };

      // Update in DB (do not write to NavObservation!)
      await prisma.scheme.update({
        where: { id: scheme.id },
        data: {
          return3M: sanitize(return3M),
          return1Y: sanitize(return1Y),
          return3Y: sanitize(return3Y),
          return5Y: sanitize(return5Y),
          sharpeRatio: sanitize(sharpeRatio),
          sortinoRatio: sanitize(sortinoRatio),
          beta: sanitize(beta),
          alpha: sanitize(alpha),
          upsideCapture: sanitize(upsideCapture),
          downsideCapture: sanitize(downsideCapture),
          informationRatio: sanitize(informationRatio),
          ...(apiData.meta?.scheme_category ? { category: apiData.meta.scheme_category } : {})
        }
      });

      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`Processed ${processedCount}/${schemes.length} schemes...`);
      }

      // Delay to avoid getting rate-limited by MFapi
      await delay(150); 
    } catch (err: any) {
      errorCount++;
      console.error(`Failed to process scheme ${scheme.schemeCode}: ${err.message}`);
    }
  }

  console.log(`\nBackfill complete! Processed: ${processedCount}, Errors: ${errorCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
