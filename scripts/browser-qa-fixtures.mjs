import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const DATABASE_PREFIX = "preheritage_razorpay_it_";
const FIXTURE_PREFIX = "browser-qa-";
const FIXTURE_ID_PATTERN = /^[a-f0-9]{12,32}$/;

export function requireDisposableTarget(environment = process.env) {
  const value = environment.TEST_DATABASE_URL;
  if (!value) throw new Error("TEST_DATABASE_URL is required; application database variables are never used.");

  let url;
  try { url = new URL(value); }
  catch { throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL."); }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("TEST_DATABASE_URL must use PostgreSQL.");
  }
  const host = url.hostname.toLowerCase();
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
    throw new Error("The browser QA database must use a loopback host.");
  }
  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!name.startsWith(DATABASE_PREFIX) || name.length <= DATABASE_PREFIX.length) {
    throw new Error(`The database name must start with ${DATABASE_PREFIX}.`);
  }
  if (environment.CONFIRM_TEST_DATABASE_NAME !== name) {
    throw new Error("CONFIRM_TEST_DATABASE_NAME must exactly match the disposable database name.");
  }
  const disallowedParameters = [...url.searchParams.keys()].some((key) => /^(schema|options|search[-_]?path|current[-_]?schema)$/i.test(key));
  if (disallowedParameters) {
    throw new Error("The browser QA database URL cannot override schema or search-path settings.");
  }
  return { url: value, name };
}

export function requireFixtureId(value) {
  if (typeof value !== "string" || !FIXTURE_ID_PATTERN.test(value)) {
    throw new Error("BROWSER_QA_FIXTURE_ID must be the fixture ID printed by setup.");
  }
  return value;
}

export function requireBrowserQaPassword(value) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") < 12 || Buffer.byteLength(value, "utf8") > 72) {
    throw new Error("BROWSER_QA_PASSWORD must be between 12 and 72 UTF-8 bytes.");
  }
  return value;
}

export function fixtureNames(fixtureId) {
  const scope = `${FIXTURE_PREFIX}${fixtureId}`;
  return {
    categorySlug: `${scope}-category`,
    productSku: `${scope}-sku`,
    customerOneEmail: `${scope}-customer-one@example.test`,
    customerTwoEmail: `${scope}-customer-two@example.test`,
    authorizedAdminEmail: `${scope}-returns-admin@example.test`,
    deniedAdminEmail: `${scope}-catalog-admin@example.test`,
    firstOrderNumber: `${scope.toUpperCase()}-ONE`,
    secondOrderNumber: `${scope.toUpperCase()}-TWO`,
  };
}

async function verifyTarget(client, expectedName) {
  const rows = await client.$queryRaw`SELECT current_database() AS name`;
  if (rows.length !== 1 || rows[0].name !== expectedName) {
    throw new Error("Connected database identity did not match the confirmed disposable target.");
  }
}

