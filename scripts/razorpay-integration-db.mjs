import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePrefix = "preheritage_razorpay_it_";

function hasUnexpectedSchemaOrSearchPath(url) {
  const keys = Array.from(url.searchParams.keys());
  const schemaValues = keys
    .filter((key) => key.toLowerCase() === "schema")
    .flatMap((key) => url.searchParams.getAll(key));
  const hasNonPublicSchema = schemaValues.some((schema) => schema !== "public");
  const hasSearchPathOverride = keys.some((key) => /^(?:options|search[-_]?path|current[-_]?schema)$/i.test(key));
  return hasNonPublicSchema || hasSearchPathOverride;
}

function requireDisposableTarget() {
  const value = process.env.TEST_DATABASE_URL;
  if (!value) throw new Error("TEST_DATABASE_URL is required; application database variables are never used.");
  const url = new URL(value);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") throw new Error("TEST_DATABASE_URL must use PostgreSQL.");
  if (hasUnexpectedSchemaOrSearchPath(url)) throw new Error("The integration target must use the public schema without connection search-path overrides.");
  const host = url.hostname.toLowerCase();
  if (!(host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]")) {
    throw new Error("The integration database must use a loopback host.");
  }
  const expectedName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!expectedName.startsWith(databasePrefix) || expectedName.length <= databasePrefix.length) {
    throw new Error(`The database name must start with ${databasePrefix}.`);
  }
  if (process.env.CONFIRM_TEST_DATABASE_NAME !== expectedName) {
    throw new Error("Set CONFIRM_TEST_DATABASE_NAME to the exact disposable database name to continue.");
  }
  return { value, expectedName };
}

async function verifyTarget(client, expectedName) {
  const rows = await client.$queryRaw`SELECT current_database() AS name`;
  if (rows.length !== 1 || rows[0].name !== expectedName) {
    throw new Error("Connected database identity did not match the confirmed disposable database.");
  }
}

