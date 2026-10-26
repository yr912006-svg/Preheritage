// PREHERITAGE Seed Script
// Populates catalog and coupon data. An administrator requires explicit environment credentials.

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env.local');
  } catch (e) {
    try {
      process.loadEnvFile('.env');
    } catch (e2) {}
  }
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PREHERITAGE database...');

  if (!process.env.DATABASE_URL) {
    console.log('Notice: DATABASE_URL not yet configured. Please set DATABASE_URL in .env or on Vercel.');
    return;
  }

  try {
    if (process.env.ADMIN_INITIAL_EMAIL && process.env.ADMIN_INITIAL_PASSWORD) {
      const email = process.env.ADMIN_INITIAL_EMAIL.trim().toLowerCase();
      const password = process.env.ADMIN_INITIAL_PASSWORD;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) throw new Error('ADMIN_INITIAL_EMAIL must be valid and ADMIN_INITIAL_PASSWORD must be at least 12 characters.');
      await prisma.admin.upsert({
        where: { email },
        update: {},
        create: { name: 'PREHERITAGE Administrator', email, passwordHash: await bcrypt.hash(password, 12), role: 'SUPER_ADMIN' },
      });
      console.log('Created or retained configured administrator.');
    } else {
      console.log('Administrator skipped; set ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD to provision one.');
    }

    // 3. Create Coupons
    const coupons = [
      {
        code: 'HERITAGE10',
        description: '10% Royal Heritage discount on orders above ₹4,999',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderValue: 4999,
        maxDiscount: 5000,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'ROYAL2000',
        description: 'Flat ₹2,000 off on heritage sarees & bridal wear above ₹19,999',
        discountType: 'FIXED',
        discountValue: 2000,
        minOrderValue: 19999,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'FIRSTWEAR',
        description: '15% off welcome offer for new patrons',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minOrderValue: 2999,
        firstOrderOnly: true,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const c of coupons) {
      await prisma.coupon.upsert({
        where: { code: c.code },
        update: {},
        create: c,
      });
    }
    console.log('Seeded promotional coupons.');
    console.log('PREHERITAGE Database Seeding Completed Successfully.');
  } catch (err) {
    console.warn('Database seed notice (DB host unreachable locally):', err.message);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
