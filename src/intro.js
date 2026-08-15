/* ============================================================
   INTRO

   The page opens on the name and nothing else, then assembles
   around it:

   1. a single H, oversized, alone in the middle of a dark page
   2. the rest of Hrishikesh arrives after it, and the lockup
      scales down and recentres as it grows
   3. the name travels to where it actually lives, and the shader
      comes up behind it
   4. tagline, hero bar and nav follow it in

   The wordmark is never duplicated. It is the same element in all
   four beats, moved with a transform, which is why there is no
   crossfade anywhere and nothing has to be kept in sync.

   Measuring happens after document.fonts.ready. The lockup is set
   in a display face loaded over the network, so measuring before
   it arrives returns fallback metrics and every offset computed
   from them is wrong. The loader holds the page until then.
   ============================================================ */

import gsap from 'gsap';

const BIG = 2.0; /* scale of the opening character against its final size */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Split el into per-character masks.
 * @returns {HTMLElement[]} the inner spans, the things that actually move
 */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';

  return [...text].map((ch) => {
    const mask = document.createElement('span');
    mask.className = 'mask';
    const inner = document.createElement('span');
    inner.textContent = ch === ' ' ? ' ' : ch;
    mask.appendChild(inner);
    el.appendChild(mask);
    return inner;
  });
}

/**
 * Offsets that place a point of the wordmark at the centre of the viewport,
 * given a scale. Assumes transform-origin 0 0, so the maths stays a plain
 * affine map instead of having to account for a moving origin.
 */
function centreOn(rect, localX, localY, scale) {
  return {
    x: innerWidth / 2 - rect.left - scale * localX,
    y: innerHeight / 2 - rect.top - scale * localY,
  };
}

export async function initIntro() {
  const loader = document.getElementById('loader');
  const wordmark = document.querySelector('.wordmark');
  const w1 = document.getElementById('w1');
  const w2 = document.getElementById('w2');
  const canvas = document.querySelector('.hero-canvas');
  const vig = document.querySelector('.hero-vig');
  const tagline = document.getElementById('tagline');
  const bar = document.querySelector('.hero-bar');
  const nav = document.getElementById('nav');

  if (!wordmark || !w1 || !w2) return;

  const chars = [...splitChars(w1), ...splitChars(w2)];

  const finish = () => {
    gsap.set([canvas, vig, tagline, bar].filter(Boolean), { opacity: 1, clearProps: 'transform' });
    gsap.set(nav, { opacity: 1 });
    gsap.set(chars, { yPercent: 0, opacity: 1 });
    gsap.set(wordmark, { clearProps: 'all' });
    if (loader) loader.classList.add('done');
  };

  if (REDUCED) {
    finish();
    return;
  }

  /* Hide everything synchronously, before the first paint can show the page
     already assembled. Ownership of the hidden state lives here rather than
     in CSS: a percentage transform declared in CSS is read back out of the
     computed matrix as plain pixels, so a tween to yPercent:0 would have
     nothing to remove, and if this module ever fails to run the CSS leaves
     the name visible rather than stranding it at opacity 0. */
  gsap.set(chars, { yPercent: 115, opacity: 0 });
  gsap.set([canvas, vig, tagline, bar].filter(Boolean), { opacity: 0 });

  /* Fonts first, then measure. The loader is still covering the page. */
  try {
    await document.fonts.ready;
  } catch {
    /* Measuring against fallback metrics is worse than ideal but still
       better than never starting. */
  }

  const rect = wordmark.getBoundingClientRect();
  const firstMask = wordmark.querySelector('.mask');
  const fm = firstMask ? firstMask.getBoundingClientRect() : rect;

  /* Local coordinates, relative to the wordmark's own box. */
  const headX = fm.left - rect.left + fm.width / 2;
  const headY = fm.top - rect.top + fm.height / 2;

  const opening = centreOn(rect, headX, headY, BIG);
  const assembled = centreOn(rect, rect.width / 2, rect.height / 2, 1);

  gsap.set(wordmark, {
    transformOrigin: '0 0',
    x: opening.x,
    y: opening.y,
    scale: BIG,
  });

  const tl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: () => {
      /* Hand the element back to the stylesheet. Leaving a transform and a
         shifted origin declared would fight anything that lays out against
         the wordmark later. */
      gsap.set(wordmark, { clearProps: 'transform,transformOrigin' });
    },
  });

  if (loader) tl.add(() => loader.classList.add('done'), 0);

  /* 1. the opening character */
  tl.to(chars[0], { yPercent: 0, opacity: 1, duration: 0.9 }, 0.25);

  /* 2. the rest of the name, while the lockup shrinks back to full size and
        recentres around its own middle rather than around that character */
  tl.to(
    wordmark,
    { x: assembled.x, y: assembled.y, scale: 1, duration: 1.15, ease: 'expo.inOut' },
    0.95
  );
  tl.to(
    chars.slice(1),
    { yPercent: 0, opacity: 1, duration: 0.95, stagger: 0.035 },
    1.05
  );

  /* 3. the name drops into place and the hero comes up behind it */
  tl.to(wordmark, { x: 0, y: 0, duration: 1.2, ease: 'expo.inOut' }, 2.05);
  tl.to([canvas, vig].filter(Boolean), { opacity: 1, duration: 1.1 }, 2.05);

  /* 4. everything else */
  if (tagline) tl.to(tagline, { opacity: 1, duration: 0.9 }, 2.75);
  if (bar) tl.to(bar, { opacity: 1, duration: 0.9 }, 2.9);
  if (nav) tl.to(nav, { opacity: 1, duration: 0.9 }, 3.0);

  /* Last line of defence. The name is the single most important element on
     the page, so if a tween is interrupted or the ticker is starved, force
     the finished state rather than leave anything stranded. */
  setTimeout(() => {
    if (chars.some((c) => Number(getComputedStyle(c).opacity) < 1)) finish();
  }, 7000);
}
