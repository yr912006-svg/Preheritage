import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function parseHost(connectionUrl: string | undefined): string | null {
  if (!connectionUrl) return null;
  try {
    return new URL(connectionUrl).hostname;
  } catch {
    return null;
  }
}

function parseDatabaseName(connectionUrl: string | undefined): string | null {
  if (!connectionUrl) return null;
  try {
    return new URL(connectionUrl).pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

function timingSafeCheck(provided: string | null, secret: string | undefined): boolean {
  if (!provided || !secret) return false;
  const provBuf = Buffer.from(provided);
  const secBuf = Buffer.from(secret);
  if (provBuf.length !== secBuf.length) return false;
  return crypto.timingSafeEqual(provBuf, secBuf);
}

export async function GET(req: Request) {
  // 1. Hard-block in Production
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  // 2. Fail closed if diagnostic token is not configured
  const secretToken = process.env.PREVIEW_DIAGNOSTIC_TOKEN;
  if (!secretToken || secretToken.trim().length < 24) {
    return new NextResponse(null, { status: 404 });
  }

  // 3. Authenticate request via timing-safe header comparison
  const providedToken = req.headers.get("x-diagnostic-token");
  if (!timingSafeCheck(providedToken, secretToken)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    // 4. Local parsing of connection hosts (zero credentials exposed)
    const pooledHost = parseHost(process.env.DATABASE_URL);
    const directHost = parseHost(process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL);
    const configuredDb = parseDatabaseName(process.env.DATABASE_URL);

    // 5. Read-only SQL queries
    const dbResult = await prisma.$queryRawUnsafe<Array<{ db: string }>>(
      "SELECT current_database() AS db;"
    );
    const currentDb = dbResult[0]?.db ?? configuredDb;

    const columnResult = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'orders' 
          AND column_name = 'checkoutRequestFingerprint'
      ) AS "exists";
    `);
    const columnExists = Boolean(columnResult[0]?.exists);

    // 6. Classification
    let classification = "UNKNOWN";
    if (pooledHost?.includes("ep-dark-pine-b565nrk4")) {
      classification = "NEON_DEVELOPMENT";
    } else if (pooledHost?.includes("ep-wild-hat-b5yend0s")) {
      classification = "NEON_PRODUCTION";
    }

    // 7. Return strictly sanitized metadata
    return NextResponse.json({
      success: true,
      environment: process.env.VERCEL_ENV || "unknown",
      databaseName: currentDb,
      configuredPooledHost: pooledHost,
      hasDirectUrl: Boolean(directHost),
      configuredDirectHost: directHost,
      classification,
      columnCheckoutRequestFingerprintExists: columnExists,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Diagnostic query failed",
        code: error?.code ?? null,
      },
      { status: 500 }
    );
  }
}

