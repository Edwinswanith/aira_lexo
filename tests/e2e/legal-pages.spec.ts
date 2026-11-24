import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

const legalPages = [
  { path: "/mediscript/privacy-policy", title: "MediScript CRM Privacy Policy", content: "AiraLexo MediScript", date: "24 November 2026" },
  { path: "/privacy-policy", title: "Privacy Policy", content: "1777002823517781" },
  { path: "/terms-of-service", title: "Terms of Service", content: "AiraLexo Solutions Private Limited" },
  { path: "/data-deletion", title: "Request data deletion", content: "Data deletion request" },
];

for (const { path, title, content, date = "6 November 2026" } of legalPages) {
  test(`${path} serves readable public HTML without JavaScript`, async ({ page, request }) => {
    const raw = await request.get(path, { headers: { "User-Agent": "facebookexternalhit/1.1" } });
    expect(raw.status()).toBe(200);
    expect(raw.headers()["content-type"]).toContain("text/html");
    expect(raw.headers()["x-robots-tag"] ?? "").not.toMatch(/noindex|nofollow/i);
    expect(await raw.text()).toContain(content);
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.locator("main")).toContainText(date);
    await expect(page.locator("main a[href^='mailto:edwin@airalexo.in']").first()).toBeVisible();
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", `https://airalexo.in${path}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await page.reload({ waitUntil: "domcontentloaded" }))?.status()).toBe(200);
  });
}

test("legacy legal links resolve to the current policy and terms", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page).toHaveURL(/\/privacy-policy$/);
  await page.goto("/terms");
  await expect(page).toHaveURL(/\/terms-of-service$/);
  for (const { path } of legalPages) {
    await expect(page.locator(`footer a[href='${path}']`)).toBeVisible();
  }
});

const storePages = [
  { path: "/contact", title: "Contact Aira", content: "Sholinganallur" },
  { path: "/refund-policy", title: "Refund and Cancellation Policy", content: "within 7 days of delivery" },
  { path: "/shipping-policy", title: "Shipping and Delivery Policy", content: "We ship to addresses within India" },
];

for (const { path, title, content } of storePages) {
  test(`${path} serves the store policy without JavaScript and is linked from the footer`, async ({ page, request }) => {
    const raw = await request.get(path);
    expect(raw.status()).toBe(200);
    expect(raw.headers()["content-type"]).toContain("text/html");
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(content);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.locator("main a[href^='mailto:edwin@airalexo.in']").first()).toBeVisible();
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", `https://airalexo.in${path}`);
    await expect(page.locator(`footer a[href='${path}']`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
