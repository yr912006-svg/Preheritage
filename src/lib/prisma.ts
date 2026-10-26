import { PrismaClient } from '@prisma/client';

// Next.js runs on Node.js here, so the existing Prisma PostgreSQL driver is
// appropriate. Neon supplies the pooled DATABASE_URL for requests and the
// direct DATABASE_URL_UNPOOLED for Prisma schema operations.

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
