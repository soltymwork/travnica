/* ===== NAVBAR SCROLL ===== */
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.classList.toggle('scrolled', y > 60);
  backToTop.classList.toggle('visible', y > 400);
});

/* ===== HAMBURGER MENU ===== */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  const isOpen = navLinks.classList.contains('open');
  spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
  spans[1].style.opacity = isOpen ? '0' : '1';
  spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
});

// Close on link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform=''; s.style.opacity='1'; });
  });
});

/* ===== SMOOTH ACTIVE NAV ===== */
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

const observerOpts = { rootMargin: '-40% 0px -55% 0px' };
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navAnchors.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--gold-light)' : '';
      });
    }
  });
}, observerOpts);

sections.forEach(s => sectionObserver.observe(s));

/* ===== SCROLL REVEAL ===== */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.about-card, .attraction-card, .news-card, .nature-list li').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObs.observe(el);
});

/* ===== ANIMATED COUNTER ===== */
function animateCounter(el, target, suffix = '') {
  const duration = 2000;
  const start = performance.now();
  const startVal = 0;

  function update(now) {
    const elapsed = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    const val = Math.round(startVal + (target - startVal) * eased);
    el.textContent = val.toLocaleString('sk') + suffix;
    if (elapsed < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

const statsObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const raw = el.dataset.count;
      animateCounter(el, parseInt(raw, 10));
      statsObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => {
  const text = el.textContent.trim();
  el.dataset.count = text;
  el.textContent = '0';
  statsObs.observe(el);
});

/* ===== CONTACT FORM ===== */
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Odosiela sa...';

  setTimeout(() => {
    submitBtn.textContent = 'Odoslať správu';
    submitBtn.disabled = false;
    formSuccess.style.display = 'block';
    form.reset();
    setTimeout(() => { formSuccess.style.display = 'none'; }, 5000);
  }, 1400);
});

/* ===== HERO PARALLAX ===== */
const heroImg = document.querySelector('.hero-img');
window.addEventListener('scroll', () => {
  if (heroImg) {
    heroImg.style.transform = `scale(1.0) translateY(${window.scrollY * 0.3}px)`;
  }
}, { passive: true });
