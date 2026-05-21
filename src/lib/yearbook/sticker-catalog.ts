/**
 * Sticker library: one Flaticon attribution pack per folder under `/public/assets/stickers/`.
 * See `docs/Sticker attributions.md` and STICKER_ATTRIBUTION_MAP for folder mapping.
 */

export type StickerItem = {
  id: string;
  src: string;
  alt: string;
};

export type StickerPack = {
  slug: string;
  title: string;
  attribution: string;
  creditUrl: string;
  stickers: StickerItem[];
};

const STICKER_BASE = "/assets/stickers";

export function stickerSrc(slug: string, filename: string): string {
  return `${STICKER_BASE}/${slug}/${encodeURIComponent(filename)}`;
}

function stickerAlt(filename: string): string {
  return filename
    .replace(/\.png$/i, "")
    .replace(/\((\d+)\)/g, " $1")
    .replace(/-/g, " ");
}

/** One-to-one map: attribution pack slug → folder name (same slug) and Flaticon credit. */
export const STICKER_ATTRIBUTION_MAP: Record<
  string,
  { title: string; attribution: string; creditUrl: string; folder: string; legacyFolders: string }
> = {
  "university": {
    title: "University",
    attribution: "University stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/university",
    folder: "university",
    legacyFolders: "university/",
  },
  "best-friend": {
    title: "Best friend",
    attribution: "Best friend stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/best-friend",
    folder: "best-friend",
    legacyFolders: "friendship/ → best-friend/",
  },
  "flowers": {
    title: "Flowers",
    attribution: "Flowers stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/flowers",
    folder: "flowers",
    legacyFolders: "spring2/ → flowers/",
  },
  "night-party": {
    title: "Night party",
    attribution: "Night party stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/night-party",
    folder: "night-party",
    legacyFolders: "night-party/ (unchanged)",
  },
  "pinata": {
    title: "Piñata",
    attribution: "Piñata stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/pinata",
    folder: "pinata",
    legacyFolders: "birthday/ → pinata/",
  },
  "school": {
    title: "School",
    attribution: "School stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/school",
    folder: "school",
    legacyFolders: "education/ + graduation/ → school/",
  },
  "nature": {
    title: "Nature",
    attribution: "Nature stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/nature",
    folder: "nature",
    legacyFolders: "nature/ (unchanged)",
  },
  "flower": {
    title: "Flower",
    attribution: "Flower stickers created by Anna Kuba — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/flower",
    folder: "flower",
    legacyFolders: "spring/ → flower/",
  },
  "gift": {
    title: "Gift",
    attribution: "Gift stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/gift",
    folder: "gift",
    legacyFolders: "gift/ (unchanged)",
  },
  "dessert": {
    title: "Dessert",
    attribution: "Dessert stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/dessert",
    folder: "dessert",
    legacyFolders: "dessert/ (unchanged)",
  },
  "solar-system": {
    title: "Solar system",
    attribution: "Solar system stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/solar-system",
    folder: "solar-system",
    legacyFolders: "solar system/ + space assets from university/ → solar-system/",
  },
  "oops": {
    title: "Oops",
    attribution: "Oops stickers created by Prosymbols Premium — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/oops",
    folder: "oops",
    legacyFolders: "Prosymbols Premium/ → oops/",
  },
  "shiba-inu": {
    title: "Shiba inu",
    attribution: "Shiba inu stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/shiba-inu",
    folder: "shiba-inu",
    legacyFolders: "shiba-inu/ (unchanged)",
  },
  "unicorn": {
    title: "Unicorn",
    attribution: "Unicorn stickers created by Stickers — Flaticon",
    creditUrl: "https://www.flaticon.com/free-stickers/unicorn",
    folder: "unicorn",
    legacyFolders: "loose unicorn*.png + unicorn/ → unicorn/",
  },
};

