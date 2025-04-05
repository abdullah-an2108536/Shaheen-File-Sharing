// app/api/logout/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies(); //   Await cookies()

  cookieStore.set("admin_auth", "", {
    maxAge: 0,
    path: "/"
  });

  return NextResponse.json({ success: true });
}
