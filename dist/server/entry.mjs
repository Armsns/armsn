import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BVPPgBHV.mjs';
import { manifest } from './manifest_B_N0kOQx.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin.astro.mjs');
const _page2 = () => import('./pages/apps.astro.mjs');
const _page3 = () => import('./pages/e/_---slug_.astro.mjs');
const _page4 = () => import('./pages/games.astro.mjs');
const _page5 = () => import('./pages/login.astro.mjs');
const _page6 = () => import('./pages/scramjet/_---slug_.astro.mjs');
const _page7 = () => import('./pages/settings.astro.mjs');
const _page8 = () => import('./pages/tabs.astro.mjs');
const _page9 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/admin.astro", _page1],
    ["src/pages/apps.astro", _page2],
    ["src/pages/e/[...slug].ts", _page3],
    ["src/pages/games.astro", _page4],
    ["src/pages/login.astro", _page5],
    ["src/pages/scramjet/[...slug].ts", _page6],
    ["src/pages/settings.astro", _page7],
    ["src/pages/tabs.astro", _page8],
    ["src/pages/index.astro", _page9]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "middleware",
    "client": "file:///Users/arman/Documents/GitHub/armsn/dist/client/",
    "server": "file:///Users/arman/Documents/GitHub/armsn/dist/server/",
    "host": false,
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
