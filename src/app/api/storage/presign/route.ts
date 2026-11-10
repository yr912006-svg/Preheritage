import { NextResponse } from "next/server";
import { requireAdminCapability } from "@/lib/account-auth";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { adminAuditStore } from "@/lib/admin-audit";
import { createProductImagePresignedUpload } from "@/lib/s3-presign";

export const runtime = "nodejs";

async function presignProductImage(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { filename, contentType, size } = body || {};
    const result = await createProductImagePresignedUpload({ filename, contentType, size });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Neon object storage presigning failed:", error);
    return NextResponse.json({ error: "Failed to generate presigned upload URL." }, { status: 503 });
  }
}

function createAdminPresignHandlers(authorize = requireAdminCapability) {
  return {
    POST: withAdminCapability(
      ADMIN_API_CAPABILITIES.productImagePresign.methods.POST,
      presignProductImage,
      authorize,
      adminAuditStore
    ),
  };
}

const handlers = createAdminPresignHandlers();
export const { POST } = handlers;
