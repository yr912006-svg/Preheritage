# PREHERITAGE — Wear the Stories of India
**Official Domain:** [preheritage.com](https://preheritage.com)  
**Brand Philosophy:** *Don’t Just Wear Heritage. Carry It Forward.*  
**Core Idea:** *Many Stories. One Thread.*  
**Positioning:** *Indian Soul. Global Luxury. Timeless Elegance.*

---

## 🏛️ Executive Summary

**PREHERITAGE** is a production-ready, mobile-first luxury ecommerce platform celebrating India's sacred handlooms, royal silks, certified GI weaving clusters, and archival handicrafts. Built with **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **PostgreSQL**, **NextAuth.js**, **Razorpay**, and designed for seamless high-performance deployment on **Vercel**.

---

## 🗂️ Complete Folder Structure

```
PREHERITAGE-With-Official-Logo/
├── .env.example                     # Environment variables template
├── .env.local                       # Local development credentials
├── .gitignore                       # Git ignore rules
├── next.config.mjs                  # Remote image domains & Next.js config
├── package.json                     # Dependencies and scripts
├── postcss.config.mjs               # PostCSS Tailwind config
├── tailwind.config.ts               # Quiet-luxury color tokens & typography
├── tsconfig.json                    # Strict TypeScript configuration
├── README.md                        # Documentation & Vercel deployment guide
├── prisma/
│   ├── schema.prisma                # Complete production Prisma database schema
│   └── seed.js                      # Database seed script for products & admin
├── public/
│   ├── images/                      # Curated high-res imagery
│   └── logo/                        # Official brand logo & crest emblems
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx       # Email + Password & Google OAuth login
    │   │   ├── register/page.tsx    # Customer registration
    │   │   └── otp-login/page.tsx   # Mobile phone OTP login (Fast2SMS/MSG91/Twilio)
    │   ├── (customer)/
    │   │   └── account/page.tsx     # Customer dashboard (Orders, Addresses, Wishlist, Coupons, Support)
    │   ├── admin/
    │   │   ├── layout.tsx           # Admin layout with secure sidebar
    │   │   ├── page.tsx             # Executive analytics & orders pipeline overview
    │   │   ├── login/page.tsx       # Dedicated admin portal login
    │   │   ├── products/
    │   │   │   ├── page.tsx         # Catalog management table (CRUD)
    │   │   │   └── new/page.tsx     # Add new handcrafted creation
    │   │   ├── orders/page.tsx      # Order management & courier dispatch
    │   │   └── inventory/page.tsx   # Variant-level stock adjustment
    │   ├── api/
    │   │   ├── auth/
    │   │   │   ├── [...nextauth]/route.ts
    │   │   │   ├── register/route.ts
    │   │   │   └── send-otp/route.ts
    │   │   ├── checkout/route.ts
    │   │   ├── razorpay/
    │   │   │   ├── create-order/route.ts
    │   │   │   └── verify-payment/route.ts
    │   │   └── newsletter/route.ts
    │   ├── products/
    │   │   └── [slug]/page.tsx      # Luxury product detail page with video & reviews
    │   ├── shop/page.tsx            # Filterable product catalogue
    │   ├── cart/page.tsx            # Shopping bag with free-shipping bar
    │   ├── checkout/page.tsx        # Guest/User checkout with Razorpay & COD
    │   ├── order-success/page.tsx   # Confirmation & invoice preview
    │   ├── track-order/page.tsx     # Real-time 6-stage logistics tracker
    │   ├── about/page.tsx           # Brand story & artisan commitment
    │   ├── contact/page.tsx         # Atelier concierge with direct WhatsApp
    │   ├── faq/page.tsx             # Frequently asked questions
    │   ├── shipping-policy/page.tsx # Domestic & international transit policy
    │   ├── return-policy/page.tsx   # 7-day royal exchange & reverse pickup
    │   ├── privacy-policy/page.tsx  # DPDP & GDPR compliance
    │   ├── terms/page.tsx           # Terms of service
    │   ├── journal/page.tsx         # Cultural Stories of India articles
    │   ├── not-found.tsx            # Custom 404 page
    │   ├── robots.ts                # SEO robots directives
    │   ├── sitemap.ts               # Dynamic XML sitemap generator
    │   ├── layout.tsx               # Root layout with Cart/Wishlist providers
    │   ├── page.tsx                 # Homepage with luxury hero & regional showcase
    │   └── globals.css              # Warm ivory, deep charcoal, antique gold tokens
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx           # Sticky nav with search, bag, wishlist, and menu
    │   │   ├── Footer.tsx           # Brand manifesto, links, policies, and newsletter
    │   │   ├── AnnouncementBar.tsx  # Cycling offers & dispatch alerts
    │   │   └── Logo.tsx             # Official PREHERITAGE crest & brandmark
    │   ├── home/
    │   │   ├── HeroBanner.tsx       # Fullscreen hero with tagline
    │   │   ├── CulturalStory.tsx    # "Many Stories. One Thread." section
    │   │   ├── ShopByCategory.tsx   # Sarees, Kurtas, Lehengas, Handloom, etc.
    │   │   ├── ShopByRegion.tsx     # Kashmir, Varanasi, Rajasthan, Gujarat, etc.
    │   │   ├── BestSellers.tsx      # Bestsellers & New Arrivals tabbed showcase
    │   │   ├── Testimonials.tsx     # Patron reviews from New Delhi, Mumbai, NY, London
    │   │   └── SocialFeed.tsx       # @preheritage Instagram aesthetic curation
    │   ├── shop/
    │   │   └── ProductCard.tsx      # Badges, hover preview, quick add, wishlist
    │   ├── cart/
    │   │   └── CartDrawer.tsx       # Global slide-over bag
    │   └── admin/
    │       └── AdminSidebar.tsx     # Console navigation
    ├── context/
    │   ├── CartContext.tsx          # LocalStorage synced bag with discount calculations
    │   └── WishlistContext.tsx      # Wishlist store with restock alert capability
    └── lib/
        ├── prisma.ts                # Prisma client singleton
        ├── auth.ts                  # NextAuth options (Credentials, OTP, Google)
        ├── razorpay.ts              # Razorpay order creator & signature verifier
        ├── sms.ts                   # Fast2SMS, Twilio, MSG91 integration
        ├── cloudinary.ts            # Media storage utility
        ├── utils.ts                 # Formatting, Indian States list, order numbers
        └── sample-data.ts           # Curated products, categories, regions, coupons
```

---

## 🚀 Quick Local Setup

1. **Clone & install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   node prisma/seed.js
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the storefront.

---

## 🔐 Credentials for Immediate Testing

- **Customer Demo Account:**
  - Email: `customer@preheritage.com`
  - Password: `Customer@123`
- **Mobile OTP Demo:**
  - Phone: `9876543210`
  - OTP: `123456`
- **Admin Console (`/admin`):**
  - Email: `admin@preheritage.com`
  - Password: `Admin@Preheritage2026`

---

## ☁️ Step-by-Step Vercel Deployment Instructions

1. **Push Code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete Preheritage luxury ecommerce platform"
   git remote add origin https://github.com/[YOUR_USERNAME]/preheritage.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Import your GitHub repository.
   - Choose **Next.js** framework preset.

3. **Configure Environment Variables in Vercel:**
   Copy the keys from `.env.example` into Vercel's **Settings → Environment Variables**:
   - `DATABASE_URL` (From Vercel Postgres, Supabase, or Neon)
   - `NEXTAUTH_URL` (`https://preheritage.com`)
   - `NEXTAUTH_SECRET` (Generate using `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `OTP_PROVIDER` (`FAST2SMS`, `MSG91`, or `TWILIO`)
   - `FAST2SMS_API_KEY`

4. **Connect Custom Domain (`preheritage.com`):**
   - In Vercel Project Dashboard, navigate to **Settings → Domains**.
   - Enter `preheritage.com` and `www.preheritage.com`.
   - Update your DNS records at your domain registrar (GoDaddy, Namecheap, Hostinger, or Cloudflare):
     - **A Record:** `@` points to `76.76.21.21`
     - **CNAME Record:** `www` points to `cname.vercel-dns.com`
   - Vercel will automatically provision SSL certificates.

---

## 📋 Final Pre-Launch Checklist

- [x] Configure production `DATABASE_URL` on Neon/Supabase with connection pooling (`sslmode=require`).
- [x] Switch `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from test mode (`rzp_test_...`) to live mode (`rzp_live_...`).
- [x] Enable UPI & RuPay routing in Razorpay Merchant Dashboard.
- [x] Register OAuth Authorized Redirect URIs in Google Cloud Console: `https://preheritage.com/api/auth/callback/google`.
- [x] Update SMS gateway DLT entity template ID with Telecom Regulatory Authority of India (TRAI).
- [x] Connect Shiprocket API credentials for automated shipping AWB generation.
