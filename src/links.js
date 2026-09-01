/* ============================================================
   LINK ROLL

   Nav and social links get their letters doubled: the visible one
   rolls up and out while its twin rolls up into the same slot,
   each character a beat behind the last.

   Driven by a CSS transition on a per-character delay rather than
   by the animation ticker. Hover is live input, not timeline work,
   so a transition runs on the compositor, cannot fall behind a
   busy main thread, and costs nothing when nobody is hovering.

   Labels here are uppercase, which is why the clipping slot can be
   a plain overflow:hidden with no descender allowance.
   ============================================================ */

const SELECTOR = '#nav a, .hero-bar .socials a';

export function initLinks() {
  document.querySelectorAll(SELECTOR).forEach((link) => {
    const label = link.textContent.trim();
    if (!label || link.querySelector('.ch')) return;

    /* Screen readers would otherwise spell the label out one span at
       a time, and once per copy, so twice over. */
    link.setAttribute('aria-label', label);

    const frag = document.createDocumentFragment();

    [...label].forEach((char, i) => {
      if (char === ' ') {
        frag.appendChild(document.createTextNode(' '));
        return;
      }

      const slot = document.createElement('span');
      slot.className = 'ch';
      slot.style.setProperty('--i', String(i));
      slot.setAttribute('aria-hidden', 'true');

      const top = document.createElement('span');
      top.className = 'ch-t';
      top.textContent = char;

      const bottom = document.createElement('span');
      bottom.className = 'ch-b';
      bottom.textContent = char;

      slot.append(top, bottom);
      frag.appendChild(slot);
    });

    link.textContent = '';
    link.classList.add('roll');
    link.appendChild(frag);
  });
}
