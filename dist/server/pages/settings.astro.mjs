import { c as createComponent, r as renderComponent, m as maybeRenderHead, a as renderTemplate, d as createAstro, e as addAttribute, n as renderSlot, b as renderScript } from '../chunks/astro/server_zxv3i2-L.mjs';
import 'piccolore';
import { b as $$, $ as $$Main, c as $$LayoutGrid } from '../chunks/Main_YddQx75n.mjs';
import { b as $$EyeOff, $ as $$Users, a as $$Eye, c as $$UserPlus, d as $$KeyRound } from '../chunks/Users_CO59jfz4.mjs';
import { $ as $$Search } from '../chunks/Search_HvdqiJRs.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Astro$6 = createAstro();
const $$ExternalLink = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$ExternalLink;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "external-link", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M15 3h6v6"></path> <path d="M10 14 21 3"></path> <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path> ` })}`;
}, "/Users/arman/Documents/GitHub/armsn/node_modules/lucide-astro/dist/ExternalLink.astro", void 0);

const $$Astro$5 = createAstro();
const $$Globe = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$Globe;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "globe", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<circle cx="12" cy="12" r="10"></circle> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path> <path d="M2 12h20"></path> ` })}`;
}, "/Users/arman/Documents/GitHub/armsn/node_modules/lucide-astro/dist/Globe.astro", void 0);

const $$Astro$4 = createAstro();
const $$Siren = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$Siren;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "siren", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M7 18v-6a5 5 0 1 1 10 0v6"></path> <path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"></path> <path d="M21 12h1"></path> <path d="M18.5 4.5 18 5"></path> <path d="M2 12h1"></path> <path d="M12 2v1"></path> <path d="m4.929 4.929.707.707"></path> <path d="M12 12v6"></path> ` })}`;
}, "/Users/arman/Documents/GitHub/armsn/node_modules/lucide-astro/dist/Siren.astro", void 0);

const $$Astro$3 = createAstro();
const $$SwatchBook = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$SwatchBook;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "swatch-book", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"></path> <path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"></path> <path d="M 7 17h.01"></path> <path d="m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8"></path> ` })}`;
}, "/Users/arman/Documents/GitHub/armsn/node_modules/lucide-astro/dist/SwatchBook.astro", void 0);

const $$Astro$2 = createAstro();
const $$ArrowButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$ArrowButton;
  const { id, title = "Open" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<button${addAttribute(id, "id")} class="group flex items-center gap-2 h-9 px-4 bg-white/5 border border-white/10 rounded text-sm text-text-secondary hover:text-text hover:bg-white/10 hover:border-white/20 transition-all"> <span>${title}</span> <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.5"> <path d="M4 11L11 4M11 4H5.5M11 4V9.5" stroke-linecap="round" stroke-linejoin="round"></path> </svg> </button>`;
}, "/Users/arman/Documents/GitHub/armsn/src/components/ArrowButton.astro", void 0);

