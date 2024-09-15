"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form as UIForm,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion } from "framer-motion";

// Schema untuk validasi form
const FormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  rumahSakit: z.string().nonempty("Rumah Sakit is required"),
  operasi: z.string().nonempty("Operasi is required"),
  operator: z.string().nonempty("Operator is required"),
  jumlah: z.coerce.number().nonnegative("Jumlah should be a non-negative number"),
});

type FormSchemaType = z.infer<typeof FormSchema>;

const CustomForm = () => {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
  });

  // URL Google Apps Script Web App Anda
  const googleScriptURL = "https://script.google.com/macros/s/AKfycbyCNn3-kL4UGkievw36YsljSIJhnEuugMLbBja1WQBHOopvDOHn-35xxPGIFkNCMYq5Xg/exec"; // Ganti YOUR_SCRIPT_ID dengan ID Skrip Anda

  const onSubmit = async (data: FormSchemaType) => {
    try {
      // Konversi data sesuai dengan format yang diharapkan Google Sheets
      const postData = {
        id: Date.now().toString(), // Menambahkan ID unik (menggunakan timestamp saat ini)
        ok: "OK", // Mengisi kolom 'ok' sebagai contoh
        unit: data.rumahSakit,
        jaminan: "Asuransi", // Atur sesuai kebutuhan Anda
        anestesi: "Umum", // Atur sesuai kebutuhan Anda
        tindakan: data.operasi,
        operator: data.operator,
        perawat: "Perawat A", // Atur sesuai kebutuhan Anda
        waktu: format(data.date, "yyyy-MM-dd HH:mm:ss"),
      };

      const response = await fetch(googleScriptURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([postData]), // Mengirimkan data sebagai array karena Google Apps Script menggunakan loop
      });

      if (response.ok) {
        alert("Data berhasil ditambahkan ke Google Sheet!");
      } else {
        alert("Gagal menambahkan data.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat mengirim data.");
    }
  };

  return (
    <div className="w-96">
      <Card>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <UIForm {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 p-4"
            >
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the date of the operation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rumahSakit"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Rumah Sakit</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rumah Sakit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operasi"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Operasi</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Operasi" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Operator</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Operator" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jumlah"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Jumlah</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Jumlah"
                        type="number"
                        min={0} // Prevents negative numbers
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <motion.button
                type="submit"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="btn btn-primary"
              >
                Submit
              </motion.button>
            </form>
          </UIForm>
        </motion.div>
      </Card>
    </div>
  );
};

export default CustomForm;
