import { c as createComponent, m as maybeRenderHead, s as spreadAttributes, e as addAttribute, n as renderSlot, b as renderTemplate, d as createAstro, r as renderComponent, a as renderScript } from './astro/server_qhutUUez.mjs';
import 'piccolore';
import 'clsx';
import { $ as $$Layout } from './Layout_VXOGlr6V.mjs';
/* empty css                        */

const $$Astro$9 = createAstro();
const $$ = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$;
  const size = Astro2.props.size;
  const cls = Astro2.props.class;
  const name = Astro2.props.iconName;
  delete Astro2.props.size;
  delete Astro2.props.class;
  delete Astro2.props.iconName;
  const props = Object.assign({
    "xmlns": "http://www.w3.org/2000/svg",
    "stroke-width": 2,
    "width": size ?? 24,
    "height": size ?? 24,
    "stroke": "currentColor",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "fill": "none",
    "viewBox": "0 0 24 24"
  }, Astro2.props);
  return renderTemplate`${maybeRenderHead()}<svg${spreadAttributes(props)}${addAttribute(["lucide", { [`lucide-${name}`]: name }, cls], "class:list")}> ${renderSlot($$result, $$slots["default"])} </svg>`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/.Layout.astro", void 0);

const $$Astro$8 = createAstro();
const $$AppWindow = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$AppWindow;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "app-window", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<rect x="2" y="4" width="20" height="16" rx="2"></rect> <path d="M10 4v4"></path> <path d="M2 8h20"></path> <path d="M6 4v4"></path> ` })}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/AppWindow.astro", void 0);

const $$Astro$7 = createAstro();
const $$Gamepad2 = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$Gamepad2;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "gamepad-2", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<line x1="6" x2="10" y1="11" y2="11"></line> <line x1="8" x2="8" y1="9" y2="13"></line> <line x1="15" x2="15.01" y1="12" y2="12"></line> <line x1="18" x2="18.01" y1="10" y2="10"></line> <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"></path> ` })}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/Gamepad2.astro", void 0);

const $$Astro$6 = createAstro();
const $$LayoutGrid = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$LayoutGrid;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "layout-grid", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<rect width="7" height="7" x="3" y="3" rx="1"></rect> <rect width="7" height="7" x="14" y="3" rx="1"></rect> <rect width="7" height="7" x="14" y="14" rx="1"></rect> <rect width="7" height="7" x="3" y="14" rx="1"></rect> ` })}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/LayoutGrid.astro", void 0);

const $$Astro$5 = createAstro();
const $$LogOut = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$LogOut;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "log-out", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="m16 17 5-5-5-5"></path> <path d="M21 12H9"></path> <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path> ` })}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/LogOut.astro", void 0);

const $$Astro$4 = createAstro();
const $$Menu = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$Menu;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "menu", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M4 5h16"></path> <path d="M4 12h16"></path> <path d="M4 19h16"></path> ` })}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/Menu.astro", void 0);

const $$Astro$3 = createAstro();
const $$MessageSquare = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$MessageSquare;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "message-square", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path> ` })}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/MessageSquare.astro", void 0);

const $$Astro$2 = createAstro();
const $$Settings2 = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Settings2;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "settings-2", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M14 17H5"></path> <path d="M19 7h-9"></path> <circle cx="17" cy="17" r="3"></circle> <circle cx="7" cy="7" r="3"></circle> ` })}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/Settings2.astro", void 0);

const $$Astro$1 = createAstro();
const $$X = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$X;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "x", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M18 6 6 18"></path> <path d="m6 6 12 12"></path> ` })}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/X.astro", void 0);

