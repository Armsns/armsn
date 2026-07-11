import { c as createComponent, e as addAttribute, a as renderScript, b as renderTemplate, d as createAstro, n as renderSlot, o as renderHead, r as renderComponent } from './astro/server_qhutUUez.mjs';
import 'piccolore';
/* empty css                        */
import 'clsx';

const $$Astro$1 = createAstro();
const $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ClientRouter;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "/Users/arman/Desktop/Arm$n/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/arman/Desktop/Arm$n/node_modules/astro/components/ClientRouter.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Layout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><meta name="generator"', '><meta name="theme-color" content="#0a0d0a"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link id="icon" rel="shortcut icon" href="/favicon.svg"><title>ARM$N</title>', "", '<script src="/assets/js/analytics.js" defer><\/script>', "", '</head> <body class="noise"> ', " </body></html>"])), addAttribute(Astro2.generator, "content"), renderComponent($$result, "ClientRouter", $$ClientRouter, {}), renderScript($$result, "/Users/arman/Desktop/Arm$n/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"), renderScript($$result, "/Users/arman/Desktop/Arm$n/src/layouts/Layout.astro?astro&type=script&index=1&lang.ts"), renderHead(), renderSlot($$result, $$slots["default"]));
}, "/Users/arman/Desktop/Arm$n/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
