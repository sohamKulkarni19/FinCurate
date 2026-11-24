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

const CONCURRENCY = 5;
const BATCH_DELAY_MS = 60;

function sanitize(val: any): number | null {
  if (val == null || typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return null;
  }
  return val;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(schemeCode: number, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchSchemeNavHistory(schemeCode);
    } catch (err: any) {
      if (err.message && err.message.includes('429')) {
        await delay(attempt * 400); // Back off on 429
        continue;
      }
      if (attempt === maxRetries) throw err;
      await delay(200);
    }
  }
  return null;
}

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

  // Find all schemes that need consistent ratio recomputation
  console.log('Querying schemes to recompute with proper formulas...');
  const schemes = await prisma.scheme.findMany({
    where: {
      OR: [
        { return1Y: { not: null } },
        { return3Y: { not: null } },
        { sortinoRatio: { not: null } }
      ]
    },
    select: {
      id: true,
      schemeCode: true,
      name: true
    },
    orderBy: { id: 'asc' }
  });

  console.log(`Found ${schemes.length} schemes to recompute with exact formulas.`);

  const today = new Date();
  const date3MAgo = new Date(today); date3MAgo.setMonth(today.getMonth() - 3);
  const date1YAgo = new Date(today); date1YAgo.setFullYear(today.getFullYear() - 1);
  const date3YAgo = new Date(today); date3YAgo.setFullYear(today.getFullYear() - 3);
  const date5YAgo = new Date(today); date5YAgo.setFullYear(today.getFullYear() - 5);

  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  let schemeIndex = 0;
  const startTime = Date.now();

  async function processScheme(scheme: { id: number; schemeCode: number; name: string }) {
    try {
      const apiData = await fetchWithRetry(scheme.schemeCode);
      if (!apiData || !apiData.data || apiData.data.length < 2) {
        return;
      }

      const navs = apiData.data.map((item: any) => {
        const [day, month, year] = item.date.split('-');
        return {
          navDate: new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)),
          nav: parseFloat(item.nav)
        };
      }).sort((a: any, b: any) => a.navDate.getTime() - b.navDate.getTime());

      if (navs.length < 2) return;

      const currentNav = navs[navs.length - 1];
      if (currentNav.nav <= 0 || !isFinite(currentNav.nav)) return;

      // Ensure historical target date is not identical to currentNav date
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
        if (minDiff > 30 * 24 * 60 * 60 * 1000) return null;
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

      let sharpeRatio = null;
      let sortinoRatio = null;
      let beta = null;
      let alpha = null;
      let upsideCapture = null;
      let downsideCapture = null;
      let informationRatio = null;

      if (nav1Y) {
        const oneYearNavs = navs.filter((n: any) => n.navDate >= nav1Y.navDate);
        const dailyFundReturns = calculateDailyReturns(oneYearNavs.map((n: any) => n.nav));

        const dailyBenchReturns: number[] = [];
        const matchedFundReturns: number[] = [];

        for (let i = 1; i < oneYearNavs.length; i++) {
          const prevDateStr = oneYearNavs[i - 1].navDate.toISOString().split('T')[0];
          const currDateStr = oneYearNavs[i].navDate.toISOString().split('T')[0];
          const benchPrev = benchmarkDateMap.get(prevDateStr);
          const benchCurr = benchmarkDateMap.get(currDateStr);

          if (benchPrev && benchCurr) {
            dailyBenchReturns.push((benchCurr - benchPrev) / benchPrev);
            matchedFundReturns.push(dailyFundReturns[i - 1]);
          }
        }

        const oneYearAnnualizedFundReturn = return1Y ?? 0;

        if (dailyFundReturns.length > 0) {
          const rawSharpe = calculateSharpeRatio(oneYearAnnualizedFundReturn, dailyFundReturns);
          sharpeRatio = rawSharpe === 0 && Math.abs(oneYearAnnualizedFundReturn - 0.06) > 0.01 ? null : rawSharpe;

          const rawSortino = calculateSortinoRatio(oneYearAnnualizedFundReturn, dailyFundReturns);
          sortinoRatio = rawSortino;
        }

        if (matchedFundReturns.length > 0) {
          beta = calculateBeta(matchedFundReturns, dailyBenchReturns);

          const bench1YStart = benchmarkDateMap.get(oneYearNavs[0].navDate.toISOString().split('T')[0]);
          const bench1YEnd = benchmarkDateMap.get(oneYearNavs[oneYearNavs.length - 1].navDate.toISOString().split('T')[0]);
          let benchAnnualReturn = 0;
          if (bench1YStart && bench1YEnd) {
            benchAnnualReturn = (bench1YEnd - bench1YStart) / bench1YStart;
          }

          if (beta != null) {
            alpha = calculateAlpha(oneYearAnnualizedFundReturn, benchAnnualReturn, beta);
          }

          const captures = calculateCaptureRatios(matchedFundReturns, dailyBenchReturns);
          upsideCapture = captures.upsideCapture;
          downsideCapture = captures.downsideCapture;

          informationRatio = calculateInformationRatio(matchedFundReturns, dailyBenchReturns, oneYearAnnualizedFundReturn, benchAnnualReturn);
        }
      }

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

      updatedCount++;
    } catch (err: any) {
      errorCount++;
    } finally {
      processedCount++;
      if (processedCount % 250 === 0 || processedCount === schemes.length) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = (processedCount / elapsed).toFixed(1);
        const percent = ((processedCount / schemes.length) * 100).toFixed(1);
        console.log(`[${percent}%] Processed ${processedCount}/${schemes.length} schemes (${rate}/s, ${updatedCount} updated, ${errorCount} errors)`);
      }
    }
  }

  async function worker() {
    while (schemeIndex < schemes.length) {
      const current = schemes[schemeIndex++];
      await processScheme(current);
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(`Starting ${CONCURRENCY} parallel workers (batch delay ${BATCH_DELAY_MS}ms)...`);
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nRecomputation Complete in ${totalTime}s! Updated: ${updatedCount}, Errors: ${errorCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
