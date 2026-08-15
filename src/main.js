/* ============================================================
   ENTRY

   Boot order matters:

   1. shader        independent, start it drawing immediately
   2. smooth scroll must exist before any ScrollTrigger is made
   3. split text    creates the .reveal-line spans that (4) queries
   4. reveals
   5. arc           renders the project <li> elements into the DOM
   6. gallery       builds the orbiting tiles from the same data
   7. cursor        binds hover handlers to every li, so it has to
                    run after (5) or the arc items get no hover state
   ============================================================ */

import gsap from 'gsap';

import { initShader } from './shader.js';
import { initSmoothScroll, initReveals } from './scroll.js';
import { initAbout } from './about.js';
import { initLinks } from './links.js';
import { initArc } from './arc.js';
import { initGallery } from './gallery.js';
import { initCursor } from './cursor.js';

/* 1 · hero background */
initShader(document.getElementById('gl'), document.querySelector('.hero'));

/* 2 · Lenis + ScrollTrigger */
initSmoothScroll();

/* 3 · split the wordmark into per-character masks */
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

const c1 = splitChars(document.getElementById('w1'));
const c2 = splitChars(document.getElementById('w2'));

/* Take ownership of the hidden state here rather than in CSS, so that a JS
   failure leaves the name visible instead of stranding it at opacity 0. */
gsap.set([...c1, ...c2], { yPercent: 112, opacity: 0 });

document.querySelectorAll('[data-split]').forEach((p) => {
  p.innerHTML = `<span class="reveal-line"><span>${p.innerHTML}</span></span>`;
});

/* loader counter, ticking until the intro takes over */
let n = 0;
const ln = document.getElementById('loadnum');
const tick = setInterval(() => {
  n = Math.min(100, n + Math.random() * 14);
  ln.textContent = String(Math.floor(n)).padStart(3, '0');
}, 85);

let introPlayed = false;

function intro() {
  /* The load handler and the 4s failsafe can both land when load fires
     late. Without this guard the timeline runs twice on the same chars. */
  if (introPlayed) return;
  introPlayed = true;

  clearInterval(tick);
  ln.textContent = '100';
  document.getElementById('loader').classList.add('done');

  gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .to(c1, { yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.026 }, 0.12)
    .to(c2, { yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.026 }, 0.3)
    .from('#tagline', { y: 18, opacity: 0, duration: 1.1 }, 0.52)
    .from('.hero-bar', { y: 24, opacity: 0, duration: 1.1 }, 0.66)
    .to('#nav', { opacity: 1, duration: 0.9 }, 0.8);
}

addEventListener('load', () => setTimeout(intro, 850));
setTimeout(intro, 4000); /* failsafe: never strand the loader */

/* Last line of defence for the wordmark. If the ticker is starved or a tween
   is interrupted, the name would otherwise sit at opacity 0. It is the single
   most important element on the page, so force it visible if anything is
   still hidden well after the intro should have finished. */
setTimeout(() => {
  const stuck = [...c1, ...c2].filter((s) => Number(getComputedStyle(s).opacity) < 1);
  if (stuck.length) gsap.set(stuck, { yPercent: 0, opacity: 1 });
}, 6000);

/* 4 · scroll reveals */
initReveals();

/* 4b · about section choreography. Owns its own word masks, so it has to
        run after (3) has finished rewriting any [data-split] markup. */
initAbout();

/* 4c · nav and social link character roll. Rewrites the text of those links,
        so it has to run before anything else reads their contents. */
initLinks();

/* 5 · the pinned arc, rendered from src/data/projects.js */
initArc();

/* 6 · the circle gallery, same data, further down the page */
initGallery();

/* 7 · cursor, last so it sees the arc items */
initCursor();
