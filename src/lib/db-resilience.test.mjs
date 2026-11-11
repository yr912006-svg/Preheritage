import test from "node:test";
import assert from "node:assert/strict";
import { isPrismaConnectionError, sanitizeDbError } from "./db-resilience.ts";

test("isPrismaConnectionError identifies known Prisma connection error codes", () => {
  assert.equal(isPrismaConnectionError({ code: "P1001", message: "Can't reach database server" }), true);
  assert.equal(isPrismaConnectionError({ code: "P1017", message: "Server has closed the connection" }), true);
  assert.equal(isPrismaConnectionError({ code: "P2002", message: "Unique constraint failed" }), false);
});

test("isPrismaConnectionError identifies socket and OS-level connection reset errors", () => {
  assert.equal(
    isPrismaConnectionError({
      message: "Error in PostgreSQL connection: Error { kind: Io, cause: Some(Os { code: 10054, kind: ConnectionReset, message: \"An existing connection was forcibly closed by the remote host.\" }) }",
    }),
    true
  );
  assert.equal(isPrismaConnectionError({ message: "read ECONNRESET" }), true);
  assert.equal(isPrismaConnectionError({ message: "connect ETIMEDOUT" }), true);
  assert.equal(isPrismaConnectionError({ message: "Invalid argument supplied" }), false);
});

test("isPrismaConnectionError handles null and undefined safely", () => {
  assert.equal(isPrismaConnectionError(null), false);
  assert.equal(isPrismaConnectionError(undefined), false);
});

test("sanitizeDbError redacts database credentials and passwords", () => {
  const rawWithCreds = "Failed to connect to postgresql://neondb_owner:npg_SecretPass123@ep-xyz.aws.neon.tech/neondb?sslmode=require";
  const sanitized = sanitizeDbError(rawWithCreds);
  assert.equal(sanitized.includes("npg_SecretPass123"), false);
  assert.equal(sanitized.includes("neondb_owner"), false);
  assert.equal(sanitized.includes("postgresql://***:***@ep-xyz.aws.neon.tech/neondb"), true);

  const rawParam = "Connection failed with user=admin password=supersecretpass in session";
  const sanitizedParam = sanitizeDbError(rawParam);
  assert.equal(sanitizedParam.includes("supersecretpass"), false);
  assert.equal(sanitizedParam.includes("password=***"), true);
});
