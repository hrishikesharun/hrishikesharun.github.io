/* ============================================================
   CIRCLE GALLERY, 3D orbiting project tiles

   A pinned section where every project tile travels a full 360
   degree orbit through 3D space as you scroll.

   Three things stack to make it work:

   1. ORBIT. The pin wrapper carries a CSS perspective. Each tile
      is placed with translate3d(x,y,z) where x and z trace a
      circle and y is derived from z. Deriving y from z is what
      tilts the ring towards the viewer rather than leaving it
      flat side on. z also drives zIndex so tiles sort correctly
      against each other without any depth buffer.

   2. STAGGER. Tile i runs at progress * totalRange - i * stagger,
      so each one trails the last around the ring instead of the
      whole set moving as a block. The stagger is derived from
      SPREAD rather than fixed, so the fan covers the same arc
      whatever the tile count.

   3. BEND. A flat photograph on a curved path still reads flat.
      Tiles that carry an image are cut into vertical slices, each
      slice showing one band of the image through background
      position, each rotated about an origin pushed back along z.
      That wraps the photo onto a cylinder so it curves with the
      orbit. Text tiles stay flat planes, because slicing live
      text would show seams at every cut.

   Desktop only, matching the breakpoint the arc uses.
   ============================================================ */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { projects, galleryExtras } from './data/projects.js';

const SLICES = 10; /* vertical cuts per image tile, more = smoother curve */
const MIN_TILES = 2; /* below this the ring looks broken, so hide the section */
/* How much of the orbit the tiles fan across, in normalised time. The first
   build used 6 tiles at 0.09 apart, so 5 * 0.09 = 0.45, which spreads them
   over 0.45/0.76 of a revolution, about 213 degrees of arc. Deriving the
   stagger from this instead of fixing it means any number of tiles fans
   across the same span. With a fixed stagger a short list bunches together
   near the entry, where y is at its lowest and perspective magnifies most,
   which is what made the tiles look oversized and too low. */
const SPREAD = 0.45;
const PERSP = 1200; /* must match the perspective on .gallery-pin in the CSS */
const CAP_H = 66; /* room the caption occupies below a tile */
const EDGE_MARGIN = 26; /* breathing room above and below the ring */
const TILT_MAX = 170; /* how far the ring may lean when there is height to spare */
const TILT_MIN = 45; /* below this the ring reads flat rather than tilted */
const ENTRY_END = 0.12; /* tile has finished sliding in by here */
const EXIT_START = 0.88; /* tile starts sliding out here */
const FADE = 0.06; /* fraction of a tile's life spent fading */
const PHRASE_START = 0.25;
const PHRASE_END = 0.75;
const PHRASE_TRAVEL = 200; /* px of vertical drift across the phrase */
const BLUR = 8; /* px blur each word resolves from */

