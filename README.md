# Emmanuel Uchenna — The Signal

An immersive WebGL portfolio. **The WebGL world is the website**: one fixed canvas, one render loop, and a thin HTML layer for text, navigation and forms.

> **Concept — "The Signal".** A single current of 262,144 particles is a raw idea. The camera rides it along a Lagos power grid, and at every station the current resolves into something real that shipped: the particles assemble your **actual project screenshots** pixel by pixel, then the sharp image resolves through a dissolve front.
> **Signature moment:** the particle cloud re-forming into a real product screenshot while the cursor-stirred fluid bends the whole screen.

Seven scenes, one camera spline: Ignition → Signal (the grid) → Lumora AI → TradePulse → AskDocs → VoltWatch AI → Contact.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build:static # ← DEPLOY BUILD: code-split, service worker, instant first paint
npm run build        # single self-contained dist/index.html (previews / hand-offs)
npm run typecheck
```

## It opens by itself

No gate, no "click to enter": the world boots and starts as soon as it is ready,
and everything is reachable by mouse-move and scroll with zero clicks.

The calm page takes over **only** for four concrete reasons, each with a
one-tap override so the choice stays the visitor's:

| Situation | What happens |
| --- | --- |
| WebGL or float buffers unavailable/blocked | calm page (never retries the engine) |
| Truly ancient device (single core, <1 GB, no `ResizeObserver`, viewport < 240 px) | calm page |
| `saveData`, `slow-2g`/`2g`, or < 0.35 Mbps | calm page instantly, "open anyway" offered |
| Engine download stalls on a 3g-class line (11 s) or on a good line (26 s) | calm page + honest note + **retry** (a retry gets 4× patience) |
| Device can't hold frame rate even at the lowest quality tier | stays immersive, but asks **once** whether to switch |

`prefers-reduced-motion` is **not** a reason to withhold the work. Those visitors
get the same world with the idle animation, colour splitting and inertial scroll
turned off, and native scrolling driving the journey.

Manual overrides: `?calm`, `?immersive`, and buttons in the corner bar and the
calm page (remembered in `sessionStorage`).

Useful URL flags:

| Flag | Effect |
| --- | --- |
| `?gui` (or press **g**) | lil-gui tuning panel: particles, fluid, lens, bloom, grain, quality tier |
| `?q=0..3` | force a quality tier (`&fixed` stops adaptive changes) |
| `?sim=128\|256\|512` | override the particle texture size (16k / 65k / 262k) |
| `?immersive` | bypass the reduced-motion fallback |

---

## What is in the world

| Layer | Implementation |
| --- | --- |
| **GPU fluid** | Stable-fluids solver (curl, vorticity, pressure, advection) stirred by the cursor with no clicks; an idle "ghost" and scroll speed also stir it. Its velocity bends the whole screen (refraction), pushes the particles, and ripples the screenshots and display type. |
| **GPGPU particles** | 262,144 particles (65,536 on phones) integrated in half-float render targets: curl-noise flow, a spring toward each scene's morph target, fluid push. Morph targets and colours live in 2D texture arrays. Re-forming is staggered per particle. |
| **The grid (procedural)** | `world/objects/Grid.ts` builds lattice pylons, sagging conductors, a landing ring per station, current sparks and blinking hazard beacons — merged into **two draw calls**, generated in JS at runtime, zero bytes on the wire. Rings brighten as you arrive at a station; conductors sway with scroll velocity. |
| **Contact mosaic** | the closing scene floats the four real project screenshots on an arc behind the portal, reusing the textures the project scenes already fetched — extra graphics, no extra requests. |
| **Typography in the scene** | Display type is rendered into the world (Instrument Serif), revealed line by line, and bent by the fluid. Real HTML copy sits alongside for SEO and screen readers. |
| **Custom shaders** | Grid floor with travelling current pulses, speed-line streaks driven by scroll velocity, the screenshot dissolve/refraction shader, and the post lens. |
| **Post-processing** | `postprocessing`: bloom, ACES tone mapping, vignette, grain, plus a custom effect for fluid refraction, scroll-velocity chromatic split, dye glow, per-scene grade and the **shader menu** wipe. |
| **Master timeline** | One GSAP timeline scrubbed by Lenis scroll progress. Camera spline position, scene morph, FOV and bloom are all tweens on it. Scroll *velocity* feeds the shaders. |
| **Cursor** | Context-aware ring with labels, magnetic buttons, hover bursts in the fluid. Disabled on touch. |
| **Audio (opt-in)** | Procedural Web Audio (no files): ambient drone that opens with scroll speed, hover ticks, scene whooshes. Off until the visitor chooses sound. |

---

## Structure

```
src/
├── main.tsx
├── data/studio.ts          ← ALL copy, projects, case-study text, links
├── assets/shots/*.webp     ← the real project screenshots (see "Swap in your own")
├── lib/
│   ├── motion.ts           Lenis scroller (page = invisible spacer → 0..1 progress)
│   └── cv.ts               print-ready CV generated from the same data
├── world/
│   ├── World.ts            the single renderer, loop, camera, adaptive quality
│   ├── config.ts           stations, camera offsets, layout shifts, grades, FOV, bloom
│   ├── timeline.ts         the GSAP master timeline
│   ├── Debug.ts            lil-gui panel
│   ├── scenes/             each scene is its own module
│   │   ├── ignition.ts     torus-knot of current + headline
│   │   ├── statement.ts    city-grid lattice with power towers
│   │   ├── project.ts      factory: screenshot → particles + plane + title
│   │   ├── contact.ts      the closing ring + "Let's talk."
│   │   └── types.ts
│   ├── objects/            TextPlane, ImagePlane, Floor, Streaks
│   ├── systems/            Fluid, Particles, Post, Quality, Audio, rt (render targets)
│   └── shaders/            GLSL as strings: fluid, particles, objects, post, common
└── ui/                     the thin HTML layer
    ├── App.tsx             boot sequence, routing, overlays, fallback detection
    ├── Panels.tsx  Hud.tsx  Menu.tsx  Loader.tsx  Cursor.tsx
    ├── CaseStudy.tsx  Dossier.tsx  ContactForm.tsx  Fallback.tsx  Split.tsx
```

---

## Swap in your own material

| To change… | Do this |
| --- | --- |
| **Copy, links, project text, limitations** | Edit `src/data/studio.ts`. |
| **A project screenshot** | Replace the file in `src/assets/shots/` (1200 px wide webp, ~72 quality). Use `cropTop` / `cropLeft` (percent) in `studio.ts` to trim browser chrome. The particles, the plane, the case study and the fallback all update together. |
| **Add a project** | Add an entry to `projects` in `studio.ts`, add a station + layout row in `world/config.ts`, bump `N` through `SCENES`. |
| **Colours** | `PALETTE` in `world/config.ts`, `:root` in `styles/global.css` (4 colours max). |
| **Camera path / pacing** | `stations`, `CAM`, `SHIFT` in `config.ts`; hold length in `timeline.ts`. |
| **The hero shape** | `world/scenes/ignition.ts` → `shape()` writes particle positions. |

### Optional upgrade: a modelled hero object

Everything runs on procedural shapes, so no external asset is required. If you want a modelled hero:

1. **Model it** in Blender (or Spline): a single mesh, ~3 units across, origin at its centre, applied transforms.
2. **Export** `.glb`, Draco-compressed, normals included, no textures, under ~2 MB.
3. **Place** it at `src/assets/models/hero.glb`.
4. In `ignition.ts`, load it with `GLTFLoader` and sample it into the morph target with `MeshSurfaceSampler`, writing positions in `shape()`. The procedural knot stays as the fallback.

If you later add a physical hero material (transmission/iridescence), use a 1k HDRI from Poly Haven (e.g. `studio_small_08`) in `public/hdr/` and `PMREMGenerator`. The current world is lit by its own light, not by an environment map.

---

## Performance and shaky networks

The deploy build (`npm run build:static`) is engineered so the page is usable
long before the 3D engine arrives, opens itself when it does, and keeps working
when the network drops.

| Stage | What arrives | Compressed |
| --- | --- | --- |
| **First paint** | `index.html` — critical CSS, the two fonts it preloads and a static boot screen, all in one file. No JS needed to see it | ~2.5 KB HTML |
| **Interactive shell** | React + Lenis/GSAP + UI: the live percentage loader, HUD, menu, every word of copy | ~115 KB |
| **The world** | three.js + postprocessing + the WebGL engine, fetched *after* that paints | ~162 KB |
| Everything else | screenshots (8 × ~24 KB webp), audio, lil-gui — lazy | on demand |

Self-hosted fonts (88 KB total, one variable file for Inter Tight) mean no
third-party request can block the text, and there are **zero** external image or
font hosts at runtime.

Measured on a simulated **slow 3G** line (400 kbps, 400 ms RTT) served with
brotli, exactly as Vercel/Netlify would compress it:

| | |
| --- | --- |
| first paint (boot screen with % counter) | **1.5 s** |
| interactive shell, live loader running | 5.7 s |
| WebGL world ready | 10.4 s |
| **opened by itself, zero clicks** | **11.0 s** |

Without compression the same run is ~3× slower, so deploy the `build:static`
output to a host that compresses.

**Offline and repeat visits.** A service worker precaches the entire build
(every chunk, font and screenshot) on the first visit. The second visit is
instant and the full 3D experience boots with the network completely off. Each
deploy gets a content-hashed cache name, so stale assets are evicted
automatically.

**Adaptive quality.** DPR is capped at 2. The world measures frame time and
walks down four tiers (resolution → particles → bloom) if fps drops; it never
climbs back, so it cannot flap. Visitors on `2g`/`3g` or with Data Saver on
start two tiers lower *before* the first frame. Phones get the same experience,
lighter: 65k particles, a 64×64 fluid grid, a portrait camera, no custom cursor.

**Caching headers** are set for Vercel (`vercel.json`) and Netlify
(`public/_headers`): hashed assets are immutable for a year; the HTML and
service worker always revalidate.

## Accessibility and fallbacks

- Real HTML text for every word; the animated character spans are `aria-hidden` with the full text in `aria-label`.
- Skip intro, a visible scroll hint, an always-reachable menu and scene dots, keyboard-operable overlays, Escape closes them, visible focus rings, contrast ≥ 7:1 for body copy.
- `prefers-reduced-motion` → a calm static page with the same content (with a button to opt back in). No WebGL / no float render targets → the same page.
- Case studies are shareable routes: `#case-lumora`, `#case-tradepulse`, `#case-askdocs`, `#case-voltwatch`.

---

## Deploy

**Vercel** — everything is already configured; no dashboard settings needed.

```bash
npm i -g vercel
vercel link      # once
vercel --prod    # deploy
vercel           # preview URL
```

`vercel.json` pins it: build `npm run build:static`, output `dist`, framework
`vite`, and the cache headers (hashed assets immutable for a year, `/sw.js` and
the HTML always revalidated). `package.json` declares `engines.node >= 20`
(Vercel builds on Node 22). `.gitignore` keeps `dist/` and `node_modules/` out.
Vercel applies brotli automatically, which is what the measured timings assume.

Nothing else to configure: routing is hash-based (`#case-lumora`), so no
rewrites are required, and there are no env vars or server functions.

**One caveat:** `npm run build` (single file) is for previews only — it references
`/fonts/*` from `public/`, so if you serve that HTML *alone* without the `dist`
folder, it falls back to local serif/sans. Deploy the `build:static` output.

**Netlify**

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```
```toml
# netlify.toml
[build]
  command = "npm run build:static"
  publish = "dist"
```

**Single file:** `npm run build` writes one `dist/index.html` with everything inlined. Drop it on any static host.

### Contact form
Messages go through FormSubmit to the studio inbox. The first time anyone submits, FormSubmit emails you a one-time activation link — **send yourself a test message and click it**. Success is only shown when the service confirms it.

---

## Honest limits

- Frame rate was verified structurally (adaptive tiers, off-screen pause, particle budgets) but **not on real GPU hardware** — the test environment is software-rendered. Tune with `?gui`.
- Depth of field and physical (transmission/iridescence) hero materials are **not** implemented; the world is particle-and-light based.
- Audio is built and wired but could not be listened to in the headless test environment.
- Fonts load from Google Fonts; offline, the serif/sans fallbacks are used.
