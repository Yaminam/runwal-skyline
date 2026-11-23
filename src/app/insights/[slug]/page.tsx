import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleChrome, ShareBar } from "@/components/coverage/ArticleChrome";
import { PageFx } from "@/components/site/PageFx";
import { Pic } from "@/components/site/Pic";
import { TLink } from "@/components/site/Transition";
import { ARTICLES, fmtDate, getArticle, neighbours, readMinutes, relatedProjects, slugify, toc, type Block } from "@/lib/articles";

// Static params come from the article list; params are awaited inside, so skip instant validation.
export const instant = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/insights/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.description, images: a.cover ? [{ url: a.cover }] : undefined, publishedTime: a.date ?? undefined },
    twitter: { card: "summary_large_image", title: a.title, description: a.description, images: a.cover ? [a.cover] : undefined },
  };
}

const strip = (h: string) => h.replace(/<[^>]+>/g, "");

function Body({ blocks }: { blocks: Block[] }) {
  const firstP = blocks.findIndex((b) => b.t === "p");
  return (
    <div className="[&_a]:text-graphite [&_a]:underline [&_a]:decoration-amber [&_a]:decoration-2 [&_a]:underline-offset-4 hover:[&_a]:decoration-dusk [&_strong]:font-semibold [&_strong]:text-graphite">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h2":
            return (
              <h2 key={i} id={slugify(strip(b.html))} className="title mt-16 scroll-mt-28 text-3xl leading-tight md:text-4xl">
                {strip(b.html)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="title mt-10 text-xl md:text-2xl">
                {strip(b.html)}
              </h3>
            );
          case "p": {
            const drop = i === firstP;
            return (
              <p
                key={i}
                className={`mt-6 text-[1.06rem] leading-[1.75] text-graphite-2 ${drop ? "first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-[family-name:var(--font-display)] first-letter:text-[4.4rem] first-letter:leading-[0.8] first-letter:text-graphite" : ""}`}
                dangerouslySetInnerHTML={{ __html: b.html }}
              />
            );
          }
          case "blockquote":
            return (
              <blockquote key={i} className="accent my-12 border-l-2 border-amber pl-6 text-3xl leading-snug text-graphite md:text-4xl" dangerouslySetInnerHTML={{ __html: b.html }} />
            );
          case "ul":
          case "ol": {
            const Tag = b.t;
            return (
              <Tag key={i} className={`mt-6 flex flex-col gap-3 pl-5 text-[1.02rem] leading-relaxed text-graphite-2 ${b.t === "ol" ? "list-decimal" : "list-disc"} marker:text-amber-deep`}>
                {b.items.map((it, k) => (
                  <li key={k} dangerouslySetInnerHTML={{ __html: it }} />
                ))}
              </Tag>
            );
          }
          case "table":
            return (
              <div key={i} className="no-scrollbar -mx-6 my-10 overflow-x-auto px-6 md:mx-0 md:px-0">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      {b.rows[0].map((c, k) => (
                        <th key={k} className="kicker border-b-2 border-graphite py-3 pr-4 align-bottom text-graphite">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.slice(1).map((r, k) => (
                      <tr key={k} className="border-b border-graphite/15">
                        {r.map((c, j) => (
                          <td key={j} className={`py-3 pr-4 align-top leading-relaxed ${j === 0 ? "font-medium text-graphite" : "text-graphite-2"}`}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "img":
            return (
              <figure key={i} className="my-12 lg:-mx-[8%]">
                <div className="relative overflow-hidden bg-stone-2" data-reveal-img>
                  <Pic src={b.src} alt={b.alt} sizes="(min-width: 1024px) 60vw, 100vw" />
                </div>
                {b.alt ? <figcaption className="kicker mt-3 text-mute">{b.alt}</figcaption> : null}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();
  const contents = toc(a);
  const related = relatedProjects(a);
  const { prev, next } = neighbours(a.slug);

  return (
    <>
      <PageFx />
      <article className="bg-stone">
        <header className="px-6 pt-28 md:px-10 md:pt-36">
          <div className="flex flex-col gap-2 border-b border-graphite/15 pb-5 md:flex-row md:items-center md:justify-between" data-fade>
            <nav aria-label="Breadcrumb" className="kicker flex flex-wrap items-center gap-2 text-mute">
              <TLink href="/" className="ulink hover:text-graphite">
                Home
              </TLink>
              <span aria-hidden>/</span>
              <TLink href="/insights" className="ulink hover:text-graphite">
                Insights
              </TLink>
              <span aria-hidden>/</span>
              <span className="text-graphite">Blog</span>
            </nav>
            <p className="kicker text-dusk">
              Blog &middot; {fmtDate(a.date)} &middot; {readMinutes(a)} min read
            </p>
          </div>
          <h1 className="title max-w-5xl py-10 text-[2.4rem] leading-[1.05] md:py-14 md:text-[min(5.2vw,5.6rem)]" data-split="now">
            {a.title}
          </h1>
        </header>
        {a.cover ? (
          <div className="relative h-[42svh] overflow-hidden md:h-[78svh]" data-reveal-img>
            <div className="absolute inset-x-0 -inset-y-[10%]" data-parallax="7">
              <Pic src={a.cover} alt={a.title} fill priority sizes="100vw" />
            </div>
          </div>
        ) : null}

        <div className="px-6 py-14 md:px-10 md:py-20">
          <ArticleChrome toc={contents}>
            <div className="max-w-[68ch]">
              <p className="title text-xl leading-snug text-graphite md:text-2xl">{a.description}</p>
              <div className="mt-8 border-y border-graphite/15 py-4">
                <ShareBar title={a.title} />
              </div>
              <Body blocks={a.blocks} />

              {a.faqs.length ? (
                <section className="mt-20" aria-labelledby="faq-h">
                  <p className="kicker text-dusk">Questions readers ask</p>
                  <h2 id="faq-h" className="title mt-3 text-3xl md:text-4xl">
                    Frequently <span className="accent">asked</span>
                  </h2>
                  <ul className="mt-8">
                    {a.faqs.map((f) => (
                      <li key={f.q} className="border-t border-graphite/15 py-6 last:border-b">
                        <p className="title text-lg leading-snug md:text-xl">{f.q}</p>
                        <p className="mt-3 text-[0.98rem] leading-relaxed text-graphite-2">{f.a}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="mt-14 flex flex-col gap-4 border-t border-graphite/15 pt-6 md:flex-row md:items-center md:justify-between">
                <ShareBar title={a.title} />
                <a href={a.source} target="_blank" rel="noreferrer" className="kicker ulink text-mute hover:text-graphite">
                  Originally published on runwalrealty.com &#8599;
                </a>
              </div>
            </div>
          </ArticleChrome>
        </div>
      </article>

      {related.length ? (
        <section data-tone="dark" className="bg-graphite px-6 py-20 text-stone md:px-10 md:py-28">
          <p className="kicker text-amber">Mentioned in this article</p>
          <h2 className="title mt-3 text-3xl md:text-5xl">
            Related <span className="accent">residences</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <TLink key={p.slug} href={`/residences/${p.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-graphite-2">
                  <Pic src={p.images.card} alt={p.name} fill sizes="(min-width: 768px) 32vw, 100vw" className="transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]" />
                </div>
                <p className="kicker mt-4 text-stone/50">{p.area}</p>
                <p className="title mt-1 text-2xl">{p.name}</p>
                {p.priceFrom ? <p className="kicker mt-2 text-amber">From {p.priceFrom}</p> : null}
              </TLink>
            ))}
          </div>
        </section>
      ) : null}

      <nav className="grid border-t border-graphite/10 bg-paper md:grid-cols-2" aria-label="More articles">
        {[prev, next].map((n, k) =>
          n ? (
            <TLink key={n.slug} href={`/insights/${n.slug}`} className={`group flex flex-col gap-3 px-6 py-12 md:px-10 md:py-16 ${k === 1 ? "md:border-l md:border-graphite/10 md:text-right" : ""}`}>
              <span className="kicker text-mute">{k === 0 ? "← Previous" : "Next →"}</span>
              <span className="title text-2xl leading-snug transition-colors group-hover:text-dusk md:text-3xl">{n.title}</span>
            </TLink>
          ) : (
            <TLink key={k} href="/insights" className={`flex flex-col gap-3 px-6 py-12 md:px-10 md:py-16 ${k === 1 ? "md:border-l md:border-graphite/10 md:text-right" : ""}`}>
              <span className="kicker text-mute">All insights</span>
              <span className="title text-2xl md:text-3xl">Back to the index</span>
            </TLink>
          ),
        )}
      </nav>
    </>
  );
}
