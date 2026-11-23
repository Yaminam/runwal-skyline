import { ARTICLES } from "./articles-data";
import type { Article, Block } from "./article-types";
import { ALL_PROJECTS } from "./projects";

export { ARTICLES };
export type { Article, Block };

const strip = (h: string) => h.replace(/<[^>]+>/g, "");

export const slugify = (t: string) =>
  t
    .toLowerCase()
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export function getArticle(slug: string) {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function readMinutes(a: Article) {
  return Math.max(1, Math.round(a.words / 220));
}

export function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00+05:30`);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);
}

/** Table of contents from the article's section headings. */
export function toc(a: Article) {
  return a.blocks.flatMap((b) => (b.t === "h2" ? [{ id: slugify(strip(b.html)), label: strip(b.html) }] : []));
}

/** Runwal projects the article mentions by name, in order of first mention. */
export function relatedProjects(a: Article) {
  const text = a.title + " " + a.blocks.map((b) => ("html" in b ? strip(b.html) : "items" in b ? b.items.map(strip).join(" ") : "")).join(" ");
  return ALL_PROJECTS.map((p) => ({ p, at: text.indexOf(p.name) }))
    .filter((x) => x.at >= 0)
    .sort((x, y) => x.at - y.at)
    .map((x) => x.p)
    .slice(0, 3);
}

export function neighbours(slug: string) {
  const i = ARTICLES.findIndex((a) => a.slug === slug);
  return { prev: i > 0 ? ARTICLES[i - 1] : null, next: i >= 0 && i < ARTICLES.length - 1 ? ARTICLES[i + 1] : null };
}
