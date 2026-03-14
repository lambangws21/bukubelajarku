import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canManageTsSupport,
  getTsSupportSessionFromCookieStore,
} from "@/lib/tsSupportSession";

type TsSupportLayoutProps = {
  children: ReactNode;
};

export default async function TsSupportLayout({ children }: TsSupportLayoutProps) {
  const adminManageEmail = "admin@ts-support.local";
  const cookieStore = await cookies();
  const session = getTsSupportSessionFromCookieStore(cookieStore);

  if (!session) {
    redirect("/ts-support-login");
  }
  const normalizedEmail = String(session.user.email || "").trim().toLowerCase();
  if (normalizedEmail !== adminManageEmail || !canManageTsSupport(session.user.role)) {
    redirect("/ts-support-view");
  }

  return <>{children}</>;
}
