import { c as createComponent, r as renderComponent, a as renderScript, b as renderTemplate, m as maybeRenderHead, e as addAttribute } from '../chunks/astro/server_ClWiFMrX.mjs';
import 'piccolore';
import { $ as $$Main } from '../chunks/Main_DSyKPxh-.mjs';
export { renderers } from '../renderers.mjs';

const $$Chat = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Main, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col items-center pt-24 pb-12 px-4 min-h-screen"> <div class="text-center mb-8 animate-fade-in"> <h1 class="text-3xl font-normal tracking-tight text-text uppercase">Chat</h1> <p class="mt-1 text-text-secondary text-sm">Global chat room for logged-in users</p> </div> <div class="w-full max-w-2xl flex-1 flex flex-col gap-4 min-h-0"> <div id="chat-messages" class="flex-1 min-h-[400px] max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3"> <p class="text-center text-text-muted text-sm">Connecting to chat...</p> </div> <form id="chat-form" class="flex items-end gap-2"> <textarea id="chat-input"${addAttribute(1, "rows")} class="flex-1 min-h-[44px] max-h-32 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-2.5 text-text placeholder:text-text-placeholder focus:outline-none focus:border-accent/50 resize-none" placeholder="Type a message..." required></textarea> <button type="submit" class="h-11 px-5 rounded-xl bg-accent text-background font-semibold hover:bg-accent/90 transition-colors">
Send
</button> </form> </div> </div> ` })} ${renderScript($$result, "/Users/arman/Documents/GitHub/armsn/src/pages/chat.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/arman/Documents/GitHub/armsn/src/pages/chat.astro", void 0);

const $$file = "/Users/arman/Documents/GitHub/armsn/src/pages/chat.astro";
const $$url = "/chat";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Chat,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