const $$Astro$1 = createAstro();
const $$Dropdown = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Dropdown;
  const { id, text, menu } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="relative"> <button${addAttribute(`${id}Button`, "id")}${addAttribute(id, "data-dropdown-toggle")} data-dropdown-delay="500" data-dropdown-trigger="hover" class="flex items-center justify-between w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text-secondary hover:text-text hover:border-white/20 hover:bg-white/[0.06] transition-all" type="button" aria-expanded="false"> <span class="truncate">${text}</span> <svg class="w-3 h-3 ml-2 opacity-50 shrink-0" fill="none" viewBox="0 0 10 6" stroke="currentColor" stroke-width="1.5"> <path d="m1 1 4 4 4-4" stroke-linecap="round" stroke-linejoin="round"></path> </svg> </button> <div${addAttribute(id, "id")} class="hidden absolute z-[9999] w-full min-w-[180px] max-h-56 overflow-auto bg-dropdown/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl pointer-events-auto py-1"> <ul> ${menu.map((item) => renderTemplate`<li> <a${addAttribute(item.value, "data-value")} class="block px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-white/10 cursor-pointer transition-colors"> ${item.text} </a> </li>`)} </ul> </div> </div>`;
}, "/Users/arman/Documents/GitHub/armsn/src/components/Dropdown.astro", void 0);

const $$Astro = createAstro();
const $$SettingsCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$SettingsCard;
  const { Icon, title, description } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="settings-card relative z-0 p-5 bg-white/[0.03] border border-white/10 rounded-xl group hover:border-accent/30 hover:bg-white/[0.05] hover:shadow-glow transition-all duration-300"> <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div> <div class="relative"> <div class="flex items-center gap-2.5 mb-2"> <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent"> ${renderComponent($$result, "Icon", Icon, { "class": "w-3.5 h-3.5", "stroke-width": "1.5" })} </div> <h3 class="text-sm font-semibold text-text uppercase tracking-wide font-display">${title}</h3> </div> <p class="text-xs text-text-secondary/80 mb-4 leading-relaxed">${description}</p> ${renderSlot($$result, $$slots["default"])} </div> </div>`;
}, "/Users/arman/Documents/GitHub/armsn/src/components/SettingsCard.astro", void 0);

