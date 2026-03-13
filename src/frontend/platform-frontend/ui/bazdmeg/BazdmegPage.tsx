import { CTASection } from "./CTASection";
import { EffortSplit } from "./EffortSplit";
import { HeroSection } from "./HeroSection";
import { PrinciplesList } from "./PrinciplesList";

export function BazdmegPage() {
  return (
    <div className="rubik-container rubik-page rubik-stack">
      <HeroSection />
      <PrinciplesList />
      <EffortSplit />
      <CTASection />
    </div>
  );
}
