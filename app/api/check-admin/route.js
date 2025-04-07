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

    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Extract real IP
    const forwarded = req.headers.get("x-forwarded-for");
    const currentIP = forwarded?.split(",")[0]?.trim() || "unknown";
    const currentHash = crypto.createHash("sha256").update(currentIP).digest("hex");

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
