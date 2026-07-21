import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots.txt", () => {
  it("allows GPTBot and other crawlers to crawl all routes", () => {
    const output = robots();
    const rules = Array.isArray(output.rules) ? output.rules : [output.rules];
    const gptRule = rules.find((rule) =>
      Array.isArray(rule.userAgent)
        ? rule.userAgent.includes("GPTBot")
        : rule.userAgent === "GPTBot",
    );

    expect(gptRule).toMatchObject({ allow: "/" });
    expect(gptRule).not.toHaveProperty("disallow");
    expect(rules.every((rule) => !("disallow" in rule))).toBe(true);
    expect(output.sitemap).toBe("https://airalexo.in/sitemap.xml");
  });
});
