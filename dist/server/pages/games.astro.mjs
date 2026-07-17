import { c as createComponent, r as renderComponent, a as renderScript, b as renderTemplate, d as createAstro, m as maybeRenderHead } from '../chunks/astro/server_qhutUUez.mjs';
import 'piccolore';
import fs from 'node:fs';
import path from 'node:path';
import { p as parseAssetCookie, $ as $$PlusCircle, a as $$AssetCard, b as $$SkeletonCard } from '../chunks/assets_CCgg8XQ1.mjs';
import { $ as $$Search } from '../chunks/Search_C2GKwJU4.mjs';
import { $ as $$Main } from '../chunks/Main_BE-5h5_F.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Games = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Games;
  const local = path.resolve("./public/assets/json/Games.json");
  let games;
  try {
    const data = fs.readFileSync(local, "utf-8");
    games = JSON.parse(data);
  } catch (error) {
    games = [];
  }
  const customGames = parseAssetCookie(Astro2.cookies, "games");
  const filteredGames = games.filter((g) => !/forms\.gle|docs\.google\.com\/forms/i.test(g.link ?? "") && !/^\s*!\s*.*request/i.test(g.name));
  const all = [...customGames, ...filteredGames].sort((a, b) => {
    if (a.custom && !b.custom) return -1;
    if (!a.custom && b.custom) return 1;
    return a.name.localeCompare(b.name);
  });
  return renderTemplate`${renderComponent($$result, "Layout", $$Main, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col items-center pt-24 pb-12 px-4"> <div class="text-center mb-8 animate-fade-in"> <h1 class="text-3xl font-light tracking-tight text-text uppercase font-display">Games</h1> <p class="mt-1 text-text-secondary text-sm">${all.length} available</p> </div> <div class="flex items-center gap-3 mb-8 animate-fade-in" style="animation-delay: 0.1s;"> <div class="relative group"> ${renderComponent($$result2, "Search", $$Search, { "class": "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder group-focus-within:text-accent transition-colors", "strokeWidth": 1.5 })} <input id="search" placeholder="Search" class="w-64 h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:border-white/25 transition-all"> </div> <button class="flex items-center gap-2 h-9 px-4 bg-white/5 border border-white/10 rounded text-sm text-text-secondary hover:text-text hover:bg-white/10 hover:border-white/20 transition-all" id="add-asset" data-type="games"> ${renderComponent($$result2, "PlusCircle", $$PlusCircle, { "class": "w-4 h-4", "strokeWidth": 1.5 })} <span>Add</span> </button> </div> <div id="container" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full max-w-6xl stagger"> ${all.map((game) => renderTemplate`${renderComponent($$result2, "AssetCard", $$AssetCard, { "asset": game, "assetType": "games" })}`)} <div id="skeleton-container" class="contents hidden"> ${renderComponent($$result2, "SkeletonCard", $$SkeletonCard, { "count": 6 })} </div> </div> </div> ` })} ${renderScript($$result, "/Users/arman/Desktop/Arm$n/src/pages/games.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/arman/Desktop/Arm$n/src/pages/games.astro", void 0);

const $$file = "/Users/arman/Desktop/Arm$n/src/pages/games.astro";
const $$url = "/games";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Games,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
