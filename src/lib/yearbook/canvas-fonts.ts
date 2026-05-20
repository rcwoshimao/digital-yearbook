import {
  Alegreya_SC,
  Bodoni_Moda,
  Bungee_Hairline,
  Bungee_Shade,
  Bungee_Spice,
  Caveat,
  Croissant_One,
  DM_Sans,
  Estonia,
  Faster_One,
  Felipa,
  Fleur_De_Leah,
  Honk,
  Jim_Nightshade,
  Kalnia,
  Lavishly_Yours,
  Libre_Barcode_128_Text,
  Megrim,
  Merriweather,
  Monoton,
  Nabla,
  Patrick_Hand,
  Plaster,
  Press_Start_2P,
  Rampart_One,
  Ribeye_Marrow,
  Rubik_Glitch,
  Sacramento,
  Snowburst_One,
  Tourney,
  UnifrakturMaguntia,
  Unkempt,
  Yarndings_20,
} from "next/font/google";

const canvasFontDMSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-clean-sans",
});

const canvasFontCaveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwritten",
});

const canvasFontPatrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-patrick-hand",
});

const canvasFontLavishlyYours = Lavishly_Yours({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lavishly-yours",
});

const canvasFontFleurDeLeah = Fleur_De_Leah({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fleur-de-leah",
});

const canvasFontSacramento = Sacramento({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sacramento",
});

const canvasFontEstonia = Estonia({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-estonia",
});

const canvasFontUnkempt = Unkempt({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-unkempt",
});

const canvasFontRampartOne = Rampart_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rampart-one",
});

const canvasFontRibeyeMarrow = Ribeye_Marrow({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ribeye-marrow",
});

const canvasFontSnowburstOne = Snowburst_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-snowburst-one",
});

const canvasFontHonk = Honk({
  subsets: ["latin"],
  weight: "400",
  adjustFontFallback: false,
  variable: "--font-honk",
});

const canvasFontNabla = Nabla({
  subsets: ["latin"],
  weight: "400",
  adjustFontFallback: false,
  variable: "--font-nabla",
});

const canvasFontRubikGlitch = Rubik_Glitch({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rubik-glitch",
});

const canvasFontFasterOne = Faster_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-faster-one",
});

const canvasFontKalnia = Kalnia({
  subsets: ["latin"],
  adjustFontFallback: false,
  variable: "--font-kalnia-glaze",
});

const canvasFontBungeeSpice = Bungee_Spice({
  subsets: ["latin"],
  weight: "400",
  adjustFontFallback: false,
  variable: "--font-bungee-spice",
});

const canvasFontPressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start-2p",
});

const canvasFontBungeeShade = Bungee_Shade({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bungee-shade",
});

const canvasFontBungeeHairline = Bungee_Hairline({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bungee-hairline",
});

const canvasFontMegrim = Megrim({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-megrim",
});

const canvasFontCroissantOne = Croissant_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-croissant-one",
});

const canvasFontPlaster = Plaster({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-plaster",
});

const canvasFontMonoton = Monoton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-monoton",
});

const canvasFontUnifrakturMaguntia = UnifrakturMaguntia({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-unifrakturmaguntia",
});

const canvasFontJimNightshade = Jim_Nightshade({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jim-nightshade",
});

const canvasFontYarndings20 = Yarndings_20({
  subsets: ["latin"],
  weight: "400",
  adjustFontFallback: false,
  variable: "--font-yarndings-20",
});

const canvasFontLibreBarcode128Text = Libre_Barcode_128_Text({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-libre-barcode-128-text",
});

const canvasFontTourney = Tourney({
  subsets: ["latin"],
  variable: "--font-tourney",
});

const canvasFontBodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  adjustFontFallback: false,
  variable: "--font-bodoni-moda-sc",
});

const canvasFontFelipa = Felipa({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-felipa",
});

const canvasFontAlegreyaSC = Alegreya_SC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-alegreya-sc",
});

const canvasFontMerriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
});

/** Fonts from docs/fonts.md not yet in next/font — loaded via Google Fonts CSS. */
export const EXTERNAL_FONT_FAMILIES = [
  "Matemasie",
  "Libertinus Keyboard",
  "Bitcount Single",
  "Bitcount",
  "Coral Pixels",
  "Playwrite England SemiJoined Guides",
] as const;

export const canvasFontGoogleStylesheetHref =
  "https://fonts.googleapis.com/css2?family=Matemasie&family=Libertinus+Keyboard&family=Bitcount+Single&family=Bitcount&family=Coral+Pixels&family=Playwrite+England+SemiJoined+Guides&display=swap";

