import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canMutateTsSupportData,
  getTsSupportSessionFromCookieStore,
} from "@/lib/tsSupportSession";

type TsSupportLayoutProps = {
  children: ReactNode;
};

export default async function TsSupportLayout({ children }: TsSupportLayoutProps) {
  const cookieStore = await cookies();
  const session = getTsSupportSessionFromCookieStore(cookieStore);

  if (!session) {
    redirect("/ts-support-login");
  }
  if (!canMutateTsSupportData(session.user.role)) {
    redirect("/ts-support-view");
  }

  return <>{children}</>;
}
