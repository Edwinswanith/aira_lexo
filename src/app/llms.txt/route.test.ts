import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("llms.txt", () => {
  it("publishes the canonical Aira guide as plain text", async () => {
    const response = await GET();
    const content = await response.text();

    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(content).toContain("# Aira");
    expect(content).toContain("https://airalexo.in/product");
    expect(content).toContain("how-we-are-building-the-aira-pilot");
  });

  it("does not expose draft Insights", async () => {
    const content = await (await GET()).text();

    expect(content).not.toContain("what-is-an-ai-medical-scribe");
    expect(content).not.toContain("\u2014");
  });
});
