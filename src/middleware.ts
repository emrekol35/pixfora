import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// In-memory redirect cache
let redirectCache: Map<string, { toPath: string; type: number }> | null = null;
let redirectCacheTime = 0;
const REDIRECT_CACHE_TTL = 300_000; // 5 dakika

async function getRedirects(
  request: NextRequest
): Promise<Map<string, { toPath: string; type: number }>> {
  const now = Date.now();
  if (redirectCache && now - redirectCacheTime < REDIRECT_CACHE_TTL) {
    return redirectCache;
  }

  try {
    const baseUrl = request.nextUrl.origin;
    const res = await fetch(`${baseUrl}/api/internal/redirects`);
    if (res.ok) {
      const data = await res.json();
      redirectCache = new Map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((r: any) => [r.fromPath, { toPath: r.toPath, type: r.type }])
      );
      redirectCacheTime = now;
    }
  } catch {
    // API hazir degilse devam et
  }

  return redirectCache || new Map();
}

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

function rateLimit(
  ip: string,
  path: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  cleanupRateLimitMap();

  const key = `${ip}:${path}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { allowed: entry.count <= maxRequests, remaining };
}

// Guvenlik header'lari
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Admin ve API route'lari — locale routing uygulanmaz
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    // API rate limiting
    if (pathname.startsWith("/api/")) {
      if (
        pathname.startsWith("/api/auth/register") ||
        pathname.startsWith("/api/auth/callback")
      ) {
        const { allowed, remaining } = rateLimit(ip, "auth", 10, 60_000);
        if (!allowed) {
          const res = NextResponse.json(
            { error: "Cok fazla istek. Lutfen biraz bekleyin." },
            { status: 429 }
          );
          res.headers.set("Retry-After", "60");
          return addSecurityHeaders(res);
        }
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Remaining", String(remaining));
        return addSecurityHeaders(response);
      }

      if (pathname.startsWith("/api/contact")) {
        const { allowed, remaining } = rateLimit(ip, "contact", 5, 60_000);
        if (!allowed) {
          const res = NextResponse.json(
            { error: "Cok fazla istek. Lutfen biraz bekleyin." },
            { status: 429 }
          );
          res.headers.set("Retry-After", "60");
          return addSecurityHeaders(res);
        }
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Remaining", String(remaining));
        return addSecurityHeaders(response);
      }

      const { allowed, remaining } = rateLimit(ip, "api", 120, 60_000);
      if (!allowed) {
        const res = NextResponse.json(
          { error: "Cok fazla istek. Lutfen biraz bekleyin." },
          { status: 429 }
        );
        res.headers.set("Retry-After", "60");
        return addSecurityHeaders(res);
      }
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      return addSecurityHeaders(response);
    }

    return addSecurityHeaders(NextResponse.next());
  }

  // SEO: DB redirect kontrolu (storefront sayfalari icin)
  const redirects = await getRedirects(request);
  const redirect = redirects.get(pathname);
  if (redirect) {
    const url = request.nextUrl.clone();
    url.pathname = redirect.toPath;
    return NextResponse.redirect(url, redirect.type === 302 ? 302 : 301);
  }

  // Locale routing (next-intl)
  const response = intlMiddleware(request);
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    // API routes
    "/api/:path*",
    // All pages (skip static files)
    "/((?!_next/static|_next/image|favicon.ico|icons/|uploads/|sw.js|manifest.json|offline.html).*)",
  ],
};