const STICKER_PACK_FILES: {
  slug: string;
  title: string;
  attribution: string;
  creditUrl: string;
  files: string[];
}[] = [
  {
    "slug": "university",
    "title": "University",
    "attribution": "University stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/university",
    "files": [
      "university (0).png",
      "university (1).png",
      "university (2).png",
      "university (3).png",
      "university (4).png",
      "university (5).png",
      "university (6).png",
      "university (7).png"
    ]
  },
  {
    "slug": "best-friend",
    "title": "Best friend",
    "attribution": "Best friend stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/best-friend",
    "files": [
      "friendship-day (1).png",
      "friendship-day (2).png",
      "friendship-day.png"
    ]
  },
  {
    "slug": "flowers",
    "title": "Flowers",
    "attribution": "Flowers stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/flowers",
    "files": [
      "birdhouse.png",
      "cat-lover.png",
      "cherry.png",
      "envelope.png",
      "love-letter.png",
      "sun.png",
      "watering-can.png",
      "wreath.png"
    ]
  },
  {
    "slug": "night-party",
    "title": "Night party",
    "attribution": "Night party stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/night-party",
    "files": [
      "night-party (1).png",
      "night-party (3).png",
      "night-party (4).png",
      "night-party (5).png",
      "night-party (6).png",
      "night-party.png"
    ]
  },
  {
    "slug": "pinata",
    "title": "Piñata",
    "attribution": "Piñata stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/pinata",
    "files": [
      "balloons.png",
      "birthday.png",
      "bunting.png",
      "confetti.png",
      "gift.png",
      "muffin.png",
      "pinata.png"
    ]
  },
  {
    "slug": "school",
    "title": "School",
    "attribution": "School stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/school",
    "files": [
      "award.png",
      "books.png",
      "graduation (0).png",
      "graduation (1).png",
      "graduation (16).png",
      "graduation (17).png",
      "graduation (18).png",
      "graduation (19).png",
      "graduation (2).png",
      "graduation (20).png",
      "graduation (3).png",
      "graduation (4).png",
      "graduation (5).png",
      "graduation (6).png",
      "graduation (7).png",
      "graduation (8).png",
      "graduation (9).png",
      "graduation(10).png",
      "graduation(11).png",
      "graduation(12).png",
      "graduation(13).png",
      "graduation(14).png",
      "graduation(15).png",
      "maths.png",
      "online-class.png",
      "to-do-list.png"
    ]
  },
  {
    "slug": "nature",
    "title": "Nature",
    "attribution": "Nature stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/nature",
    "files": [
      "butterfly.png",
      "lemon.png",
      "nature (1).png",
      "nature.png",
      "sparrow.png"
    ]
  },
  {
    "slug": "flower",
    "title": "Flower",
    "attribution": "Flower stickers created by Anna Kuba — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/flower",
    "files": [
      "cat (1).png",
      "flower.png",
      "flowers.png"
    ]
  },
  {
    "slug": "gift",
    "title": "Gift",
    "attribution": "Gift stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/gift",
    "files": [
      "gift (1).png",
      "gift (2).png",
      "gift (3).png",
      "gift (4).png",
      "gift (5).png",
      "gift (6).png",
      "gift.png"
    ]
  },
  {
    "slug": "dessert",
    "title": "Dessert",
    "attribution": "Dessert stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/dessert",
    "files": [
      "bread.png",
      "cake.png",
      "cupcake.png",
      "dessert (1).png",
      "dessert.png"
    ]
  },
  {
    "slug": "solar-system",
    "title": "Solar system",
    "attribution": "Solar system stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/solar-system",
    "files": [
      "alien (1).png",
      "alien.png",
      "planet.png",
      "rocket-ship (1).png",
      "rocket-ship.png"
    ]
  },
  {
    "slug": "oops",
    "title": "Oops",
    "attribution": "Oops stickers created by Prosymbols Premium — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/oops",
    "files": [
      "bam.png",
      "boom.png",
      "comic.png",
      "crush.png",
      "ohh.png",
      "oops.png",
      "power.png",
      "smash.png",
      "snap.png",
      "yes.png"
    ]
  },
  {
    "slug": "shiba-inu",
    "title": "Shiba inu",
    "attribution": "Shiba inu stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/shiba-inu",
    "files": [
      "shiba-inu (1).png",
      "shiba-inu (2).png",
      "shiba-inu (3).png",
      "shiba-inu (4).png",
      "shiba-inu (5).png",
      "shiba-inu (6).png",
      "shiba-inu.png"
    ]
  },
  {
    "slug": "unicorn",
    "title": "Unicorn",
    "attribution": "Unicorn stickers created by Stickers — Flaticon",
    "creditUrl": "https://www.flaticon.com/free-stickers/unicorn",
    "files": [
      "unicorn (1).png",
      "unicorn (2).png",
      "unicorn (3).png",
      "unicorn (4).png",
      "unicorn.png"
    ]
  }
];

export const STICKER_PACKS: StickerPack[] = STICKER_PACK_FILES.map((pack) => ({
  slug: pack.slug,
  title: pack.title,
  attribution: pack.attribution,
  creditUrl: pack.creditUrl,
  stickers: pack.files.map((filename) => ({
    id: `${pack.slug}/${filename}`,
    src: stickerSrc(pack.slug, filename),
    alt: stickerAlt(filename),
  })),
}));
