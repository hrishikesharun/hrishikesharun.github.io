/* ============================================================
   LERPED CURSOR

   The dot chases the pointer on the GSAP ticker rather than being
   tweened per mousemove. mousemove only ever writes a target, so
   a fast flick costs two assignments instead of spawning a tween
   per event, and the trail stays smooth at any pointer rate.

   Hidden by CSS on touch and below 861px.
   ============================================================ */

import gsap from 'gsap';

const EASE = 0.11; /* fraction of the remaining gap closed per frame */
const HOVER_TARGETS = 'a,li,button,.portrait,.exp-photo';

export function initCursor() {
  const cur = document.getElementById('cursor');
  if (!cur) return;

  let tx = innerWidth / 2;
  let ty = innerHeight / 2;
  let cx = tx;
  let cy = ty;

  addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });

  gsap.ticker.add(() => {
    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;
    cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
  });

  /* Called after the arc list is rendered so its items are included. */
  document.querySelectorAll(HOVER_TARGETS).forEach((el) => {
    el.addEventListener('mouseenter', () => cur.classList.add('big'));
    el.addEventListener('mouseleave', () => cur.classList.remove('big'));
  });
}
