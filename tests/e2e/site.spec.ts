import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const LEGAL = ["/privacy", "/terms", "/delete-account", "/data-safety", "/child-safety", "/cookies", "/accessibility", "/licenses"];

test.describe("legal pages work without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const path of LEGAL) {
    test(path, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("main")).toContainText(/./);
    });
  }
  test("the homepage keeps its content and CTAs without JS", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero-title")).toContainText("Curate your everyday.");
    await expect(page.getByRole("link", { name: /Android app|Download APK|Google Play/ }).first()).toBeVisible();
  });
});

test("admin is denied without an admin session", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText(/Not available|Sign in/i).first()).toBeVisible();
  await expect(page.getByText("SYSTEM HEALTH", { exact: false })).toHaveCount(0);
});

test("assetlinks.json has the App Links shape", async ({ request }) => {
  const res = await request.get("/.well-known/assetlinks.json");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body[0].relation).toContain("delegate_permission/common.handle_all_urls");
  expect(body[0].target).toMatchObject({ namespace: "android_app", package_name: "com.notteodo.notteodo" });
  expect(Array.isArray(body[0].target.sha256_cert_fingerprints)).toBe(true);
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/privacy");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["strict-transport-security"]).toContain("max-age");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("theme and view persist with no flash of the wrong theme", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("nt-theme", "dark");
    localStorage.setItem("nt-view", "editorial");
  });
  await page.goto("/privacy");
  // Read before hydration-time effects: the inline head script must already have applied both.
  const attrs = await page.evaluate(() => [document.documentElement.dataset.theme, document.documentElement.dataset.view, document.documentElement.dataset.mode]);
  expect(attrs).toEqual(["dark", "editorial", "dark"]);
  // The root paints the canvas (the body stays clear so the atmosphere layer shows through).
  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  expect(bg).toBe("rgb(0, 0, 0)");
});

test.describe("reduced motion path", () => {
  test.use({ reducedMotion: "reduce" });
  test("no pinning and content is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/reduced/);
    const pos = await page.locator(".act .act__pin").first().evaluate((el) => getComputedStyle(el).position);
    expect(["relative", "static"]).toContain(pos);
    await expect(page.locator(".world")).toHaveCount(0);
  });
});

test("lite path renders fallbacks instead of WebGL", async ({ page }) => {
  await page.goto("/?film=lite");
  await expect(page.locator("html")).toHaveAttribute("data-film", "lite");
  await expect(page.locator(".world")).toHaveCount(0);
  await expect(page.locator(".act__visual").first()).toBeAttached();
});

test("the simulator is keyboard-operable", async ({ page }) => {
  await page.goto("/try");
  await page.getByRole("button", { name: "Quick capture" }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.type("call mom tomorrow 5pm");
  await expect(page.getByText(/Becomes a task/)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator(".sim__h1")).toHaveText("Tasks");
  await page.getByRole("button", { name: "Focus", exact: true }).first().click();
  const dial = page.getByRole("slider", { name: /Session length/ });
  await dial.focus();
  await page.keyboard.press("ArrowUp");
  await expect(dial).toHaveAttribute("aria-valuenow", "30");
});

test.describe("accessibility (axe)", () => {
  for (const path of ["/", "/privacy", "/features", "/download", "/try", "/help"]) {
    test(path, async ({ page }) => {
      await page.goto(`${path}${path === "/" ? "?film=lite" : ""}`);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).disableRules(["color-contrast"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
});
