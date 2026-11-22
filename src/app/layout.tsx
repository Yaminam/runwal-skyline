import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Footer } from "@/components/site/Footer";
import { Loader } from "@/components/site/Loader";
import { Nav } from "@/components/site/Nav";
import { TransitionProvider } from "@/components/site/Transition";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const display = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const sans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://runwal-skyline.vercel.app"),
  title: {
    default: "Runwal Realty | Built for Generations, Since 1978",
    template: "%s | Runwal Realty",
  },
  description:
    "Runwal Realty has built homes, offices and city landmarks across Mumbai, Thane and Pune since 1978. Explore luxury residences in Malabar Hill, Worli, Wadala, Andheri, Malad, Mulund, Thane and Pune.",
  applicationName: "Runwal Realty",
  keywords: ["Runwal Realty", "Runwal", "luxury apartments Mumbai", "Malabar Hill", "Worli", "Thane", "Runwal Raaya", "Runwal Malabar", "R City"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Runwal Realty",
    title: "Runwal Realty | Built for Generations",
    description: "Homes, offices and city landmarks across Mumbai, Thane and Pune since 1978.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runwal Realty | Built for Generations",
    description: "Homes, offices and city landmarks across Mumbai, Thane and Pune since 1978.",
  },
};

export const viewport: Viewport = {
  themeColor: "#eeebe5",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${sans.variable} ${mono.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Mark JS before first paint so the loader and reveal states never flash. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <SmoothScroll />
        <TransitionProvider>
          <Loader />
          <Nav />
          <main>{children}</main>
          <Footer />
        </TransitionProvider>
      </body>
    </html>
  );
}
