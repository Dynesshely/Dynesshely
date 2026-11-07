/**
 * Design tokens for the composed status panel.
 *
 * Two variants are produced because an SVG used through <img> cannot respond to
 * `prefers-color-scheme`; the README picks a variant with <picture> instead.
 */

// Single quotes inside: this string is interpolated into double-quoted SVG
// attributes, so it must not contain a double quote.
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";

/** Accent pair reused from the capsule-render banners so the page feels coherent. */
export const ACCENT = ["#00c6ff", "#0072ff"];

export const LAYOUT = {
  width: 800,
  margin: 16,
  gap: 12,
  padding: 14,
  radius: 14,
  titleHeight: 30,
  // rows: top banner row, then two rows of two panels
  panels: {
    heatmap: { x: 16, y: 16, w: 768, h: 156 },
    stats: { x: 16, y: 184, w: 378, h: 166 },
    streak: { x: 406, y: 184, w: 378, h: 166 },
    wakatime: { x: 16, y: 362, w: 378, h: 148 },
    toplangs: { x: 406, y: 362, w: 378, h: 148 },
  },
  height: 362 + 148 + 16,
};

export const THEMES = {
  light: {
    variant: "light",
    font: FONT,
    panelFill: "rgba(15, 23, 42, 0.035)",
    panelStroke: "rgba(15, 23, 42, 0.10)",
    title: "#57606a",
    text: "#24292f",
    muted: "#6e7781",
    accent: ACCENT[1],
    accentSoft: "rgba(0, 114, 255, 0.12)",
    heat: ["#eef2f8", "#b9d9ff", "#6fb2ff", "#2f86ff", "#0072ff"],
    heatEmpty: "rgba(15, 23, 42, 0.08)",
    // render options handed to the vendored github-readme-stats cards
    card: {
      theme: "transparent",
      bg_color: "00000000",
      hide_border: true,
      hide_title: true,
      card_width: 495,
      disable_animations: true,
      border_radius: 0,
      title_color: "#24292f",
      text_color: "#57606a",
      icon_color: "#0072ff",
      text_bold: true,
    },
  },
  dark: {
    variant: "dark",
    font: FONT,
    panelFill: "rgba(255, 255, 255, 0.05)",
    panelStroke: "rgba(255, 255, 255, 0.10)",
    title: "#8b949e",
    text: "#c9d1d9",
    muted: "#8b949e",
    accent: ACCENT[0],
    accentSoft: "rgba(0, 198, 255, 0.14)",
    heat: ["#161b22", "#123a5c", "#0d5c94", "#0a82c4", "#00c6ff"],
    heatEmpty: "rgba(255, 255, 255, 0.08)",
    card: {
      theme: "transparent",
      bg_color: "00000000",
      hide_border: true,
      hide_title: true,
      card_width: 495,
      disable_animations: true,
      border_radius: 0,
      title_color: "#d0d7de",
      text_color: "#b1bac4",
      icon_color: "#00c6ff",
      text_bold: true,
    },
  },
};
