import { Architecture } from "@/components/home/Architecture";
import { Beyond } from "@/components/home/Beyond";
import { Closing } from "@/components/home/Closing";
import { InstaWall } from "@/components/home/InstaWall";
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
      <Architecture />
      <Regions />
      <Beyond />
      <InstaWall />
      <Closing />
    </>
  );
}
