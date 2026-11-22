import { Beyond } from "@/components/home/Beyond";
import { Closing } from "@/components/home/Closing";
import { Manifesto } from "@/components/home/Manifesto";
import { Regions } from "@/components/home/Regions";
import { Signature } from "@/components/home/Signature";
import { SkylineHero } from "@/components/home/SkylineHero";
import { PageFx } from "@/components/site/PageFx";

export default function Home() {
  return (
    <>
      <PageFx />
      <SkylineHero />
      <Manifesto />
      <Signature />
      <Regions />
      <Beyond />
      <Closing />
    </>
  );
}
