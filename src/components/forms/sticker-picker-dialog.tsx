"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STICKER_PACKS } from "@/lib/yearbook/sticker-catalog";

type StickerPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSticker: (src: string) => void;
};

export function StickerPickerDialog({
  open,
  onOpenChange,
  onSelectSticker,
}: StickerPickerDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(92vw,42rem)]">
        <DialogHeader>
          <DialogTitle>Stickers</DialogTitle>
          <DialogDescription>
            Tap a sticker to add it to your page. Credits are shown per pack — nothing is added to your
            layout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pr-1">
          {STICKER_PACKS.map((pack) => (
            <section key={pack.slug}>
              <h3 className="text-sm font-bold text-yearbook-ink">{pack.title}</h3>
              <p className="mt-0.5 text-xs text-stone-500">
                <a
                  className="underline decoration-stone-300 underline-offset-2 hover:text-stone-700"
                  href={pack.creditUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {pack.attribution}
                </a>
              </p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {pack.stickers.map((sticker) => (
                  <li key={sticker.id}>
                    <button
                      className="flex h-28 w-28 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-2 transition hover:border-yearbook-accent hover:bg-white"
                      onClick={() => {
                        onSelectSticker(sticker.src);
                        onOpenChange(false);
                      }}
                      title={sticker.alt}
                      type="button"
                    >
                      <Image
                        alt={sticker.alt}
                        className="max-h-full max-w-full object-contain"
                        height={96}
                        src={sticker.src}
                        unoptimized
                        width={96}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
