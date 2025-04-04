import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies(); //   Await cookies()
  const cookie = cookieStore.get("admin_auth");

  if (!cookie || cookie.value !== "true") {
    return NextResponse.json({ isAdmin: false });
  }

  return NextResponse.json({ isAdmin: true });
}
