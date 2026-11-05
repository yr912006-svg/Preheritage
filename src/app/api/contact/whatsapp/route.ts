import { NextResponse } from "next/server";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp-contact";

export const dynamic = "force-dynamic";

export async function GET() {
  const number = normalizeWhatsAppNumber(process.env.WHATSAPP_SUPPORT_NUMBER);
  return NextResponse.json(number ? { number } : { number: null }, { headers: { "Cache-Control": "no-store" } });
}
