/* ============================================================
   WAILLS — SCRIPT PRINCIPAL ULTRA-PREMIUM
   ============================================================ */

'use strict';

/* ── UTILS ──────────────────────────────────────────────────── */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);

/* ── 1. LOADER ──────────────────────────────────────────────── */
(() => {
  const loader = $('#loader');
  const minDuration = 2600;
  const start = Date.now();

  window.addEventListener('load', () => {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minDuration - elapsed);
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.add('loaded');
      initAfterLoad();
    }, remaining);
  });
})();

/* ── 2. CUSTOM CURSOR ───────────────────────────────────────── */
(() => {
  const dot   = $('#cursor-dot');
  const ring  = $('#cursor-ring');
  const trail = $('#cursor-trail-container');

  let mx = -100, my = -100;
  let rx = -100, ry = -100;
  let animId;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    spawnTrail(mx, my);
  });

  // Smooth ring follow
  const tick = () => {
    rx = lerp(rx, mx, 0.12);
    ry = lerp(ry, my, 0.12);
    dot.style.transform  = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    animId = requestAnimationFrame(tick);
  };
  tick();

  // Trail
  let trailTimer = 0;
  function spawnTrail(x, y) {
    const now = Date.now();
    if (now - trailTimer < 40) return;
    trailTimer = now;
    const d = document.createElement('div');
    d.className = 'trail-dot';
    d.style.left = x + 'px';
    d.style.top  = y + 'px';
    trail.appendChild(d);
    setTimeout(() => d.remove(), 600);
  }

  // Hover state
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a, button, [data-tilt], .service-card, .pricing-card, input, select, textarea');
    document.body.classList.toggle('cursor-hover', !!t);
  });
})();