const EMPTY_DATABASE_INVENTORY_SQL = `
  SELECT 'schema'::text AS object_type, n.nspname::text AS schema_name,
         n.nspname::text AS object_name
  FROM pg_catalog.pg_namespace AS n
  WHERE n.nspname <> 'public'
    AND n.nspname <> 'information_schema'
    AND n.nspname <> 'pg_catalog'
    AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT CASE c.relkind
           WHEN 'r' THEN 'table'
           WHEN 'p' THEN 'partitioned table'
           WHEN 'v' THEN 'view'
           WHEN 'm' THEN 'materialized view'
           WHEN 'S' THEN 'sequence'
           WHEN 'f' THEN 'foreign table'
           WHEN 'i' THEN 'index'
           WHEN 'I' THEN 'partitioned index'
           ELSE 'relation'
         END,
         n.nspname::text,
         c.relname::text
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname <> 'information_schema'
    AND n.nspname <> 'pg_catalog'
    AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT CASE p.prokind
           WHEN 'p' THEN 'procedure'
           WHEN 'a' THEN 'aggregate routine'
           WHEN 'w' THEN 'window routine'
           ELSE 'function'
         END,
         n.nspname::text,
         p.proname::text
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname <> 'information_schema'
    AND n.nspname <> 'pg_catalog'
    AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT CASE t.typtype
           WHEN 'd' THEN 'domain'
           WHEN 'e' THEN 'enum'
           WHEN 'r' THEN 'range type'
           WHEN 'm' THEN 'multirange type'
           ELSE 'custom type'
         END,
         n.nspname::text,
         t.typname::text
  FROM pg_catalog.pg_type AS t
  JOIN pg_catalog.pg_namespace AS n ON n.oid = t.typnamespace
  WHERE n.nspname <> 'information_schema'
    AND n.nspname <> 'pg_catalog'
    AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'operator', n.nspname::text, o.oprname::text
  FROM pg_catalog.pg_operator AS o
  JOIN pg_catalog.pg_namespace AS n ON n.oid = o.oprnamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'collation', n.nspname::text, c.collname::text
  FROM pg_catalog.pg_collation AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.collnamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'conversion', n.nspname::text, c.conname::text
  FROM pg_catalog.pg_conversion AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.connamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'operator class', n.nspname::text, o.opcname::text
  FROM pg_catalog.pg_opclass AS o
  JOIN pg_catalog.pg_namespace AS n ON n.oid = o.opcnamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'operator family', n.nspname::text, o.opfname::text
  FROM pg_catalog.pg_opfamily AS o
  JOIN pg_catalog.pg_namespace AS n ON n.oid = o.opfnamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'text search configuration', n.nspname::text, t.cfgname::text
  FROM pg_catalog.pg_ts_config AS t
  JOIN pg_catalog.pg_namespace AS n ON n.oid = t.cfgnamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'text search dictionary', n.nspname::text, t.dictname::text
  FROM pg_catalog.pg_ts_dict AS t
  JOIN pg_catalog.pg_namespace AS n ON n.oid = t.dictnamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'text search parser', n.nspname::text, t.prsname::text
  FROM pg_catalog.pg_ts_parser AS t
  JOIN pg_catalog.pg_namespace AS n ON n.oid = t.prsnamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'text search template', n.nspname::text, t.tmplname::text
  FROM pg_catalog.pg_ts_template AS t
  JOIN pg_catalog.pg_namespace AS n ON n.oid = t.tmplnamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'extension', n.nspname::text, e.extname::text
  FROM pg_catalog.pg_extension AS e
  JOIN pg_catalog.pg_namespace AS n ON n.oid = e.extnamespace
  WHERE n.nspname <> 'information_schema' AND n.nspname <> 'pg_catalog' AND n.nspname !~ '^pg_'

  UNION ALL

  SELECT 'foreign data wrapper', '<database>'::text, f.fdwname::text
  FROM pg_catalog.pg_foreign_data_wrapper AS f

  UNION ALL

  SELECT 'foreign server', '<database>'::text, s.srvname::text
  FROM pg_catalog.pg_foreign_server AS s

  UNION ALL

  SELECT 'event trigger', '<database>'::text, e.evtname::text
  FROM pg_catalog.pg_event_trigger AS e

  UNION ALL

  SELECT 'procedural language', '<database>'::text, l.lanname::text
  FROM pg_catalog.pg_language AS l
  WHERE l.lanname NOT IN ('internal', 'c', 'sql', 'plpgsql')

  UNION ALL

  SELECT 'access method', '<database>'::text, a.amname::text
  FROM pg_catalog.pg_am AS a
  WHERE a.amname NOT IN ('heap', 'btree', 'hash', 'gist', 'gin', 'spgist', 'brin')

  UNION ALL

  SELECT 'publication', '<database>'::text, p.pubname::text
  FROM pg_catalog.pg_publication AS p

  UNION ALL

  SELECT 'subscription', '<database>'::text, s.subname::text
  FROM pg_catalog.pg_subscription AS s
`;

export function assertEmptyDatabaseInventory(rows) {
  if (!Array.isArray(rows)) {
    throw new Error("Disposable target emptiness could not be verified; refusing schema preparation.");
  }
  if (rows.length) {
    const description = rows.slice(0, 5).map((row) => `${row.object_type} in schema ${row.schema_name}`).join(", ");
    throw new Error(`Disposable target must contain no user schemas or objects; found ${description}. Discard and recreate it before preparation.`);
  }
}

export async function verifyEmptySchema(client) {
  // Static catalog query only; no user-controlled SQL is interpolated.
  const rows = await client.$queryRawUnsafe(EMPTY_DATABASE_INVENTORY_SQL);
  assertEmptyDatabaseInventory(rows);
}

function withoutRecoveryModels(schema) {
  let output = schema;
  for (const modelName of ["RazorpayCheckout", "RazorpayWebhookEvent"]) {
    const start = output.search(new RegExp(`\\bmodel\\s+${modelName}\\s*\\{`));
    if (start < 0) throw new Error(`Could not locate ${modelName} in Prisma schema.`);
    const open = output.indexOf("{", start);
    let depth = 0;
    let end = -1;
    for (let index = open; index < output.length; index += 1) {
      if (output[index] === "{") depth += 1;
      if (output[index] === "}" && --depth === 0) { end = index + 1; break; }
    }
    if (end < 0) throw new Error(`Could not parse ${modelName} block.`);
    output = `${output.slice(0, start)}${output.slice(end)}`;
  }
  output = output.replace(/^\s*razorpayCheckout\s+RazorpayCheckout\?\s*\r?\n/gm, "");
  output = output.replace(/directUrl\s*=\s*env\("DATABASE_URL_UNPOOLED"\)\s*\r?\n/, "");
  output = output.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url       = env("TEST_DATABASE_URL")');
  return output;
}

