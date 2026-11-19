import { site } from "./site";

/**
 * The origin the visitor is actually using (a preview URL or the live site),
 * so links in emails lead back to the same deployment.
 */
export function originFromHeaders(headers: Headers) {
  const host = headers.get("x-forwarded-host") || headers.get("host");
  if (!host) return site.url;
  const proto = headers.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}
