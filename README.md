# Hrishikesh Arun, portfolio

Personal portfolio site. Vanilla JavaScript, no framework, built with Vite.

Live sections: hero, about, selected work, experience, capabilities, contact.

## Running it

Requires Node 20.19 or newer.

```bash
npm install
```

```bash
npm run dev
```

That starts the Vite dev server on http://localhost:5173 with hot reload.

To produce the static build in `dist/`:

```bash
npm run build
```

To serve that build locally exactly as it will be hosted:

```bash
npm run preview
```

## How it is put together

Four things are doing the visible work. They are deliberately kept in separate
modules because they fail independently.

### 1. Hero background, `src/shader.js`

A hand written WebGL2 fragment shader. It draws one oversized triangle covering
the viewport and generates the whole image in the fragment stage, so nothing is
loaded and nothing is textured.

The effect is domain warped fractal Brownian motion: six octaves of value noise
are summed into `fbm`, then `fbm` is sampled through itself twice. `q` warps the
coordinates used to compute `r`, and `r` warps the coordinates of the final
sample. That double indirection is what turns smooth noise into the folded,
smoke like structure. A little per pixel grain is added at the end because the
gradient bands visibly without it.

The palette is one line. `HUE` near the top of the file is an HSV triple, and
every colour in the shader is derived from it. Change that array to reskin the
hero.

The draw loop pauses via `IntersectionObserver` whenever the hero scrolls out of
view, so the GPU is idle for most of the page. If WebGL2 is unavailable the
module logs a warning and returns `false`, leaving an empty canvas behind the
vignette. Nothing else on the page depends on it.

### 2. Smooth scroll, `src/scroll.js`

Lenis owns the scroll position and is driven from the GSAP ticker rather than
its own animation frame loop. This matters: if Lenis and GSAP each run their own
loop, ScrollTrigger reads a scroll position that Lenis is about to change on the
same frame, and pinned sections judder. One ticker, one frame, one read.

`gsap.ticker.lagSmoothing(0)` is set so that GSAP does not try to catch up after
a long frame, which would otherwise teleport the scroll position.

Anchor links in the nav are routed through `lenis.scrollTo`, because a native
hash jump desynchronises Lenis from the real scroll position.

### 3. The arc, `src/arc.js`

The work section pins and scroll progress drives a floating centre index across
the project list. Each item is offset horizontally by

```
CURVE * (1 - cos(distanceFromCentre * 0.38))
```

Items near the centre barely move and distant ones swing out hard, which traces
the red arc sitting behind the list. Opacity and scale fall off linearly with
distance and are clamped so the ends of the list never vanish completely. Raise
`CURVE` for a tighter whirlpool.

Below 901px the pin is dropped and the list becomes tappable instead.

### 4. Cursor, `src/cursor.js`

The dot chases the pointer on the GSAP ticker rather than being tweened per
mousemove. `mousemove` only ever writes a target coordinate, so a fast flick
costs two assignments instead of spawning a tween per event. Hidden by CSS on
touch devices and below 861px.

## Project data

The six projects live in `src/data/projects.js` as a single array and are
rendered into the DOM at runtime by `src/arc.js`. To add, remove or reorder a
project, edit that array only. Nothing else needs to change, and the arc maths
adapts to the new length automatically.

Each entry takes `title`, `year`, `image`, `description` and `tags`. Set `image`
to `null` to show the text placeholder instead of a preview, or point it at a
file in `public/assets/` using the `asset()` helper at the top of the file.

## Layout

```
index.html            markup only
public/assets/        photographs, copied to the build as is
src/
  main.js             entry point and boot order
  shader.js           GLSL and WebGL2 setup
  scroll.js           Lenis and ScrollTrigger
  arc.js              pinned project list
  cursor.js           lerped cursor
  style.css           all styles
  data/projects.js    the six projects
```

Boot order in `main.js` is load bearing. Smooth scroll must be initialised
before anything creates a ScrollTrigger, text splitting must happen before the
reveals query the spans it creates, and the cursor must run after the arc so
that it binds hover handlers to the project items.

## Dependencies

GSAP and Lenis are pinned to exact versions rather than ranges. Both were tuned
by feel, and a patch bump to either can change easing or scroll behaviour in
ways that are hard to notice and annoying to track down.

## Deploying

`npm run build` outputs a fully static `dist/`. `base` is set to `./` in
`vite.config.js`, so the build works from a domain root and from a repository
subpath such as `username.github.io/portfolio/` without changes.

Fonts are loaded from Fontshare and Google Fonts at runtime and are the only
external requests the page makes.
