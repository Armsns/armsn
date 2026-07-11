import { c as createComponent, r as renderComponent, m as maybeRenderHead, b as renderTemplate, d as createAstro, e as addAttribute, a as renderScript } from './astro/server_qhutUUez.mjs';
import 'piccolore';
import { b as $$ } from './Main_kDsPl02p.mjs';
import { $ as $$Image } from './_astro_assets_BAGfQhOg.mjs';
import Cookies from 'js-cookie';

const $$Astro$4 = createAstro();
const $$PlusCircle = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$PlusCircle;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "circle-plus", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<circle cx="12" cy="12" r="10"></circle> <path d="M8 12h8"></path> <path d="M12 8v8"></path> ` })}`;
}, "G:/armsn/armsn/node_modules/lucide-astro/dist/PlusCircle.astro", void 0);

const $$Astro$3 = createAstro();
const $$Ban = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$Ban;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "ban", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M4.929 4.929 19.07 19.071"></path> <circle cx="12" cy="12" r="10"></circle> ` })}`;
}, "G:/armsn/armsn/node_modules/lucide-astro/dist/Ban.astro", void 0);

const $$Astro$2 = createAstro();
const $$CircleAlert = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$CircleAlert;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "circle-alert", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<circle cx="12" cy="12" r="10"></circle> <line x1="12" x2="12" y1="8" y2="12"></line> <line x1="12" x2="12.01" y1="16" y2="16"></line> ` })}`;
}, "G:/armsn/armsn/node_modules/lucide-astro/dist/CircleAlert.astro", void 0);

const $$Astro$1 = createAstro();
const $$User = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$User;
  return renderTemplate`${renderComponent($$result, "Layout", $$, { "iconName": "user", ...Astro2.props }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path> <circle cx="12" cy="7" r="4"></circle> ` })}`;
}, "G:/armsn/armsn/node_modules/lucide-astro/dist/User.astro", void 0);

const $$Astro = createAstro();
const $$AssetCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AssetCard;
  const { asset, assetType } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="group relative" data-asset-card> <button type="button"${addAttribute(JSON.stringify(asset), "data-asset")} class="relative block w-full overflow-hidden rounded bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] transition-all text-left"${addAttribute(`Open ${asset.name}`, "aria-label")}> ${asset.image?.startsWith("/") ? renderTemplate`${renderComponent($$result, "Image", $$Image, { "loading": "lazy", "src": asset.image, "alt": asset.name, "height": 128, "width": 128, "class": "w-full aspect-square object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" })}` : renderTemplate`<img loading="lazy"${addAttribute(asset.image || "/favicon.svg", "src")}${addAttribute(asset.name, "alt")} class="w-full aspect-square object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300">`} <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"> <div class="absolute bottom-0 left-0 right-0 p-3"> <div class="flex items-center gap-1.5"> ${asset.custom && renderTemplate`${renderComponent($$result, "User", $$User, { "class": "w-3 h-3 text-accent", "strokeWidth": 1.5 })}`} ${asset.partial && renderTemplate`${renderComponent($$result, "CircleAlert", $$CircleAlert, { "class": "w-3 h-3 text-yellow-500", "strokeWidth": 1.5 })}`} ${asset.error && renderTemplate`${renderComponent($$result, "Ban", $$Ban, { "class": "w-3 h-3 text-red-500", "strokeWidth": 1.5 })}`} <span class="text-xs text-white font-medium truncate">${asset.name}</span> </div> </div> </div> </button> ${asset.custom && renderTemplate`<button type="button"${addAttribute(JSON.stringify({ type: assetType, id: asset.id, name: asset.name, link: asset.link, image: asset.image }), "data-asset-remove")} class="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"${addAttribute(`Remove ${asset.name}`, "aria-label")}>
✕
</button>`} </div> ${renderScript($$result, "G:/armsn/armsn/src/components/AssetCard.astro?astro&type=script&index=0&lang.ts")}`;
}, "G:/armsn/armsn/src/components/AssetCard.astro", void 0);

function getRoute(name) {
  const routeMap = window._0;
  return routeMap?.[name] ? `/${routeMap[name]}` : `/${name}`;
}
function getObfId(name) {
  const codeMap = window._2;
  return codeMap?.[name] ?? name;
}

