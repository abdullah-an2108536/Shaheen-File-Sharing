// app/api/logout/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
 await cookies().set("admin_auth", "", {
    maxAge: 0,
    path: "/"
  });

  return NextResponse.json({ success: true });
}
