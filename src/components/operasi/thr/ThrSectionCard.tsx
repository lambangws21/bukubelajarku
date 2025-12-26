import { ThrSection } from "@/components/operasi/thr/data/data";
import ThrImageGallery from "@/components/operasi/thr/ThrImageGallery";
import ThrExplanation from "@/components/operasi/thr/ThrExplanation";

export default function ThrSectionCard({
  section,
}: {
  section: ThrSection;
}) {
  return (
    <section className="border rounded-xl p-6 bg-background shadow-sm">
      <header className="mb-4">
        <h2 className="text-xl font-semibold">{section.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {section.purpose}
        </p>
      </header>

      <ThrImageGallery images={section.imageRefs} />
      <ThrExplanation explanation={section.explanation} />
    </section>
  );
}