/* ── 3. NAVIGATION ──────────────────────────────────────────── */
(() => {
  const nav  = $('#nav');
  const ham  = $('#hamburger');
  const mob  = $('#mobileOverlay');

  // Solid on scroll
  const onScroll = () => {
    nav.classList.toggle('solid', window.scrollY > 60);
    updateActiveLink();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Hamburger
  ham.addEventListener('click', () => {
    const open = mob.classList.toggle('open');
    ham.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', open);
    mob.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  window.closeMobileMenu = () => {
    mob.classList.remove('open');
    ham.classList.remove('open');
    ham.setAttribute('aria-expanded', false);
    mob.setAttribute('aria-hidden', true);
    document.body.style.overflow = '';
  };

  // Active section link
  function updateActiveLink() {
    const sections = $$('section[id]');
    const scrollY  = window.scrollY + 140;
    sections.forEach(s => {
      const top = s.offsetTop;
      const bot = top + s.offsetHeight;
      const link = $(`a[href="#${s.id}"]`, nav);
      if (link) link.classList.toggle('active', scrollY >= top && scrollY < bot);
    });
  }
})();

/* ── 4. HERO CANVAS (Particles + Grid) ─────────────────────── */
function initHeroCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], grid = [];
  let mouse = { x: -1000, y: -1000 };

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildGrid();
  }
  resize();
  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });

  // Dot grid
  function buildGrid() {
    grid = [];
    const spacing = 52;
    const cols = Math.ceil(W / spacing) + 1;
    const rows = Math.ceil(H / spacing) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid.push({ x: c * spacing, y: r * spacing, base: 0.08, alpha: 0.08 });
      }
    }
  }

  // Gold particles
  const N = 60;
  for (let i = 0; i < N; i++) {
    particles.push({
      x: Math.random() * 2000,
      y: Math.random() * 1000,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.4 + 0.1),
      alpha: Math.random() * 0.6 + 0.1,
      life: Math.random()
    });
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Grid dots with mouse proximity glow
    grid.forEach(dot => {
      const dx = dot.x - mouse.x;
      const dy = dot.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const target = dist < 120 ? map(dist, 0, 120, 0.7, 0.08) : 0.08;
      dot.alpha = lerp(dot.alpha, target, 0.08);
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${dot.alpha})`;
      ctx.fill();
    });

    // Particles
    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.life += 0.004;
      if (p.y < -10 || p.life > 1) {
        p.x = Math.random() * W;
        p.y = H + 10;
        p.life = 0;
      }
      const fade = Math.sin(p.life * Math.PI);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${p.alpha * fade})`;
      ctx.fill();

      // Twinkle larger ones
      if (p.r > 1.4) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        g.addColorStop(0, `rgba(212,175,55,${0.15 * fade})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fill();
      }
    });

    requestAnimationFrame(drawFrame);
  }
  drawFrame();
}

/* ── 5. HERO TYPEWRITER ─────────────────────────────────────── */
function initTypewriter() {
  const el = $('#heroTypewriter');
  if (!el) return;
  const words = ['Détailing Premium', 'Polissage Machine', 'Protection Céramique', 'Film PPF', 'Finition Parfaite'];
  let wi = 0, ci = 0, deleting = false;
  let timer;

  function tick() {
    const word = words[wi];
    if (!deleting) {
      ci++;
      el.textContent = word.slice(0, ci);
      if (ci === word.length) { deleting = true; timer = setTimeout(tick, 1800); return; }
    } else {
      ci--;
      el.textContent = word.slice(0, ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
    }
    timer = setTimeout(tick, deleting ? 55 : 90);
  }
  setTimeout(tick, 3800);
}

/* ── 6. REVEAL ON SCROLL (IntersectionObserver) ─────────────── */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal-up, .hero-badge').forEach(el => io.observe(el));
}

/* ── 7. MAGNETIC BUTTONS ────────────────────────────────────── */
function initMagnetic() {
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const dx = (e.clientX - cx) * 0.35;
      const dy = (e.clientY - cy) * 0.35;
      btn.style.transform = `translate(${dx}px,${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ── 8. BEFORE/AFTER SLIDERS ────────────────────────────────── */
function initSliders() {
  $$('.before-after-slider').forEach(slider => {
    const after   = $('.ba-after', slider);
    const handle  = $('.ba-handle', slider);
    let active = false;
    let pct = 50;

    function setPos(x) {
      const r = slider.getBoundingClientRect();
      pct = clamp(((x - r.left) / r.width) * 100, 2, 98);
      after.style.clipPath  = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left     = pct + '%';
    }
    setPos(slider.getBoundingClientRect().left + slider.getBoundingClientRect().width / 2);

    handle.addEventListener('mousedown',  e => { active = true; e.preventDefault(); });
    handle.addEventListener('touchstart', e => { active = true; }, { passive: true });
    window.addEventListener('mousemove',  e => { if (active) setPos(e.clientX); });
    window.addEventListener('touchmove',  e => { if (active) setPos(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('mouseup',    () => { active = false; });
    window.addEventListener('touchend',   () => { active = false; });
    slider.addEventListener('click', e => setPos(e.clientX));
  });
}

/* ── 9. GALLERY NAVIGATION ──────────────────────────────────── */
function initGallery() {
  const container = $('#galleryScrollContainer');
  const slides    = $$('.gallery-slide', container);
  const dotsWrap  = $('#galleryDots');
  const prev      = $('#galleryPrev');
  const next      = $('#galleryNext');
  if (!container || !slides.length) return;

  let current = 0;
  const total = slides.length;

  // Build dots
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `Slide ${i + 1}`);
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  });

  function goTo(i) {
    current = (i + total) % total;
    const slide = slides[current];
    container.scrollTo({ left: slide.offsetLeft - 32, behavior: 'smooth' });
    $$('.gallery-dot', dotsWrap).forEach((d, idx) => d.classList.toggle('active', idx === current));
  }

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  // Sync dots on scroll
  let scrollTimer;
  container.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const center = container.scrollLeft + container.offsetWidth / 2;
      let closest = 0, minD = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - center);
        if (d < minD) { minD = d; closest = i; }
      });
      if (closest !== current) {
        current = closest;
        $$('.gallery-dot', dotsWrap).forEach((d, idx) => d.classList.toggle('active', idx === current));
      }
    }, 80);
  }, { passive: true });
}

