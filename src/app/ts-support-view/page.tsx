import TsSupportAsistensiManager from "@/components/public/TsSupportAsistensiManager";

export default function TsSupportViewPage() {
  return (
    <main className="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
      <TsSupportAsistensiManager readonlyOnly />
    </main>
  );
}
