/* Subtle motion: reading-progress bar, header shadow, back-to-top, cards that ease in as they scroll
   into view, and a count-up on the home stats. Only opacity/transform are animated (GPU-cheap), one
   light passive scroll handler, and nothing runs when the user prefers reduced motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bar = document.getElementById('progress'), top = document.getElementById('toTop'), header = document.querySelector('header');

  /* scroll events already arrive at most once per frame; the work here is one transform and two class toggles */
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 40 ? Math.min(1, y / max) : 0})`;
    header.classList.toggle('scrolled', y > 4);
    top.hidden = y < 700;
  };
  addEventListener('scroll', onScroll, {passive: true});
  top.onclick = () => scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'});

  /* cards ease in when they first scroll into view (only those below the fold, so nothing visible blinks) */
  const SEL = '.tile,.card,.home-do-card,.home-stages a,.home-stats>div,.pf-cards>*,.grid4>*,.pg,.calc,.ex';
  let ioAlive = false; /* IntersectionObserver always reports once per element; if it never does, show everything */
  const io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(es => es.forEach(e => {
    ioAlive = true;
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
  }), {rootMargin: '0px 0px -40px 0px'}) : null;

  const countUp = el => {
    const m = el.textContent.match(/^(\d+)(\D*)$/); if (!m || reduce) return;
    const end = +m[1], dur = 900, fin = end + m[2]; let t0 = 0, done = false;
    const step = t => {
      if (done) return;
      t0 ||= t; const p = Math.max(0, Math.min(1, (t - t0) / dur));
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + m[2];
      if (p < 1) requestAnimationFrame(step); else done = true;
    };
    el.textContent = '0' + m[2]; requestAnimationFrame(step);
    setTimeout(() => { done = true; el.textContent = fin; }, dur + 150); /* final value even if frames are paused (background tab) */
  };

  document.addEventListener('pf:rendered', () => {
    onScroll();
    if (!io) return;
    const fold = innerHeight;
    const groups = new Map();
    document.querySelectorAll('#app ' + SEL.split(',').join(',#app ')).forEach(el => {
      if (el.getBoundingClientRect().top < fold - 20) return;
      const n = groups.get(el.parentElement) || 0; groups.set(el.parentElement, n + 1);
      el.style.setProperty('--d', Math.min(n, 4) * 60 + 'ms');
      el.classList.add('rv'); io.observe(el);
    });
    ioAlive = false;
    setTimeout(() => { if (!ioAlive) document.querySelectorAll('#app .rv:not(.in)').forEach(el => el.classList.add('in')); }, 1200);
    document.querySelectorAll('#app .home-stats b').forEach(countUp);
  });
})();
