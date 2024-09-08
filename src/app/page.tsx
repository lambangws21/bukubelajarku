import SurgicalTechniquePersona from "@/components/operasi/persona/page";
import PosisiHip from "./procedure/posisihip/page";
import SurgicalStepsUka from "@/components/operasi/ukr/surgicalstep";


export default function Home() {
  return (
   <div>
    <PosisiHip/>
    <SurgicalStepsUka/>
    <SurgicalTechniquePersona/>
   </div>
  );
}
