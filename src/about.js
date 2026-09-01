/* ============================================================
   ABOUT, entrance choreography

   Everything arrives from below on the same expo curve, so the
   section reads as one movement rather than a pile of effects.

   TYPE
   1. lead      per-character rise, flipped up out of the baseline
                on rotateX. Characters sit inside per-word masks,
                so the line still wraps at any width with nothing
                measured and nothing rebuilt on resize.
   2. accent    the coral word draws its own underline once the
                line has landed.
   3. body      paragraphs rise in sequence, and the bolded terms
                bloom from muted to full white just behind them so
                the eye is walked through the key phrases.

   PORTRAIT
   4. slats     the frame is covered by bars in the page colour
                that wipe away alternately left and right. Bars in
                the background colour rather than slices of the
                photograph, so nothing is duplicated and there is
                no seam to line up. This is the same idea as the
                cylinder bend in gallery.js, one step simpler.
   5. grade     grayscale and blur resolve to full colour, scrubbed
                against scroll position rather than fired once, so
                the photograph sharpens as it reaches centre.
   6. tilt      leans towards the pointer.
   7. parallax  drifts against its frame the whole way past.

   Each of those rides its own element. Two writers on one
   transform fight each other, so the layering is deliberate:
   .portrait holds the perspective and the border, .portrait-tilt
   takes the pointer lean, .portrait-inner takes the parallax, and
   the <img> keeps its own scale for the hover.
   ============================================================ */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const SLATS = 9; /* horizontal bars covering the portrait on entry */
const TILT_MAX = 7; /* degrees of pointer lean */
const BLUR = 8; /* px each body word resolves from, matching gallery.js */

/**
 * Wrap every word of el in a clipping mask, and every character inside
 * that word in its own span. Recurses through inline elements, so the
 * <em> in the lead keeps its styling and still gets animated.
 * @returns {HTMLElement[]} the character spans, in document order
 */
function splitChars(el) {
  const chars = [];

  const walk = (node) => {
    /* Copy first: replaceWith mutates childNodes while we iterate. */
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();

        /* Capturing split keeps the whitespace, which has to survive as
           real text nodes or every word runs together. */
        child.textContent.split(/(\s+)/).forEach((token) => {
          if (!token) return;

          if (/^\s+$/.test(token)) {
            frag.appendChild(document.createTextNode(token));
            return;
          }

          const mask = document.createElement('span');
          mask.className = 'wmask';

          [...token].forEach((ch) => {
            const c = document.createElement('span');
            c.className = 'ch';
            c.textContent = ch;
            mask.appendChild(c);
            chars.push(c);
          });

          frag.appendChild(mask);
        });

        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };

  walk(el);
  return chars;
}

/**
 * Wrap every word of el in its own span, leaving inline elements such as
 * <strong> in place around them so their styling survives.
 * @returns {HTMLElement[]} the word spans, in document order
 */
function splitWords(el) {
  const words = [];

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();

        child.textContent.split(/(\s+)/).forEach((token) => {
          if (!token) return;

          if (/^\s+$/.test(token)) {
            frag.appendChild(document.createTextNode(token));
            return;
          }

          const w = document.createElement('span');
          w.className = 'word';
          w.textContent = token;
          frag.appendChild(w);
          words.push(w);
        });

        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };

  walk(el);
  return words;
}

/** Build the slat overlay that covers the portrait before it is revealed. */
function buildSlats(portrait) {
  const wrap = document.createElement('div');
  wrap.className = 'slats';
  wrap.setAttribute('aria-hidden', 'true');

  const bars = [];
  for (let i = 0; i < SLATS; i += 1) {
    const bar = document.createElement('span');
    /* Overlap each bar by a hair. Fractional layout widths leave hairline
       gaps between exact thirds otherwise, and on a dark page those read
       as scan lines across the photograph. */
    bar.style.top = `${(i / SLATS) * 100}%`;
    bar.style.height = `${100 / SLATS + 0.4}%`;
    bar.style.transformOrigin = i % 2 ? 'right center' : 'left center';
    wrap.appendChild(bar);
    bars.push(bar);
  }

  portrait.appendChild(wrap);
  return { wrap, bars };
}

