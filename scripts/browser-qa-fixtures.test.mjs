import test from "node:test";
import assert from "node:assert/strict";
import { fixtureNames, requireBrowserQaPassword, requireDisposableTarget, requireFixtureId } from "./browser-qa-fixtures.mjs";

const environment = {
  TEST_DATABASE_URL: "postgresql://test:password@127.0.0.1:5432/preheritage_razorpay_it_browser",
  CONFIRM_TEST_DATABASE_NAME: "preheritage_razorpay_it_browser",
};

test("browser QA target guard accepts only an exactly confirmed loopback disposable target", () => {
  assert.deepEqual(requireDisposableTarget(environment), {
    url: environment.TEST_DATABASE_URL,
    name: "preheritage_razorpay_it_browser",
  });
  assert.throws(() => requireDisposableTarget({ ...environment, TEST_DATABASE_URL: "postgresql://test:password@neon.example/preheritage_razorpay_it_browser" }), /loopback/);
  assert.throws(() => requireDisposableTarget({ ...environment, CONFIRM_TEST_DATABASE_NAME: "other" }), /exactly match/);
  assert.throws(() => requireDisposableTarget({ ...environment, TEST_DATABASE_URL: "postgresql://test:password@127.0.0.1:5432/other" }), /must start/);
  assert.throws(() => requireDisposableTarget({ ...environment, TEST_DATABASE_URL: `${environment.TEST_DATABASE_URL}?schema=other` }), /schema/);
});

test("fixture handles and credentials are validated without storing a password", () => {
  assert.equal(requireFixtureId("0123456789abcdef"), "0123456789abcdef");
  assert.throws(() => requireFixtureId("not-a-fixture"), /FIXTURE_ID/);
  assert.equal(requireBrowserQaPassword("a-valid-test-password"), "a-valid-test-password");
  assert.throws(() => requireBrowserQaPassword("too-short"), /12 and 72/);
  const names = fixtureNames("0123456789abcdef");
  assert.match(names.customerOneEmail, /^browser-qa-0123456789abcdef-customer-one@example\.test$/);
  assert.match(names.authorizedAdminEmail, /^browser-qa-0123456789abcdef-returns-admin@example\.test$/);
});
