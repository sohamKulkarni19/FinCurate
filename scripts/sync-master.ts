import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { fetchSchemeList } from '../src/infrastructure/mfapi.js';

console.log(`Connecting to database at Postgres...`);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Fetching scheme list from MFapi.in...");
  const schemes = await fetchSchemeList();
  console.log(`Fetched ${schemes.length} schemes.`);

  console.log("Syncing to database...");
  
  const chunkSize = 2000;
  for (let i = 0; i < schemes.length; i += chunkSize) {
    const chunk = schemes.slice(i, i + chunkSize);
    
    const data = chunk.map(s => ({
      id: s.schemeCode,
      schemeCode: s.schemeCode,
      name: s.schemeName
    }));

    await prisma.scheme.createMany({
      data,
    });
    console.log(`Synced ${Math.min(i + chunkSize, schemes.length)} / ${schemes.length}`);
  }
  
  console.log("Sync complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