function statements(sql) {
  return sql.split(/;\s*(?:\r?\n|$)/).map((part) => part.trim())
    .filter((part) => part && !part.split(/\r?\n/).every((line) => line.trim().startsWith("--")));
}

const SAFE_STAGES = new Set([
  "target validation",
  "Prisma SQL generation",
  "recovery SQL loading",
  "connection verification",
  "empty-database verification",
  "schema statement execution",
  "connection cleanup",
  "temporary-file cleanup",
]);

const SAFE_ERROR_CLASSES = new Set([
  "Error", "TypeError", "RangeError", "SyntaxError",
  "PrismaClientInitializationError", "PrismaClientKnownRequestError",
  "PrismaClientUnknownRequestError", "PrismaClientValidationError",
  "PrismaClientRustPanicError", "DatabaseError", "PostgresError",
]);

const SAFE_PRISMA_INITIALIZATION_MESSAGES = new Map([
  ["P1000", "Database authentication failed."],
  ["P1001", "Database server could not be reached."],
  ["P1002", "Database connection timed out."],
  ["P1003", "The requested database does not exist."],
  ["P1010", "Database access was denied."],
  ["P1011", "The secure database connection could not be established."],
  ["P1013", "The database connection configuration is invalid."],
]);

const SAFE_PRISMA_REQUEST_MESSAGES = new Map([
  ["P2021", "A required database table is missing."],
  ["P2022", "A required database column is missing."],
]);

const SAFE_POSTGRES_MESSAGES = new Map([
  ["23502", "A database not-null constraint was violated."],
  ["23503", "A database foreign-key constraint was violated."],
  ["23505", "A database unique constraint was violated."],
  ["23514", "A database check constraint was violated."],
  ["40001", "The database reported a serialization conflict."],
  ["40P01", "The database reported a deadlock."],
  ["42501", "The database role lacks a required permission."],
  ["42P07", "A database object already exists."],
  ["42710", "A database object already exists."],
  ["08001", "A database connection could not be established."],
  ["08006", "The database connection failed."],
]);

const SAFE_LOCAL_MESSAGES = new Set([
  "TEST_DATABASE_URL is required; application database variables are never used.",
  "TEST_DATABASE_URL must use PostgreSQL.",
  "The integration target must use the public schema without connection search-path overrides.",
  "The integration database must use a loopback host.",
  `The database name must start with ${databasePrefix}.`,
  "Set CONFIRM_TEST_DATABASE_NAME to the exact disposable database name to continue.",
  "Connected database identity did not match the confirmed disposable database.",
  "Disposable target emptiness could not be verified; refusing schema preparation.",
]);

class PreparationFailure extends Error {
  constructor(stage, cause) {
    super(`Preparation failed during ${stage}.`, { cause });
    this.name = "PreparationFailure";
    this.stage = stage;
  }
}

