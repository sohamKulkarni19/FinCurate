'use server';

import prisma from '@/lib/prisma';

export type FilterOptions = {
  query?: string;
  category?: string;
  plan?: 'all' | 'direct' | 'regular';
  minReturn1Y?: number;
  minReturn3Y?: number;
  minReturn5Y?: number;
  minSharpeRatio?: number;
  minSortinoRatio?: number;
  minBeta?: number;
  maxBeta?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'return1Y' | 'return3Y' | 'return5Y' | 'sharpeRatio' | 'sortinoRatio' | 'beta' | 'alpha' | 'upsideCapture' | 'downsideCapture' | 'informationRatio';
  sortOrder?: 'asc' | 'desc';
};

/** Map logical category identifiers to Prisma category where clauses */
function buildCategoryFilter(category: string): any {
  switch (category.toLowerCase()) {
    // Broad categories
    case 'equity':
      return { contains: 'Equity', mode: 'insensitive' };
    case 'debt':
      return {
        OR: [
          { contains: 'Debt', mode: 'insensitive' },
          { contains: 'Income', mode: 'insensitive' },
          { contains: 'Liquid', mode: 'insensitive' },
          { contains: 'Gilt', mode: 'insensitive' }
        ]
      };
    case 'hybrid':
      return { contains: 'Hybrid', mode: 'insensitive' };
    case 'index_etf':
      return {
        OR: [
          { contains: 'Index', mode: 'insensitive' },
          { contains: 'ETF', mode: 'insensitive' },
          { contains: 'Exchange Traded', mode: 'insensitive' }
        ]
      };

    // Equity subcategories
    case 'large_cap':
      return { contains: 'Large Cap', mode: 'insensitive' };
    case 'mid_cap':
      return { contains: 'Mid Cap', mode: 'insensitive' };
    case 'small_cap':
      return { contains: 'Small Cap', mode: 'insensitive' };
    case 'flexi_cap':
      return { contains: 'Flexi Cap', mode: 'insensitive' };
    case 'large_mid_cap':
      return { contains: 'Large & Mid', mode: 'insensitive' };
    case 'multi_cap':
      return { contains: 'Multi Cap', mode: 'insensitive' };
    case 'elss':
      return { contains: 'ELSS', mode: 'insensitive' };
    case 'sectoral_thematic':
      return {
        OR: [
          { contains: 'Sectoral', mode: 'insensitive' },
          { contains: 'Thematic', mode: 'insensitive' }
        ]
      };
    case 'value_contra':
      return {
        OR: [
          { contains: 'Value', mode: 'insensitive' },
          { contains: 'Contra', mode: 'insensitive' }
        ]
      };
    case 'focused':
      return {
        OR: [
          { contains: 'Focused', mode: 'insensitive' },
          { contains: 'Focussed', mode: 'insensitive' }
        ]
      };
    case 'dividend_yield':
      return { contains: 'Dividend Yield', mode: 'insensitive' };

    // Debt subcategories
    case 'liquid':
      return { contains: 'Liquid', mode: 'insensitive' };
    case 'overnight':
      return { contains: 'Overnight', mode: 'insensitive' };
    case 'money_market':
      return { contains: 'Money Market', mode: 'insensitive' };
    case 'ultra_short':
      return { contains: 'Ultra Short', mode: 'insensitive' };
    case 'low_duration':
      return { contains: 'Low Duration', mode: 'insensitive' };
    case 'short_duration':
      return { contains: 'Short Duration', mode: 'insensitive' };
    case 'medium_duration':
      return {
        OR: [
          { contains: 'Medium Duration', mode: 'insensitive' },
          { contains: 'Medium Term', mode: 'insensitive' },
          { contains: 'Medium to Long', mode: 'insensitive' }
        ]
      };
    case 'long_duration':
      return {
        OR: [
          { contains: 'Long Duration', mode: 'insensitive' },
          { contains: 'Long Term', mode: 'insensitive' }
        ]
      };
    case 'corporate_bond':
      return { contains: 'Corporate Bond', mode: 'insensitive' };
    case 'banking_psu':
      return { contains: 'Banking and PSU', mode: 'insensitive' };
    case 'gilt':
      return { contains: 'Gilt', mode: 'insensitive' };
    case 'dynamic_bond':
      return {
        OR: [
          { contains: 'Dynamic Bond', mode: 'insensitive' },
          { contains: 'Dynamic Term', mode: 'insensitive' }
        ]
      };
    case 'floater':
      return {
        OR: [
          { contains: 'Floater', mode: 'insensitive' },
          { contains: 'Floating Interest', mode: 'insensitive' }
        ]
      };
    case 'credit_risk':
      return { contains: 'Credit Risk', mode: 'insensitive' };

    // Hybrid subcategories
    case 'aggressive_hybrid':
      return { contains: 'Aggressive Hybrid', mode: 'insensitive' };
    case 'conservative_hybrid':
      return { contains: 'Conservative Hybrid', mode: 'insensitive' };
    case 'balanced_advantage':
      return {
        OR: [
          { contains: 'Balanced Advantage', mode: 'insensitive' },
          { contains: 'Dynamic Asset Allocation', mode: 'insensitive' }
        ]
      };
    case 'arbitrage':
      return { contains: 'Arbitrage', mode: 'insensitive' };
    case 'equity_savings':
      return { contains: 'Equity Savings', mode: 'insensitive' };
    case 'multi_asset':
      return { contains: 'Multi Asset', mode: 'insensitive' };

    // Other subcategories
    case 'index_funds':
      return { contains: 'Index', mode: 'insensitive' };
    case 'etf':
      return {
        OR: [
          { contains: 'ETF', mode: 'insensitive' },
          { contains: 'Exchange Traded', mode: 'insensitive' }
        ]
      };
    case 'fof':
      return {
        OR: [
          { contains: 'FoF', mode: 'insensitive' },
          { contains: 'Fund of Funds', mode: 'insensitive' }
        ]
      };
    case 'solution_oriented':
      return { contains: 'Solution Oriented', mode: 'insensitive' };

    default:
      return { contains: category, mode: 'insensitive' };
  }
}

