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

/**
 * Section banners. One Morandi hue per section so the page reads as a family
 * without repeating the same colour, and none of them competes with the status
 * panel below.
 *
 *   Status   dusty blue
 *   Intro    dusty violet
 *   Skills   sage green
 *   Contact  clay rose
 *   Footer   neutral slate (pure decoration, no label)
 */
export const BANNER_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/**
 * Rendered by vendor/capsule-render itself (`type=venom`), so the artwork and the
 * animation are exactly what the old public endpoint produced - only the colour
 * stops are Morandi, one hue per section.
 */
export const BANNERS = [
  { id: "status", type: "venom", text: "Status", height: 150, color: "0:93A9C4,100:6E87A6", fontColor: "ffffff" },
  { id: "intro", type: "venom", text: "Intro", height: 150, color: "0:A79BB8,100:817293", fontColor: "ffffff" },
  { id: "skills", type: "venom", text: "Skills", height: 150, color: "0:9CAF9F,100:76897A", fontColor: "ffffff" },
  { id: "contact", type: "venom", text: "Contact", height: 150, color: "0:C2A199,100:9A776F", fontColor: "ffffff" },
  { id: "footer", type: "venom", text: "...", height: 300, color: "0:8C9AA8,100:5F6C79", fontColor: "ffffff",
    extra: { section: "header", reversal: "false", fontAlignY: "44" } },
];

/** Typing line shown above the status panel. */
export const TYPING = {
  text: "Hello GitHub @Dynesshely",
  fontSize: 26,
  color: "#6E87A6",
  caret: "#A9B8CC",
  typeMs: 1800,
};

/** Typing lines still rendered on their own (the rest moved into the skills panel). */
export const TYPING_LINES = [{ id: "hello", ...TYPING }];

/**
 * Skills panel groups: one heading plus its icon list, laid out on a shared grid
 * by src/render/skills.mjs. Icon ids are the short names the old skill-icons URLs
 * used; the adapter maps them onto the vendored asset file names.
 */
/**
 * `perLine` keeps the column count each group had in the original skill-icons
 * URLs (`perline=`), so the composition preserves the familiar 5-wide language
 * grid, the 3x3 UI frameworks block, the 4-wide editor grid, and so on.
 */
export const SKILL_GROUPS = [
  {
    id: "programing-languages",
    title: "Programing Languages",
    icons: "cs,c,cpp,rust,dart,kotlin,java,py,html,css,js,ts,php,zig,visualbasic,lua,fortran,julia,pwsh,bash,haskell,swift,go,ruby,perl".split(","),
  },
  {
    id: "frameworks-ui",
    title: "Frameworks / UI",
    icons: "avaloniaui,blazor,qt,tauri,electron,angular,vuejs,react,nextjs,nuxtjs,svelte,astro,pinia,tailwindcss,bootstrap,materialui,sass".split(","),
  },
  { id: "mobile", title: "Mobile", icons: "flutter,reactnative,jetpackcompose".split(",") },
  {
    id: "backend-apis",
    title: "Backend / APIs",
    icons: "dotnet,nodejs,deno,spring,yew,expressjs,nestjs,flask,django,fastapi,graphql,prisma".split(","),
  },
  {
    id: "databases",
    title: "Databases",
    icons: "sqlite,sqlserver,mongo,postgresql,mysql,redis,mariadb,elasticsearch".split(","),
  },
  {
    id: "build-test-quality",
    title: "Build & Test",
    icons: "cmake,maven,gradle,vite,webpack,npm,yarn,pnpm,eslint,prettier,vitest,jest,playwright,cypress".split(","),
  },
  {
    id: "cloud-services",
    title: "Cloud Services",
    icons: "github,gitlab,gitea,bitbucket,azure,aws,cloudflare,vercel,codepen".split(","),
  },
  {
    id: "devops-infra",
    title: "DevOps / Infra",
    icons: "githubactions,docker,kubernetes,portainer,ansible,grafana".split(","),
  },
  {
    id: "servers-network",
    title: "Servers / Network",
    icons: "nginx,caddy,apache,tomcat,pm2,ipfs,tor,wireshark,putty".split(","),
  },
  { id: "tools", title: "Tools", icons: "git,svn,postman,swagger,terminal,thunderbird,dbeaver".split(",") },
  {
    id: "ai-ml",
    title: "AI / ML",
    icons: "cuda,pytorch,tensorflow,opencv,chatgpt,claude,gemini,ollama,huggingface,langchain".split(","),
  },
  { id: "game-3d", title: "Game / 3D", icons: "unity,unrealengine,godot,threejs,blender".split(",") },
  {
    id: "media",
    title: "Media",
    icons: "photoshop,premiere,aftereffects,audition,illustrator,lightroom,davinci,gimp,inkscape,figma,lunacy,obs,ffmpeg,kdenlive".split(","),
  },
  {
    id: "ides-editors",
    title: "IDEs / Editors",
    icons: "visualstudio,vscode,xcode,rider,rustrover,clion,idea,androidstudio,resharper,pycharm,fleet,eclipse,vim,neovim,sublime,obsidian".split(","),
  },
  {
    id: "docs-learning",
    title: "Docs & Learning",
    icons: "hexo,hugo,jekyll,mermaid,markdown,latex,matlab,jupyter,anaconda,numpy".split(","),
  },
  {
    id: "operating-systems",
    title: "Operating Systems",
    icons: "windows,apple,android,linux,ubuntu,debian,kali,arch,redhat,raspberrypi,nixos".split(","),
  },
  {
    id: "virtualization-hardware",
    // Two-line heading: the first four are virtualisation, the last two are
    // hardware boards, and pretending they are one concept was misleading.
    titleLines: ["Virtualization", "Hardwares"],
    icons: "proxmox,virtualbox,vmwareworkstation,wsl,arduino,platformio".split(","),
  },
  { id: "internet-browsers", title: "Internet Browsers", icons: "chrome,chromium,edge,firefox,brave,arcbrowser".split(",") },
];