const $$Settings = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Main, {}, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col items-center pt-24 pb-12 px-4"> <div class="text-center mb-10 animate-fade-in"> <h1 class="text-3xl font-normal tracking-tight text-text uppercase font-display">Settings</h1> <p class="mt-1 text-text-secondary text-sm">Configure your experience</p> </div> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl stagger overflow-visible relative z-[1000]"> ${renderComponent($$result2, "SettingsCard", $$SettingsCard, { "description": "Open in an about:blank tab", "title": "About:Blank", "Icon": $$ExternalLink }, { "default": async ($$result3) => renderTemplate` <div class="flex items-center justify-between gap-3"> <label class="flex items-center gap-3 text-sm text-text-secondary"> <input id="ab-toggle" type="checkbox" class="sr-only"> <span id="ab-switch" class="relative inline-flex h-6 w-11 items-center rounded-full border shadow-inner transition-colors"> <span id="ab-knob" class="inline-block h-5 w-5 rounded-full shadow-sm transition-transform"></span> </span> <span id="ab-status" class="text-text-secondary">Disabled</span> </label> </div> <div class="mt-3"> ${renderComponent($$result3, "ArrowButton", $$ArrowButton, { "id": "AB", "title": "Open Popup" })} </div> ` })} ${renderComponent($$result2, "SettingsCard", $$SettingsCard, { "description": "Disguise browser tab appearance", "title": "Tab Cloaker", "Icon": $$EyeOff }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Dropdown", $$Dropdown, { "id": "cloaker", "text": "Select Preset", "menu": [
    { value: "Britannica", text: "Britannica" },
    { value: "Canvas", text: "Canvas" },
    { value: "Classroom", text: "Classroom" },
    { value: "Clever", text: "Clever" },
    { value: "DeltaMath", text: "DeltaMath" },
    { value: "Desmos", text: "Desmos" },
    { value: "Drive", text: "Drive" },
    { value: "Edpuzzle", text: "Edpuzzle" },
    { value: "Gmail", text: "Gmail" },
    { value: "Google", text: "Google" },
    { value: "Google_Docs", text: "Google Docs" },
    { value: "Google_Meet", text: "Google Meet" },
    { value: "Google_Slides", text: "Google Slides" },
    { value: "IF_Campus", text: "Infinite Campus" },
    { value: "IXL", text: "IXL" },
    { value: "Khan", text: "Khan Academy" },
    { value: "Schoology", text: "Schoology" },
    { value: "Wikipedia", text: "Wikipedia" }
  ] })} <input id="custom-title" placeholder="Custom title" class="w-full h-9 px-3 mt-2 bg-white/5 border border-white/10 rounded text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-white/25 transition-all"> <input id="custom-icon" placeholder="Custom icon URL" class="w-full h-9 px-3 mt-2 bg-white/5 border border-white/10 rounded text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-white/25 transition-all"> ` })} ${renderComponent($$result2, "SettingsCard", $$SettingsCard, { "description": "Quick escape to another site", "title": "Panic Key", "Icon": $$Siren }, { "default": async ($$result3) => renderTemplate` <input id="key" placeholder="Key sequence (e.g. \`\`)" class="w-full h-9 px-3 bg-white/5 border border-white/10 rounded text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-white/25 transition-all"> <input id="link" placeholder="Redirect URL" class="w-full h-9 px-3 mt-2 bg-white/5 border border-white/10 rounded text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-white/25 transition-all"> ` })} ${renderComponent($$result2, "SettingsCard", $$SettingsCard, { "description": "Default search provider", "title": "Search Engine", "Icon": $$Search }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Dropdown", $$Dropdown, { "id": "engine", "text": "Select Engine", "menu": [
    { value: "Google", text: "Google" },
    { value: "DuckDuckGo", text: "DuckDuckGo" },
    { value: "Bing", text: "Bing" },
    { value: "Ecosia", text: "Ecosia" },
    { value: "Startpage", text: "Startpage" }
  ] })} <input id="custom-engine" placeholder="Custom search URL" class="w-full h-9 px-3 mt-2 bg-white/5 border border-white/10 rounded text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-white/25 transition-all"> ` })} ${renderComponent($$result2, "SettingsCard", $$SettingsCard, { "description": "Proxy backend engine", "title": "Proxy Engine", "Icon": $$Globe }, { "default": async ($$result3) => renderTemplate` <div class="flex flex-col gap-2 text-sm text-text-secondary"> <div class="flex items-center justify-between"> <span>Engine</span> <span id="proxy-engine-status" class="text-text">Scramjet</span> </div> <div class="flex items-center justify-between"> <span>Service Worker</span> <span id="proxy-sw-status" class="text-text-secondary">Checking...</span> </div> <div class="flex items-center justify-between"> <span>Transport</span> <span id="proxy-transport-status" class="text-text-secondary">Checking...</span> </div> </div> ` })} ${renderComponent($$result2, "SettingsCard", $$SettingsCard, { "description": "Top navigation layout", "title": "Navigation", "Icon": $$LayoutGrid }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Dropdown", $$Dropdown, { "id": "nav-style", "text": "Select Layout", "menu": [
    { value: "menu", text: "Menu" },
    { value: "inline", text: "Inline" }
  ] })} ` })} ${renderComponent($$result2, "SettingsCard", $$SettingsCard, { "description": "Visual appearance", "title": "Theme", "Icon": $$SwatchBook }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Dropdown", $$Dropdown, { "id": "theme", "text": "Select Theme", "menu": [
    { value: "Default", text: "Vault (Default)" },
    { value: "Black", text: "Void" },
    { value: "Midnight", text: "Midnight" },
    { value: "Ocean", text: "Cipher" },
    { value: "Forest", text: "Hedge" },
    { value: "Citrine", text: "Bullion" },
    { value: "Purple", text: "Quantum" },
    { value: "White", text: "Light" }
  ] })} ` })} <div id="admin-panel" class="hidden"> ${renderComponent($$result2, "SettingsCard", $$SettingsCard, { "description": "Create and manage user accounts", "title": "User Management", "Icon": $$Users }, { "default": async ($$result3) => renderTemplate` <form id="add-user-form" class="space-y-2.5"> <input id="new-username" placeholder="Username" required class="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"> <div class="relative"> <input id="new-password" type="password" autocomplete="new-password" placeholder="Password" required minlength="6" class="w-full h-10 px-3 pr-10 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"> <button type="button" id="toggle-password-visibility" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-placeholder hover:text-text transition-colors" aria-label="Show password"> ${renderComponent($$result3, "Eye", $$Eye, { "id": "pw-eye", "class": "w-4 h-4", "stroke-width": "1.5" })} ${renderComponent($$result3, "EyeOff", $$EyeOff, { "id": "pw-eyeoff", "class": "w-4 h-4 hidden", "stroke-width": "1.5" })} </button> </div> <p class="text-xs text-text-secondary">Password must be at least 6 characters.</p> <button id="add-user-btn" type="submit" class="w-full h-10 mt-1 rounded-lg bg-accent/15 text-accent font-semibold hover:bg-accent/25 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"> ${renderComponent($$result3, "UserPlus", $$UserPlus, { "class": "w-4 h-4", "stroke-width": "1.5" })} <span>Add User</span> </button> </form> <div class="mt-5"> <div class="flex items-center justify-between mb-2.5"> <p class="text-xs text-text-secondary uppercase font-semibold tracking-wider">Users</p> <span id="user-count" class="text-xs text-text-secondary/70 font-mono">0</span> </div> <div id="user-search-wrapper" class="relative mb-2.5"> <input id="user-search" type="text" placeholder="Filter users..." autocomplete="off" class="w-full h-9 pl-8 pr-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"> ${renderComponent($$result3, "Search", $$Search, { "class": "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none", "stroke-width": "1.5" })} </div> <ul id="user-list" class="space-y-1.5 text-sm text-text"> <li class="text-text-secondary text-xs italic py-2">Loading...</li> </ul> </div> ` })} </div> </div> </div>  <div id="reset-pw-modal" class="hidden fixed inset-0 z-[10000] flex items-center justify-center px-4"> <div id="reset-pw-overlay" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div> <div class="relative w-full max-w-sm rounded-2xl border border-white/10 bg-background/95 backdrop-blur-md shadow-2xl p-6 space-y-4"> <div class="flex items-center gap-2.5"> <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent"> ${renderComponent($$result2, "KeyRound", $$KeyRound, { "class": "w-4 h-4", "stroke-width": "1.5" })} </div> <div> <h3 class="text-sm font-semibold text-text uppercase tracking-wide font-display">Reset Password</h3> <p class="text-xs text-text-secondary mt-0.5">for <span id="reset-pw-username" class="text-text font-medium"></span></p> </div> </div> <form id="reset-pw-form" class="space-y-3"> <div class="relative"> <input id="reset-pw-input" type="password" autocomplete="new-password" placeholder="New password" required minlength="6" class="w-full h-10 px-3 pr-10 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all"> <button type="button" id="reset-pw-toggle" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-placeholder hover:text-text transition-colors" aria-label="Show password"> ${renderComponent($$result2, "Eye", $$Eye, { "id": "reset-pw-eye", "class": "w-4 h-4", "stroke-width": "1.5" })} ${renderComponent($$result2, "EyeOff", $$EyeOff, { "id": "reset-pw-eyeoff", "class": "w-4 h-4 hidden", "stroke-width": "1.5" })} </button> </div> <p class="text-xs text-text-secondary">Password must be at least 6 characters.</p> <div class="flex gap-2 pt-1"> <button type="button" id="reset-pw-cancel" class="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 text-text-secondary font-medium hover:bg-white/10 transition-all text-sm">
Cancel
</button> <button type="submit" id="reset-pw-submit" class="flex-1 h-10 rounded-lg bg-accent/15 text-accent font-semibold hover:bg-accent/25 active:scale-[0.98] transition-all text-sm">
Reset
</button> </div> </form> </div> </div> ${renderScript($$result2, "/Users/arman/Documents/GitHub/armsn/src/pages/settings.astro?astro&type=script&index=0&lang.ts")} ${renderScript($$result2, "/Users/arman/Documents/GitHub/armsn/src/pages/settings.astro?astro&type=script&index=1&lang.ts")} ` })}`;
}, "/Users/arman/Documents/GitHub/armsn/src/pages/settings.astro", void 0);

const $$file = "/Users/arman/Documents/GitHub/armsn/src/pages/settings.astro";
const $$url = "/settings";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Settings,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
