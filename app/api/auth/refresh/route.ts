import { EXTERNAL_API_BASE } from "@/lib/config";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/refresh
 * Proxy to https://dummyjson.com/auth/refresh
 * - Forwards incoming cookies to DummyJSON
 * - Forwards any Set-Cookie headers from DummyJSON back to the client
 * - Uses DummyJSON's HTTP status for the response
 */

export async function POST(req: Request) {
  try {
    const originCookie = req.headers.get("cookie") ?? "";

    // pass along any JSON body if provided
    const bodyText = await req.text();
    const fetchRes = await fetch(EXTERNAL_API_BASE+"/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // forward cookies from browser to dummyjson (so it can read refresh cookie)
        cookie: originCookie,
      },
      body: bodyText || undefined,
    });

    const text = await fetchRes.text();
    let resBody: unknown = null;
    try {
      resBody = text ? JSON.parse(text) : null;
    } catch {
      resBody = text;
    }

    // create NextResponse and forward status/body
    const nextRes = NextResponse.json(resBody, { status: fetchRes.status });

    // Forward Set-Cookie headers (if any) from DummyJSON to the client.
    const setCookie = fetchRes.headers.get("set-cookie");
    if (setCookie) {
      nextRes.headers.set("set-cookie", setCookie);
    }

    return nextRes;
  } catch (err: any) {
    console.error("/api/auth/refresh proxy error:", err);
    return NextResponse.json(
      { message: "Proxy error", error: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}
