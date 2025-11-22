import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const incomingCookie = req.headers.get("cookie") ?? "";

    const fetchRes = await fetch("https://dummyjson.com/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: incomingCookie, // forward client cookies (rarely needed for login)
      },
      body: JSON.stringify(body),
      credentials: "include",
    });

    const text = await fetchRes.text();
    const data = text ? JSON.parse(text) : {};

    // Create response with SAME STATUS as DummyJSON returned
    const nextRes = NextResponse.json(data, { status: fetchRes.status });

    // Forward cookies if DummyJSON set any
    const setCookieHeader = fetchRes.headers.get("set-cookie");
    if (setCookieHeader) {
      nextRes.headers.set("set-cookie", setCookieHeader);
    }

    return nextRes;
  } catch (err: any) {
    console.error("LOGIN PROXY ERROR:", err);

    return NextResponse.json(
      { message: "Proxy error", error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
