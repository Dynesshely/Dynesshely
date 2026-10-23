/**
 * The single source of truth for every image embedded into README.md.
 *
 * `service` points at tools/services/<service>.mjs; `path` is the request path
 * (including query string) to ask that locally running service for; `file` is
 * where the resulting SVG is written, relative to `assets/`.
 *
 * `requiresEnv` lists environment variables the asset needs. When one of them is
 * missing the asset is reported as "skipped" instead of failing the run.
 */
export const assets = [
  // ---------------------------------------------------------------- capsule-render
  {
    id: "banner-status",
    service: "capsule-render",
    path: "/api?type=venom&height=150&color=0:00c6ff,100:0072ff&text=Status&fontSize=50&fontAlignY=55&animation=twinkling&fontColor=9daaf8",
    file: "banner/status.svg",
  },
  {
    id: "banner-intro",
    service: "capsule-render",
    path: "/api?type=venom&height=150&color=0:00c6ff,100:0072ff&text=Intro&fontSize=50&fontAlignY=55&animation=twinkling&fontColor=9daaf8",
    file: "banner/intro.svg",
  },
  {
    id: "banner-skills",
    service: "capsule-render",
    path: "/api?type=venom&height=150&color=0:00c6ff,100:0072ff&text=Skills&fontSize=50&fontAlignY=55&animation=twinkling&fontColor=9daaf8",
    file: "banner/skills.svg",
  },
  {
    id: "banner-contact",
    service: "capsule-render",
    path: "/api?type=venom&height=150&color=0:00c6ff,100:0072ff&text=Contact&fontSize=50&fontAlignY=55&animation=twinkling&fontColor=9daaf8",
    file: "banner/contact.svg",
  },
  {
    id: "banner-footer",
    service: "capsule-render",
    path: "/api?type=venom&height=300&color=0:00c6ff,100:0072ff&text=...&section=header&reversal=false&fontAlignY=44",
    file: "banner/footer.svg",
  },

  // -------------------------------------------------------------- readme-typing-svg
  {
    id: "typing-hello",
    service: "readme-typing-svg",
    path: "/?font=Fira+Code&size=28&pause=1000&center=true&width=435&lines=Hello+GitHub+%40+Dynesshely",
    file: "typing/hello.svg",
  },
  {
    id: "typing-programing-languages",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Programing+Languages",
    file: "typing/programing-languages.svg",
  },
  {
    id: "typing-databases",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Databases",
    file: "typing/databases.svg",
  },
  {
    id: "typing-ui-frameworks",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=UI+Frameworks",
    file: "typing/ui-frameworks.svg",
  },
  {
    id: "typing-platforms-frameworks",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Platforms+/+Frameworks",
    file: "typing/platforms-frameworks.svg",
  },
  {
    id: "typing-package-build",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Package+/+Build",
    file: "typing/package-build.svg",
  },
  {
    id: "typing-tools",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Tools",
    file: "typing/tools.svg",
  },
  {
    id: "typing-game-engines",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Game+Engines+/+3D+/+AI+/+CV",
    file: "typing/game-engines.svg",
  },
  {
    id: "typing-hardwares",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Hardwares",
    file: "typing/hardwares.svg",
  },
  {
    id: "typing-learn-research",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Learn+/+Research",
    file: "typing/learn-research.svg",
  },
  {
    id: "typing-ides-editors",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=IDEs+/+Editors",
    file: "typing/ides-editors.svg",
  },
  {
    id: "typing-medias-editors",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Medias+Editors",
    file: "typing/medias-editors.svg",
  },
  {
    id: "typing-cloud-services",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Cloud+Services",
    file: "typing/cloud-services.svg",
  },
  {
    id: "typing-operating-systems",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Operating+Systems",
    file: "typing/operating-systems.svg",
  },
  {
    id: "typing-virtual-environment",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Virtual+Environment",
    file: "typing/virtual-environment.svg",
  },
  {
    id: "typing-internet-browsers",
    service: "readme-typing-svg",
    path: "/?center=true&repeat=false&lines=Internet+Browsers",
    file: "typing/internet-browsers.svg",
  },

  // ------------------------------------------------------------------- skill-icons
  {
    id: "icons-languages",
    service: "skill-icons",
    path: "/api/icons?i=cs,c,cpp,rust,dart,kotlin,java,py,html,css,js,ts,php,zig,visualbasic,lua,fortran,julia,pwsh,bash,haskell,swift,go,ruby,perl&perline=5",
    file: "icons/languages.svg",
  },
  {
    id: "icons-databases",
    service: "skill-icons",
    path: "/api/icons?i=sqlite,sqlserver,mongo,postgresql,mysql,redis",
    file: "icons/databases.svg",
  },
  {
    id: "icons-ui-frameworks",
    service: "skill-icons",
    path: "/api/icons?i=avaloniaui,flutter,blazor,qt,tauri,electron,angular,vuejs,react&perline=3",
    file: "icons/ui-frameworks.svg",
  },
  {
    id: "icons-platforms-frameworks",
    service: "skill-icons",
    path: "/api/icons?i=dotnet,nodejs,deno,spring,yew",
    file: "icons/platforms-frameworks.svg",
  },
  {
    id: "icons-package-build",
    service: "skill-icons",
    path: "/api/icons?i=cmake,maven,gradle,vite,webpack,npm,yarn,pnpm",
    file: "icons/package-build.svg",
  },
  {
    id: "icons-tools",
    service: "skill-icons",
    path: "/api/icons?i=git,svn,postman,swagger,ipfs,nginx,tomcat,caddy,pm2,tor,terminal,thunderbird&perline=6",
    file: "icons/tools.svg",
  },
  {
    id: "icons-game-engines",
    service: "skill-icons",
    path: "/api/icons?i=unity,unreal,godot,cuda,pytorch,tensorflow,threejs,opencv",
    file: "icons/game-engines.svg",
  },
  {
    id: "icons-hardwares",
    service: "skill-icons",
    path: "/api/icons?i=arduino,platformio",
    file: "icons/hardwares.svg",
  },
  {
    id: "icons-learn-research",
    service: "skill-icons",
    path: "/api/icons?i=mermaid,md,matlab,latex,jupyter,anaconda,numpy",
    file: "icons/learn-research.svg",
  },
  {
    id: "icons-ides-editors",
    service: "skill-icons",
    path: "/api/icons?i=visualstudio,vscode,xcode,rider,rustrover,clion,idea,androidstudio,resharper,pycharm,fleet,eclipse,vim,neovim,sublime,obsidian&perline=4",
    file: "icons/ides-editors.svg",
  },
  {
    id: "icons-medias-editors",
    service: "skill-icons",
    path: "/api/icons?i=photoshop,premiere,aftereffects,audition,illustrator,lightroom,davinci,blender,gimp,inkscape,figma,lunacy&perline=4",
    file: "icons/medias-editors.svg",
  },
  {
    id: "icons-cloud-services",
    service: "skill-icons",
    path: "/api/icons?i=github,gitlab,gitea,bitbucket,azure,aws,cloudflare,vercel,codepen&perline=3",
    file: "icons/cloud-services.svg",
  },
  {
    id: "icons-operating-systems",
    service: "skill-icons",
    path: "/api/icons?i=windows,apple,android,linux,ubuntu,debian,kali,arch,redhat,raspberrypi&perline=5",
    file: "icons/operating-systems.svg",
  },
  {
    id: "icons-virtual-environment",
    service: "skill-icons",
    path: "/api/icons?i=proxmox,virtualbox,vmwareworkstation,wsl,docker",
    file: "icons/virtual-environment.svg",
  },
  {
    id: "icons-internet-browsers",
    service: "skill-icons",
    path: "/api/icons?i=chrome,chromium,edge,firefox,brave,arcbrowser",
    file: "icons/internet-browsers.svg",
  },
  {
    id: "icons-contact-x",
    service: "skill-icons",
    path: "/api/icons?i=x",
    file: "icons/contact-x.svg",
  },
  {
    id: "icons-contact-mastodon",
    service: "skill-icons",
    path: "/api/icons?i=mastodon",
    file: "icons/contact-mastodon.svg",
  },
  {
    id: "icons-contact-gmail",
    service: "skill-icons",
    path: "/api/icons?i=gmail",
    file: "icons/contact-gmail.svg",
  },

  // ---------------------------------------------------------- github-readme-stats
  {
    id: "stats-github",
    service: "github-readme-stats",
    path: "/api?username=Dynesshely&theme=transparent&show_icons=true&hide_border=true&show=reviews&hide_title=true&hide=contribs&number_format=long",
    file: "stats/github.svg",
    // The workflow's own GITHUB_TOKEN is scoped to this repository and GitHub
    // rejects reading other accounts' data with it ("Resource not accessible by
    // integration"), so this card needs a personal access token.
    requiresEnv: ["PAT_1"],
  },
  {
    id: "stats-top-langs",
    service: "github-readme-stats",
    path: "/api/top-langs/?username=Dynesshely&theme=transparent&hide_border=true&layout=donut-vertical&langs_count=10&hide=html",
    file: "stats/top-langs.svg",
    requiresEnv: ["PAT_1"],
  },
  {
    // Kept in the manifest so switching away from the remote WakaTime deployment
    // is a one line README change. Only generated when both tokens exist.
    id: "stats-wakatime",
    service: "github-readme-stats",
    path: "/api/wakatime?username=Dynesshely&theme=transparent&hide_border=true&layout=compact&langs_count=22",
    file: "stats/wakatime.svg",
    requiresEnv: ["PAT_1", "WAKATIME_API_KEY"],
  },

  // ------------------------------------------------- github-readme-streak-stats
  {
    id: "stats-streak",
    service: "github-readme-streak-stats",
    path: "/?user=Dynesshely&theme=transparent&hide_border=true",
    file: "stats/streak.svg",
    requiresEnv: ["TOKEN"],
  },

  // --------------------------------------------- github-readme-activity-graph
  {
    id: "stats-activity-graph",
    service: "github-readme-activity-graph",
    path: "/graph?username=Dynesshely&theme=github-compact&hide_border=true&area=true&custom_title=Contribution%20Graph",
    file: "stats/activity-graph.svg",
    requiresEnv: ["TOKEN"],
  },
];

/** Services referenced by the manifest, in first-use order. */
export function manifestServices() {
  return [...new Set(assets.map((asset) => asset.service))];
}
