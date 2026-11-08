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
    icons: "windows,apple,android,linux,ubuntu,debian,kali,arch,redhat,centos,fedora,manjaro,mint,popos,raspberrypi,nixos".split(","),
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

/**
 * Icon colour treatment for the skills grid.
 *
 * `morandi: true` rewrites every logo colour through the shared HSL desaturator
 * (hue kept, saturation capped), so the icon grid sits in the same muted range as
 * the panels instead of showing raw brand colours. The dark tile behind each icon
 * is already a neutral, so it passes through untouched.
 */
export const SKILL_ICON_STYLE = {
  /** Recolour every icon to its ICON_COLORS value. */
  morandi: true,
  /** The dark tile every icon sits on (also left untouched by the recolour). */
  tile: "#2C3238",
};


/**
 * Fixed per-icon accent colour.
 *
 * One hand-checked hue per logo, taken from the Morandi board. Icons are
 * recoloured to this exact value at render time - no runtime desaturation, no hue
 * maths - so the output is reproducible and any colour can be corrected by editing
 * this table.
 *
 * Assignment rule: stay near the brand hue (Vue stays teal-ish, Rust stays red-ish)
 * and never let two neighbours in the same group share a family. Lightness
 * alternates so adjacent tiles also differ in value.
 */
export const ICON_COLORS = {
  cs: "#aa70ba",
  c: "#6e79ba",
  cpp: "#578eb7",
  rust: "#c17b6f",
  dart: "#62bbb3",
  kotlin: "#c67c83",
  java: "#c39a74",
  py: "#8aa3bc",
  html: "#c18470",
  css: "#5b9bd5",
  js: "#8aa3bc",
  ts: "#8aa3bc",
  php: "#8aa3bc",
  zig: "#c3a676",
  visualbasic: "#578db7",
  lua: "#8aa3bc",
  fortran: "#947ab0",
  julia: "#c17570",
  pwsh: "#8aa3bc",
  bash: "#77b97f",
  haskell: "#8aa3bc",
  swift: "#c6857b",
  go: "#8aa3bc",
  ruby: "#b8625b",
  perl: "#5793b7",
  avaloniaui: "#7393c3",
  blazor: "#8b64b7",
  qt: "#74c37e",
  tauri: "#c7b07d",
  electron: "#7ebbc8",
  angular: "#bf697d",
  vuejs: "#74bb9c",
  react: "#71b5c2",
  nextjs: "#8aa3bc",
  nuxtjs: "#68be9a",
  svelte: "#c28471",
  astro: "#c47682",
  pinia: "#c5af78",
  tailwindcss: "#6db7c0",
  bootstrap: "#9f75c4",
  materialui: "#7199c2",
  sass: "#c481a2",
  flutter: "#7fb6c8",
  reactnative: "#7eb8c8",
  jetpackcompose: "#77c499",
  dotnet: "#8a7fc4",
  nodejs: "#9ac272",
  deno: "#8aa3bc",
  spring: "#87bf6c",
  yew: "#86c0a8",
  expressjs: "#9db3c8",
  nestjs: "#c27283",
  flask: "#6ca8b1",
  django: "#57b793",
  fastapi: "#57b7ae",
  graphql: "#c578ab",
  prisma: "#7f8cc7",
  sqlite: "#5799b7",
  sqlserver: "#c57b78",
  mongo: "#8aa3bc",
  postgresql: "#6893b5",
  mysql: "#8aa3bc",
  redis: "#b85c4e",
  mariadb: "#5781b7",
  elasticsearch: "#c2b473",
  cmake: "#5b7fb8",
  maven: "#c39675",
  gradle: "#8aa3bc",
  vite: "#7fb6c8",
  webpack: "#7fafc8",
  npm: "#c27272",
  yarn: "#6ea8c0",
  pnpm: "#c1a86f",
  eslint: "#8a7fa8",
  prettier: "#727b9d",
  vitest: "#b0b98a",
  jest: "#b3727c",
  playwright: "#c7827c",
  cypress: "#81c6a9",
  github: "#c9c9c9",
  gitlab: "#c37e73",
  gitea: "#8eba61",
  bitbucket: "#7a9bc6",
  azure: "#6697bd",
  aws: "#9db3c8",
  cloudflare: "#c39976",
  vercel: "#9db3c8",
  codepen: "#8aa3bc",
  githubactions: "#789cc5",
  docker: "#75a2c4",
  kubernetes: "#7790c4",
  portainer: "#7bb1c6",
  ansible: "#b06a6a",
  grafana: "#c2bd71",
  nginx: "#87b77c",
  caddy: "#68a0bc",
  apache: "#be686f",
  tomcat: "#bfab6c",
  pm2: "#7f8dc8",
  ipfs: "#75b2b5",
  tor: "#9757b7",
  wireshark: "#9db3c8",
  putty: "#5757b7",
  git: "#c58679",
  svn: "#879cbf",
  postman: "#c8927e",
  swagger: "#85af6b",
  terminal: "#8aa3bc",
  thunderbird: "#c98fc4",
  dbeaver: "#a07d6f",
  cuda: "#9aba5f",
  pytorch: "#c58478",
  tensorflow: "#c29471",
  opencv: "#c27171",
  chatgpt: "#9db3c8",
  claude: "#c78f7d",
  gemini: "#5fba8c",
  ollama: "#8aa3bc",
  huggingface: "#c5b678",
  langchain: "#8aa3bc",
  unity: "#9db3c8",
  unrealengine: "#8aa3bc",
  godot: "#7f93b0",
  threejs: "#9db3c8",
  blender: "#5d8ab7",
  photoshop: "#7da8c7",
  premiere: "#6e5aad",
  aftereffects: "#5c5cc0",
  audition: "#7e7ec8",
  illustrator: "#d0ad7d",
  lightroom: "#7da8c7",
  davinci: "#7178c2",
  gimp: "#b78957",
  inkscape: "#8aa3bc",
  figma: "#67bd9c",
  lunacy: "#6fa5c1",
  obs: "#8aa3bc",
  ffmpeg: "#57b76e",
  kdenlive: "#7fa1c7",
  visualstudio: "#917cb5",
  vscode: "#6c9fc0",
  xcode: "#6fa0c1",
  rider: "#c06d8f",
  rustrover: "#c3ab73",
  clion: "#6fc09d",
  idea: "#7298c2",
  androidstudio: "#7e99c8",
  resharper: "#c3ab73",
  pycharm: "#6fb1c0",
  fleet: "#7183c2",
  eclipse: "#7161ad",
  vim: "#57b777",
  neovim: "#72abc2",
  sublime: "#c9965c",
  obsidian: "#9076c3",
  hexo: "#679dbe",
  hugo: "#be6999",
  jekyll: "#b75757",
  mermaid: "#c77e94",
  markdown: "#8aa3bc",
  latex: "#57b7b7",
  matlab: "#79a3c5",
  jupyter: "#c59677",
  anaconda: "#75b979",
  numpy: "#78b0c5",
  windows: "#6da9c0",
  apple: "#6fbf6c",
  android: "#8bbb9e",
  linux: "#c2ae72",
  ubuntu: "#c49576",
  debian: "#be6887",
  kali: "#79a4c6",
  arch: "#6ba3bf",
  redhat: "#c06c6c",
  centos: "#c3a876",
  fedora: "#5e79b0",
  manjaro: "#6fbfb0",
  mint: "#8dbb73",
  popos: "#77b9c1",
  raspberrypi: "#86c079",
  nixos: "#7f9fc8",
  proxmox: "#bf936a",
  virtualbox: "#c29f72",
  vmwareworkstation: "#c09d6d",
  wsl: "#bc8e63",
  arduino: "#57b4b7",
  platformio: "#bf946a",
  chrome: "#7294c2",
  chromium: "#7e9ac8",
  edge: "#7fc783",
  firefox: "#c8c37f",
  brave: "#c27b71",
  arcbrowser: "#6b57b7",
};
/**
 * Icons whose identity *is* their multi-colour structure.
 *
 * These keep their own hues, only desaturated - flattening Chrome's four colours
 * or Firefox's gradient into one accent made them unrecognisable. Everything else
 * is re-tinted to its single `ICON_COLORS` accent.
 */
