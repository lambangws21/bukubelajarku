import { AlignmentTool } from "@/components/operasi/aligment/AligmentTool";
import { alignmentContent } from "@/components/operasi/aligment/content";
import { QnAAlignmentWizard } from "@/components/operasi/aligment/QnAAlignmentWizard";

export default function AlignmentPage() {
  return (
    <main className="min-h-dvh bg-black text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* <AlignmentTool content={alignmentContent} /> */}
        <QnAAlignmentWizard content={alignmentContent} />
      </div>
    </main>
  );
}
