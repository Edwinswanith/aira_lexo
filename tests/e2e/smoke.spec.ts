import { expect, test } from "@playwright/test";

test("homepage exposes the product story and working interactions", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Your consultation memory, ready when the patient returns." })).toBeVisible();
  await page.getByRole("tab", { name: "REC" }).click();
  await expect(page.getByRole("tabpanel").first()).toContainText("recording state");
  await page.getByRole("tab", { name: "Patient" }).click();
  await expect(page.getByRole("tabpanel").last()).toContainText("Know when recording begins");
});

test("pilot form submits locally without collecting patient information", async ({ page }) => {
  await page.goto("/pilot", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Full name").fill("Dr Test User");
  await page.getByLabel("Work email").fill(`test-${Date.now()}@example.com`);
  await page.getByLabel("Your role").selectOption("doctor");
  await page.getByLabel("Specialty or area of work").fill("General medicine");
  await page.getByLabel("City").selectOption("chennai");
  await page.getByLabel("Daily patient volume").selectOption("20_40");
  await page.getByLabel("Current documentation method").selectOption("mixed");
  await page.getByLabel("Share of consultations that are repeat visits").selectOption("25_50");
  await page.getByLabel(/I have read the privacy notice/).check();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page).toHaveURL(/\/pilot\/thanks\?status=received/);
  await expect(page.getByRole("heading", { name: "Your application is with us." })).toBeVisible();
});

test("founders page exposes accountable roles and public profile links", async ({ page }) => {
  await page.goto("/founders", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Meet the people accountable for Aira." })).toBeVisible();
  await expect(page.locator(".founder-card")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Dr. Pon Shamli Duraisamy" })).toHaveCount(2);
  await expect(page.getByText("Advanced Ozone Therapy Practitioner", { exact: false })).toHaveCount(3);
  await expect(page.getByRole("link", { name: /Edwin Swanith's public LinkedIn profile/ })).toHaveAttribute("href", "https://www.linkedin.com/in/edwinswanith/");
  await expect(page.getByRole("link", { name: /Dr\. Pon Shamli Duraisamy's public LinkedIn profile/ })).toHaveCount(2);
  await expect(page.getByRole("link", { name: /Raghul Senthilnathan's public LinkedIn profile/ })).toHaveAttribute("href", "https://www.linkedin.com/in/raghul-snn/");
});
