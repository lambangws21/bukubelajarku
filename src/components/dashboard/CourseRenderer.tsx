// components/dashboard/CourseRenderer.tsx
import dynamic from "next/dynamic";
import SurgicalStepsUka from "@/components/operasi/uka/ukaStep";
import SurgicalTechniquePersona from "@/components/operasi/tkr/persona/PersonaSurgitech";
import PersonaKASurgicalGuideUI from "@/components/operasi/tkr/persona/PersonaKASurgicalGuideUI";
import VanguardStepsGallery from "@/components/operasi/vanguard/VanguardStepsGallery";
import AnatomiTkr from "@/components/operasi/tkr/anatomi-guide-tkr";
import TKAKnowledgeUI from "@/components/operasi/tkr/(knee)/TKAKnowledgeUI";
import TKAFemoralRotationCourse from "@/components/operasi/tkr/(knee)/TKAFemoralRotationCourse";
import TKAIntraOpGuideUI from "@/components/operasi/tkr/(knee)/TKAIntraOpGuideUI";
import TKAMentalChecklistUI from "@/components/operasi/tkr/(knee)/TKAMentalChecklistUI";
import TKAImplantDecisionGuideUI from "@/components/operasi/tkr/(knee)/TKAImplantDecisionGuideUI";

import AnatomiThr from "@/components/operasi/thr/anatomi-thr";
import PosisiHip from "@/app/procedure/posisihip/page";
import WagnerConeInteractiveLearning from "@/components/operasi/hip/WagnerConeInteractiveLearning";
import MLTaperInteractiveLearning from "@/components/operasi/hip/MLTaperInteractiveLearning";
import CPT1214InteractiveLearning from "@/components/operasi/hip/CPT1214InteractiveLearning";
import ContinuumAcetabularInteractiveLearning from "@/components/operasi/hip/ContinuumAcetabularInteractiveLearning";
import TrilogyITInteractiveLearning from "@/components/operasi/hip/TrilogyITInteractiveLearning";
import ZCAAllPolyInteractiveLearning from "@/components/operasi/hip/ZCAAllPolyInteractiveLearning";
import FemoralHeadInteractiveLearning from "@/components/operasi/hip/FemoralHeadInteractiveLearning";
import QuizKnee from "@/components/operasi/tkr/(knee)/TKAQuizUi";
import AnteAcetabulum from "@/components/operasi/thr/ThrRenderer";
import EmailSenderPage from "@/components/EmailSender/EmailSenderPage";

const DigitalTemplatingViewer = dynamic(
  () => import("@/components/digitalTemplating/digitalTemplatingViewer"),
  { ssr: false }
);

export default function CourseRenderer({ active }: { active: string }) {
  switch (active) {
    case "knee-uka":
      return <SurgicalStepsUka />;
    case "knee-persona":
      return <SurgicalTechniquePersona />;
    case "knee-persona-alignment":
      return <PersonaKASurgicalGuideUI />;
    case "knee-vanguard":
      return <VanguardStepsGallery />;
    case "knee-anatomi":
      return <AnatomiTkr />;
    case "knee-knowledge":
      return <TKAKnowledgeUI />;
    case "knee-rotation":
      return <TKAFemoralRotationCourse />;
    case "knee-guide":
      return <TKAIntraOpGuideUI />;
    case "knee-implant":
      return <TKAMentalChecklistUI />;
    case "knee-decision":
      return <TKAImplantDecisionGuideUI />;
    case "knee-quiz":
      return <QuizKnee />;

    case "hip-anatomi":
      return <AnatomiThr />;
    case "hip-posisi":
      return <PosisiHip />;
    case "hip-stem":
      return (
        <>
          <WagnerConeInteractiveLearning />
          <MLTaperInteractiveLearning />
          <CPT1214InteractiveLearning />
        </>
      );
    case "hip-acetabulum":
      return (
        <>
          <ContinuumAcetabularInteractiveLearning />
          <TrilogyITInteractiveLearning />
          <ZCAAllPolyInteractiveLearning />
        </>
      );
    case "acetabulum-rotation":
      return <AnteAcetabulum />;
    case "hip-head":
      return <FemoralHeadInteractiveLearning />;
    case "tool-advance":
      return <EmailSenderPage />;
    case "tool-templating":
      return <DigitalTemplatingViewer />;

    default:
      return null;
  }
}
