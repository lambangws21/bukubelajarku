"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, LoaderPinwheel } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// Schema untuk validasi form
const FormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  rumahSakit: z.string().nonempty("Rumah Sakit is required"),
  operasi: z.string().nonempty("Operasi is required"),
  operator: z.string().nonempty("Operator is required"),
  jumlah: z.coerce
    .number()
    .nonnegative("Jumlah should be a non-negative number"),
});

type FormSchemaType = z.infer<typeof FormSchema>;

const CustomForm = () => {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: new Date(),
      rumahSakit: "",
      operasi: "",
      operator: "",
      jumlah: 0,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const API_URL = "/api/googlesheet";

  async function handleFormSubmit(data: FormSchemaType) {
    setIsSubmitting(true); // Mulai animasi
    try {
      const formattedData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit data");
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success!",
        description: "Data berhasil disimpan!",
      });

      form.reset(); // Reset form setelah berhasil submit
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Terjadi kesalahan: ${err.message}`,
      });
    } finally {
      setIsSubmitting(false); // Hentikan animasi setelah proses selesai
    }
  }

  return (
    <div className="w-96 mx-auto">
      <Card>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <UIForm {...form}>
              <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-8 p-4"
              >
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Operasi</FormLabel>
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
                        Pilih tanggal operasi yang sudah diikuti.
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
                          min={0}
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
                  className="w-40 bg-slate-900 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded"
                  disabled={isSubmitting}
                  animate={{ opacity: isSubmitting ? 0.5 : 1 }} // Animasi perubahan opacity saat submit
                  transition={{ duration: 0.3 }}
                >
                  {isSubmitting ? (
                    <LoaderPinwheel className="animate-spin h-5 w-5 inline-block" />
                  ) : (
                    "Submit"
                  )}
                </motion.button>
              </form>
            </UIForm>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomForm;
