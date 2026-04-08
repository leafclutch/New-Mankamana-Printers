import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005/api/v1';
const AUTH_TOKEN_COOKIE = "admin-auth-token";
const AUTH_FLAG_COOKIE = "admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const endpoint = `${API_BASE_URL}/admin/auth/login`;
    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const contentType = apiResponse.headers.get("content-type") || "";
    const rawBody = await apiResponse.text();
    let data: any = null;
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(rawBody);
      } catch (parseError) {
        console.error("Login API route JSON parse error:", parseError);
      }
    }

    if (!apiResponse.ok) {
      console.error("Login API route backend error:", {
        status: apiResponse.status,
        endpoint,
        contentType,
        body: rawBody?.slice(0, 500),
      });
      const errorResponse = NextResponse.json(
        { message: data?.message || "Authentication failed." },
        { status: apiResponse.status }
      );
      errorResponse.cookies.set(AUTH_TOKEN_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });
      errorResponse.cookies.set(AUTH_FLAG_COOKIE, "", {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });
      return errorResponse;
    }

    // On successful login, set the token in a secure cookie
    const response = NextResponse.json({
      success: true,
      user: data.admin,
    });

    response.cookies.set(AUTH_TOKEN_COOKIE, data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    response.cookies.set(AUTH_FLAG_COOKIE, "true", {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
    
  } catch (error) {
    console.error("Login API route error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
