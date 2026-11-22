import type { Metadata } from "next";
import { Suspense } from "react";
import { EnquiryFlow, EnquiryShell } from "@/components/enquire/EnquiryFlow";

export const metadata: Metadata = {
  title: "Book a site visit",
  description: "Book a site visit to a Runwal Realty residence or office in Mumbai, Thane or Pune. Choose a project, your home, a day and a time.",
  alternates: { canonical: "/enquire" },
};

export default function EnquirePage() {
  return (
    <Suspense fallback={<EnquiryShell />}>
      <EnquiryFlow />
    </Suspense>
  );
}
