import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('Sanitizing database from NaN and invalid zero returns...');

  // 1. Clean all IEEE-754 NaN values across all float columns in Scheme table
  const nanUpdateResult: any = await prisma.$executeRaw`
    UPDATE "Scheme" SET
      "return3M" = CASE WHEN "return3M" = 'NaN'::float8 THEN NULL ELSE "return3M" END,
      "return1Y" = CASE WHEN "return1Y" = 'NaN'::float8 THEN NULL ELSE "return1Y" END,
      "return3Y" = CASE WHEN "return3Y" = 'NaN'::float8 THEN NULL ELSE "return3Y" END,
      "return5Y" = CASE WHEN "return5Y" = 'NaN'::float8 THEN NULL ELSE "return5Y" END,
      "sharpeRatio" = CASE WHEN "sharpeRatio" = 'NaN'::float8 THEN NULL ELSE "sharpeRatio" END,
      "sortinoRatio" = CASE WHEN "sortinoRatio" = 'NaN'::float8 THEN NULL ELSE "sortinoRatio" END,
      "beta" = CASE WHEN "beta" = 'NaN'::float8 THEN NULL ELSE "beta" END,
      "alpha" = CASE WHEN "alpha" = 'NaN'::float8 THEN NULL ELSE "alpha" END,
      "upsideCapture" = CASE WHEN "upsideCapture" = 'NaN'::float8 THEN NULL ELSE "upsideCapture" END,
      "downsideCapture" = CASE WHEN "downsideCapture" = 'NaN'::float8 THEN NULL ELSE "downsideCapture" END,
      "informationRatio" = CASE WHEN "informationRatio" = 'NaN'::float8 THEN NULL ELSE "informationRatio" END
    WHERE 
      "return3M" = 'NaN'::float8 OR
      "return1Y" = 'NaN'::float8 OR
      "return3Y" = 'NaN'::float8 OR
      "return5Y" = 'NaN'::float8 OR
      "sharpeRatio" = 'NaN'::float8 OR
      "sortinoRatio" = 'NaN'::float8 OR
      "beta" = 'NaN'::float8 OR
      "alpha" = 'NaN'::float8 OR
      "upsideCapture" = 'NaN'::float8 OR
      "downsideCapture" = 'NaN'::float8 OR
      "informationRatio" = 'NaN'::float8;
  `;
  console.log(`Updated ${nanUpdateResult} records containing NaN values to NULL.`);

  // 2. Clean Segregated Portfolio 2 schemes with 0 NAVs
  const segregatedResult: any = await prisma.$executeRaw`
    UPDATE "Scheme" SET
      "return3M" = NULL,
      "return1Y" = NULL,
      "return3Y" = NULL,
      "return5Y" = NULL,
      "sharpeRatio" = NULL,
      "sortinoRatio" = NULL,
      "beta" = NULL,
      "alpha" = NULL,
      "upsideCapture" = NULL,
      "downsideCapture" = NULL,
      "informationRatio" = NULL
    WHERE "name" ILIKE '%Segregated Portfolio 2%';
  `;
  console.log(`Reset ${segregatedResult} Segregated Portfolio 2 schemes with flat 0 NAVs.`);

  // 3. Clean Groww/Indiabulls defunct arbitrage schemes where return3Y was falsely calculated as 0
  const defunctResult: any = await prisma.$executeRaw`
    UPDATE "Scheme" SET
      "return3Y" = NULL
    WHERE "name" ILIKE '%Groww Arbitrage%' AND "return3Y" = 0;
  `;
  console.log(`Reset ${defunctResult} defunct Arbitrage schemes with false 0 return3Y.`);

  // 4. Verify no NaNs remain
  const check: any = await prisma.$queryRaw`
    SELECT 
      COUNT(*) FILTER (WHERE "sharpeRatio" = 'NaN'::float8) as nan_sharpe,
      COUNT(*) FILTER (WHERE "beta" = 'NaN'::float8) as nan_beta,
      COUNT(*) FILTER (WHERE "alpha" = 'NaN'::float8) as nan_alpha
    FROM "Scheme";
  `;
  console.log('Verification check (remaining NaNs):', check);
}

main().catch(console.error).finally(() => prisma.$disconnect());
