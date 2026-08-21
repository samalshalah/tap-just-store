import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Overwrite before deleting: some clients keep a cookie whose only
  // instruction was to remove it, and an empty value fails verification anyway.
  res.cookies.set(ADMIN_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
