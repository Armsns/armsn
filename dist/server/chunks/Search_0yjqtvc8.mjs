import { c as createComponent, r as renderComponent, m as maybeRenderHead, b as renderTemplate, d as createAstro } from './astro/server_ClWiFMrX.mjs';
import 'piccolore';
import { b as $$ } from './Main_DSyKPxh-.mjs';

const $$Astro = createAstro();
const $$Search = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Search;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "search", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="m21 21-4.34-4.34"></path> <circle cx="11" cy="11" r="8"></circle> ` })}`;
}, "/Users/arman/Documents/GitHub/armsn/node_modules/lucide-astro/dist/Search.astro", void 0);

export { $$Search as $ };
