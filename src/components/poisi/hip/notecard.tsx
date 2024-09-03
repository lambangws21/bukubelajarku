import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";

const NoteCard = () => {
  return (
    <Card className="my-6 w-full overflow-y-auto">
      <CardHeader>
        <CardTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">Hip Positioning in Hemiarthroplasty-Lateral Position</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="w-full ">
          <thead>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right ">Component</th>
              <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">Recommended Degree</th>
              <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Inklinasi Acetabulum</td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><Badge variant="secondary">40-45°</Badge></td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Sudut kemiringan acetabulum untuk stabilitas implan dan mengurangi risiko dislokasi.</td>
            </tr>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Medialisasi</td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><Badge variant="secondary">90°</Badge></td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Untuk Menentukan kedalaman saat rhimer dan implant Liner dan head.</td>
            </tr>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Versi Acetabulum</td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><Badge variant="secondary">10-20°</Badge></td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right ">
                Rotasi acetabulum ke depan atau ke belakang untuk orientasi yang tepat.</td>
            </tr>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Anteversi Femoral</td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><Badge variant="secondary">10-15°</Badge></td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Rotasi leher femur ke depan agar implan femoral berfungsi optimal.</td>
            </tr>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Abduksi Kaki</td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><Badge variant="secondary">10-20°</Badge></td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Gerakan kaki ke arah luar untuk akses yang lebih baik ke sendi pinggul.</td>
            </tr>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Rotasi Eksternal Kaki</td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><Badge variant="secondary">Minimal (5-10°)</Badge></td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Rotasi kaki sedikit ke luar untuk orientasi implan yang tepat.</td>
            </tr>
            <tr className="m-0 border-t p-0 even:bg-muted">
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Fleksi Pinggul dan Lutut</td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"><Badge variant="secondary">10-15°</Badge></td>
              <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">Fleksi ringan untuk mengurangi ketegangan jaringan lunak dan memudahkan akses.</td>
            </tr>
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default NoteCard;
