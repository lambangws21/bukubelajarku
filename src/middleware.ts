import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TS_SUPPORT_SESSION_COOKIE = "ts_support_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname !== "/") return NextResponse.next();

  const hasSession = Boolean(req.cookies.get(TS_SUPPORT_SESSION_COOKIE)?.value);
  const destination = hasSession ? "/ts-support-view" : "/ts-support-login";
  const nextUrl = req.nextUrl.clone();
  nextUrl.pathname = destination;
  nextUrl.search = "";
  return NextResponse.redirect(nextUrl);
}

export const config = {
  matcher: ["/"],
};
