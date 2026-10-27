import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin || !admin.isActive || !(await bcrypt.compare(password, admin.passwordHash))) return null;
        return { id: admin.id, name: admin.name, email: admin.email, role: "ADMIN", adminRole: admin.role } as any;
      },
    }),
    // 1. Google OAuth Login
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // 2. Email & Password Login
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (!user || !user.isActive || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            image: user.image,
          };
        } catch {
          // Keep infrastructure failures distinct from an ordinary bad password.
          // The client maps this stable code to a generic retry message; no database
          // details or credentials are sent to the browser.
          throw new Error("AuthenticationUnavailable");
        }
      },
    }),

    // 3. Mobile Phone & OTP Login
    CredentialsProvider({
      id: "phone-otp",
      name: "Mobile OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error("Phone number and OTP are required");
        }

        const phone = credentials.phone.replace(/[^0-9]/g, "").slice(-10);
        const otp = credentials.otp.trim();

        try {
          const record = await prisma.phoneOtp.findFirst({ where: { phone, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
          if (!record) return null;
          const consumed = await prisma.phoneOtp.deleteMany({ where: { id: record.id } });
          if (consumed.count !== 1 || !/^[a-f0-9]{64}$/i.test(record.otp)) return null;
          const expected = crypto.createHash("sha256").update(otp).digest();
          const actual = Buffer.from(record.otp, "hex");
          if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

          // Find or create customer
          let user = await prisma.user.findFirst({
            where: { phone },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                phone,
                name: `Guest (${phone.slice(-4)})`,
                role: "CUSTOMER",
                phoneVerified: new Date(),
              },
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            image: user.image,
          };
        } catch { return null; }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const email = user.email?.trim().toLowerCase();
      const googleProfile = profile as { email_verified?: boolean } | undefined;
      if (!email || googleProfile?.email_verified !== true) return false;
      try {
        const customer = await prisma.user.findUnique({ where: { email }, select: { role: true, isActive: true } });
        return Boolean(customer?.isActive && customer.role === "CUSTOMER");
      } catch {
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          const email = user.email?.trim().toLowerCase();
          let customer: any = null;
          try {
            if (email) customer = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, phone: true, image: true, isActive: true } });
          } catch {
            customer = null;
          }
          if (!customer?.isActive || customer.role !== "CUSTOMER") {
            token.id = undefined;
            token.role = "UNLINKED";
            token.adminRole = undefined;
          } else {
            token.id = customer.id;
            token.role = customer.role;
            token.phone = customer.phone;
            token.image = customer.image;
            token.adminRole = undefined;
          }
        } else {
          token.id = user.id;
          token.role = (user as any).role || "UNLINKED";
          token.phone = (user as any).phone;
          token.adminRole = (user as any).adminRole;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phone = token.phone;
        (session.user as any).adminRole = token.adminRole;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
