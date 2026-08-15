/* ============================================================
   ENTRY

   Boot order matters:

   1. shader        independent, start it drawing immediately
   2. smooth scroll must exist before any ScrollTrigger is made
   3. intro         hides the hero and the wordmark synchronously,
                    before the first paint, then plays them in. It
                    waits on the fonts internally, so it returns
                    long before it has finished.
   4. split text    creates the .reveal-line spans that (5) queries
   5. reveals
   6. about         owns its own word and character splitting
   7. links         rewrites nav and social link text
   8. arc           renders the project <li> elements into the DOM
   9. gallery       builds the orbiting tiles from the same data
   10. cursor       binds hover handlers to every li, so it has to
                    run after (8) or the arc items get no hover state
   ============================================================ */

import { initShader } from './shader.js';
import { initSmoothScroll, initReveals } from './scroll.js';
import { initIntro } from './intro.js';
import { initAbout } from './about.js';
import { initLinks } from './links.js';
import { initArc } from './arc.js';
import { initGallery } from './gallery.js';
import { initCursor } from './cursor.js';

/* 1 · hero background */
initShader(document.getElementById('gl'), document.querySelector('.hero'));

/* 2 · Lenis + ScrollTrigger */
initSmoothScroll();

/* 3 · opening sequence. Not awaited: everything below builds the rest of the
       page, which is far offscreen while the intro runs. */
initIntro();

/* 4 · line masks for anything marked [data-split] */
document.querySelectorAll('[data-split]').forEach((p) => {
  p.innerHTML = `<span class="reveal-line"><span>${p.innerHTML}</span></span>`;
});

/* 5 · scroll reveals */
initReveals();

/* 6 · about section choreography */
initAbout();

/* 7 · nav and social link character roll */
initLinks();

/* 8 · the pinned arc, rendered from src/data/projects.js */
initArc();

/* 9 · the circle gallery, same data, further down the page */
initGallery();

/* 10 · cursor, last so it sees the arc items */
initCursor();
