import { NextResponse } from "next/server";

/**
 * GET /api/todos/user/:id
 * Proxy to https://dummyjson.com/todos/user/:id
 */

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: userId } = await params;
    
    const originCookie = req.headers.get("cookie") ?? "";
    
    const fetchRes = await fetch(
      `https://dummyjson.com/todos/user/${encodeURIComponent(userId)}`, 
      {
        method: "GET",
        headers: {
          cookie: originCookie,
        },
      }
    );

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
    console.error("/api/todos/user/[id] proxy error:", err);
    return NextResponse.json(
      { message: "Proxy error", error: String(err?.message ?? err) }, 
      { status: 502 }
    );
  }
}