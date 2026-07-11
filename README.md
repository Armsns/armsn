# ARM$N

<p align="center">
  <span style="font-family: monospace; font-weight: 900; font-size: 2rem; color: #00ff80; letter-spacing: -0.05em;">ARM$N</span>
</p>

<p align="center">
  <em>Every dollar finds its way. A web proxy built on Scramjet.</em>
</p>

---

ARM$N is a high-performance web proxy designed to bypass internet censorship and web restrictions. It is a rebrand of [Interstellar-Astro](https://github.com/UseInterstellar/Interstellar-Astro), keeping the same modern stack (Astro + React + Fastify + Scramjet) under a new identity.

## Stack

- **Frontend**: Astro 5, React 19, Tailwind CSS
- **Backend**: Fastify
- **Proxy Engine**: [Scramjet](https://github.com/MercuryWorkshop/scramjet)
- **Transport**: [epoxy-transport](https://github.com/MercuryWorkshop/epoxy-transport) over [wisp-js](https://github.com/MercuryWorkshop/wisp-js)
- **Runtime**: Bun (preferred), Node.js (works)

## Features

- Multi-tab in-browser proxy with full URL bar
- About:Blank cloaking for stealth browsing
- Tab title + icon cloaker with preset disguises
- Panic key & panic link for instant escape
- Settings: themes, search engine, navigation layout
- Apps & Games shortcuts with custom asset support
- Service-Worker based proxy, no extension required
- Built-in obfuscation of routes and asset names

## Quick start

```bash
# install
bun install

# develop
bun run dev

# build + start
bun run start
```

By default the server listens on `http://localhost:8080`.

### Environment variables

| Variable          | Default | Description                                                       |
| ----------------- | ------- | ----------------------------------------------------------------- |
| `PORT`            | `8080`  | Port the server listens on                                        |
| `OBFUSCATE`       | `true`  | Disable to skip route/asset name obfuscation                      |
| `COMPRESS`        | `true`  | Disable to skip built-in compression                              |
| `AUTH_CHALLENGE`  | `false` | Enable HTTP basic auth for the whole site                         |
| `AUTH_USER`       | -       | Single basic-auth username (use with `AUTH_PASS`)                 |
| `AUTH_PASS`       | -       | Single basic-auth password                                        |
| `AUTH_USERS`      | -       | JSON object of `{ "user": "password" }` for multiple users        |

### Password protection

```bash
AUTH_CHALLENGE=true AUTH_USER=admin AUTH_PASS=hunter2 bun run start
# or
AUTH_CHALLENGE=true AUTH_USERS='{"admin":"hunter2","guest":"letmein"}' bun run start
```

## Theming

ARM$N ships with a default **Vault** theme (electric mint green on a deep black-green background). The settings page exposes additional themes: Void, Midnight, Cipher, Hedge, Bullion, Quantum, Light, plus the originals (Ocean, Forest, Sunset, Purple, Dusk, Rosewood, Citrine, Slate).

Themes live in `src/global.css` and can be customized by adding a `[data-theme="..."]` block.

## Project layout

```
src/
  components/     Reusable UI (Browser tabs, Dropdown, AssetCard, SettingsCard...)
  layouts/        Layout.astro (head/HTML shell), Main.astro (nav wrapper)
  lib/            Proxy + client-side helpers
  pages/          File-system routing (/, /apps, /games, /settings, /tabs)
  pages/scramjet  Scramjet integration routes
public/
  assets/         Static assets, JSON lists, scramjet binaries, favicons
index.ts          Fastify server entry
astro.config.ts   Astro config + vite plugins
tailwind.config.ts Tailwind theme tokens
src/global.css    Theme variables, base styles, keyframes
```

## Credits

ARM$N is built on top of [Interstellar-Astro](https://github.com/UseInterstellar/Interstellar-Astro) by the Interstellar team (MIT licensed). The proxy engine is [Scramjet](https://github.com/MercuryWorkshop/scramjet) by Mercury Workshop. ARM$N is just a rebrand — all credit goes to the original authors.

## License

MIT, same as Interstellar-Astro.