export function initAbout() {
  const about = document.querySelector('.about');
  if (!about) return;

  const lead = about.querySelector('p.lead');
  const paras = [...about.querySelectorAll('.body p')];
  const portrait = about.querySelector('.portrait');
  const tilt = about.querySelector('.portrait-tilt');
  const inner = about.querySelector('.portrait-inner');
  const img = about.querySelector('.portrait img');
  const caption = about.querySelector('.portrait figcaption');

  /* Reduced motion still gets every word and the photograph, just already
     in place. Nothing below this line runs. */
  if (REDUCED) {
    gsap.set([lead, ...paras, portrait, caption].filter(Boolean), { opacity: 1 });
    return;
  }

  /* ---- 1. lead, per-character rise ---- */
  if (lead) {
    /* Split text is read out character by character otherwise. */
    lead.setAttribute('aria-label', lead.textContent.replace(/\s+/g, ' ').trim());

    const chars = splitChars(lead);
    [...lead.querySelectorAll('.wmask')].forEach((m) => m.setAttribute('aria-hidden', 'true'));

    /* Own the hidden state in JS. A CSS percentage transform is read back
       out of the computed matrix as plain pixels, which leaves yPercent at
       0 and makes the tween a no-op. Same trap the line masks in scroll.js
       fell into. */
    gsap.set(chars, { yPercent: 120, rotateX: -78, opacity: 0 });

    gsap.to(chars, {
      yPercent: 0,
      rotateX: 0,
      opacity: 1,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.014,
      scrollTrigger: { trigger: lead, start: 'top 85%' },
      /* Release the clip once the characters have landed, so a later reflow
         at a new width can never shave a descender. */
      onComplete: () =>
        lead.querySelectorAll('.wmask').forEach((m) => (m.style.overflow = 'visible')),
    });

    /* ---- 2. the accent word draws its own underline ---- */
    const em = lead.querySelector('em');
    if (em) {
      const rule = document.createElement('span');
      rule.className = 'uline';
      rule.setAttribute('aria-hidden', 'true');
      em.appendChild(rule);

      gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' });
      gsap.to(rule, {
        scaleX: 1,
        duration: 0.9,
        ease: 'expo.out',
        delay: 0.55,
        scrollTrigger: { trigger: lead, start: 'top 85%' },
      });
    }
  }

  /* ---- 3. body copy resolves word by word ---- */
  /* Scrubbed rather than fired once, so the paragraph develops under the
     reader as they scroll into it instead of having already finished by the
     time they arrive. Each paragraph carries its own trigger, so the resolve
     tracks whichever one is currently entering rather than running the whole
     column off the first. */
  paras.forEach((p) => {
    const words = splitWords(p);
    if (!words.length) return;

    gsap.set(words, { filter: `blur(${BLUR}px)`, opacity: 0 });

    gsap.to(words, {
      filter: 'blur(0px)',
      opacity: 1,
      ease: 'none',
      stagger: { each: 0.06 },
      scrollTrigger: {
        trigger: p,
        start: 'top 88%',
        end: 'top 45%',
        scrub: true,
        /* Drop the filter declaration once resolved. A blur that stays
           declared holds every word on its own composited layer for the rest
           of the page, and there are a couple of hundred of them. */
        onLeave: () => gsap.set(words, { filter: 'none' }),
        onEnterBack: () => gsap.set(words, { filter: 'blur(0px)' }),
      },
    });
  });

  if (!portrait) return;

  /* ---- 4. slat reveal ---- */
  const { wrap, bars } = buildSlats(portrait);
  gsap.set(bars, { scaleX: 1 });

  gsap.to(bars, {
    scaleX: 0,
    duration: 1.05,
    ease: 'expo.inOut',
    stagger: { each: 0.055, from: 'start' },
    scrollTrigger: { trigger: portrait, start: 'top 84%' },
    /* Nothing left to show, and it sits over the image capturing nothing.
       Remove it rather than leave nine dead nodes on top of the hover. */
    onComplete: () => wrap.remove(),
  });

  /* ---- 5. grade, scrubbed against scroll ---- */
  if (img) {
    gsap.fromTo(
      img,
      { filter: 'grayscale(1) contrast(1.06) blur(7px)' },
      {
        filter: 'grayscale(0) contrast(1) blur(0px)',
        ease: 'none',
        scrollTrigger: {
          trigger: portrait,
          start: 'top 78%',
          end: 'center 58%',
          scrub: true,
        },
      }
    );
  }

  /* ---- 6. pointer tilt ---- */
  /* Written straight to the style attribute and eased by a CSS transition
     rather than tweened. This is the one effect driven by live pointer input
     instead of scroll position, and handing it to the animation ticker buys
     nothing: a transition on transform runs on the compositor, survives a
     starved main thread, and cannot drift out of sync with the pointer. */
  if (tilt) {
    const lean = (ry, rx) => {
      tilt.style.transform = `scale(1.03) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
    };

    /* Filtered per event rather than gated on a (hover:hover) query at load.
       That query is answered once, at the moment this module runs, and a
       device reporting touch at that instant would lose the tilt for the rest
       of the session even on a real mouse. */
    portrait.addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const r = portrait.getBoundingClientRect();
      lean(
        ((e.clientX - r.left) / r.width - 0.5) * 2 * TILT_MAX,
        ((e.clientY - r.top) / r.height - 0.5) * -2 * TILT_MAX
      );
    });

    portrait.addEventListener('pointerleave', () => lean(0, 0));
  }

  /* ---- 7. parallax ---- */
  if (inner) {
    gsap.fromTo(
      inner,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: {
          trigger: portrait,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  }

  if (caption) {
    gsap.set(caption, { opacity: 0, y: 10 });

    gsap.to(caption, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: portrait, start: 'top 84%' },
    });
  }

  ScrollTrigger.refresh();
}
