import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const nextPackageJson = path.join(root, "node_modules/next/package.json");
const fontDataPath = path.join(
  path.dirname(nextPackageJson),
  "dist/compiled/@next/font/dist/google/font-data.json",
);
const data = JSON.parse(fs.readFileSync(fontDataPath, "utf8"));

const DOC_FONTS = fs
  .readFileSync(path.join(root, "docs/fonts.md"), "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const SUBSTITUTES = {
  "Kalnia Glaze": "Kalnia",
  "Bodoni Moda SC": "Bodoni Moda",
};

const EXTERNAL_ONLY = new Set([
  "Matemasie",
  "Libertinus Keyboard",
  "Bitcount Single",
  "Bitcount",
  "Coral Pixels",
  "Playwrite England SemiJoined Guides",
]);

const SYSTEM_OPTIONS = [
  {
    label: "Classic Serif",
    value: "Georgia, 'Times New Roman', serif",
    keywords: ["georgia", "times new roman"],
  },
  {
    label: "Arial",
    value: "Arial, Helvetica, sans-serif",
    keywords: ["arial", "helvetica"],
  },
  {
    label: "Typewriter",
    value: "'Courier New', Courier, monospace",
    keywords: ["courier", "mono"],
  },
];

const UTILITY = [
  {
    label: "Clean Sans",
    importName: "DM_Sans",
    resolved: "DM Sans",
    fallbacks: "Arial, Helvetica, sans-serif",
  },
  {
    label: "Handwritten",
    importName: "Caveat",
    resolved: "Caveat",
    fallbacks: "cursive",
  },
  {
    label: "Patrick Hand",
    importName: "Patrick_Hand",
    resolved: "Patrick Hand",
    fallbacks: "cursive",
    weight: "400",
  },
];

