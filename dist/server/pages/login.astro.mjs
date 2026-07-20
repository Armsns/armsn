import { c as createComponent, r as renderComponent, d as renderScript, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B5uWz4y8.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_LoqxeHD5.mjs';
export { renderers } from '../renderers.mjs';

const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen flex items-center justify-center px-4 relative"> <div class="absolute inset-0 overflow-hidden pointer-events-none"> <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]"></div> </div> <div class="relative w-full max-w-md"> <div class="text-center mb-8"> <h1 class="text-4xl font-black tracking-tight text-text uppercase font-display">
ARM<span class="text-[#26de81] text-glow animate-dollar-shimmer">$</span>N
</h1> <p class="mt-2 text-text-secondary text-sm">Sign in to continue</p> </div> <form id="login-form" class="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl space-y-5"> <div class="space-y-2"> <label for="username" class="block text-sm font-medium text-text-secondary">Username</label> <input id="username" name="username" type="text" autocomplete="username" required class="w-full h-12 rounded-xl bg-white/[0.03] border border-white/10 px-4 text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all" placeholder="Enter your username"> </div> <div class="space-y-2"> <label for="password" class="block text-sm font-medium text-text-secondary">Password</label> <input id="password" name="password" type="password" autocomplete="current-password" required class="w-full h-12 rounded-xl bg-white/[0.03] border border-white/10 px-4 text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all" placeholder="Enter your password"> </div> <p id="login-error" class="hidden text-sm text-emerald-400 text-center"></p> <button type="submit" class="w-full h-12 rounded-xl bg-accent text-background font-semibold hover:bg-accent/90 transition-colors">
Sign in
</button> </form> </div> </div> ` })} ${renderScript($$result, "/Users/arman/Documents/GitHub/armsn/src/pages/login.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/arman/Documents/GitHub/armsn/src/pages/login.astro", void 0);

const $$file = "/Users/arman/Documents/GitHub/armsn/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
