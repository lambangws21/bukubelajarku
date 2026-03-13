import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTsSupportSessionFromCookieStore } from "@/lib/tsSupportSession";

type TsSupportViewLayoutProps = {
  children: ReactNode;
};

export default async function TsSupportViewLayout({
  children,
}: TsSupportViewLayoutProps) {
  const cookieStore = await cookies();
  const session = getTsSupportSessionFromCookieStore(cookieStore);

  if (!session) {
    redirect("/ts-support-login");
  }

  return <>{children}</>;
}

