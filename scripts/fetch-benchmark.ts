import 'dotenv/config';
import yahooFinanceModule from 'yahoo-finance2';
const YahooFinance = (yahooFinanceModule as any).default || yahooFinanceModule;
const yahooFinance = new YahooFinance();
import prisma from '../src/lib/prisma';

async function main() {
  const symbol = '^NSEI';
  // Fetch from 10 years ago to have enough data for 10Y rolling/5Y returns
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 15);
  
  const queryOptions = { 
    period1: tenYearsAgo.toISOString(),
    period2: new Date().toISOString()
  };
  console.log('Fetching NIFTY 50 historical data...');
  const result = await yahooFinance.chart(symbol, queryOptions as any);
  
  const data = result.quotes.map((r: any) => ({
    date: new Date(r.date),
    value: r.close
  })).filter((d: any) => !isNaN(d.value) && d.value !== null);

  console.log(`Fetched ${data.length} records. Syncing to DB...`);

  await prisma.$transaction(async (tx) => {
    await tx.benchmarkObservation.deleteMany();
    
    const chunkSize = 1000;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await tx.benchmarkObservation.createMany({
        data: chunk
      });
    }
  });

  console.log('Benchmark data synced successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
