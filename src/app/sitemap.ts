import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/articles";

const BASE = "https://runwal-skyline.vercel.app";

const RESIDENCES = [
  "runwal-malabar",
  "runwal-raaya",
  "runwal-timeless",
  "runwal-rare",
  "runwal-auris",
  "runwal-sanctuary",
  "runwal-one",
  "runwal-zenith",
  "runwal-lands-end",
  "runwal-the-central-park",
  "r-square-andheri",
  "r-square-mulund",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/residences", "/places", "/legacy", "/enquire", "/insights", "/customers", "/nri", "/club-oasis", "/investors", "/careers", "/contact", "/faq", "/about/csr"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const residences = RESIDENCES.map((slug) => ({
    url: `${BASE}/residences/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const articles = ARTICLES.map((a) => ({
    url: `${BASE}/insights/${a.slug}`,
    lastModified: a.date ?? undefined,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));
  return [...pages, ...residences, ...articles];
}
