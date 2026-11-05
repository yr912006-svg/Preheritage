import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppContactUrl, normalizeWhatsAppNumber } from "./whatsapp-contact.ts";

test("WhatsApp contact numbers are normalized from formatted international values", () => {
  assert.equal(normalizeWhatsAppNumber("+91 (98765) 43210"), "919876543210");
  assert.equal(normalizeWhatsAppNumber(undefined), null);
  assert.equal(normalizeWhatsAppNumber("not-a-number"), null);
  assert.equal(normalizeWhatsAppNumber("0123456789"), null);
  assert.equal(normalizeWhatsAppNumber("1234567890123456"), null);
  assert.equal(normalizeWhatsAppNumber("919876543210?text=unsafe"), null);
});

test("WhatsApp URL encodes fixed message text safely and has no invented-number fallback", () => {
  const url = buildWhatsAppContactUrl("919876543210", "Hello PREHERITAGE Concierge, I need assistance with an order");
  assert.equal(new URL(url).hostname, "wa.me");
  assert.equal(new URL(url).pathname, "/919876543210");
  assert.equal(new URL(url).searchParams.get("text"), "Hello PREHERITAGE Concierge, I need assistance with an order");
  assert.equal(buildWhatsAppContactUrl(null, "Hello"), null);
});
