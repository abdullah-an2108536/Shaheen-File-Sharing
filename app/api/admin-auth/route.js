// app/api/admin-auth/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { comparePasswordsServer } from "@/lib/server/adminFunc";

const JWT_SECRET = process.env.JWT_SECRET;



export async function POST(req) {
  const { username, password } = await req.json();

  const ADMIN_USERNAME = process.env.ADMIN_USER;
  const ADMIN_HASH = process.env.ADMIN_PASS;
  const SALT = process.env.ADMIN_SALT;

  if(!JWT_SECRET) {
    //temp fix until we resolve the issue with JWT_SECRET not being defined in the environment variables
    JWT_SECRET="K9x!d2$B7tL8zQ@cR3WmNpV5JhX0uE1g"
    // throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  const isValid =
    username === ADMIN_USERNAME &&
    (await comparePasswordsServer(password, ADMIN_HASH, SALT));

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // ✅ Get client IP
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

  // ✅ Create JWT with IP hash
  const token = jwt.sign(
    {
      username: ADMIN_USERNAME,
      role: "admin",
      ipHash,
    },
    JWT_SECRET,
    { expiresIn: "4h" }
  );

  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 60 * 60 * 4, // 4 hours
    path: "/",
  });

  return NextResponse.json({ success: true });
}
