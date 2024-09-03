import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PreOperasi from "@/app/procedure/posisihip/img/preop.jpg";
import PostOperasi from "@/app/procedure/posisihip/img/postOp.jpg";
import Gambar1 from "@/app/procedure/posisihip/img/62_Pr010_i010.png";
import Gambar2 from "@/app/procedure/posisihip/img/62_Pr010_i020.png";

export const PlaningCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning Pre Operasi</CardTitle>
      </CardHeader>
      <CardContent>
        <Card className="flex items-center justify-center mb-3 flex-col">
          <Image
            src={PreOperasi}
            alt="Penjelasan Gambar Pertama"
            width={268}
            height={126}
            className="rounded-md w-auto h-auto hover:scale-150 transition ease-in-out duration-200"
          />
          <Image
            src={PostOperasi}
            alt="Penjelasan Gambar Pertama"
            width={268}
            height={126}
            className="rounded-md w-auto h-auto hover:scale-150 transition ease-in-out duration-200"
          />
        </Card>
        <Card className="flex items-center justify-center">
        <Image
            src={Gambar1}
            alt="Penjelasan Gambar Pertama"
            width={468}
            height={826}
            className="rounded-md w-auto h-auto"
          />
           <Image
            src={Gambar2}
            alt="Penjelasan Gambar Pertama"
            width={468}
            height={826}
            className="rounded-md w-auto h-auto"
          />
        </Card>
      </CardContent>
    </Card>
  );
};
