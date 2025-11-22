import { EXTERNAL_API_BASE } from "@/lib/config";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/me
 * Proxy to https://dummyjson.com/auth/me
 * - Forwards incoming cookies to DummyJSON so it can validate session
 * - Returns the JSON response (user info) and uses DummyJSON's HTTP status code
 * - Forwards any Set-Cookie header back to the client
 */

export async function GET(req: Request) {
  try {
    const originCookie = req.headers.get("cookie") ?? "";

    const fetchRes = await fetch(EXTERNAL_API_BASE+"/auth/me", {
      method: "GET",
      headers: {
        // forward cookies from the browser
        cookie: originCookie,
      },
    });

    // Read body text and attempt to parse JSON safely
    const text = await fetchRes.text();
    let resBody: unknown = null;
    try {
      resBody = text ? JSON.parse(text) : null;
    } catch {
      // not JSON — return raw text
      resBody = text;
    }

    // Build response and forward set-cookie if provided
    const nextRes = NextResponse.json(resBody, { status: fetchRes.status });

    const setCookie = fetchRes.headers.get("set-cookie");
    if (setCookie) {
      // Forward Set-Cookie header(s)
      nextRes.headers.set("set-cookie", setCookie);
    }

    return nextRes;
  } catch (err: any) {
    console.error("/api/auth/me proxy error:", err);
    return NextResponse.json(
      { message: "Proxy error", error: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}
