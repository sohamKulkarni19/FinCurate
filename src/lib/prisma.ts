import { PrismaClient } from '../generated/prisma/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import * as path from 'path';

// Construct the absolute path to the database
// In Next.js, process.cwd() points to the project root
const dbPath = path.resolve(process.cwd(), 'data/database/mf.db');

const sqlite = new Database(dbPath);
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
