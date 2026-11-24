import type { Metadata } from "next";
import { ArchitectureBand } from "@/components/legacy/ArchitectureBand";
import { Awards } from "@/components/legacy/Awards";
import { FortyEight } from "@/components/legacy/FortyEight";
import { Leadership } from "@/components/legacy/Leadership";
import { LegacyHero } from "@/components/legacy/LegacyHero";
import { Numbers } from "@/components/legacy/Numbers";
import { Pillars } from "@/components/legacy/Pillars";
import { Reel } from "@/components/legacy/Reel";
import { TimeMachine } from "@/components/legacy/TimeMachine";
import { PageFx } from "@/components/site/PageFx";

export const metadata: Metadata = {
  title: "Legacy",
  description:
    "Since 1978: from a single residential project in Thane to 35 completed projects, 11.22 million sq ft handed over and landmarks like R City. The Runwal Realty journey, leadership and awards.",
  alternates: { canonical: "/legacy" },
};

export default function LegacyPage() {
  return (
    <>
      <PageFx />
      <LegacyHero />
      <FortyEight />
      <TimeMachine />
      <Numbers />
      <ArchitectureBand />
      <Pillars />
      <Leadership />
      <Reel />
      <Awards />
    </>
  );
}
