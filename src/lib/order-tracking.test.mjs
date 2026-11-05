import test from "node:test";
import assert from "node:assert/strict";
import { toOrderTrackingItems } from "./order-tracking.ts";

test("tracking items preserve each API quantity and calculate line totals from unit price", () => {
  const result = toOrderTrackingItems([
    { title: "Silk saree", size: "Free Size", color: "Gold", price: 1200, quantity: 2 },
    { title: "Handloom stole", size: null, color: "Indigo", price: 350, quantity: 3 },
  ]);

  assert.deepEqual(result, [
    { title: "Silk saree", size: "Free Size", color: "Gold", price: 1200, quantity: 2, lineTotal: 2400 },
    { title: "Handloom stole", size: null, color: "Indigo", price: 350, quantity: 3, lineTotal: 1050 },
  ]);
  assert.notEqual(result[0].lineTotal, 5000);
});
