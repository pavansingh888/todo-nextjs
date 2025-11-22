import { EXTERNAL_API_BASE } from "@/lib/config";
import { NextResponse } from "next/server";

/**
 * POST /api/todos/add
 * Proxy to https://dummyjson.com/todos/add
 * - Forwards cookies and JSON body
 */

export async function POST(req: Request) {
  try {
    const originCookie = req.headers.get("cookie") ?? "";
    const bodyText = await req.text();

    const fetchRes = await fetch(EXTERNAL_API_BASE+"/todos/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    const nextRes = NextResponse.json(resBody, { status: fetchRes.status });

    const setCookie = fetchRes.headers.get("set-cookie");
    if (setCookie) nextRes.headers.set("set-cookie", setCookie);

    return nextRes;
  } catch (err: any) {
    console.error("/api/todos/add proxy error:", err);
    return NextResponse.json({ message: "Proxy error", error: String(err?.message ?? err) }, { status: 502 });
  }
}