const $$Astro = createAstro();
const $$ProxyStatus = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ProxyStatus;
  const { class: className = "" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div id="proxy-status"${addAttribute(`inline-flex items-center gap-1.5 text-xs font-medium ${className}`, "class")} title="Proxy engine status"> <span id="proxy-status-dot" class="h-2 w-2 rounded-full bg-text-muted animate-pulse"></span> <span id="proxy-status-text" class="text-text-secondary">Proxy</span> </div> ${renderScript($$result, "/Users/arman/Desktop/Arm$n/src/components/ProxyStatus.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/arman/Desktop/Arm$n/src/components/ProxyStatus.astro", void 0);

const $$Main = createComponent(async ($$result, $$props, $$slots) => {
  const navLinks = [
    { href: "/games", text: "Games", Icon: $$Gamepad2 },
    { href: "/apps", text: "Apps", Icon: $$LayoutGrid },
    { href: "/tabs", text: "Tabs", Icon: $$AppWindow },
    { href: "/chat", text: "Chat", Icon: $$MessageSquare },
    { href: "/settings", text: "Settings", Icon: $$Settings2 }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "data-astro-cid-hsp6otuf": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<nav id="default-nav" class="fixed top-4 left-4 right-4 z-[99999] flex items-center justify-between px-6 py-3 bg-background/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg" data-astro-cid-hsp6otuf> <a href="/" class="inline-block text-4xl font-black leading-none text-text hover:-translate-y-0.5 tracking-tight [-webkit-text-stroke:1px_currentColor] font-display" aria-label="ARM$N home" data-astro-cid-hsp6otuf>
ARM<span class="text-[#26de81] text-glow animate-dollar-shimmer" data-astro-cid-hsp6otuf>$</span>N
</a> <div id="nav-links" class="hidden items-center gap-2" data-astro-cid-hsp6otuf> ${navLinks.map((link) => renderTemplate`<a${addAttribute(link.href, "href")} class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-base text-text-secondary hover:-translate-y-0.5" data-astro-cid-hsp6otuf> ${renderComponent($$result2, "link.Icon", link.Icon, { "class": "w-5 h-5", "strokeWidth": 1.5, "data-astro-cid-hsp6otuf": true })} <span data-astro-cid-hsp6otuf>${link.text}</span> </a>`)} ${renderComponent($$result2, "ProxyStatus", $$ProxyStatus, { "class": "ml-2", "data-astro-cid-hsp6otuf": true })} <button id="logout-button" type="button" class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-base text-text-secondary hover:text-emerald-400 hover:-translate-y-0.5 transition-all" data-astro-cid-hsp6otuf> ${renderComponent($$result2, "LogOut", $$LogOut, { "class": "w-5 h-5", "strokeWidth": 1.5, "data-astro-cid-hsp6otuf": true })} <span data-astro-cid-hsp6otuf>Logout</span> </button> </div> <button id="menu-toggle" class="p-2 text-text-secondary hover:text-text transition-colors" aria-label="Toggle menu" data-astro-cid-hsp6otuf> ${renderComponent($$result2, "Menu", $$Menu, { "id": "menu-icon", "class": "w-7 h-7 transition-transform duration-200", "strokeWidth": 1.5, "data-astro-cid-hsp6otuf": true })} ${renderComponent($$result2, "X", $$X, { "id": "close-icon", "class": "w-7 h-7 hidden transition-transform duration-200", "strokeWidth": 1.5, "data-astro-cid-hsp6otuf": true })} </button> </nav> <div id="nav-menu" class="fixed top-24 right-4 z-[99998] min-w-[200px] bg-background/95 backdrop-blur-sm border border-white/10 rounded-2xl p-2 shadow-2xl origin-top-right transition-all duration-200 ease-out opacity-0 scale-95 pointer-events-none" data-astro-cid-hsp6otuf> ${navLinks.map((link, i) => renderTemplate`<a${addAttribute(link.href, "href")} class="menu-item flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text hover:bg-white/10 transition-all duration-150"${addAttribute(`transition-delay: ${i * 30}ms;`, "style")} data-astro-cid-hsp6otuf> ${renderComponent($$result2, "link.Icon", link.Icon, { "class": "w-5 h-5", "strokeWidth": 1.5, "data-astro-cid-hsp6otuf": true })} <span class="text-base" data-astro-cid-hsp6otuf>${link.text}</span> </a>`)} <button id="logout-button-mobile" type="button" class="menu-item flex w-full items-center gap-3 px-4 py-3 text-text-secondary hover:text-emerald-400 hover:bg-white/10 transition-all duration-150"${addAttribute(`transition-delay: ${navLinks.length * 30}ms;`, "style")} data-astro-cid-hsp6otuf> ${renderComponent($$result2, "LogOut", $$LogOut, { "class": "w-5 h-5", "strokeWidth": 1.5, "data-astro-cid-hsp6otuf": true })} <span class="text-base" data-astro-cid-hsp6otuf>Logout</span> </button> </div> <main class="flex flex-col min-h-screen pt-24" data-astro-cid-hsp6otuf> ${renderSlot($$result2, $$slots["default"])} </main> ` })}  ${renderScript($$result, "/Users/arman/Desktop/Arm$n/src/layouts/Main.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/arman/Desktop/Arm$n/src/layouts/Main.astro", void 0);

export { $$Main as $, $$ as a, $$LayoutGrid as b };