export const ICON_MULTI_COLOR = [
  // 74 icons whose identity lives in more than one hue (Chrome's four colours,
  // VS Code's blue, Figma's rings, VMware's two tones, ...). These keep their own
  // hues and are only muted; flattening them into a single accent erased the
  // feature that makes the logo recognisable.
  "android", "androidstudio", "angular", "apache", "apple", "arcbrowser", "astro",
  "azure", "blender", "brave", "centos", "chrome", "chromium", "clion",
  "cmake", "cypress", "dart", "davinci", "eclipse", "edge", "elasticsearch",
  "ffmpeg", "figma", "firefox", "flask", "fleet", "flutter", "gemini", "gimp",
  "gitlab", "gmail", "gnome", "grafana", "huggingface", "idea", "inkscape",
  "ipfs", "jetpackcompose", "julia", "kde", "kdenlive", "kotlin", "latex",
  "linux", "mariadb", "matlab", "maven", "mint", "neovim", "obsidian", "opencv",
  "pinia", "playwright", "pm2", "prettier", "putty", "pycharm", "raspberrypi",
  "resharper", "rider", "rustrover", "tauri", "tomcat",
  "virtualbox", "visualstudio", "vite", "vitest", "vmwareworkstation", "vscode",
  "webstorm", "wsl", "xcode",
];
