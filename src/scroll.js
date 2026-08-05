/* ============================================================
   LENIS + GSAP SCROLLTRIGGER

   Lenis owns the scroll position. It is driven from the GSAP
   ticker rather than its own rAF loop so that smooth scroll and
   every ScrollTrigger read happen on the same frame. Running two
   independent loops is what causes pinned sections to judder.

   lagSmoothing(0) stops GSAP from fast-forwarding after a long
   frame, which would otherwise teleport the scroll position.
   ============================================================ */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/**
 * Wire Lenis into the GSAP ticker and register ScrollTrigger.
 * Call once, before anything that creates a ScrollTrigger.
 * @returns {Lenis}
 */
export function initSmoothScroll() {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Anchor links have to go through Lenis, native jumps desync it. */
  document.querySelectorAll('#nav a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      lenis.scrollTo(a.getAttribute('href'), { offset: -10 });
    });
  });

  return lenis;
}

/**
 * Scroll-driven reveals for the static sections.
 * Must run after [data-split] elements have been wrapped, because it
 * queries the .reveal-line spans that wrapping creates.
 */
export function initReveals() {
  gsap.utils.toArray('.reveal-line>span').forEach((s) =>
    gsap.to(s, {
      yPercent: 0,
      duration: 1.15,
      ease: 'expo.out',
      scrollTrigger: { trigger: s, start: 'top 86%' },
    })
  );

  gsap.utils.toArray('[data-fade]').forEach((s) =>
    gsap.from(s, {
      y: 26,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: s, start: 'top 88%' },
    })
  );

  ScrollTrigger.batch('.skill', {
    start: 'top 90%',
    onEnter: (b) =>
      gsap.to(b, { y: 0, opacity: 1, duration: 0.85, stagger: 0.07, ease: 'power3.out' }),
  });

  ScrollTrigger.batch('.role', {
    start: 'top 90%',
    onEnter: (b) =>
      gsap.to(b, { y: 0, opacity: 1, duration: 0.85, stagger: 0.1, ease: 'power3.out' }),
  });

  gsap.utils.toArray('[data-stagger]').forEach((wrap) =>
    gsap.from(wrap.children, {
      y: 16,
      opacity: 0,
      duration: 0.7,
      stagger: 0.045,
      ease: 'power3.out',
      scrollTrigger: { trigger: wrap, start: 'top 90%' },
    })
  );

  /* Slow counter-scale on the two photographs. */
  gsap.utils.toArray('.portrait img,.exp-photo img').forEach((img) =>
    gsap.to(img, {
      scale: 1.02,
      ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
    })
  );
}
