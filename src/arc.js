/* ============================================================
   THE ARC, pinned cosine-offset project list

   The section pins and the scroll progress drives a floating
   "centre" index across the list. Each item is pushed right by

       CURVE * (1 - cos(distanceFromCentre * 0.38))

   so items near the centre barely move and distant ones swing
   out hard, tracing the red arc behind them. Opacity and scale
   fall off linearly with distance, clamped so the ends of the
   list never disappear completely.

   Below 901px the pin is dropped and the list becomes tappable.
   ============================================================ */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { projects } from './data/projects.js';

const CURVE = 86; /* raise CURVE = tighter whirlpool */
const SWAP_DELAY = 180; /* ms the panel spends faded out mid-swap */

export function initArc() {
  const list = document.getElementById('projList');
  if (!list) return;

  const countEl = document.getElementById('count');
  const pYear = document.getElementById('pYear');
  const pKind = document.getElementById('pKind');
  const pDesc = document.getElementById('pDesc');
  const pTags = document.getElementById('pTags');
  const pImg = document.getElementById('pImg');

  /* ---- render the list from data ---- */
  const items = projects.map((project) => {
    const li = document.createElement('li');
    li.textContent = project.title;
    list.appendChild(li);
    return li;
  });

  const N = items.length;
  /* Read once. Querying per paint would let a mid session resize leave half
     the list transformed and half not. */
  const DESKTOP = matchMedia('(min-width:901px)').matches;
  let active = -1;
  let pendingShow = null;

  function show(i) {
    pKind.classList.remove('on');
    pDesc.classList.remove('on');
    pImg.classList.remove('on');

    /* Scrubbing fast queues several swaps. Without this the panel can
       settle on a project that is no longer the highlighted one. */
    if (pendingShow !== null) clearTimeout(pendingShow);

    pendingShow = setTimeout(() => {
      pendingShow = null;
      const project = projects[i];

      pYear.textContent = project.year;
      pKind.textContent = project.title.toUpperCase();
      pDesc.textContent = project.description;

      pTags.replaceChildren(
        ...project.tags.map((tag) => {
          const span = document.createElement('span');
          span.textContent = tag;
          return span;
        })
      );

      if (project.image) {
        pImg.src = project.image;
        pImg.classList.add('on');
        pImg.classList.toggle('inv', !!project.invert);
        /* Screenshots and diagrams are shown whole. Cropping a flowchart to
           fill the frame is how it became unreadable in the first place. */
        pImg.classList.toggle('fit', project.fit === 'contain');
        pKind.classList.remove('on');
      } else {
        pImg.removeAttribute('src');
        pKind.classList.add('on');
      }

      pDesc.classList.add('on');
      gsap.fromTo(
        pTags.children,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'power3.out' }
      );
    }, SWAP_DELAY);
  }

  function paint(centre) {
    /* The curve only means anything while scroll is driving the centre index
       across the list. Without the pin there is nothing to drive it, so the
       geometry would freeze at whatever paint() was last called with and the
       list would just look like a broken staircase of indented, half faded
       items. Below the breakpoint the list stays flat and fully legible and
       the active item is marked by class alone. */
    if (DESKTOP) {
      items.forEach((li, i) => {
        const d = i - centre;
        const ad = Math.abs(d);
        gsap.set(li, {
          x: CURVE * (1 - Math.cos(d * 0.38)),
          opacity: 1 - Math.min(ad * 0.23, 0.75),
          scale: 1 - Math.min(ad * 0.052, 0.29),
          transformOrigin: '0% 50%',
        });
      });
    }

    const idx = Math.round(Math.min(Math.max(centre, 0), N - 1));
    if (idx !== active) {
      active = idx;
      items.forEach((li, i) => li.classList.toggle('active', i === idx));
      countEl.textContent = '(' + String(idx + 1).padStart(2, '0') + ')';
      show(idx);
    }
  }

  paint(0);

  if (DESKTOP) {
    ScrollTrigger.create({
      trigger: '.work',
      start: 'top top',
      end: '+=2800',
      pin: '.work-pin',
      scrub: 1,
      onUpdate: (s) => paint(s.progress * (N - 1)),
    });
  } else {
    items.forEach((li, i) => li.addEventListener('click', () => paint(i)));
  }
}
