// app/api/admin-auth/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { comparePasswordsServer } from "@/lib/server/adminFunc"; // ✅ SERVER version

export async function POST(req) {
  const { username, password } = await req.json();

  const ADMIN_USERNAME = process.env.ADMIN_USER;
  const ADMIN_HASH = process.env.ADMIN_PASS;
  const SALT = process.env.ADMIN_SALT;

  //   const SALT = "kjOOeuZuAXheBsyidihKRA==";

  // console.log("ENV USER:", ADMIN_USERNAME);
  // console.log("ENV HASH:", ADMIN_HASH);
  // console.log("ENV SALT:", SALT);

  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const isValid =
    username === ADMIN_USERNAME &&
    (await comparePasswordsServer(password, ADMIN_HASH, SALT));

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Set secure HttpOnly cookie

  const cookieStore = await cookies(); //   Await cookies()

  cookieStore.set("admin_auth", "true", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 60 * 60 * 4, // 4 hours
    path: "/"
  });

  return NextResponse.json({ success: true });
}
