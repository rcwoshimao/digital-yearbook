"use client";

import { SampleFlipbook } from "@/components/login/sample-flipbook";

type FeatureCard = {
  title: string;
  description: string;
  imagePath: string;
  imageHint: string;
};

const FEATURES: FeatureCard[] = [
  {
    title: "Desktop canvas signing",
    description:
      "Friends add text, photos, stickers, and freehand drawing on a page-sized canvas that matches the book.",
    imagePath: "/assets/login-features/canvas-editor.png",
    imageHint: "Write page with the Fabric.js editor and tool rail visible",
  },
  {
    title: "Share & invite friends",
    description:
      "Send a personal link or invite by username. Choose invite-only or anyone-with-link sharing.",
    imagePath: "/assets/login-features/share.png",
    imageHint: "Share modal or invite flow on the dashboard",
  },
];

function FeatureImagePlaceholder({ feature }: { feature: FeatureCard }) {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-yearbook-accent/35 bg-white/60 p-5 text-center">
      <span className="rounded-full bg-yearbook-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yearbook-accent">
        Screenshot placeholder
      </span>
      <code className="max-w-full break-all rounded-lg bg-stone-100 px-2 py-1.5 text-[11px] text-stone-800">
        public{feature.imagePath}
      </code>
      <p className="text-xs leading-relaxed text-stone-600">{feature.imageHint}</p>
    </div>
  );
}

export function LoginFeatures() {
  return (
    <section className="border-t border-yearbook-ink/10 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Your digital yearbook, end to end
          </h2>
          <p className="mt-4 text-lg leading-8 text-stone-700">
            Collect signatures, flip through pages, and share with the people who matter.
          </p>
        </div>
      </div>

      <div className="mt-12 w-full">
        <SampleFlipbook />
      </div>

      <div className="mx-auto mt-14 max-w-5xl px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="flex flex-col overflow-hidden rounded-[1.75rem] bg-white/85 shadow-lg shadow-yearbook-accent/5 ring-1 ring-white/80"
            >
              <FeatureImagePlaceholder feature={feature} />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-base font-semibold text-stone-700">
          And more — PDF export, search signed entries, and graduation profiles.
        </p>
      </div>
    </section>
  );
}
