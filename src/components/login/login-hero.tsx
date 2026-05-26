"use client";

import { motion } from "framer-motion";
import { AuthForm } from "@/components/forms/auth-form";
import { AppBrand } from "@/components/layout/app-brand";
import { CreatorSocialIconLinks } from "@/components/layout/creator-social-links";
import { SampleMarquee } from "@/components/login/sample-marquee";

type LoginHeroProps = {
  isConfigured: boolean;
};

function scrollToFeatures(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  const features = document.getElementById("features");
  if (!features) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  features.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

export function LoginHero({ isConfigured }: LoginHeroProps) {
  return (
    <section className="relative min-h-screen px-6 py-10 sm:py-12" id="get-started">
      <CreatorSocialIconLinks className="absolute right-6 top-6 z-20 sm:right-10 sm:top-10" />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center gap-10 lg:flex-row lg:items-center lg:gap-12">
        <div className="w-full shrink-0 lg:max-w-md lg:flex-1">
          <AppBrand
            className="inline-flex items-center gap-8 text-3xl font-black tracking-tight sm:text-4xl"
            href="/"
            iconSize={100}
            iconSrc="/assets/icon_big.png"
          />

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            A warm place to collect the notes you will keep.
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-700">
            Sign in with Google to read your yearbook, invite friends, and write permanent
            graduation memories.
          </p>

          <div className="mt-6 w-full">
            <AuthForm isConfigured={isConfigured} />
          </div>
        </div>

        <div className="w-full min-w-0 shrink-0 lg:flex-1 lg:max-w-[min(100%,32rem)]">
          <SampleMarquee />
        </div>
      </div>

      <a
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-center transition-colors hover:text-yearbook-accent sm:bottom-10"
        href="#features"
        onClick={scrollToFeatures}
      >
        <span className="text-xl font-bold tracking-tight text-stone-800 sm:text-2xl">
          See what you can do
        </span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          aria-hidden
          className="text-3xl font-semibold text-yearbook-accent sm:text-4xl"
          transition={{
            duration: 1.4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          ↓
        </motion.span>
      </a>
    </section>
  );
}