function safeFailureDiagnostic(error) {
  const stage = SAFE_STAGES.has(error?.stage) ? error.stage : "preparation";
  const cause = error instanceof PreparationFailure ? error.cause : error;
  const reportedClass = SAFE_ERROR_CLASSES.has(cause?.name) ? cause.name : "Error";
  const rawCode = cause?.code;
  let code = null;
  let safeMessage = null;
  if (typeof rawCode === "string" && /^P\d{4}$/.test(rawCode)) {
    const prismaNumber = Number(rawCode.slice(1));
    if (reportedClass === "PrismaClientInitializationError" && prismaNumber >= 1000 && prismaNumber <= 1017) {
      code = rawCode;
      safeMessage = SAFE_PRISMA_INITIALIZATION_MESSAGES.get(code) ?? null;
    } else if (reportedClass === "PrismaClientKnownRequestError" && prismaNumber >= 2000 && prismaNumber <= 2999) {
      code = rawCode;
      safeMessage = SAFE_PRISMA_REQUEST_MESSAGES.get(code) ?? null;
    }
  } else if (typeof rawCode === "string" && /^[0-9A-Z]{5}$/.test(rawCode) &&
      ["PrismaClientKnownRequestError", "DatabaseError", "PostgresError"].includes(reportedClass)) {
    code = rawCode;
    safeMessage = SAFE_POSTGRES_MESSAGES.get(code) ?? null;
  } else if (typeof rawCode === "string" && /^(?:ERR_[A-Z0-9_]{1,48}|E[A-Z0-9]{1,16})$/.test(rawCode) &&
      ["Error", "TypeError", "RangeError", "SyntaxError"].includes(reportedClass)) {
    code = rawCode;
  } else if (Number.isInteger(cause?.status) && cause.status >= 0 && cause.status <= 255 &&
      reportedClass === "Error" && stage === "Prisma SQL generation") {
    code = `EXIT_${cause.status}`;
  }

  if (!safeMessage && typeof cause?.message === "string") {
    if (SAFE_LOCAL_MESSAGES.has(cause.message)) safeMessage = cause.message;
    else if (cause.message.startsWith("Disposable target must contain no user schemas or objects; found ")) {
      safeMessage = "The disposable database contains user-created objects.";
    } else {
      const modelError = cause.message.match(/^Could not (locate|parse) (RazorpayCheckout|RazorpayWebhookEvent)(?: in Prisma schema| block)\.?$/);
      if (modelError) safeMessage = `Could not ${modelError[1]} expected recovery model ${modelError[2]} in the Prisma schema.`;
    }
  }

  return `${stage} failed (${reportedClass}${code ? `, ${code}` : ""}).${safeMessage ? ` ${safeMessage}` : ""}`;
}

async function prepare() {
  let stage = "target validation";
  let originalError = null;
  let tempDir = null;
  let client = null;
  try {
    const { value, expectedName } = requireDisposableTarget();
    stage = "Prisma SQL generation";
    tempDir = await mkdtemp(resolve(tmpdir(), "preheritage-razorpay-it-"));
    const schemaPath = resolve(tempDir, "schema.prisma");
    const sourceSchemaPath = resolve(root, "prisma/schema.prisma");
    const sourceSchema = await readFile(sourceSchemaPath, "utf8");
    await writeFile(schemaPath, withoutRecoveryModels(sourceSchema), "utf8");

    const prismaCli = resolve(root, "node_modules/prisma/build/index.js");
    const baseSql = execFileSync(process.execPath, [prismaCli, "migrate", "diff", "--from-empty", "--to-schema-datamodel", schemaPath, "--script"], {
      cwd: root,
      env: { ...process.env, TEST_DATABASE_URL: value },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const baseSqlPath = resolve(tempDir, "base.sql");
    await writeFile(baseSqlPath, baseSql, "utf8");
    stage = "recovery SQL loading";
    const recoverySql = await readFile(resolve(root, "prisma/migration-drafts/razorpay_webhook_recovery.sql"), "utf8");
    client = new PrismaClient({ datasources: { db: { url: value } } });

    stage = "connection verification";
    await verifyTarget(client, expectedName);
    stage = "empty-database verification";
    await verifyEmptySchema(client);
    for (const statement of [...statements(baseSql), ...statements(recoverySql)]) {
      // Recheck immediately before every DDL statement; never execute on a changed target.
      stage = "connection verification";
      await verifyTarget(client, expectedName);
      stage = "schema statement execution";
      await client.$executeRawUnsafe(statement);
    }
    process.stdout.write(`Disposable schema prepared for ${expectedName}. No rows were copied.\n`);
  } catch (error) {
    originalError = error;
    throw new PreparationFailure(stage, error);
  } finally {
    let cleanupFailure = null;
    if (client) {
      try { await client.$disconnect(); }
      catch (error) { cleanupFailure = { stage: "connection cleanup", error }; }
    }
    if (tempDir) {
      try { await rm(tempDir, { recursive: true, force: true }); }
      catch (error) { cleanupFailure ??= { stage: "temporary-file cleanup", error }; }
    }
    if (!originalError && cleanupFailure) throw new PreparationFailure(cleanupFailure.stage, cleanupFailure.error);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv[2] !== "prepare") {
  process.stderr.write("Usage: npm run test:integration:prepare (requires TEST_DATABASE_URL and CONFIRM_TEST_DATABASE_NAME).\n");
  process.exitCode = 2;
} else if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepare().catch((error) => {
    process.stderr.write(`${safeFailureDiagnostic(error)}\n`);
    process.exitCode = 1;
  });
}
