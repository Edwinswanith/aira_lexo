import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots.txt", () => {
  it("allows GPTBot to crawl public pages while protecting API routes", () => {
    const output = robots();
    const rules = Array.isArray(output.rules) ? output.rules : [output.rules];
    const gptRule = rules.find((rule) =>
      Array.isArray(rule.userAgent)
        ? rule.userAgent.includes("GPTBot")
        : rule.userAgent === "GPTBot",
    );

    expect(gptRule).toMatchObject({ allow: "/", disallow: "/api/" });
    expect(output.sitemap).toBe("https://airalexo.in/sitemap.xml");
  });
});
