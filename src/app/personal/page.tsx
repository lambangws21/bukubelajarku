import Link from "next/link";
import { ClipboardList, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardPage from '@/components/Dasboards/DasboardAdvance/DasboardPage';

export default function Home() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/operasi">
            <ClipboardList className="h-4 w-4 mr-2" />
            Operasi
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/operasi-manajemen">
            <ListChecks className="h-4 w-4 mr-2" />
            Manajemen Operasi
          </Link>
        </Button>
      </div>
      <DashboardPage />
    </div>
  );
}
