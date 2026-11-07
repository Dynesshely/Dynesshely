/**
 * Design tokens for the composed status panel.
 *
 * Palette: Morandi - muted, grey-leaning tones (fog blue, warm grey, parchment)
 * so the panel sits quietly on both GitHub themes instead of the saturated blue
 * the individual cards used to bring.
 *
 * Two variants are produced because an SVG used through <img> cannot respond to
 * `prefers-color-scheme`; the README picks a variant with <picture> instead.
 */

// Single quotes inside: this string is interpolated into double-quoted SVG
// attributes, so it must not contain a double quote.
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";

/**
 * Morandi swatches.
 *   mist    #A9B8CC  dusty blue (the darkest accent, used on dark backgrounds)
 *   fog     #7D8FA8  deeper dusty blue (visible on white)
 *   warmGrey#6B655E  labels on white
 *   ink     #3F3B37  body text on white
 *   bone    #CFC8BC  body text on dark
 *   stone   #B0A89C  secondary text on dark
 */
export const MORANDI = {
  mist: "#9DB2CC",
  fog: "#7D8FA8",
  warmGrey: "#6B655E",
  ink: "#3F3B37",
  bone: "#CFC8BC",
  stone: "#B0A89C",
  slate: "#38424D",
  parchment: "#E3E7EC",
};

export const LAYOUT = {
  width: 800,
  margin: 16,
  gap: 12,
  padding: 14,
  radius: 14,
  panels: {
    contributions: { x: 16, y: 16, w: 768, h: 162 },
    activity: { x: 16, y: 190, w: 768, h: 156 },
    stats: { x: 16, y: 358, w: 378, h: 166 },
    streak: { x: 406, y: 358, w: 378, h: 166 },
    wakatime: { x: 16, y: 536, w: 378, h: 357 },
    toplangs: { x: 406, y: 536, w: 378, h: 357 },
  },
  height: 536 + 357 + 16,
};

export const THEMES = {
  light: {
    variant: "light",
    font: FONT,
    panelFill: "rgba(90, 82, 74, 0.045)",
    panelStroke: "rgba(90, 82, 74, 0.12)",
    title: "#57524C",
    text: MORANDI.ink,
    muted: MORANDI.warmGrey,
    accent: MORANDI.fog,
    accentSoft: "rgba(125, 143, 168, 0.14)",
    // continuous heat scale: empty cells use heatEmpty, everything else is
    // interpolated between heatFrom (quiet) and heatTo (peak)
    heatFrom: MORANDI.parchment,
    heatTo: MORANDI.fog,
    heatEmpty: "rgba(63, 59, 55, 0.055)",
    // render options handed to the vendored github-readme-stats cards
    card: {
      theme: "transparent",
      bg_color: "00000000",
      hide_border: true,
      hide_title: true,
      card_width: 420,
      disable_animations: true,
      border_radius: 0,
      title_color: "57524C",
      // labels and numbers share this colour upstream, so it has to be dark
      // enough to read at 14px on white
      text_color: "514C46",
      icon_color: "7D8FA8",
      ring_color: "7D8FA8",
      text_bold: true,
    },
  },
  dark: {
    variant: "dark",
    font: FONT,
    panelFill: "rgba(232, 226, 216, 0.045)",
    panelStroke: "rgba(232, 226, 216, 0.11)",
    title: MORANDI.bone,
    text: "#E7E1D6",
    muted: MORANDI.stone,
    accent: "#8FA8C6",
    accentSoft: "rgba(169, 184, 204, 0.16)",
    heatFrom: MORANDI.slate,
    heatTo: "#A6BDD9",
    heatEmpty: "rgba(228, 222, 211, 0.045)",
    card: {
      theme: "transparent",
      bg_color: "00000000",
      hide_border: true,
      hide_title: true,
      card_width: 420,
      disable_animations: true,
      border_radius: 0,
      title_color: "D8D2C6",
      // bright enough to pass as body text on #0d1117
      text_color: "DED8CC",
      icon_color: "A9B8CC",
      ring_color: "A9B8CC",
      text_bold: true,
    },
  },
};
