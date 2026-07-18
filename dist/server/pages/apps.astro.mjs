import { c as createComponent, r as renderComponent, b as renderScript, a as renderTemplate, d as createAstro, m as maybeRenderHead } from '../chunks/astro/server_zxv3i2-L.mjs';
import 'piccolore';
import fs from 'node:fs';
import path from 'node:path';
import { p as parseAssetCookie, $ as $$PlusCircle, a as $$AssetCard, b as $$SkeletonCard } from '../chunks/assets_CZwuq9xq.mjs';
import { $ as $$Search } from '../chunks/Search_HvdqiJRs.mjs';
import { $ as $$Main } from '../chunks/Main_YddQx75n.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Apps = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Apps;
  const local = path.resolve("./public/assets/json/Apps.json");
  let apps;
  try {
    const data = fs.readFileSync(local, "utf-8");
    apps = JSON.parse(data);
  } catch (error) {
    apps = [];
  }
  const customApps = parseAssetCookie(Astro2.cookies, "app");
  const filteredApps = apps.filter((a) => !/forms\.gle|docs\.google\.com\/forms/i.test(a.link ?? "") && !/^\s*!\s*.*request/i.test(a.name));
  const all = [...customApps, ...filteredApps].sort((a, b) => {
    if (a.custom && !b.custom) return -1;
    if (!a.custom && b.custom) return 1;
    return a.name.localeCompare(b.name);
  });
  return renderTemplate`${renderComponent($$result, "Layout", $$Main, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col items-center pt-24 pb-12 px-4"> <div class="text-center mb-8 animate-fade-in"> <h1 class="text-3xl font-light tracking-tight text-text uppercase font-display">Apps</h1> <p class="mt-1 text-text-secondary text-sm">${all.length} available</p> </div> <div class="flex items-center gap-3 mb-8 animate-fade-in" style="animation-delay: 0.1s;"> <div class="relative group"> ${renderComponent($$result2, "Search", $$Search, { "class": "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder group-focus-within:text-accent transition-colors", "strokeWidth": 1.5 })} <input id="search" placeholder="Search" class="w-64 h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-white/25 transition-all"> </div> <button class="flex items-center gap-2 h-9 px-4 bg-white/5 border border-white/10 rounded text-sm text-text-secondary hover:text-text hover:bg-white/10 hover:border-white/20 transition-all" id="add-asset" data-type="app"> ${renderComponent($$result2, "PlusCircle", $$PlusCircle, { "class": "w-4 h-4", "strokeWidth": 1.5 })} <span>Add</span> </button> </div> <div id="container" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full max-w-6xl stagger"> ${all.map((app) => renderTemplate`${renderComponent($$result2, "AssetCard", $$AssetCard, { "asset": app, "assetType": "app" })}`)} <div id="skeleton-container" class="contents hidden"> ${renderComponent($$result2, "SkeletonCard", $$SkeletonCard, { "count": 6 })} </div> </div> </div> ` })} ${renderScript($$result, "/Users/arman/Documents/GitHub/armsn/src/pages/apps.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/arman/Documents/GitHub/armsn/src/pages/apps.astro", void 0);

const $$file = "/Users/arman/Documents/GitHub/armsn/src/pages/apps.astro";
const $$url = "/apps";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Apps,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
