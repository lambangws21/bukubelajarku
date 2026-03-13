import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TS_SUPPORT_SESSION_COOKIE = "ts_support_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname !== "/") return NextResponse.next();

  const hasSession = Boolean(req.cookies.get(TS_SUPPORT_SESSION_COOKIE)?.value);
  const destination = hasSession ? "/ts-support-view" : "/ts-support-login";
  return NextResponse.redirect(new URL(destination, req.url));
}

export const config = {
  matcher: ["/"],
};
