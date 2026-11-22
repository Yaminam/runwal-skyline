import type { Project } from "./projects";

/** "2, 3 & 4 BHK", "Sky mansions" or the first office config. */
export function bhkLabel(p: Project) {
  if (!p.bhk.length) return p.configs[0]?.label ?? "";
  if (p.slug === "runwal-malabar") return "Sky mansions";
  const b = [...p.bhk].sort((a, z) => a - z);
  return b.length === 1 ? `${b[0]} BHK` : `${b.slice(0, -1).join(", ")} & ${b[b.length - 1]} BHK`;
}

/** Carpet span across configurations, e.g. "583 – 1,002 sq ft". */
export function carpetSpan(p: Project) {
  const nums = p.configs.flatMap((c) => (c.carpet.match(/[\d,]+/g) ?? []).map((n) => Number(n.replace(/,/g, "")))).filter((n) => n > 100);
  if (!nums.length) return null;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const f = (n: number) => n.toLocaleString("en-IN");
  return lo === hi ? `${f(lo)} sq ft` : `${f(lo)} – ${f(hi)} sq ft`;
}