export async function filterSchemes(options: FilterOptions) {
  const {
    query,
    category,
    plan,
    minReturn1Y,
    minReturn3Y,
    minReturn5Y,
    minSharpeRatio,
    minSortinoRatio,
    minBeta,
    maxBeta,
    page = 1,
    pageSize = 50,
    sortBy = 'return3Y',
    sortOrder = 'desc',
  } = options;

  const where: any = {};
  const andClauses: any[] = [];

  if (query && query.length >= 2) {
    const isNumeric = /^\d+$/.test(query);
    andClauses.push({
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        ...(isNumeric ? [{ schemeCode: parseInt(query, 10) }] : [])
      ]
    });
  }

  // Plan filtering: Direct vs Regular
  if (plan === 'direct') {
    andClauses.push({ name: { contains: 'Direct', mode: 'insensitive' } });
  } else if (plan === 'regular') {
    andClauses.push({ NOT: { name: { contains: 'Direct', mode: 'insensitive' } } });
  }

  // Category filtering
  if (category && category !== 'all') {
    const catFilter = buildCategoryFilter(category);
    if (catFilter.OR) {
      andClauses.push({
        OR: catFilter.OR.map((clause: any) => ({ category: clause }))
      });
    } else {
      andClauses.push({ category: catFilter });
    }
  }

  if (minReturn1Y !== undefined) where.return1Y = { gte: minReturn1Y };
  if (minReturn3Y !== undefined) where.return3Y = { gte: minReturn3Y };
  if (minReturn5Y !== undefined) where.return5Y = { gte: minReturn5Y };
  if (minSharpeRatio !== undefined) where.sharpeRatio = { gte: minSharpeRatio };
  if (minSortinoRatio !== undefined) where.sortinoRatio = { gte: minSortinoRatio };
  
  if (minBeta !== undefined || maxBeta !== undefined) {
    where.beta = {};
    if (minBeta !== undefined) where.beta.gte = minBeta;
    if (maxBeta !== undefined) where.beta.lte = maxBeta;
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  const skip = (page - 1) * pageSize;

  const schemes = await prisma.scheme.findMany({
    where,
    orderBy: sortBy ? [ { [sortBy]: { sort: sortOrder, nulls: 'last' } }, { id: 'asc' } ] : { id: 'asc' },
    skip,
    take: pageSize,
  });

  const total = await prisma.scheme.count({ where });

  return { schemes, total, page, pageSize };
}

/**
 * Returns all distinct non-null categories from the Scheme table, sorted alphabetically.
 */
export async function getDistinctCategories(): Promise<string[]> {
  const results = await prisma.scheme.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return results.map(r => r.category!);
}
