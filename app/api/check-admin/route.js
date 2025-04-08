// app/api/check-admin/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) return NextResponse.json({ isAdmin: false });

    if (!JWT_SECRET) {
      //temp fix until we resolve the issue with JWT_SECRET not being defined in the environment variables
      console.warn("⚠️ JWT_SECRET not defined. Using fallback secret.");
      JWT_SECRET = "K9x!d2$B7tL8zQ@cR3WmNpV5JhX0uE1g";
      // throw new Error("JWT_SECRET is not defined in the environment variables.");
    }
    // if (!JWT_SECRET) {
    //   throw new Error(
    //     "JWT_SECRET is not defined in the environment variables."
    //   );
    // }


    const decoded = jwt.verify(token, secret);

    // Extract and hash client IP
    let clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    clientIP = clientIP.split(",")[0]?.trim();

    console.warn("⚠️ Client IP:", clientIP);

    try {
      console.warn("⚠️ Client IP:", clientIP);
      console.log("Client IP:", clientIP);
      console.warn("⚠️ Client IP:", clientIP);

    } catch (_) {}


    //✅ Hash the IP address to store in the JWT
    const currentHash = crypto
      .createHash("sha256")
      .update(currentIP)
      .digest("hex");

    if (
      decoded?.role === "admin" &&
      decoded?.ipHash &&
      decoded.ipHash === currentHash
    ) {
      return NextResponse.json({ isAdmin: true });
    }

    return NextResponse.json({ isAdmin: false });
  } catch (err) {
    console.error("JWT validation failed:", err.message);
    return NextResponse.json({ isAdmin: false });
  }
}
