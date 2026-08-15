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
  gsap.utils.toArray('.reveal-line>span').forEach((s) => {
    /* Restate the hidden position in GSAP's own terms before tweening it.
       CSS parks the span at translateY(105%). GSAP reads that back out of the
       computed matrix as a base pixel offset, not as yPercent, so a tween to
       yPercent:0 only ever cancels a percentage layer sitting on top of that
       base and the line stays exactly where it was. Setting y:0 clears the
       inherited pixels and yPercent:105 restates the hide, so the tween now
       has something to actually remove. Same reason main.js takes ownership
       of the wordmark's hidden state in JS rather than leaving it to CSS. */
    gsap.set(s, { y: 0, yPercent: 105 });

    gsap.to(s, {
      yPercent: 0,
      duration: 1.15,
      ease: 'expo.out',
      /* Trigger off the clipping parent, never the span itself: the span is
         displaced by the very transform this tween removes, so it would be
         measuring a start position that moves as it runs. */
      scrollTrigger: { trigger: s.parentElement, start: 'top 86%' },
    });
  });

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

  /* Section labels drift up as their section arrives. */
  gsap.utils.toArray('.eyebrow,.certs-head').forEach((el) =>
    gsap.from(el, {
      y: 14,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%' },
    })
  );

  /* Certification cards, same batched entrance as the capability tiles. */
  ScrollTrigger.batch('.cert', {
    start: 'top 90%',
    onEnter: (b) =>
      gsap.to(b, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' }),
  });

  /* The recommendation card itself. */
  gsap.utils.toArray('.rec').forEach((el) =>
    gsap.from(el, {
      y: 34,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    })
  );

  /* Quoted text resolves word by word out of a blur as it scrolls in, the
     same treatment the orbit phrase uses, so the two read as one idea. */
  gsap.utils.toArray('[data-words]').forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(
      words,
      { opacity: 0.12, filter: 'blur(7px)' },
      {
        opacity: 1,
        filter: 'blur(0px)',
        ease: 'none',
        stagger: 0.5,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 62%', scrub: true },
      }
    );
  });
}

/**
 * Wrap every word of an element in its own span so they can be staggered.
 * Walks text nodes rather than touching innerHTML, so inline markup such as
 * the emphasised phrase inside a quote survives intact.
 * @param {Element} el
 * @returns {HTMLElement[]}
 */
function splitWords(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  const words = [];
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((chunk) => {
      if (/^\s+$/.test(chunk)) {
        frag.appendChild(document.createTextNode(chunk));
      } else if (chunk) {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = chunk;
        frag.appendChild(span);
        words.push(span);
      }
    });
    node.parentNode.replaceChild(frag, node);
  });
  return words;
}
