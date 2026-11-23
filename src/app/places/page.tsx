import type { Metadata } from "next";
import { District } from "@/components/places/District";
import { PlacesGallery } from "@/components/places/PlacesGallery";
import { Commercial, DrawingBoard, Hospitality, Investors, PlacesHero, Retail } from "@/components/places/PlacesSections";
import { PageFx } from "@/components/site/PageFx";

export const metadata: Metadata = {
  title: "Places",
  description:
    "R Square offices in Andheri and Mulund, R City and R Mall destinations, and Runwal Realty's upcoming hotels in Worli, Thane, Pune and Alibaug.",
  alternates: { canonical: "/places" },
};

export default function PlacesPage() {
  return (
    <>
      <PageFx />
      <PlacesHero />
      <District />
      <PlacesGallery />
      <Commercial />
      <Retail />
      <Hospitality />
      <DrawingBoard />
      <Investors />
    </>
  );
}