export const canvasFontLoaders = [
  canvasFontDMSans,
  canvasFontCaveat,
  canvasFontPatrickHand,
  canvasFontLavishlyYours,
  canvasFontFleurDeLeah,
  canvasFontSacramento,
  canvasFontEstonia,
  canvasFontUnkempt,
  canvasFontRampartOne,
  canvasFontRibeyeMarrow,
  canvasFontSnowburstOne,
  canvasFontHonk,
  canvasFontNabla,
  canvasFontRubikGlitch,
  canvasFontFasterOne,
  canvasFontKalnia,
  canvasFontBungeeSpice,
  canvasFontPressStart2P,
  canvasFontBungeeShade,
  canvasFontBungeeHairline,
  canvasFontMegrim,
  canvasFontCroissantOne,
  canvasFontPlaster,
  canvasFontMonoton,
  canvasFontUnifrakturMaguntia,
  canvasFontJimNightshade,
  canvasFontYarndings20,
  canvasFontLibreBarcode128Text,
  canvasFontTourney,
  canvasFontBodoniModa,
  canvasFontFelipa,
  canvasFontAlegreyaSC,
  canvasFontMerriweather,
] as const;

export const canvasFontVariables = canvasFontLoaders.map((font) => font.variable).join(" ");

function fontStack(loader: (typeof canvasFontLoaders)[number], fallbacks: string): string {
  return `${loader.style.fontFamily}, ${fallbacks}`;
}

export type CanvasFontOption = {
  label: string;
  value: string;
  keywords: string[];
};