export async function initGallery() {
  const section = document.getElementById('gallery');
  const pin = document.getElementById('gallery-pin');
  const phrase = document.getElementById('cg-phrase');
  if (!section || !pin || !phrase) return;

  /* The arc uses the same breakpoint. Below it the section is hidden by
     CSS and we never build the tiles at all. */
  if (!matchMedia('(min-width:901px)').matches) return;

  const vw = innerWidth;
  const vh = innerHeight;
  const tileW = Math.min(Math.max(170, vw * 0.175), 260);
  const tileH = (tileW * 2) / 3;

  /* Orbit radii. rx is wider than rz so the ring reads as an ellipse in
     perspective rather than a circle seen head on. rz also sets how hard
     the perspective magnifies at the near point, so it is kept well under
     the CSS perspective distance. */
  const rx = vw * 0.34;
  const rz = 420;
  const offX = vw * 0.85; /* how far off screen tiles enter and exit */
  const entryAngle = Math.PI / 2;

  /* Assigned once the tiles exist, because it depends on how tall the
     tallest one turned out. See the fit calculation below. */
  let tiltY = 0;

  /* Cylinder geometry for the bend. The radius is the mean of the two
     orbit radii so the curve of a tile matches the curve of its path. */
  const cylR = (rx + rz) / 2;
  /* Every tile is given the same AREA rather than the same box, then takes
     its own image's aspect ratio. Nothing is letterboxed and nothing is
     cropped, a wide screenshot gets a wide tile and a tall diagram gets a
     tall one, and they still carry equal visual weight in the ring. */
  const AREA = tileW * tileH;
  const MAX_W = tileW * 1.45;
  const MAX_H = tileH * 1.5;

  /* ---------- collect the images ---------- */
  /* One project can contribute several tiles. The arc reads project.image,
     the ring walks project.gallery when present so a build photo and a CAD
     sheet can both orbit while still belonging to the same entry. */
  const wanted = [...projects, ...galleryExtras].flatMap((p) => {
    const list = p.gallery || (p.image ? [p.image] : []);
    return list.map((src) => ({ project: p, src }));
  });

  /* Measure first. A src that fails to load is dropped rather than left as
     an empty ghost tile, which also means paths can be wired ahead of the
     files existing: each one joins the ring the moment it is saved. */
  const measured = (
    await Promise.all(
      wanted.map(
        (item) =>
          new Promise((resolve) => {
            const probe = new Image();
            probe.onload = () =>
              resolve({ ...item, natW: probe.naturalWidth, natH: probe.naturalHeight });
            probe.onerror = () => resolve(null);
            probe.src = item.src;
          })
      )
    )
  ).filter(Boolean);

  if (measured.length < MIN_TILES) {
    section.remove();
    return;
  }

  const tiles = measured.map(({ project, src, natW, natH }) => {
    const tile = document.createElement('div');
    tile.className = 'cg-tile';

    /* Equal area, native aspect, then clamped without distorting. An optional
       per-project scale lets a flagship piece carry more weight than the rest
       of the ring. Squaring it keeps scale a multiplier on the edge lengths
       rather than on the area. */
    const k = project.scale || 1;
    const ratio = natW / natH;
    let w = Math.sqrt(AREA * k * k * ratio);
    let h = Math.sqrt((AREA * k * k) / ratio);
    const clamp = Math.min(1, (MAX_W * k) / w, (MAX_H * k) / h);
    w *= clamp;
    h *= clamp;

    tile.style.width = `${w.toFixed(1)}px`;
    tile.style.height = `${h.toFixed(1)}px`;

    const sliceW = w / SLICES;
    const stepDeg = ((w / cylR) * (180 / Math.PI)) / SLICES;

    /* Reassemble the image from rotated vertical slices to bend it onto a
       cylinder, so it curves with the orbit instead of reading as a flat
       card on a curved path. */
    for (let s = 0; s < SLICES; s++) {
      const slice = document.createElement('div');
      slice.className = 'cg-slice';
      const sw = sliceW + 1.5; /* overlap hides subpixel gaps between slices */
      slice.style.width = `${sw.toFixed(1)}px`;
      slice.style.marginLeft = `${(-sw / 2).toFixed(1)}px`;
      slice.style.backgroundImage = `url(${src})`;
      slice.style.backgroundSize = `${w.toFixed(1)}px ${h.toFixed(1)}px`;
      slice.style.backgroundPosition = `${(-s * sliceW).toFixed(1)}px 0`;
      slice.style.transformOrigin = `50% 50% ${(-cylR).toFixed(1)}px`;
      slice.style.transform = `rotateY(${((s - (SLICES - 1) / 2) * stepDeg).toFixed(2)}deg)`;
      /* Diagrams exported on white need inverting or they punch a hole in
         the dark page. Set invert: true on the project to opt in. */
      if (project.invert) slice.style.filter = 'invert(1)';
      tile.appendChild(slice);
    }

    /* Caption rides below the tile. It sits outside the sliced surface so it
       stays crisp, and gets counter-rotated each frame in the update loop so
       the text always faces the viewer instead of turning edge on and
       mirroring as the tile spins. */
    const cap = document.createElement('div');
    cap.className = 'cg-cap';
    const capTitle = document.createElement('span');
    capTitle.className = 'cg-cap-title';
    capTitle.textContent = project.title;
    cap.appendChild(capTitle);
    if (project.blurb) {
      const capDesc = document.createElement('span');
      capDesc.className = 'cg-cap-desc';
      capDesc.textContent = project.blurb;
      cap.appendChild(capDesc);
    }
    tile.appendChild(cap);
    tile.__cap = cap;

    tile.style.opacity = '0';
    pin.appendChild(tile);
    return tile;
  });

  /* Fan the tiles across a fixed span of the orbit whatever the count, so a
     short list spreads out instead of bunching near the entry. */
  const stagger = tiles.length > 1 ? SPREAD / (tiles.length - 1) : 0;
  const totalRange = 1 + stagger * (tiles.length - 1);

  /* ---------- make the ring fit the viewport ----------
     The worst case for vertical overflow is the entry and exit phase: a tile
     is at its lowest, y = tiltY, at the same moment it is nearest the camera
     at z = rz, where perspective magnifies everything by PERSP/(PERSP - rz).
     Its caption hangs below it too. Rather than guess a tilt and hope, solve
     for the largest tilt whose lowest point still lands inside the viewport:

       (tiltY + tallestHalf + captionHeight) * nearScale  <=  vh/2 - MARGIN

     Hardcoding tiltY at 180 is what pushed the tiles off the bottom of the
     screen, so only their top halves were visible. */
  const tallestHalf = Math.max(...tiles.map((t) => parseFloat(t.style.height))) / 2;
  const nearScale = PERSP / (PERSP - rz);
  const budget = vh / 2 - EDGE_MARGIN;
  tiltY = Math.max(TILT_MIN, Math.min(TILT_MAX, budget / nearScale - tallestHalf - CAP_H));

  /* ---------- wrap phrase words so they can resolve individually ---------- */
  const words = [];
  const walker = document.createTreeWalker(phrase, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((w) => {
      if (/^\s+$/.test(w)) {
        frag.appendChild(document.createTextNode(w));
      } else if (w) {
        const span = document.createElement('span');
        span.className = 'cg-word';
        span.textContent = w;
        frag.appendChild(span);
        words.push(span);
      }
    });
    node.parentNode.replaceChild(frag, node);
  });

  /* ---------- position along the orbit ---------- */
  function getPos(t) {
    if (t <= ENTRY_END) {
      /* slide in from the left while moving away from the viewer */
      const p = t / ENTRY_END;
      return { x: -offX * (1 - p), y: tiltY, z: rz * p, rotY: 0 };
    }
    if (t <= EXIT_START) {
      /* the orbit proper: one full revolution, spinning as it goes */
      const p = (t - ENTRY_END) / (EXIT_START - ENTRY_END);
      const angle = entryAngle - p * Math.PI * 2;
      const z = Math.sin(angle) * rz;
      return {
        x: Math.cos(angle) * rx,
        y: (z / rz) * tiltY,
        z,
        rotY: p * Math.PI * 2,
      };
    }
    /* slide out to the right, returning towards the viewer */
    const p = (t - EXIT_START) / (1 - EXIT_START);
    return { x: offX * p, y: tiltY, z: rz * (1 - p), rotY: Math.PI * 2 };
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    pin,
    onUpdate: (self) => {
      const progress = self.progress;

      tiles.forEach((tile, i) => {
        const t = progress * totalRange - i * stagger;

        if (t <= 0 || t >= 1) {
          tile.style.opacity = '0';
          return;
        }

        let alpha = 1;
        if (t < FADE) alpha = t / FADE;
        else if (t > 1 - FADE) alpha = (1 - t) / FADE;

        const pos = getPos(t);
        const rotDeg = (pos.rotY * 180) / Math.PI;
        tile.style.transform =
          `translate3d(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px,${pos.z.toFixed(1)}px)` +
          ` rotateY(${rotDeg.toFixed(1)}deg)`;
        tile.style.opacity = alpha;
        tile.style.zIndex = Math.round(pos.z + 600);
        /* Undo the tile's spin so the caption stays readable and forward
           facing all the way round the orbit. */
        tile.__cap.style.transform = `rotateY(${(-rotDeg).toFixed(1)}deg)`;
      });

      /* ---------- phrase ---------- */
      if (progress < PHRASE_START || progress > PHRASE_END) {
        phrase.style.opacity = '0';
        return;
      }

      const p = (progress - PHRASE_START) / (PHRASE_END - PHRASE_START);
      phrase.style.transform = `translateY(${(PHRASE_TRAVEL * (0.5 - p)).toFixed(1)}px)`;

      const revealEnd = 0.4;
      if (p < revealEnd) {
        const revealP = p / revealEnd;
        words.forEach((w, wi) => {
          /* +4 lets the last word finish before the reveal window closes */
          const wp = Math.max(0, Math.min(1, (revealP * (words.length + 4) - wi) / 3));
          w.style.opacity = wp;
          w.style.filter = `blur(${(BLUR * (1 - wp)).toFixed(1)}px)`;
        });
      } else {
        words.forEach((w) => {
          w.style.opacity = '1';
          w.style.filter = 'blur(0px)';
        });
      }

      let alpha = 1;
      if (p < 0.1) alpha = p / 0.1;
      else if (p > 0.75) alpha = (1 - p) / 0.25;
      phrase.style.opacity = alpha;
    },
  });
}
