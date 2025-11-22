import { EXTERNAL_API_BASE } from "@/lib/config";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const originCookie = req.headers.get("cookie") ?? "";
    
    const fetchRes = await fetch(
      `${EXTERNAL_API_BASE}/todos/${encodeURIComponent(id)}`,
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
    console.error("/api/todos/[id] GET proxy error:", err);
    return NextResponse.json(
      { message: "Proxy error", error: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const originCookie = req.headers.get("cookie") ?? "";

    const fetchRes = await fetch(
      `${EXTERNAL_API_BASE}/todos/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
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
    console.error("/api/todos/[id] DELETE proxy error:", err);
    return NextResponse.json(
      { message: "Proxy error", error: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const originCookie = req.headers.get("cookie") ?? "";
    const bodyText = await req.text();

    const fetchRes = await fetch(
      `${EXTERNAL_API_BASE}/todos/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: originCookie,
        },
        body: bodyText || undefined,
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
    console.error("/api/todos/[id] PUT proxy error:", err);
    return NextResponse.json(
      { message: "Proxy error", error: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const originCookie = req.headers.get("cookie") ?? "";
    const bodyText = await req.text();

    const fetchRes = await fetch(
      `${EXTERNAL_API_BASE}/todos/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: originCookie,
        },
        body: bodyText || undefined,
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
    console.error("/api/todos/[id] PATCH proxy error:", err);
    return NextResponse.json(
      { message: "Proxy error", error: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}