function output(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function loadFixture(client, names) {
  const [customerOne, customerTwo, authorizedAdmin, deniedAdmin, request] = await Promise.all([
    client.user.findUnique({ where: { email: names.customerOneEmail }, select: { id: true } }),
    client.user.findUnique({ where: { email: names.customerTwoEmail }, select: { id: true } }),
    client.admin.findUnique({ where: { email: names.authorizedAdminEmail }, select: { id: true, role: true } }),
    client.admin.findUnique({ where: { email: names.deniedAdminEmail }, select: { id: true, role: true } }),
    client.returnRequest.findFirst({ where: { order: { orderNumber: names.firstOrderNumber } }, select: { id: true, status: true } }),
  ]);
  return { customerOne, customerTwo, authorizedAdmin, deniedAdmin, request };
}

async function setup(client, fixtureId, password) {
  const names = fixtureNames(fixtureId);
  const existing = await loadFixture(client, names);
  if (Object.values(existing).some(Boolean)) {
    throw new Error("A browser QA fixture with this ID already exists; use status or cleanup.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await client.$transaction(async (tx) => {
    const customerOne = await tx.user.create({ data: {
      name: "Browser QA Customer One", email: names.customerOneEmail, passwordHash, role: "CUSTOMER", isActive: true,
    } });
    const customerTwo = await tx.user.create({ data: {
      name: "Browser QA Customer Two", email: names.customerTwoEmail, passwordHash, role: "CUSTOMER", isActive: true,
    } });
    const authorizedAdmin = await tx.admin.create({ data: {
      name: "Browser QA Returns Manager", email: names.authorizedAdminEmail, passwordHash, role: "ORDER_MANAGER", isActive: true,
    } });
    const deniedAdmin = await tx.admin.create({ data: {
      name: "Browser QA Catalog Manager", email: names.deniedAdminEmail, passwordHash, role: "PRODUCT_MANAGER", isActive: true,
    } });
    const category = await tx.category.create({ data: {
      name: `Browser QA ${fixtureId}`, slug: names.categorySlug,
    } });
    const product = await tx.product.create({ data: {
      title: "Browser QA Return Item", slug: `${FIXTURE_PREFIX}${fixtureId}-item`, sku: names.productSku,
      description: "Disposable browser QA fixture item.", price: 100, mrp: 100, categoryId: category.id, stock: 10,
    } });
    const firstOrder = await tx.order.create({ data: {
      orderNumber: names.firstOrderNumber, userId: customerOne.id, guestEmail: names.customerOneEmail,
      guestName: customerOne.name, subtotal: 100, discountAmount: 0, shippingCharge: 0, totalAmount: 100,
      paymentMethod: "COD", paymentStatus: "SUCCESS", status: "DELIVERED",
      items: { create: { productId: product.id, title: product.title, sku: product.sku, price: 100, quantity: 1, totalPrice: 100 } },
      timeline: { create: { status: "DELIVERED", title: "Delivered", description: "Disposable browser QA fixture." } },
    }, include: { items: { select: { id: true } } } });
    const secondOrder = await tx.order.create({ data: {
      orderNumber: names.secondOrderNumber, userId: customerTwo.id, guestEmail: names.customerTwoEmail,
      guestName: customerTwo.name, subtotal: 100, discountAmount: 0, shippingCharge: 0, totalAmount: 100,
      paymentMethod: "COD", paymentStatus: "SUCCESS", status: "DELIVERED",
      items: { create: { productId: product.id, title: product.title, sku: product.sku, price: 100, quantity: 1, totalPrice: 100 } },
      timeline: { create: { status: "DELIVERED", title: "Delivered", description: "Disposable browser QA fixture." } },
    } });
    const request = await tx.returnRequest.create({ data: {
      orderId: firstOrder.id, userId: customerOne.id, reason: "Disposable browser QA review",
      explanation: JSON.stringify({
        format: "preheritage-return-request-v1", requestType: "RETURN", orderItemIds: [firstOrder.items[0].id],
        customerExplanation: "Created only for local browser QA.",
      }),
    } });
    return { customerOne, customerTwo, authorizedAdmin, deniedAdmin, firstOrder, secondOrder, request };
  });

  output({
    fixtureId,
    database: "verified disposable loopback target",
    accounts: {
      customerOne: names.customerOneEmail,
      customerTwo: names.customerTwoEmail,
      authorizedReturnsAdmin: names.authorizedAdminEmail,
      deniedCatalogAdmin: names.deniedAdminEmail,
    },
    returnRequest: { id: result.request.id, status: result.request.status, orderNumber: names.firstOrderNumber },
    cleanup: "Run browser-qa:cleanup with the same TEST_DATABASE_URL, CONFIRM_TEST_DATABASE_NAME, and BROWSER_QA_FIXTURE_ID.",
    password: "Not printed or stored. Use the BROWSER_QA_PASSWORD supplied to this setup process for local sign-in only.",
  });
}

async function status(client, fixtureId) {
  const names = fixtureNames(fixtureId);
  const fixture = await loadFixture(client, names);
  output({
    fixtureId,
    present: Boolean(fixture.customerOne && fixture.customerTwo && fixture.authorizedAdmin && fixture.deniedAdmin && fixture.request),
    accounts: {
      customerOne: names.customerOneEmail,
      customerTwo: names.customerTwoEmail,
      authorizedReturnsAdmin: names.authorizedAdminEmail,
      deniedCatalogAdmin: names.deniedAdminEmail,
    },
    authorizedAdminRole: fixture.authorizedAdmin?.role ?? null,
    deniedAdminRole: fixture.deniedAdmin?.role ?? null,
    returnRequest: fixture.request,
  });
}

async function cleanup(client, fixtureId) {
  const names = fixtureNames(fixtureId);
  const users = await client.user.findMany({ where: { email: { in: [names.customerOneEmail, names.customerTwoEmail] } }, select: { id: true } });
  await client.$transaction(async (tx) => {
    if (users.length) await tx.order.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
    await tx.product.deleteMany({ where: { sku: names.productSku } });
    await tx.category.deleteMany({ where: { slug: names.categorySlug } });
    await tx.user.deleteMany({ where: { email: { in: [names.customerOneEmail, names.customerTwoEmail] } } });
    await tx.admin.deleteMany({ where: { email: { in: [names.authorizedAdminEmail, names.deniedAdminEmail] } } });
  });
  output({ fixtureId, cleaned: true });
}

async function main() {
  const command = process.argv[2];
  if (!["setup", "status", "cleanup"].includes(command)) {
    throw new Error("Usage: browser-qa-fixtures.mjs <setup|status|cleanup>");
  }
  const target = requireDisposableTarget();
  const fixtureId = command === "setup"
    ? (process.env.BROWSER_QA_FIXTURE_ID ? requireFixtureId(process.env.BROWSER_QA_FIXTURE_ID) : randomUUID().replaceAll("-", "").slice(0, 16))
    : requireFixtureId(process.env.BROWSER_QA_FIXTURE_ID);
  const password = command === "setup" ? requireBrowserQaPassword(process.env.BROWSER_QA_PASSWORD) : null;
  const client = new PrismaClient({ datasources: { db: { url: target.url } } });
  try {
    await verifyTarget(client, target.name);
    if (command === "setup") await setup(client, fixtureId, password);
    if (command === "status") await status(client, fixtureId);
    if (command === "cleanup") await cleanup(client, fixtureId);
  } finally {
    await client.$disconnect();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Browser QA fixture command failed."}\n`);
    process.exitCode = 1;
  });
}
