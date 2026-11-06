import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

const legalPages = [
  { path: "/privacy-policy", title: "Privacy Policy", content: "1777002823517781" },
  { path: "/terms-of-service", title: "Terms of Service", content: "AiraLexo Solutions Private Limited" },
  { path: "/data-deletion", title: "Request data deletion", content: "Data deletion request" },
];

for (const { path, title, content } of legalPages) {
  test(`${path} serves readable public HTML without JavaScript`, async ({ page, request }) => {
    const raw = await request.get(path, { headers: { "User-Agent": "facebookexternalhit/1.1" } });
    expect(raw.status()).toBe(200);
    expect(raw.headers()["content-type"]).toContain("text/html");
    expect(await raw.text()).toContain(content);
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.locator("main")).toContainText("6 November 2026");
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
