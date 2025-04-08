// app/api/admin-auth/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { comparePasswordsServer } from "@/lib/server/adminFunc";

export async function GET(req) {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  
    return new Response(JSON.stringify({ ip }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  