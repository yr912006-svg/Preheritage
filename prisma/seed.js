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

    // Keep the homepage's cultural-region catalogue present and repairable on repeat runs.
    // These banner URLs reuse imagery already referenced by the storefront sample data.
    const regions = [
      { name: 'Kashmir', slug: 'kashmir', state: 'Jammu & Kashmir', craftForm: 'Pashmina & Sozni Needlework', culturalStory: 'Woven high in the Himalayas, where Changthangi goat wool meets the centuries-old delicate art of Sozni needlework passed down through Kashmiri families.', bannerImage: '/images/regions/region-kashmir.jpg' },
      { name: 'Varanasi', slug: 'varanasi', state: 'Uttar Pradesh', craftForm: 'Kashi Katan Silk & Real Zari', culturalStory: 'On the ghats of the Ganges, master weavers translate Mughal motifs and celestial flora into heavy real zari brocades on pit looms.', bannerImage: '/images/regions/region-varanasi.jpg' },
      { name: 'Rajasthan', slug: 'rajasthan', state: 'Rajasthan', craftForm: 'Gota Patti & Royal Bandhej', culturalStory: 'From Jaipur to Jodhpur, desert women tie thousands of tiny knots on georgette and silk to create kaleidoscopic patterns inspired by royal coronation ceremonies.', bannerImage: '/images/regions/region-rajasthan.jpg' },
      { name: 'Kutch & Patan', slug: 'gujarat', state: 'Gujarat', craftForm: 'Double Ikkat Patola & Ajrakh', culturalStory: 'Ancient block printers and silk weavers using organic indigo, madder root, and intricate double-warp resist dyeing that lasts generations.', bannerImage: '/images/regions/region-gujarat.jpg' },
      { name: 'Bengal', slug: 'bengal', state: 'West Bengal', craftForm: 'Jamdani & Kantha Stitches', culturalStory: "The finest muslin woven with discontinuous weft technique that was once described as 'woven wind' by ancient Roman travelers.", bannerImage: '/images/regions/region-bengal.jpg' },
      { name: 'Kanchipuram', slug: 'tamilnadu', state: 'Tamil Nadu', craftForm: 'Temple Kanjeevaram Silks', culturalStory: 'Interlocking korvai weaving technique incorporating temple borders, peacocks (Mayil), and Rudraksha beads dipped in pure silver-gold zari.', bannerImage: '/images/regions/region-tamilnadu.jpg' },
    ];
    for (const region of regions) {
      await prisma.region.upsert({ where: { slug: region.slug }, update: region, create: region });
    }
    console.log(`Seeded ${regions.length} cultural regions.`);

    // 2.5 Ensure Catalogue Categories and Subcategories
    const categories = [
      { name: "Sarees", slug: "sarees", description: "Six yards of unstitched poetry woven across the sacred looms of India.", image: "/images/categories/category-sarees.jpg", orderIndex: 0 },
      { name: "Kurtas & Tunics", slug: "kurtas", description: "Breathable silks and handspun khadi tailored for modern poise.", image: "/images/categories/category-kurtas.jpg", orderIndex: 1 },
      { name: "Lehengas", slug: "lehengas", description: "Regal silhouettes adorned with zardozi, gota patti, and hand-embroidery.", image: "/images/categories/category-lehengas.jpg", orderIndex: 2 },
      { name: "Handloom", slug: "handloom", description: "Pure GI-tagged heritage weaves from master artisan clusters.", image: "/images/categories/category-handloom.jpg", orderIndex: 3 },
      { name: "Handicrafts & Decor", slug: "handicrafts", description: "Hand-chiseled brass, dhokra bell metal, and wooden heirloom artifacts.", image: "/images/categories/category-handicrafts.jpg", orderIndex: 4 },
      { name: "Art Posters", slug: "posters", description: "Limited-edition archival prints depicting India's timeless architectural marvels.", image: "/images/categories/category-posters.jpg", orderIndex: 5 },
      { name: "Accessories & Shawls", slug: "accessories", description: "Pure Pashmina wraps, potlis, and handcrafted antique gold jewelry.", image: "/images/categories/category-accessories.jpg", orderIndex: 6 },
      { name: "Men’s Ethnic Wear", slug: "mens-ethnic-wear", description: "Classic kurtas. Refined Nehru jackets.", image: "/images/categories/category-mens-ethnic-wear.jpg", orderIndex: 7 },
    ];

    const subcategoriesMap = {
      sarees: [
        { name: "Banarasi Katan Silk", slug: "banarasi-katan-silk" },
        { name: "Kanjeevaram Silk", slug: "kanjeevaram-silk" },
        { name: "Chanderi & Maheshwari", slug: "chanderi-maheshwari" },
        { name: "Jamdani Muslin", slug: "jamdani-muslin" },
        { name: "Patola & Bandhani", slug: "patola-bandhani" },
      ],
      kurtas: [
        { name: "Chanderi Silk Kurtas", slug: "chanderi-silk-kurtas" },
        { name: "Awadhi Angrakhas", slug: "awadhi-angrakhas" },
        { name: "Handspun Khadi Tunics", slug: "handspun-khadi-tunics" },
        { name: "Short Silk Tunics", slug: "short-silk-tunics" },
      ],
      lehengas: [
        { name: "Bridal Zardozi Lehengas", slug: "bridal-zardozi-lehengas" },
        { name: "Royal Gota Patti Sets", slug: "royal-gota-patti-sets" },
        { name: "Banarasi Brocade Lehengas", slug: "banarasi-brocade-lehengas" },
        { name: "Velvet Ceremonial Lehengas", slug: "velvet-ceremonial-lehengas" },
      ],
      "mens-ethnic-wear": [
        { name: "Royal Sherwanis & Achkans", slug: "royal-sherwanis-achkans" },
        { name: "Handcrafted Kurta Sets", slug: "handcrafted-kurta-sets" },
        { name: "Tailored Nehru Jackets", slug: "tailored-nehru-jackets" },
        { name: "Bandhgala Jackets", slug: "bandhgala-jackets" },
      ],
      handloom: [
        { name: "GI-Tagged Master Weaves", slug: "gi-tagged-master-weaves" },
        { name: "Khadi & Organic Cottons", slug: "khadi-organic-cottons" },
        { name: "Ikat & Telia Rumal", slug: "ikat-telia-rumal" },
        { name: "Tussar & Muga Silks", slug: "tussar-muga-silks" },
      ],
      handicrafts: [
        { name: "Brass & Dhokra Sculptures", slug: "brass-dhokra-sculptures" },
        { name: "Marble Inlay Artifacts", slug: "marble-inlay-artifacts" },
        { name: "Wooden Heirlooms & Boxes", slug: "wooden-heirlooms-boxes" },
        { name: "Silver Filigree", slug: "silver-filigree" },
      ],
      posters: [
        { name: "Architectural Heritage Prints", slug: "architectural-heritage-prints" },
        { name: "Mughal Botanical Lithographs", slug: "mughal-botanical-lithographs" },
        { name: "Vintage Palace Monochromes", slug: "vintage-palace-monochromes" },
      ],
      accessories: [
        { name: "Kashmiri Pashmina Shawls", slug: "kashmiri-pashmina-shawls" },
        { name: "Hand-Embroidered Stoles", slug: "hand-embroidered-stoles" },
        { name: "Potlis & Batwas", slug: "potlis-batwas" },
        { name: "Heritage Jewelry & Brooches", slug: "heritage-jewelry-brooches" },
      ],
    };

    for (const cat of categories) {
      const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
      const record = existing || await prisma.category.create({ data: cat });
      const subcats = subcategoriesMap[cat.slug] || [];
      const subcatCount = await prisma.subcategory.count({ where: { categoryId: record.id } });
      if (subcatCount === 0) {
        for (const sub of subcats) {
          await prisma.subcategory.upsert({
            where: { slug: sub.slug },
            update: {},
            create: { name: sub.name, slug: sub.slug, categoryId: record.id },
          });
        }
      }
    }
    console.log(`Seeded ${categories.length} catalogue categories and their subcategories.`);

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
