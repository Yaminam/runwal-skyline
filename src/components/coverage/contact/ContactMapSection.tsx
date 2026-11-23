"use client";

import dynamic from "next/dynamic";

// MapLibre touches window on import, so the map only loads in the browser.
const ContactMap = dynamic(() => import("./ContactMap"), {
  ssr: false,
  loading: () => <div className="h-[62svh] border border-stone/15 bg-[#ebe7e0] md:h-[78svh]" />,
});

export function ContactMapSection() {
  return <ContactMap />;
}
