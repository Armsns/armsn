import { c as createComponent, r as renderComponent, a as renderScript, b as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_qhutUUez.mjs';
import 'piccolore';
import { $ as $$Search } from '../chunks/Search_ButUYSlr.mjs';
import { $ as $$Main } from '../chunks/Main_kDsPl02p.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Main, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex-1 flex flex-col items-center justify-center px-4 relative"> <div class="absolute inset-0 overflow-hidden pointer-events-none"> <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]"></div> </div> <div class="relative text-center"> <h1 class="text-6xl md:text-8xl font-black tracking-tighter mb-2 uppercase font-display"> <span class="text-text">ARM</span><span class="text-accent text-glow animate-dollar-shimmer">$</span><span class="text-text">N</span> </h1> <p class="text-xs md:text-sm uppercase tracking-[0.4em] text-accent/80 mb-8 font-display">finance · proxy · protocol</p> </div> <p id="tagline" class="relative min-h-[1.75rem] mb-8 -mt-6 text-base md:text-lg text-text-secondary/90 tracking-wide leading-6 opacity-0 transition-opacity duration-500"></p> <div class="relative w-full max-w-2xl"> <div class="relative group"> ${renderComponent($$result2, "Search", $$Search, { "class": "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary group-focus-within:text-accent transition-colors", "strokeWidth": 2 })} <input id="search" class="w-full h-14 pl-12 pr-5 rounded-xl bg-white/[0.03] border border-white/10 text-base text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] focus:shadow-glow transition-all" placeholder="Search or enter URL" type="search" autocomplete="off" spellcheck="false"> </div> <p class="mt-3 text-center text-xs text-text-muted">Press <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-text-secondary font-mono text-[10px]">Enter</kbd> to browse</p> </div> </div> ` })} ${renderScript($$result, "G:/armsn/armsn/src/pages/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "G:/armsn/armsn/src/pages/index.astro", void 0);

const $$file = "G:/armsn/armsn/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
