import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PreOperasi from "@/app/procedure/posisihip/img/preop.jpg";
import PostOperasi from "@/app/procedure/posisihip/img/postOp.jpg";

export const PlaningCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning Pre Operasi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center flex-col">
          <Image
            src={PreOperasi}
            alt="Penjelasan Gambar Pertama"
            width={468}
            height={826}
            className="rounded-md w-auto h-auto"
          />
          <Image
            src={PostOperasi}
            alt="Penjelasan Gambar Pertama"
            width={468}
            height={826}
            className="rounded-md w-auto h-auto"
          />
        </div>
      </CardContent>
    </Card>
  );
};
