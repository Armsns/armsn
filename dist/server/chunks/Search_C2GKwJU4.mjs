import { c as createComponent, r as renderComponent, m as maybeRenderHead, b as renderTemplate, d as createAstro } from './astro/server_qhutUUez.mjs';
import 'piccolore';
import { a as $$ } from './Main_BE-5h5_F.mjs';

const $$Astro = createAstro();
const $$Search = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Search;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "search", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="m21 21-4.34-4.34"></path> <circle cx="11" cy="11" r="8"></circle> ` })}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/lucide-astro/dist/Search.astro", void 0);

export { $$Search as $ };
