import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL("../src/styles/tokens.css", import.meta.url),
  "utf8",
);
const modes = {
  light: css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1],
  dark: css.match(/\.dark\s*\{([\s\S]*?)\n\}/)?.[1],
};
if (!modes.light || !modes.dark)
  throw new Error("Could not locate light/dark theme tokens.");

function parseTokens(block) {
  return Object.fromEntries(
    [
      ...block.matchAll(
        /--([a-z-]+):\s*oklch\((\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\)/g,
      ),
    ].map(([, name, l, c, h]) => [name, [Number(l), Number(c), Number(h)]]),
  );
}

function toSrgb([lightness, chroma, hue]) {
  const angle = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(angle);
  const b = chroma * Math.sin(angle);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return linear.map((value) => {
    // Clamp to the sRGB gamut before applying the WCAG transfer function.
    const channel = Math.max(0, Math.min(1, value));
    return channel <= 0.0031308
      ? 12.92 * channel
      : 1.055 * channel ** (1 / 2.4) - 0.055;
  });
}

function luminance(color) {
  const linear = toSrgb(color).map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const pairs = [
  ["body text / canvas", "foreground", "background", 4.5],
  ["muted text / canvas", "muted-foreground", "background", 4.5],
  ["primary control text", "primary-foreground", "primary", 4.5],
  ["accent text", "accent-foreground", "accent", 4.5],
  ["destructive control text", "destructive-foreground", "destructive", 4.5],
  ["warning text", "warning-text", "warning-bg", 4.5],
  ["information text", "info-text", "info-bg", 4.5],
  ["success status text", "success-text", "success-bg", 4.5],
  ["quality: good label", "quality-good-text", "quality-good-bg", 4.5],
  [
    "quality: needs-work label",
    "quality-needs-work-text",
    "quality-needs-work-bg",
    4.5,
  ],
  ["input boundary / canvas", "input", "background", 3],
  ["focus ring / canvas", "ring", "background", 3],
];

let failed = false;
for (const [mode, block] of Object.entries(modes)) {
  const tokens = parseTokens(block);
  console.log(`\n${mode.toUpperCase()} THEME`);
  for (const [label, foreground, background, minimum] of pairs) {
    if (!tokens[foreground] || !tokens[background]) {
      failed = true;
      console.error(`  FAIL ${label}: missing token`);
      continue;
    }
    const ratio = contrastRatio(tokens[foreground], tokens[background]);
    const pass = ratio >= minimum;
    console.log(
      `  ${pass ? "PASS" : "FAIL"} ${label}: ${ratio.toFixed(2)}:1 (minimum ${minimum}:1)`,
    );
    if (!pass) failed = true;
  }
}
if (failed) process.exitCode = 1;