/* ── 10. TIMELINE SCROLL ANIMATION ─────────────────────────── */
function initTimeline() {
  const timeline = $('.timeline');
  if (!timeline) return;
  const progress = $('#timelineProgress');
  const items = $$('.timeline-item', timeline);

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        const idx = items.indexOf(e.target);
        setTimeout(() => e.target.classList.add('active'), 200);
      }
    });
  }, { threshold: 0.4 });
  items.forEach(el => io.observe(el));

  // Progress line
  const lineIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const rect   = timeline.getBoundingClientRect();
        const scroll = window.scrollY + window.innerHeight;
        const pct    = clamp(((scroll - (window.scrollY + rect.top)) / rect.height) * 100, 0, 100);
        if (progress) progress.style.height = pct + '%';
      }
    });
  }, { threshold: Array.from({length: 20}, (_, i) => i / 20) });
  if (timeline) lineIO.observe(timeline);

  window.addEventListener('scroll', () => {
    if (!timeline) return;
    const rect   = timeline.getBoundingClientRect();
    const start  = rect.top  - window.innerHeight;
    const end    = rect.bottom;
    const scroll = -rect.top;
    const pct    = clamp((scroll / rect.height) * 130, 0, 100);
    if (progress) progress.style.height = pct + '%';
  }, { passive: true });
}

/* ── 11. STATS COUNTER ──────────────────────────────────────── */
function initStats() {
  const items = $$('.stat-item');
  if (!items.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const numEl  = $('.stat-number', el);
      const barEl  = $('.stat-bar span', el);
      const target = +numEl.dataset.target;
      const suffix = numEl.dataset.suffix || '';

      el.classList.add('visible');
      io.unobserve(el);

      // Animate bar
      if (barEl) setTimeout(() => { barEl.style.width = '100%'; }, 200);

      // Count up
      let start = 0;
      const duration = 1800;
      const startTime = performance.now();

      function count(now) {
        const elapsed = now - startTime;
        const progress = clamp(elapsed / duration, 0, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(ease * target);
        numEl.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(count);
      }
      requestAnimationFrame(count);
    });
  }, { threshold: 0.5 });

  items.forEach(el => io.observe(el));
}

