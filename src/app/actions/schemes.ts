'use server';

import prisma from '@/lib/prisma';
import { fetchSchemeNavHistory } from '@/infrastructure/mfapi';
import { revalidatePath } from 'next/cache';

/**
 * Search mutual fund schemes from the local database by name or ID.
 * Returns top 50 matches.
 */
export async function searchSchemes(query: string) {
  if (!query || query.length < 2) return [];

  // Check if query is numeric (search by scheme code)
  const isNumeric = /^\d+$/.test(query);

  const schemes = await prisma.scheme.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        ...(isNumeric ? [{ schemeCode: parseInt(query, 10) }] : [])
      ]
    },
    take: 50,
  });

  return schemes;
}

/**
 * Fetch scheme and NAV history from local DB.
 * Lazily fetches from MFapi if data is missing or stale.
 */
export async function getSchemeDetails(schemeCode: number, forceRefresh = false) {
  let scheme = await prisma.scheme.findUnique({
    where: { schemeCode },
    include: {
      navs: {
        orderBy: { navDate: 'desc' },
      },
    }
  });

  if (!scheme) {
    throw new Error(`Scheme ${schemeCode} not found in master database.`);
  }

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const isStale = !scheme.lastSyncedAt || scheme.lastSyncedAt < oneDayAgo;
  const hasNoData = scheme.navs.length === 0;

  if (forceRefresh || hasNoData || isStale) {
    await syncSchemeNavData(schemeCode);
    
    // Re-fetch from DB after sync
    scheme = await prisma.scheme.findUnique({
      where: { schemeCode },
      include: {
        navs: {
          orderBy: { navDate: 'desc' },
        },
      }
    });
  }

  return scheme;
}

/**
 * Fetches NAV data from MFapi and syncs it to our local database.
 */
export async function syncSchemeNavData(schemeCode: number) {
  console.log(`Syncing NAV data for scheme ${schemeCode}...`);
  
  const apiData = await fetchSchemeNavHistory(schemeCode);
  
  if (!apiData || !apiData.data) {
    throw new Error("Invalid data received from MFapi");
  }

  // Parse strings to dates/numbers
  const newNavs = apiData.data.map(item => {
    // MFapi dates are 'DD-MM-YYYY'. We need to parse this properly.
    const [day, month, year] = item.date.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return {
      schemeId: schemeCode, // schemeCode is used as id in DB
      navDate: dateObj,
      nav: parseFloat(item.nav),
    };
  });

  // Since SQLite does not support createMany with skipDuplicates or createManyAndReturn well for upserts,
  // we'll run upserts in a transaction for the new rows. Or better, just delete existing and bulk insert
  // to avoid hitting limits and for performance since it's historical data.
  // Actually, deleting all and inserting is very fast for SQLite!
  
  await prisma.$transaction(async (tx) => {
    await tx.navObservation.deleteMany({
      where: { schemeId: schemeCode }
    });

    // Chunk inserts if it's very large (some funds have 5000+ days)
    const chunkSize = 1000;
    for (let i = 0; i < newNavs.length; i += chunkSize) {
      const chunk = newNavs.slice(i, i + chunkSize);
      await tx.navObservation.createMany({
        data: chunk
      });
    }

    // Update category from metadata and lastSyncedAt
    await tx.scheme.update({
      where: { id: schemeCode },
      data: {
        category: apiData.meta.scheme_category,
        lastSyncedAt: new Date()
      }
    });
  });

  console.log(`Sync complete for ${schemeCode} (${newNavs.length} records)`);
  return true;
}

export async function refreshSchemeAction(schemeCode: number) {
  await syncSchemeNavData(schemeCode);
  revalidatePath(`/fund/${schemeCode}`);
}

export async function getMultipleSchemesDetails(schemeCodes: number[]) {
  const results = await Promise.all(schemeCodes.map(code => getSchemeDetails(code)));
  // Filter out any nulls
  return results.filter(r => r !== null) as NonNullable<Awaited<ReturnType<typeof getSchemeDetails>>>[];
}
