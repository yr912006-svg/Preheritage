import { test, expect } from "@playwright/test";

const productTitle = "Varanasi Katan Silk Saree in Antique Gold";
const productPath = "/products/varanasi-katan-silk-saree-in-antique-gold";
const routes = [
  "/",
  "/shop",
  productPath,
  "/about",
  "/journal",
  "/contact",
  "/faq",
  "/shipping-policy",
  "/return-policy",
];

function routeLabel(route) {
  return route === "/" ? "home" : route.replaceAll("/", "-").replace(/^-/, "") || "home";
}

test.describe("storefront route and viewport smoke checks", () => {
  for (const route of routes) {
    test(`${route} renders at the configured viewport`, async ({ page }, testInfo) => {
      const uncaughtErrors = [];
      const failedRequests = [];
      const failedResponses = [];
      const origin = new URL(testInfo.project.use.baseURL || "http://127.0.0.1:4173").origin;

      page.on("pageerror", (error) => uncaughtErrors.push(error.name));
      page.on("requestfailed", (request) => {
        if (new URL(request.url()).origin === origin) {
          failedRequests.push(new URL(request.url()).pathname);
        }
      });
      page.on("response", (response) => {
        if (new URL(response.url()).origin === origin && response.status() >= 400) {
          failedResponses.push(`${new URL(response.url()).pathname} (${response.status()})`);
        }
      });

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response, `No document response for ${route}`).not.toBeNull();
      expect(
        response.status(),
        `${route} returned HTTP ${response.status()}; if this is a catalog route, check dev-server logs for Prisma P1001 before treating it as an app defect`,
      ).toBe(200);
      await expect(page.locator("body")).toBeVisible();
      expect((await page.locator("body").innerText()).trim().length, `${route} has no visible page content`).toBeGreaterThan(40);

      if (["/", "/shop", productPath].includes(route)) {
        const productLocator = route === productPath
          ? page.getByRole("heading", { name: productTitle, exact: true })
          : page.getByText(productTitle, { exact: true }).first();
        await expect(
          productLocator,
          `Expected active database product was not rendered at ${route}; inspect safe server output for Prisma connectivity errors`,
        ).toBeVisible();
      }

      const layout = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        headings: [...document.querySelectorAll("h1")].filter((node) => node.getClientRects().length > 0).length,
        overflowElements: [...document.querySelectorAll("body *")]
          .map((node) => ({ node, rect: node.getBoundingClientRect() }))
          .filter(({ rect }) => rect.right > window.innerWidth + 1 || rect.left < -1)
          .slice(0, 8)
          .map(({ node, rect }) => ({
            tag: node.tagName,
            className: typeof node.className === "string" ? node.className.slice(0, 100) : "",
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            text: (node.textContent || "").trim().slice(0, 50),
          })),
        oversizedScrollAreas: [...document.querySelectorAll("body *")]
          .filter((node) => node.scrollWidth > node.clientWidth + 1)
          .slice(0, 8)
          .map((node) => ({
            tag: node.tagName,
            className: typeof node.className === "string" ? node.className.slice(0, 100) : "",
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            text: (node.textContent || "").trim().slice(0, 50),
          })),
      }));
      expect(layout.documentWidth, `${route} overflows horizontally: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.bodyWidth, `${route} body overflows horizontally: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.headings, `${route} has no visible h1`).toBeGreaterThan(0);

      const brokenImages = await page.evaluate(async () => {
        const visibleImages = [...document.images].filter((image) => {
          const rect = image.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
        });
        await Promise.race([
          Promise.all(visibleImages.map((image) => image.decode().catch(() => undefined))),
          new Promise((resolve) => setTimeout(resolve, 5_000)),
        ]);
        return visibleImages
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src);
      });

      expect(brokenImages, `${route} has broken visible images`).toEqual([]);
      expect(uncaughtErrors, `${route} raised uncaught browser errors`).toEqual([]);
      expect(failedRequests, `${route} had failed same-origin requests`).toEqual([]);
      expect(failedResponses, `${route} had same-origin HTTP errors`).toEqual([]);

      await page.screenshot({ path: testInfo.outputPath(`${routeLabel(route)}.png`) });
    });
  }
});