function toImportName(name) {
  return name.replace(/ /g, "_");
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function varId(importName) {
  return `canvasFont${importName.replace(/_/g, "")}`;
}

function fallbacksFor(label) {
  const lower = label.toLowerCase();
  if (lower.includes("barcode") || lower.includes("press start") || lower.includes("pixel")) {
    return "monospace";
  }
  if (
    lower.includes("bungee") ||
    lower.includes("monoton") ||
    lower.includes("megrim") ||
    lower.includes("ribeye") ||
    lower.includes("honk") ||
    lower.includes("nabla") ||
    lower.includes("rampart") ||
    lower.includes("bitcount") ||
    lower.includes("glitch") ||
    lower.includes("tourney")
  ) {
    return "sans-serif";
  }
  if (
    lower.includes("yours") ||
    lower.includes("leah") ||
    lower.includes("sacramento") ||
    lower.includes("nightshade") ||
    lower.includes("croissant") ||
    lower.includes("plaster") ||
    lower.includes("felipa") ||
    lower.includes("yarndings") ||
    lower.includes("playwrite")
  ) {
    return "cursive";
  }
  return "serif";
}

const docNext = [];
const externalLabels = [];

for (const label of DOC_FONTS) {
  if (EXTERNAL_ONLY.has(label)) {
    externalLabels.push(label);
    continue;
  }
  const resolved = SUBSTITUTES[label] || label;
  if (!data[resolved]) {
    externalLabels.push(label);
    continue;
  }
  docNext.push({
    label,
    importName: toImportName(resolved),
    resolved,
    fallbacks: fallbacksFor(label),
  });
}

const allNext = [...UTILITY, ...docNext];
const importNames = [...new Set(allNext.map((f) => f.importName))].sort();

const NO_FALLBACK_ADJUST = new Set([
  "Honk",
  "Kalnia",
  "Bungee_Spice",
  "Yarndings_20",
  "Bodoni_Moda",
  "Nabla",
]);

function buildFontConfig(f) {
  const meta = data[f.resolved];
  const lines = ['  subsets: ["latin"],'];

  if (f.weight) {
    lines.push(`  weight: "${f.weight}",`);
  } else if (meta) {
    const weights = meta.weights.filter((w) => w !== "variable");
    if (weights.length === 1) {
      lines.push(`  weight: "${weights[0]}",`);
    } else if (
      f.importName === "Merriweather" ||
      f.importName === "Alegreya_SC" ||
      (weights.includes("400") && weights.includes("700") && weights.length === 2)
    ) {
      lines.push(`  weight: ["400", "700"],`);
    }
  }

  if (NO_FALLBACK_ADJUST.has(f.importName)) {
    lines.push("  adjustFontFallback: false,");
  }

  lines.push(`  variable: "--font-${slug(f.label)}",`);
  return lines.join("\n");
}

let out = `import {\n  ${importNames.join(",\n  ")},\n} from "next/font/google";\n\n`;

for (const f of allNext) {
  const id = varId(f.importName);
  out += `const ${id} = ${f.importName}({\n${buildFontConfig(f)}\n});\n\n`;
}

out += `/** Fonts from docs/fonts.md not yet in next/font — loaded via Google Fonts CSS. */\n`;
out += `export const EXTERNAL_FONT_FAMILIES = [\n`;
for (const label of externalLabels) {
  out += `  "${label}",\n`;
}
out += `] as const;\n\n`;

const familyParams = externalLabels
  .map((label) => `family=${label.replace(/ /g, "+")}`)
  .join("&");
out += `export const canvasFontGoogleStylesheetHref =\n  "https://fonts.googleapis.com/css2?${familyParams}&display=swap";\n\n`;

out += `export const canvasFontLoaders = [\n`;
for (const f of allNext) {
  out += `  ${varId(f.importName)},\n`;
}
out += `] as const;\n\n`;

out += `export const canvasFontVariables = canvasFontLoaders.map((font) => font.variable).join(" ");\n\n`;

out += `function fontStack(loader: (typeof canvasFontLoaders)[number], fallbacks: string): string {\n`;
out += `  return \`\${loader.style.fontFamily}, \${fallbacks}\`;\n}\n\n`;

out += `export type CanvasFontOption = {\n  label: string;\n  value: string;\n  keywords: string[];\n};\n\n`;

out += `export const CANVAS_FONT_OPTIONS: CanvasFontOption[] = [\n`;
for (const opt of SYSTEM_OPTIONS) {
  out += `  { label: "${opt.label}", value: "${opt.value}", keywords: ${JSON.stringify(opt.keywords)} },\n`;
}
for (const f of allNext) {
  const id = varId(f.importName);
  const keywords = [f.label.toLowerCase(), slug(f.label)];
  if (f.label === "Kalnia Glaze") keywords.push("kalnia glaze", "kalnia");
  if (f.label === "Bodoni Moda SC") keywords.push("bodoni moda sc", "bodoni moda");
  out += `  {\n    label: "${f.label}",\n    value: fontStack(${id}, "${f.fallbacks}"),\n    keywords: ${JSON.stringify(keywords)},\n  },\n`;
}
for (const label of externalLabels) {
  const fb = fallbacksFor(label);
  out += `  {\n    label: "${label}",\n    value: "${label}, ${fb}",\n    keywords: ${JSON.stringify([label.toLowerCase(), slug(label)])},\n  },\n`;
}
out += `];\n\n`;

out += `export { canvasFontCaveat };\n\n`;

out += `export async function preloadCanvasFonts(): Promise<void> {\n`;
out += `  if (typeof document === "undefined") return;\n\n`;
out += `  if (EXTERNAL_FONT_FAMILIES.length > 0) {\n`;
out += `    await document.fonts.ready;\n`;
out += `  }\n\n`;
out += `  const loads = canvasFontLoaders.map((font) =>\n`;
out += `    document.fonts.load(\`400 24px \${font.style.fontFamily}\`).catch(() => undefined),\n`;
out += `  );\n\n`;
out += `  for (const family of EXTERNAL_FONT_FAMILIES) {\n`;
out += `    loads.push(document.fonts.load(\`400 24px "\${family}"\`).catch(() => undefined));\n`;
out += `  }\n\n`;
out += `  await Promise.all(loads);\n`;
out += `}\n\n`;

out += `export function normalizeCanvasFontFamily(value: string | undefined) {\n`;
out += `  if (!value) return CANVAS_FONT_OPTIONS[0].value;\n`;
out += `  const lowered = value.toLowerCase();\n`;
out += `  for (const option of CANVAS_FONT_OPTIONS) {\n`;
out += `    if (option.keywords.some((keyword) => lowered.includes(keyword))) {\n`;
out += `      return option.value;\n`;
out += `    }\n`;
out += `  }\n`;
out += `  return value;\n`;
out += `}\n`;

fs.writeFileSync(path.join(root, "src/lib/yearbook/canvas-fonts.ts"), out);
console.log(`Wrote canvas-fonts.ts (${allNext.length} next fonts, ${externalLabels.length} external)`);
