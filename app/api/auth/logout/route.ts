import { NextResponse } from "next/server";

const cookieOptions = (name: string) =>
  `${name}=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;

export async function POST(req: Request) {
  try {
    const res = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear cookies
    res.headers.append("Set-Cookie", cookieOptions("accessToken"));
    res.headers.append("Set-Cookie", cookieOptions("refreshToken"));

    return res;
  } catch (err: any) {
    console.error("/api/auth/logout error:", err);
    return NextResponse.json(
      { message: "Logout proxy error", error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}