/* ── 12. STATS CANVAS (Moving Lines) ───────────────────────── */
function initStatsCanvas() {
  const canvas = $('#statsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, lines = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 12; i++) {
    lines.push({
      y:     Math.random() * 1000,
      speed: Math.random() * 0.4 + 0.1,
      alpha: Math.random() * 0.15 + 0.03,
      width: Math.random() * 200 + 50
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    lines.forEach(l => {
      l.y -= l.speed;
      if (l.y < -2) l.y = H + 2;
      const g = ctx.createLinearGradient(0, l.y, W, l.y);
      g.addColorStop(0, 'transparent');
      g.addColorStop(0.3, `rgba(212,175,55,${l.alpha})`);
      g.addColorStop(0.7, `rgba(212,175,55,${l.alpha})`);
      g.addColorStop(1,   'transparent');
      ctx.strokeStyle = g;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(0, l.y);
      ctx.lineTo(W, l.y);
      ctx.stroke();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ── 13. PRICING TOGGLE ─────────────────────────────────────── */
function initPricingToggle() {
  const btnSingle = $('#toggleSingle');
  const btnPack   = $('#togglePack');
  const sw        = $('#toggleSwitch');
  const prices    = $$('.pricing-price');
  if (!btnSingle) return;

  let mode = 'single';

  function setMode(m) {
    mode = m;
    btnSingle.classList.toggle('active', m === 'single');
    btnPack.classList.toggle('active',   m === 'pack');
    sw.classList.toggle('on', m === 'pack');

    prices.forEach(el => {
      const val = m === 'single' ? el.dataset.single : el.dataset.pack;
      if (!val) return;
      el.innerHTML = val + '<span>€</span>';
      el.style.transform = 'scale(1.15)';
      setTimeout(() => { el.style.transform = ''; }, 300);
    });
  }

  btnSingle.addEventListener('click', () => setMode('single'));
  btnPack.addEventListener('click',   () => setMode('pack'));
  sw.addEventListener('click',        () => setMode(mode === 'single' ? 'pack' : 'single'));
}

/* ── 14. PRICING CHECKMARKS ANIMATE ────────────────────────── */
function initPricingReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        // Stagger check icons
        $$('.check-item:not(.disabled)', e.target).forEach((item, i) => {
          setTimeout(() => item.querySelector('.check-icon')?.classList.add('lit'), i * 80);
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  $$('.pricing-card').forEach(c => io.observe(c));
}

/* ── 15. TESTIMONIALS CAROUSEL ──────────────────────────────── */
function initTestimonials() {
  const track  = $('#testimonialTrack');
  const cards  = $$('.testimonial-card', track);
  const dotsEl = $('#testiDots');
  const prev   = $('#testiPrev');
  const next   = $('#testiNext');
  if (!track || !cards.length) return;

  const total = cards.length;
  let current = 0;
  let autoPlay;

  // Build dots
  cards.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'testi-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `Témoignage ${i + 1}`);
    d.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(d);
  });

  // Light stars
  function lightStars(card) {
    const stars = $$('.star-svg', card);
    stars.forEach((s, i) => {
      setTimeout(() => s.classList.add('lit'), i * 100);
    });
  }

  // Build stars
  cards.forEach(card => {
    const wrap = $('.testimonial-stars', card);
    const n = +wrap.dataset.stars || 5;
    for (let i = 0; i < 5; i++) {
      wrap.innerHTML += `<svg class="star-svg" viewBox="0 0 24 24" fill="${i < n ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
  });

  function goTo(i) {
    cards[current].classList.remove('active');
    $$('.testi-dot', dotsEl)[current].classList.remove('active');
    current = (i + total) % total;
    cards[current].classList.add('active');
    $$('.testi-dot', dotsEl)[current].classList.add('active');

    // Offset track so active card is centered
    const card   = cards[current];
    const parent = track.parentElement;
    const offset = card.offsetLeft - (parent.offsetWidth / 2) + (card.offsetWidth / 2);
    track.style.transform = `translateX(${-offset}px)`;

    // Reset & relight stars
    $$('.star-svg', cards[current]).forEach(s => s.classList.remove('lit'));
    setTimeout(() => lightStars(cards[current]), 150);
  }

  function startAuto() {
    autoPlay = setInterval(() => goTo(current + 1), 4500);
  }
  function stopAuto() { clearInterval(autoPlay); }

  prev.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
  next.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
  track.parentElement.addEventListener('mouseenter', stopAuto);
  track.parentElement.addEventListener('mouseleave', startAuto);

  goTo(0);
  startAuto();
}

/* ── 16. FAQ ACCORDION ──────────────────────────────────────── */
function initFAQ() {
  $$('.faq-item').forEach(item => {
    const btn = $('.faq-question', item);
    const ans = $('.faq-answer', item);

    btn.addEventListener('click', () => {
      const open = item.classList.contains('open');

      // Close all
      $$('.faq-item.open').forEach(el => {
        el.classList.remove('open');
        $('.faq-question', el).setAttribute('aria-expanded', false);
        $('.faq-answer', el).style.maxHeight = '0';
      });

      if (!open) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', true);
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });
}

/* ── 17. CONTACT FORM ───────────────────────────────────────── */
function initContactForm() {
  const form    = $('#contactForm');
  const submit  = $('#formSubmit');
  const success = $('#formSuccess');
  if (!form) return;

  // Floating labels for select
  $$('.form-field--select select', form).forEach(sel => {
    sel.addEventListener('change', () => {
      sel.parentElement.classList.toggle('has-value', sel.value !== '');
    });
  });

  // Real-time validation
  $$('input[required], textarea[required]', form).forEach(inp => {
    inp.addEventListener('blur', () => validateField(inp));
    inp.addEventListener('input', () => {
      if (inp.parentElement.classList.contains('error')) validateField(inp);
    });
  });

  function validateField(inp) {
    const field = inp.closest('.form-field');
    const errEl = $('.field-error', field);
    let msg = '';

    if (!inp.value.trim()) {
      msg = 'Ce champ est requis.';
    } else if (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) {
      msg = 'Adresse email invalide.';
    }

    field.classList.toggle('error',   !!msg);
    field.classList.toggle('success', !msg && !!inp.value.trim());
    if (errEl) errEl.textContent = msg;
    return !msg;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const required = $$('input[required], textarea[required]', form);
    const valid = required.every(inp => validateField(inp));
    if (!valid) return;

    // Loading state
    submit.classList.add('loading');
    submit.disabled = true;

    setTimeout(() => {
      submit.style.display    = 'none';
      success.classList.add('show');
      form.reset();
      $$('.form-field', form).forEach(f => f.classList.remove('success', 'error', 'has-value'));
      setTimeout(() => {
        submit.style.display = '';
        submit.classList.remove('loading');
        submit.disabled = false;
        success.classList.remove('show');
      }, 5000);
    }, 1600);
  });
}

/* ── 18. TILT 3D CARDS ──────────────────────────────────────── */
function initTilt() {
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const rx = ((e.clientY - cy) / (r.height / 2)) * -8;
      const ry = ((e.clientX - cx) / (r.width  / 2)) *  8;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ── 19. SMOOTH PARALLAX ────────────────────────────────────── */
function initParallax() {
  const hero   = $('#hero');
  const heroC  = $('.hero-content', hero);
  if (!hero || !heroC) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroC.style.transform = `translateY(${y * 0.3}px)`;
      heroC.style.opacity   = 1 - (y / window.innerHeight) * 1.2;
    }
  }, { passive: true });
}

/* ── 20. TEXT SCRAMBLE ──────────────────────────────────────── */
class TextScramble {
  constructor(el) {
    this.el    = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.queue = [];
    this.frame = 0;
    this.frameReq = null;
    this.original = el.textContent;
  }
  scramble() {
    const text = this.original;
    this.queue = text.split('').map((c, i) => ({
      from: this.chars[Math.floor(Math.random() * this.chars.length)],
      to: c,
      start: Math.floor(Math.random() * 20),
      end:   Math.floor(Math.random() * 20) + 20,
      char: ''
    }));
    cancelAnimationFrame(this.frameReq);
    this.frame = 0;
    this.update();
  }
  update() {
    let out = '', complete = 0;
    this.queue.forEach(item => {
      if (this.frame >= item.end) {
        complete++;
        out += item.to;
      } else if (this.frame >= item.start) {
        out += `<span style="color:var(--gold);opacity:0.6">${this.chars[Math.floor(Math.random() * this.chars.length)]}</span>`;
      } else {
        out += item.to === ' ' ? ' ' : `<span style="opacity:0.15">${item.from}</span>`;
      }
    });
    this.el.innerHTML = out;
    if (complete < this.queue.length) {
      this.frame++;
      this.frameReq = requestAnimationFrame(() => this.update());
    }
  }
}

function initTextScramble() {
  const labels = $$('.section-label');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const scramble = new TextScramble(e.target);
        setTimeout(() => scramble.scramble(), 200);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.8 });
  labels.forEach(el => io.observe(el));
}

/* ── 21. FOOTER YEAR ────────────────────────────────────────── */
function initFooterYear() {
  const el = $('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ── 22. SMOOTH SCROLL ──────────────────────────────────────── */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    });
  });
}

/* ── BOOT ───────────────────────────────────────────────────── */
// Run before load finishes
initSmoothScroll();
initFooterYear();

// Run after load
function initAfterLoad() {
  initHeroCanvas();
  initTypewriter();
  initReveal();
  initMagnetic();
  initSliders();
  initGallery();
  initTimeline();
  initStats();
  initStatsCanvas();
  initPricingToggle();
  initPricingReveal();
  initTestimonials();
  initFAQ();
  initContactForm();
  initTilt();
  initParallax();
  initTextScramble();
}