test.describe("safe storefront interactions", () => {
  test("footer fits the viewport and newsletter validates without submitting", async ({ page }, testInfo) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    const dimensions = await footer.evaluate((node) => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }));
    expect(dimensions.scrollWidth, `Footer overflows horizontally: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.clientWidth);
    const newsletter = footer.getByLabel("Email address");
    await expect(newsletter).toHaveAttribute("required", "");
    expect(await newsletter.evaluate((node) => node.checkValidity())).toBe(false);
    await page.screenshot({ path: testInfo.outputPath("footer.png") });
  });

  test("header search navigates to the shop with the entered query", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Search store" }).click();
    const dialog = page.getByRole("dialog", { name: "Search store" });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder(/Search Varanasi silk/).fill("Katan Silk");
    await dialog.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/shop\?q=Katan%20Silk/);
  });

  test("mobile navigation opens and closes without leaving the page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.getByRole("button", { name: "Close navigation menu" })).toBeVisible();
    await expect(page.locator("#preheritage-category-menu")).toBeVisible();
    await page.getByRole("button", { name: "Close navigation menu" }).click();
    await expect(page.locator("#preheritage-category-menu")).toHaveCount(0);
  });

  test("shop sorting and mobile filter drawer are usable", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Sort products").selectOption("PRICE_ASC");
    await expect(page.getByLabel("Sort products")).toHaveValue("PRICE_ASC");
    if (page.viewportSize().width < 1024) {
      await page.getByRole("button", { name: /Filters/ }).click();
      await expect(page.getByRole("dialog", { name: "Filter the collection" })).toBeVisible();
      await page.getByRole("button", { name: "Close filters" }).click();
      await expect(page.getByRole("dialog", { name: "Filter the collection" })).toHaveCount(0);
    }
  });

  test("FAQ disclosures toggle with keyboard", async ({ page }) => {
    await page.goto("/faq");
    const disclosure = page.locator("details").first();
    const summary = disclosure.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(disclosure).not.toHaveAttribute("open", "");
  });

  test("contact form required fields validate without submitting", async ({ page }) => {
    await page.goto("/contact");
    const form = page.locator("#contact-form");
    await expect(form).toBeVisible();
    await expect(form.locator("#contact-name")).toHaveAttribute("required", "");
    await expect(form.locator("#contact-email")).toHaveAttribute("required", "");
    await expect(form.locator("#contact-message")).toHaveAttribute("required", "");
    expect(await form.evaluate((node) => node.checkValidity())).toBe(false);
  });

  test("product gallery, wishlist, and cart feedback are available", async ({ page }) => {
    await page.goto(productPath);
    await expect(page.getByRole("heading", { name: productTitle })).toBeVisible();
    await expect(page.getByRole("button", { name: "View image 1" })).toBeVisible();
    const secondImage = page.getByRole("button", { name: "View image 2" });
    if (await secondImage.count()) await secondImage.click();

    const save = page.getByRole("button", { name: "Save to wishlist" });
    await expect(save).toBeVisible();
    await expect(save).toBeEnabled();
    await save.click();
    const remove = page.getByRole("button", { name: "Remove from wishlist" });
    await expect(remove).toBeVisible();
    await expect(remove).toHaveAttribute("aria-pressed", "true");
    await remove.click();
    await expect(save).toBeVisible();
    await expect(save).toHaveAttribute("aria-pressed", "false");
    await save.click();
    await expect(remove).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    const restoredRemove = page.getByRole("button", { name: "Remove from wishlist" });
    await expect(restoredRemove).toBeVisible();
    await expect(restoredRemove).toHaveAttribute("aria-pressed", "true");
    await restoredRemove.click();
    await expect(page.getByRole("button", { name: "Save to wishlist" })).toHaveAttribute("aria-pressed", "false");

    const addToBag = page.getByRole("button", { name: "Add to bag" });
    test.skip(!(await addToBag.count()) || !(await addToBag.isEnabled()), "Active product is unavailable for cart interaction");
    await addToBag.click();
    await expect(page.getByText("Added to bag", { exact: true })).toBeVisible();
  });
});

