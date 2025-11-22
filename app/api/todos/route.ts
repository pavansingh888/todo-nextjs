// /Users/pavan/Desktop/todo-nextjs/app/api/todos/route.ts
import { NextResponse } from "next/server";

/**
 * GET /api/todos
 * Proxy to https://dummyjson.com/todos
 * Forwards query string and cookies, returns DummyJSON response and status.
 */

export async function GET(req: Request) {
  try {
    const originCookie = req.headers.get("cookie") ?? "";

    // Forward query string exactly as received
    const url = new URL(req.url);
    const qs = url.search; // includes leading "?" or empty string

    const fetchUrl = `https://dummyjson.com/todos${qs}`;

    const fetchRes = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        cookie: originCookie,
      },
    });

    const text = await fetchRes.text();
    let resBody: unknown = null;
    try {
      resBody = text ? JSON.parse(text) : null;
    } catch {
      resBody = text;
    }

    const nextRes = NextResponse.json(resBody, { status: fetchRes.status });

    const setCookie = fetchRes.headers.get("set-cookie");
    if (setCookie) nextRes.headers.set("set-cookie", setCookie);

    return nextRes;
  } catch (err: any) {
    console.error("/api/todos GET proxy error:", err);
    return NextResponse.json({ message: "Proxy error", error: String(err?.message ?? err) }, { status: 502 });
  }
}