function parseAssetCookie(cookies, type) {
  try {
    const parsed = cookies.get(`asset.${type}`)?.json();
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.name === "string" && typeof item.image === "string");
  } catch {
    return [];
  }
}
function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function addAsset(name, link, type, image) {
  let currentAssets = [];
  try {
    currentAssets = JSON.parse(Cookies.get(`asset.${type}`) || "[]");
  } catch {
    currentAssets = [];
  }
  currentAssets.push({
    id: generateId(),
    name,
    link,
    image: image || "/icons/Custom.webp",
    custom: true
  });
  Cookies.set(`asset.${type}`, JSON.stringify(currentAssets), {
    path: "/",
    expires: new Date(Date.now() + 1e3 * 60 * 60 * 24 * 365)
  });
}
function removeAsset(type, payload) {
  let currentAssets = [];
  try {
    currentAssets = JSON.parse(Cookies.get(`asset.${type}`) || "[]");
  } catch {
    currentAssets = [];
  }
  const nextAssets = currentAssets.filter((asset) => {
    if (payload.id && asset.id) return asset.id !== payload.id;
    return !(asset.name === payload.name && asset.link === payload.link && asset.image === payload.image);
  });
  Cookies.set(`asset.${type}`, JSON.stringify(nextAssets), {
    path: "/",
    expires: new Date(Date.now() + 1e3 * 60 * 60 * 24 * 365)
  });
}
if (typeof window !== "undefined") {
  document.addEventListener("astro:page-load", () => {
    const assetAttr = getObfId("data-asset");
    const assetRemoveAttr = getObfId("data-asset-remove");
    const buttons = document.querySelectorAll(`[${assetAttr}]`);
    for (const button of buttons) {
      const handleActivate = () => {
        const assetData = button.getAttribute(assetAttr);
        if (!assetData) return;
        let asset;
        try {
          asset = JSON.parse(assetData);
        } catch {
          return;
        }
        if (asset.say) alert(asset.say);
        if (asset.link) {
          sessionStorage.setItem("goUrl", asset.link);
          return location.replace(getRoute("tabs"));
        }
        if (asset.links) {
          const selection = prompt(`Select a link to go to: ${asset.links.map(({ name }, idx) => `
${name}: ${idx + 1}`).join("")}`);
          if (!selection) return;
          const link = asset.links[Number.parseInt(selection, 10) - 1];
          if (!link) return alert("Invalid selection");
          sessionStorage.setItem("goUrl", link.url);
          return location.replace(getRoute("tabs"));
        }
      };
      button.addEventListener("click", (event) => {
        if (event.defaultPrevented) return;
        const target = event.target;
        if (target?.closest(`[${assetRemoveAttr}]`)) return;
        handleActivate();
      });
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleActivate();
        }
      });
    }
    const handleRemove = (target) => {
      if (!target) return;
      const raw = target.getAttribute(assetRemoveAttr);
      if (!raw) return;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }
      if (!parsed.type || parsed.type !== "games" && parsed.type !== "app") return;
      removeAsset(parsed.type, parsed);
      const card = target.closest(`[${assetAttr}]`) || target.closest("[data-asset-card]");
      if (card instanceof HTMLElement) card.remove();
    };
    const removeButtons = document.querySelectorAll(`[${assetRemoveAttr}]`);
    for (const button of removeButtons) {
      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
          handleRemove(button);
        },
        { capture: true }
      );
    }
    const assetAdd = document.getElementById(getObfId("add-asset"));
    if (assetAdd) {
      assetAdd.addEventListener("click", async () => {
        const type = assetAdd.getAttribute("data-type");
        if (!type || type !== "games" && type !== "app") return;
        const name = prompt(`Enter the name of the ${type}`)?.trim() || "";
        if (!name) return alert("Invalid name");
        const link = prompt(`Enter the link of the ${type} (must include http:// or https://)`)?.trim() || "";
        if (!link) return alert("Invalid link");
        let image = prompt("Enter an image URL (optional)")?.trim() || "";
        if (image && !image.startsWith("/") && !/^https?:\/\//i.test(image)) {
          image = "";
        }
        try {
          const url = new URL(link);
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            return alert("Invalid link: only HTTP and HTTPS URLs are allowed");
          }
        } catch {
          return alert("Invalid link: please enter a valid URL including https://");
        }
        addAsset(name, link, type, image || void 0);
        location.reload();
      });
    }
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target;
        if (!target) return;
        const button = target.closest(`[${assetRemoveAttr}]`);
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        handleRemove(button);
      },
      { capture: true }
    );
    const search = document.getElementById(getObfId("search"));
    const container = document.getElementById(getObfId("container"));
    const all = container ? Array.from(container.children) : [];
    if (search) {
      let searchTimeout;
      const filterCards = (query) => {
        const lowerQuery = query.toLowerCase();
        for (const card of all) {
          const span = card.querySelector("span");
          const name = span?.textContent ? span.textContent.toLowerCase() : "";
          card.style.display = name.includes(lowerQuery) ? "" : "none";
        }
      };
      search.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        const target = e.target;
        searchTimeout = setTimeout(() => filterCards(target.value), 150);
      });
      search.addEventListener("keydown", (e) => {
        if (e.key === "Enter") e.preventDefault();
      });
    }
  });
}

export { $$PlusCircle as $, $$AssetCard as a, parseAssetCookie as p };
