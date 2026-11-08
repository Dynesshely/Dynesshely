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
  cs: "#987C96",
  c: "#586187",
  cpp: "#93A9C4",
  rust: "#A96E68",
  dart: "#547077",
  kotlin: "#C08A85",
  java: "#B07F5C",
  py: "#546E8A",
  html: "#C99E7E",
  css: "#7290AF",
  js: "#586187",
  ts: "#9AA2C4",
  php: "#877C9A",
  zig: "#8A6244",
  visualbasic: "#A79BB8",
  lua: "#877C9A",
  fortran: "#715A6F",
  julia: "#C08A85",
  pwsh: "#987C96",
  bash: "#5E725C",
  haskell: "#C69FA6",
  swift: "#AD9E6C",
  go: "#7F5C63",
  ruby: "#C9BD8E",
  perl: "#A87E86",
  avaloniaui: "#7290AF",
  blazor: "#655C74",
  qt: "#9DB39A",
  tauri: "#B07F5C",
  electron: "#547077",
  angular: "#C08A85",
  vuejs: "#779891",
  react: "#547077",
  nextjs: "#93A9C4",
  nuxtjs: "#779891",
  svelte: "#82524E",
  astro: "#C99E7E",
  pinia: "#AD9E6C",
  tailwindcss: "#586187",
  bootstrap: "#A79BB8",
  materialui: "#7882AC",
  sass: "#7F5C63",
  flutter: "#72949C",
  reactnative: "#546E8A",
  jetpackcompose: "#96B5AE",
  dotnet: "#7882AC",
  nodejs: "#6F7854",
  deno: "#93A9C4",
  spring: "#7E977B",
  yew: "#58726C",
  expressjs: "#A79BB8",
  nestjs: "#A96E68",
  flask: "#547077",
  django: "#B79BB5",
  fastapi: "#A87E86",
  graphql: "#8A6244",
  prisma: "#C9BD8E",
  sqlite: "#7290AF",
  sqlserver: "#82524E",
  mongo: "#9AA2C4",
  postgresql: "#877C9A",
  mysql: "#715A6F",
  redis: "#C99E7E",
  mariadb: "#A87E86",
  elasticsearch: "#85784E",
  cmake: "#7882AC",
  maven: "#8A6244",
  gradle: "#93A9C4",
  vite: "#72949C",
  webpack: "#546E8A",
  npm: "#C08A85",
  yarn: "#7882AC",
  pnpm: "#8A6244",
  eslint: "#A79BB8",
  prettier: "#72949C",
  vitest: "#6F7854",
  jest: "#C08A85",
  playwright: "#AD9E6C",
  cypress: "#58726C",
  github: "#7290AF",
  gitlab: "#82524E",
  gitea: "#B5BE93",
  bitbucket: "#7882AC",
  azure: "#655C74",
  aws: "#B79BB5",
  cloudflare: "#B07F5C",
  vercel: "#7F5C63",
  codepen: "#C9BD8E",
  githubactions: "#7290AF",
  docker: "#586187",
  kubernetes: "#A79BB8",
  portainer: "#987C96",
  ansible: "#7F5C63",
  grafana: "#C9BD8E",
  nginx: "#779891",
  caddy: "#546E8A",
  apache: "#C08A85",
  tomcat: "#AD9E6C",
  pm2: "#586187",
  ipfs: "#92B2BA",
  tor: "#877C9A",
  wireshark: "#715A6F",
  putty: "#C69FA6",
  git: "#A96E68",
  svn: "#546E8A",
  postman: "#C99E7E",
  swagger: "#95A071",
  terminal: "#586187",
  thunderbird: "#B79BB5",
  dbeaver: "#AD9E6C",
  cuda: "#95A071",
  pytorch: "#82524E",
  tensorflow: "#C99E7E",
  opencv: "#AD9E6C",
  chatgpt: "#546E8A",
  claude: "#9DB39A",
  gemini: "#779891",
  ollama: "#586187",
  huggingface: "#92B2BA",
  langchain: "#877C9A",
  unity: "#7290AF",
  unrealengine: "#586187",
  godot: "#A79BB8",
  threejs: "#987C96",
  blender: "#7F5C63",
  photoshop: "#7290AF",
  premiere: "#586187",
  aftereffects: "#9AA2C4",
  audition: "#877C9A",
  illustrator: "#8A6244",
  lightroom: "#93A9C4",
  davinci: "#877C9A",
  gimp: "#8A6244",
  inkscape: "#B79BB5",
  figma: "#779891",
  lunacy: "#715A6F",
  obs: "#C69FA6",
  ffmpeg: "#7E977B",
  kdenlive: "#7F5C63",
  visualstudio: "#877C9A",
  vscode: "#546E8A",
  xcode: "#93A9C4",
  rider: "#A87E86",
  rustrover: "#8A6244",
  clion: "#96B5AE",
  idea: "#7882AC",
  androidstudio: "#586187",
  resharper: "#C99E7E",
  pycharm: "#72949C",
  fleet: "#655C74",
  eclipse: "#B79BB5",
  vim: "#779891",
  neovim: "#715A6F",
  sublime: "#C9BD8E",
  obsidian: "#A87E86",
  hexo: "#7290AF",
  hugo: "#7F5C63",
  jekyll: "#C08A85",
  mermaid: "#B07F5C",
  markdown: "#586187",
  latex: "#92B2BA",
  matlab: "#877C9A",
  jupyter: "#85784E",
  anaconda: "#9DB39A",
  numpy: "#987C96",
  windows: "#7290AF",
  apple: "#5E725C",
  android: "#96B5AE",
  linux: "#AD9E6C",
  ubuntu: "#8A6244",
  debian: "#C69FA6",
  kali: "#7290AF",
  arch: "#586187",
  redhat: "#C08A85",
  centos: "#B07F5C",
  fedora: "#586187",
  manjaro: "#92B2BA",
  mint: "#95A071",
  popos: "#547077",
  raspberrypi: "#9DB39A",
  nixos: "#877C9A",
  proxmox: "#B07F5C",
  virtualbox: "#85784E",
  vmwareworkstation: "#B5BE93",
  wsl: "#7E977B",
  arduino: "#547077",
  platformio: "#96B5AE",
  chrome: "#7290AF",
  chromium: "#586187",
  edge: "#9DB39A",
  firefox: "#AD9E6C",
  brave: "#82524E",
  arcbrowser: "#A79BB8",};


/**
 * Icons whose identity *is* their multi-colour structure.
 *
 * These keep their own hues, only desaturated - flattening Chrome's four colours
 * or Firefox's gradient into one accent made them unrecognisable. Everything else
 * is re-tinted to its single `ICON_COLORS` accent.
 */
export const ICON_MULTI_COLOR = [
  "chrome", "chromium", "edge", "firefox", "brave",
  "figma", "blender", "gimp", "inkscape", "davinci",
  "android", "apple", "gemini", "huggingface", "arcbrowser",
  "gmail", "obsidian", "vscode", "visualstudio", "androidstudio",
  "clion", "pycharm", "rider", "fleet", "idea", "webstorm",
  "jetpackcompose", "kde", "gnome", "linux", "mint",
];
