"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion"; // Hanya import motion, tanpa AnimatePresence
import { CircleX, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

// Definisikan tipe data
interface SheetDataItem {
  date: string;
  rumahSakit: string;
  operasi: string;
  operator: string;
  jumlah: number;
}

export default function Page() {
  // State untuk menyimpan data, status loading, error, dll.
  const [data, setData] = useState<SheetDataItem[]>([]); // Pastikan berupa array
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect untuk mengambil data saat komponen di-mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/getGoogleSheets");
        const result = (await response.json()) as {
          data: SheetDataItem[];
          error?: string;
        };

        if (result.error) {
          setError(result.error);
        } else if (Array.isArray(result.data)) {
          const formattedData = result.data.map((item: SheetDataItem) => ({
            ...item,
            date: format(new Date(item.date), "yyyy-MM-dd"),
          }));
          setData(formattedData);
        } else {
          setError("Format data tidak sesuai");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Building Your Application
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {!loading &&
            !error &&
            data.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                  <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="aspect-video rounded-xl bg-muted/50">       <Card className="shadow-lg border border-gray-200 rounded-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-slate-900 to-zinc-500 text-white rounded-t-lg p-4">
                    <CardTitle className="flex items-center">
                      <Badge className="mr-2 bg-white text-black">{index + 1}</Badge>
                      Tanggal: {item.date}
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-50">Rumah Sakit: {item.rumahSakit}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div>
                      <span className="font-semibold">Operasi:</span> <Badge variant="outline">{item.operasi}</Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Operator:</span> <Badge variant="outline">{item.operator}</Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Jumlah:</span> <Badge variant="outline">{item.jumlah}</Badge>
                    </div>
                  </CardContent>
                </Card></div>
                    <div className="aspect-video rounded-xl bg-muted/50" />
                    <div className="aspect-video rounded-xl bg-muted/50" />
                  </div>
                  <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
                </div>
              </motion.div>
            ))}
        </SidebarInset>
      </SidebarProvider>
    );
  }
}
