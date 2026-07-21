import { getAllInsights } from "../../lib/insights";
import { buildLlmsText } from "../../lib/llms";

export const dynamic = "force-static";

export async function GET() {
  const insights = await getAllInsights(false);
  const content = buildLlmsText(insights.map(({ frontmatter }) => frontmatter));

  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
