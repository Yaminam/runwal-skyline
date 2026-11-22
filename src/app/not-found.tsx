import { TLink } from "@/components/site/Transition";

export default function NotFound() {
  return (
    <section className="blueprint relative flex min-h-svh flex-col justify-end bg-stone px-6 pb-16 pt-32 md:px-10 md:pb-20">
      <p className="kicker text-mute">Error 404 &middot; Floor not found</p>
      <h1 className="display mt-6 text-[26vw] leading-[0.8] md:text-[min(22vw,24rem)]">404</h1>
      <div className="mt-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <p className="title max-w-xl text-3xl md:text-4xl">
          This address isn&rsquo;t built <span className="accent">yet.</span>
        </p>
        <div className="flex gap-3">
          <TLink href="/" className="bg-graphite px-6 py-4 text-sm font-medium text-stone transition-colors hover:bg-dusk">
            Back to the skyline
          </TLink>
          <TLink href="/residences" className="border border-graphite/25 px-6 py-4 text-sm font-medium transition-colors hover:border-graphite">
            All residences
          </TLink>
        </div>
      </div>
    </section>
  );
}
