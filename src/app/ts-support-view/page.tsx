import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TsSupportAsistensiManager from "@/components/public/TsSupportAsistensiManager";
import TsSupportSessionBar from "@/components/public/TsSupportSessionBar";
import { getTsSupportSessionFromCookieStore } from "@/lib/tsSupportSession";

export default async function TsSupportViewPage() {
  const cookieStore = await cookies();
  const session = getTsSupportSessionFromCookieStore(cookieStore);

  if (!session) {
    redirect("/ts-support-login");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 md:p-6">
      <div className="mx-auto max-w-[1600px]">
        <TsSupportSessionBar
          userName={session.user.name}
          userEmail={session.user.email}
          role={session.user.role}
          showAuditTimeline={false}
        />
        <TsSupportAsistensiManager readonlyOnly />
      </div>
    </main>
  );
}
