'use server';

import prisma from '@/lib/prisma';

export type FilterOptions = {
  query?: string;
  minReturn1Y?: number;
  minReturn3Y?: number;
  minReturn5Y?: number;
  minSharpeRatio?: number;
  minSortinoRatio?: number;
  minBeta?: number;
  maxBeta?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'return1Y' | 'return3Y' | 'return5Y' | 'sharpeRatio' | 'sortinoRatio' | 'beta' | 'alpha' | 'informationRatio';
  sortOrder?: 'asc' | 'desc';
};

export async function filterSchemes(options: FilterOptions) {
  const {
    query,
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

  if (query && query.length >= 2) {
    const isNumeric = /^\d+$/.test(query);
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      ...(isNumeric ? [{ schemeCode: parseInt(query, 10) }] : [])
    ];
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

  // Only return schemes that have some data if we are sorting by it
  if (sortBy) {
    // If not searching by query, filter out nulls for the sort field to ensure relevant results
    if (!query) {
      (where as any)[sortBy] = { not: null };
    }
  }

  const skip = (page - 1) * pageSize;

  const schemes = await prisma.scheme.findMany({
    where,
    orderBy: sortBy ? { [sortBy]: sortOrder } : undefined,
    skip,
    take: pageSize,
  });

  const total = await prisma.scheme.count({ where });

  return { schemes, total, page, pageSize };
}
