/* ============================================================
   CIRCLE GALLERY — 3D orbiting project tiles

   A pinned section where every project tile travels a full 360
   degree orbit through 3D space as you scroll.

   Three things stack to make it work:

   1. ORBIT. The pin wrapper carries a CSS perspective. Each tile
      is placed with translate3d(x,y,z) where x and z trace a
      circle and y is derived from z. Deriving y from z is what
      tilts the ring towards the viewer rather than leaving it
      flat side on. z also drives zIndex so tiles sort correctly
      against each other without any depth buffer.

   2. STAGGER. Tile i runs at progress * totalRange - i * STAGGER,
      so each one trails the last around the ring instead of the
      whole set moving as a block.

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
import { projects } from './data/projects.js';

const SLICES = 10; /* vertical cuts per image tile, more = smoother curve */
const STAGGER = 0.09; /* normalised offset between consecutive tiles */
const ENTRY_END = 0.12; /* tile has finished sliding in by here */
const EXIT_START = 0.88; /* tile starts sliding out here */
const FADE = 0.06; /* fraction of a tile's life spent fading */
const PHRASE_START = 0.25;
const PHRASE_END = 0.75;
const PHRASE_TRAVEL = 200; /* px of vertical drift across the phrase */
const BLUR = 8; /* px blur each word resolves from */

export function initGallery() {
  const section = document.getElementById('gallery');
  const pin = document.getElementById('gallery-pin');
  const phrase = document.getElementById('cg-phrase');
  if (!section || !pin || !phrase) return;

  /* The arc uses the same breakpoint. Below it the section is hidden by
     CSS and we never build the tiles at all. */
  if (!matchMedia('(min-width:901px)').matches) return;

  const vw = innerWidth;
  const tileW = Math.min(Math.max(150, vw * 0.16), 240);
  const tileH = (tileW * 2) / 3;

  /* Orbit radii. rx is wider than rz so the ring reads as an ellipse in
     perspective rather than a circle seen head on. */
  const rx = vw * 0.34;
  const rz = 500;
  const tiltY = 180;
  const offX = vw * 0.85; /* how far off screen tiles enter and exit */
  const entryAngle = Math.PI / 2;

  /* Cylinder geometry for the bend. The radius is the mean of the two
     orbit radii so the curve of a tile matches the curve of its path. */
  const cylR = (rx + rz) / 2;
  const sliceW = tileW / SLICES;
  const stepDeg = (tileW / cylR) * (180 / Math.PI) / SLICES;

  /* ---------- build tiles ---------- */
  const tiles = projects.map((project) => {
    const tile = document.createElement('div');
    tile.className = 'cg-tile';
    tile.style.width = `${tileW.toFixed(1)}px`;
    tile.style.height = `${tileH.toFixed(1)}px`;

    if (project.image) {
      /* Bent photograph: reassemble it from rotated vertical slices. */
      tile.classList.add('cg-tile-img');
      for (let s = 0; s < SLICES; s++) {
        const slice = document.createElement('div');
        slice.className = 'cg-slice';
        const w = sliceW + 1.5; /* overlap hides subpixel gaps between slices */
        slice.style.width = `${w.toFixed(1)}px`;
        slice.style.marginLeft = `${(-w / 2).toFixed(1)}px`;
        slice.style.backgroundImage = `url(${project.image})`;
        slice.style.backgroundSize = `${tileW.toFixed(1)}px ${tileH.toFixed(1)}px`;
        slice.style.backgroundPosition = `${(-s * sliceW).toFixed(1)}px 0`;
        slice.style.transformOrigin = `50% 50% ${(-cylR).toFixed(1)}px`;
        slice.style.transform = `rotateY(${((s - (SLICES - 1) / 2) * stepDeg).toFixed(2)}deg)`;
        tile.appendChild(slice);
      }
    } else {
      /* Typographic tile, mirroring the image-or-placeholder pattern the
         work panel already uses. */
      const card = document.createElement('div');
      card.className = 'cg-card';
      const year = document.createElement('span');
      year.className = 'cg-year';
      year.textContent = project.year;
      const name = document.createElement('span');
      name.className = 'cg-name';
      name.textContent = project.title.toUpperCase();
      const tag = document.createElement('span');
      tag.className = 'cg-tag';
      tag.textContent = project.tags[0];
      card.append(year, name, tag);
      tile.appendChild(card);
    }

    tile.style.opacity = '0';
    pin.appendChild(tile);
    return tile;
  });

  const totalRange = 1 + STAGGER * (tiles.length - 1);

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
        const t = progress * totalRange - i * STAGGER;

        if (t <= 0 || t >= 1) {
          tile.style.opacity = '0';
          return;
        }

        let alpha = 1;
        if (t < FADE) alpha = t / FADE;
        else if (t > 1 - FADE) alpha = (1 - t) / FADE;

        const pos = getPos(t);
        tile.style.transform =
          `translate3d(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px,${pos.z.toFixed(1)}px)` +
          ` rotateY(${((pos.rotY * 180) / Math.PI).toFixed(1)}deg)`;
        tile.style.opacity = alpha;
        tile.style.zIndex = Math.round(pos.z + 600);
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
