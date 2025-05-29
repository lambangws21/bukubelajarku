"use client";
import React from "react";

import FormGoogleSheet from "@/app/pages/googlesheetform/page";
import FormAdvance from "@/app/pages/formadvance/page";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function page() {
  return (
    <div>
      <div className="w-full max-w-md mx-auto">
        {" "}
        {/* Membuat carousel responsif dan di tengah */}
        <Carousel className="h-[300px]">
          {" "}
          {/* Mengatur tinggi carousel */}
          <CarouselContent>
            <CarouselItem>
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-4">
                  {" "}
                  {/* Menggunakan flex-col dan padding yang disesuaikan */}
                  {/* Jika FormGoogleSheet harus di dalam Carousel, pastikan tidak terlalu panjang */}
                  <FormGoogleSheet />
                </CardContent>
              </Card>
            </CarouselItem>
            {/* Tambahkan CarouselItem lainnya di sini */}
            <CarouselItem>
              <Card>
                <CardContent>
                  <FormAdvance/>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <div className="flex justify-between w-full">
            {" "}
            {/* Memposisikan navigasi di luar carousel */}
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </Carousel>
      </div>
    </div>
  );
}