export const CANVAS_FONT_OPTIONS: CanvasFontOption[] = [
  { label: "Classic Serif", value: "Georgia, 'Times New Roman', serif", keywords: ["georgia","times new roman"] },
  { label: "Arial", value: "Arial, Helvetica, sans-serif", keywords: ["arial","helvetica"] },
  { label: "Typewriter", value: "'Courier New', Courier, monospace", keywords: ["courier","mono"] },
  {
    label: "Clean Sans",
    value: fontStack(canvasFontDMSans, "Arial, Helvetica, sans-serif"),
    keywords: ["clean sans","clean-sans"],
  },
  {
    label: "Handwritten",
    value: fontStack(canvasFontCaveat, "cursive"),
    keywords: ["handwritten","handwritten"],
  },
  {
    label: "Patrick Hand",
    value: fontStack(canvasFontPatrickHand, "cursive"),
    keywords: ["patrick hand","patrick-hand"],
  },
  {
    label: "Lavishly Yours",
    value: fontStack(canvasFontLavishlyYours, "cursive"),
    keywords: ["lavishly yours","lavishly-yours"],
  },
  {
    label: "Fleur De Leah",
    value: fontStack(canvasFontFleurDeLeah, "cursive"),
    keywords: ["fleur de leah","fleur-de-leah"],
  },
  {
    label: "Sacramento",
    value: fontStack(canvasFontSacramento, "cursive"),
    keywords: ["sacramento","sacramento"],
  },
  {
    label: "Estonia",
    value: fontStack(canvasFontEstonia, "serif"),
    keywords: ["estonia","estonia"],
  },
  {
    label: "Unkempt",
    value: fontStack(canvasFontUnkempt, "serif"),
    keywords: ["unkempt","unkempt"],
  },
  {
    label: "Rampart One",
    value: fontStack(canvasFontRampartOne, "sans-serif"),
    keywords: ["rampart one","rampart-one"],
  },
  {
    label: "Ribeye Marrow",
    value: fontStack(canvasFontRibeyeMarrow, "sans-serif"),
    keywords: ["ribeye marrow","ribeye-marrow"],
  },
  {
    label: "Snowburst One",
    value: fontStack(canvasFontSnowburstOne, "serif"),
    keywords: ["snowburst one","snowburst-one"],
  },
  {
    label: "Honk",
    value: fontStack(canvasFontHonk, "sans-serif"),
    keywords: ["honk","honk"],
  },
  {
    label: "Nabla",
    value: fontStack(canvasFontNabla, "sans-serif"),
    keywords: ["nabla","nabla"],
  },
  {
    label: "Rubik Glitch",
    value: fontStack(canvasFontRubikGlitch, "sans-serif"),
    keywords: ["rubik glitch","rubik-glitch"],
  },
  {
    label: "Faster One",
    value: fontStack(canvasFontFasterOne, "serif"),
    keywords: ["faster one","faster-one"],
  },
  {
    label: "Kalnia Glaze",
    value: fontStack(canvasFontKalnia, "serif"),
    keywords: ["kalnia glaze","kalnia-glaze","kalnia glaze","kalnia"],
  },
  {
    label: "Bungee Spice",
    value: fontStack(canvasFontBungeeSpice, "sans-serif"),
    keywords: ["bungee spice","bungee-spice"],
  },
  {
    label: "Press Start 2P",
    value: fontStack(canvasFontPressStart2P, "monospace"),
    keywords: ["press start 2p","press-start-2p"],
  },
  {
    label: "Bungee Shade",
    value: fontStack(canvasFontBungeeShade, "sans-serif"),
    keywords: ["bungee shade","bungee-shade"],
  },
  {
    label: "Bungee Hairline",
    value: fontStack(canvasFontBungeeHairline, "sans-serif"),
    keywords: ["bungee hairline","bungee-hairline"],
  },
  {
    label: "Megrim",
    value: fontStack(canvasFontMegrim, "sans-serif"),
    keywords: ["megrim","megrim"],
  },
  {
    label: "Croissant One",
    value: fontStack(canvasFontCroissantOne, "cursive"),
    keywords: ["croissant one","croissant-one"],
  },
  {
    label: "Plaster",
    value: fontStack(canvasFontPlaster, "cursive"),
    keywords: ["plaster","plaster"],
  },
  {
    label: "Monoton",
    value: fontStack(canvasFontMonoton, "sans-serif"),
    keywords: ["monoton","monoton"],
  },
  {
    label: "UnifrakturMaguntia",
    value: fontStack(canvasFontUnifrakturMaguntia, "serif"),
    keywords: ["unifrakturmaguntia","unifrakturmaguntia"],
  },
  {
    label: "Jim Nightshade",
    value: fontStack(canvasFontJimNightshade, "cursive"),
    keywords: ["jim nightshade","jim-nightshade"],
  },
  {
    label: "Yarndings 20",
    value: fontStack(canvasFontYarndings20, "cursive"),
    keywords: ["yarndings 20","yarndings-20"],
  },
  {
    label: "Libre Barcode 128 Text",
    value: fontStack(canvasFontLibreBarcode128Text, "monospace"),
    keywords: ["libre barcode 128 text","libre-barcode-128-text"],
  },
  {
    label: "Tourney",
    value: fontStack(canvasFontTourney, "sans-serif"),
    keywords: ["tourney","tourney"],
  },
  {
    label: "Bodoni Moda SC",
    value: fontStack(canvasFontBodoniModa, "serif"),
    keywords: ["bodoni moda sc","bodoni-moda-sc","bodoni moda sc","bodoni moda"],
  },
  {
    label: "Felipa",
    value: fontStack(canvasFontFelipa, "cursive"),
    keywords: ["felipa","felipa"],
  },
  {
    label: "Alegreya SC",
    value: fontStack(canvasFontAlegreyaSC, "serif"),
    keywords: ["alegreya sc","alegreya-sc"],
  },
  {
    label: "Merriweather",
    value: fontStack(canvasFontMerriweather, "serif"),
    keywords: ["merriweather","merriweather"],
  },
  {
    label: "Matemasie",
    value: "Matemasie, serif",
    keywords: ["matemasie","matemasie"],
  },
  {
    label: "Libertinus Keyboard",
    value: "Libertinus Keyboard, serif",
    keywords: ["libertinus keyboard","libertinus-keyboard"],
  },
  {
    label: "Bitcount Single",
    value: "Bitcount Single, sans-serif",
    keywords: ["bitcount single","bitcount-single"],
  },
  {
    label: "Bitcount",
    value: "Bitcount, sans-serif",
    keywords: ["bitcount","bitcount"],
  },
  {
    label: "Coral Pixels",
    value: "Coral Pixels, monospace",
    keywords: ["coral pixels","coral-pixels"],
  },
  {
    label: "Playwrite England SemiJoined Guides",
    value: "Playwrite England SemiJoined Guides, cursive",
    keywords: ["playwrite england semijoined guides","playwrite-england-semijoined-guides"],
  },
];

export { canvasFontCaveat };

export async function preloadCanvasFonts(): Promise<void> {
  if (typeof document === "undefined") return;

  if (EXTERNAL_FONT_FAMILIES.length > 0) {
    await document.fonts.ready;
  }

  const loads = canvasFontLoaders.map((font) =>
    document.fonts.load(`400 24px ${font.style.fontFamily}`).catch(() => undefined),
  );

  for (const family of EXTERNAL_FONT_FAMILIES) {
    loads.push(document.fonts.load(`400 24px "${family}"`).catch(() => undefined));
  }

  await Promise.all(loads);
}

export function normalizeCanvasFontFamily(value: string | undefined) {
  if (!value) return CANVAS_FONT_OPTIONS[0].value;
  const lowered = value.toLowerCase();
  for (const option of CANVAS_FONT_OPTIONS) {
    if (option.keywords.some((keyword) => lowered.includes(keyword))) {
      return option.value;
    }
  }
  return value;
}
