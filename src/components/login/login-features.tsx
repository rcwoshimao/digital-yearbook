"use client";

import { SampleFlipbook } from "@/components/login/sample-flipbook";

type Feature = {
  title: string;
  description: string;
  videoSrc: string;
  videoAlt: string;
};

const FEATURES: Feature[] = [
  {
    title: "Share modes you control",
    description:
      "Toggle between invite-only and anyone-with-link sharing. Tighten access when you want only close friends, or open the book when you want signing to feel effortless.",
    videoSrc: "/assets/demos/sharemodes.mp4",
    videoAlt: "Switching between two yearbook share modes",
  },
  {
    title: "Freewrite on a signing canvas",
    description:
      "Open a page-sized canvas and write by hand—like signing a tablet in the hallway. Personal strokes and notes feel closer to a real yearbook than typed text alone.",
    videoSrc: "/assets/demos/freewrite.mp4",
    videoAlt: "Freehand drawing and writing on a yearbook page",
  },
  {
    title: "Backgrounds that match your style",
    description:
      "Set the mood with custom background images and colors on each page. Graduation palettes, photos, or clean tones—your book looks like yours, not a template.",
    videoSrc: "/assets/demos/background.mp4",
    videoAlt: "Changing page background image and color",
  },
  {
    title: "Text, photos, and stickers",
    description:
      "Layer messages, images, and stickers anywhere on the page. Mix typography and visuals so every signature carries the inside jokes and memories you want to keep.",
    videoSrc: "/assets/demos/text_image_sticker.mp4",
    videoAlt: "Adding text, photos, and stickers to a yearbook page",
  },
];

function scrollToGetStarted(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  const target = document.getElementById("get-started");
  if (!target) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

function FeatureTile({ feature }: { feature: Feature }) {
  return (
    <article className="flex flex-col gap-4">
      <video
        aria-label={feature.videoAlt}
        autoPlay
        className="h-auto w-full"
        loop
        muted
        playsInline
        preload="metadata"
        src={feature.videoSrc}
      />
      <div>
        <h3 className="text-lg font-bold tracking-tight text-yearbook-ink">{feature.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{feature.description}</p>
      </div>
    </article>
  );
}

export function LoginFeatures() {
  return (
    <section className="border-t border-yearbook-ink/10 bg-white/75 py-16 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Your digital yearbook, end to end
          </h2>
          <p className="mt-4 text-lg leading-8 text-stone-700">
            Collect signatures, flip through pages, and share with the people who matter.
          </p>
        </div>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12">
          {FEATURES.map((feature) => (
            <FeatureTile key={feature.title} feature={feature} />
          ))}
        </div>

        <p className="mt-12 text-center text-base font-semibold text-stone-700">
          Plus PDF export, searchable signed entries, and graduation-ready profiles.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Sample yearbook</h2>
          <p className="mt-4 text-lg leading-8 text-stone-700">
            Create an account or sign in to start your journey on collecting memories.
          </p>
        </div>
      </div>

      <div className="mt-8 w-full">
        <SampleFlipbook />
      </div>

      <div className="mx-auto mt-12 max-w-5xl px-6 text-center">
        <button
          className="rounded-full bg-yearbook-accent px-8 py-3.5 text-base font-semibold text-white transition hover:bg-yearbook-ink"
          onClick={scrollToGetStarted}
          type="button"
        >
          Get started
        </button>
      </div>

      <p className="mx-auto mt-10 max-w-5xl px-6 pb-10 text-center text-xs text-stone-600">
        Background image by{" "}
        <a
          className="font-medium text-yearbook-accent underline underline-offset-2 hover:text-yearbook-ink"
          href="https://unsplash.com/@codioful?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
          rel="noopener noreferrer"
          target="_blank"
        >
          Codioful (Formerly Gradienta)
        </a>{" "}
        on{" "}
        <a
          className="font-medium text-yearbook-accent underline underline-offset-2 hover:text-yearbook-ink"
          href="https://unsplash.com/photos/pink-and-white-abstract-painting-KfGJzEOZXAE?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
          rel="noopener noreferrer"
          target="_blank"
        >
          Unsplash
        </a>
      </p>
    </section>
  );
}
