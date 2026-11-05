import test from "node:test";
import assert from "node:assert/strict";
import { assertEmptyDatabaseInventory, verifyEmptySchema } from "./razorpay-integration-db.mjs";

const unexpectedObjects = [
  ["schema", "custom_schema", "custom_schema"],
  ["table", "public", "users"],
  ["partitioned table", "public", "partitioned_orders"],
  ["view", "public", "order_view"],
  ["materialized view", "public", "order_summary"],
  ["sequence", "public", "custom_sequence"],
  ["foreign table", "public", "remote_table"],
  ["function", "public", "custom_function"],
  ["procedure", "custom_schema", "custom_procedure"],
  ["custom type", "public", "custom_type"],
  ["domain", "public", "email_domain"],
  ["enum", "custom_schema", "order_state"],
  ["operator", "custom_schema", "custom_operator"],
  ["collation", "public", "custom_collation"],
  ["conversion", "custom_schema", "custom_conversion"],
  ["operator class", "public", "custom_opclass"],
  ["operator family", "public", "custom_opfamily"],
  ["text search configuration", "public", "custom_config"],
  ["text search dictionary", "public", "custom_dictionary"],
  ["text search parser", "public", "custom_parser"],
  ["text search template", "public", "custom_template"],
  ["extension", "public", "custom_extension"],
  ["foreign data wrapper", "<database>", "custom_fdw"],
  ["foreign server", "<database>", "custom_server"],
  ["event trigger", "<database>", "custom_event_trigger"],
  ["procedural language", "<database>", "custom_language"],
  ["access method", "<database>", "custom_access_method"],
  ["publication", "<database>", "custom_publication"],
  ["subscription", "<database>", "custom_subscription"],
];

for (const [object_type, schema_name, object_name] of unexpectedObjects) {
  test(`rejects an unexpected ${object_type} in ${schema_name}`, () => {
    assert.throws(
      () => assertEmptyDatabaseInventory([{ object_type, schema_name, object_name }]),
      /must contain no user schemas or objects/,
    );
  });
}

test("accepts an empty catalog inventory", () => {
  assert.doesNotThrow(() => assertEmptyDatabaseInventory([]));
});

test("fails closed when the catalog inventory is unavailable or malformed", () => {
  assert.throws(() => assertEmptyDatabaseInventory(undefined), /could not be verified/);
  assert.throws(() => assertEmptyDatabaseInventory({}), /could not be verified/);
});

test("queries all non-system schemas and the required PostgreSQL object catalogs", async () => {
  let queryText = "";
  const client = {
    async $queryRawUnsafe(sql) {
      queryText = sql;
      return [];
    },
  };

  await verifyEmptySchema(client);

  for (const catalog of ["pg_namespace", "pg_class", "pg_proc", "pg_type", "pg_operator", "pg_collation", "pg_conversion", "pg_opclass", "pg_opfamily", "pg_ts_config", "pg_ts_dict", "pg_ts_parser", "pg_ts_template", "pg_extension", "pg_foreign_data_wrapper", "pg_foreign_server", "pg_event_trigger", "pg_language", "pg_am", "pg_publication", "pg_subscription"]) {
    assert.match(queryText, new RegExp(`pg_catalog\\.${catalog}`));
  }
  for (const relkind of ["'r'", "'p'", "'v'", "'m'", "'S'", "'f'"]) {
    assert.ok(queryText.includes(relkind), `catalog query should classify relation kind ${relkind}`);
  }
  for (const typeKind of ["'d'", "'e'"]) {
    assert.ok(queryText.includes(typeKind), `catalog query should classify type kind ${typeKind}`);
  }
  assert.match(queryText, /nspname <> 'public'/);
  assert.match(queryText, /nspname !~ '\^pg_'/);
});

test("rejects objects returned from a non-public schema by the catalog query", async () => {
  const client = {
    async $queryRawUnsafe() {
      return [{ object_type: "table", schema_name: "private_app", object_name: "leftover" }];
    },
  };
  await assert.rejects(verifyEmptySchema(client), /table in schema private_app/);
});

test("fails closed if the PostgreSQL catalog query errors", async () => {
  const client = {
    async $queryRawUnsafe() {
      throw new Error("catalog access denied");
    },
  };
  await assert.rejects(verifyEmptySchema(client), /catalog access denied/);
});
