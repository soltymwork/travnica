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
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
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
/* ===== CMS CONTENT LOADING ===== */
async function loadCMSContent() {
  const cmsElements = document.querySelectorAll('[data-cms-id]');

  for (const el of cmsElements) {
    const id = el.dataset.cmsId;
    const type = el.dataset.cmsType || 'md'; // md, json, or collection

    try {
      if (type === 'collection') {
        renderCollection(el, id);
        continue;
      }

      const response = await fetch(`content/${id}.${type}`);
      if (!response.ok) continue;

      if (type === 'md') {
        const text = await response.text();
        const cleanContent = text.replace(/^---[\s\S]*?---/, '').trim();
        if (typeof marked !== 'undefined') {
          el.innerHTML = marked.parse(cleanContent);
        } else {
          el.textContent = cleanContent;
        }
      } else if (type === 'json') {
        const data = await response.json();
        renderJSONContent(el, id, data);
      }
    } catch (err) {
      console.warn(`Failed to load CMS content for ${id}:`, err);
    }
  }
}

async function renderCollection(container, collectionId) {
  // Manifest listing for static site compatibility
  const manifest = {
    'aktuality': ['vikend-parkov-2025', 'naucny-chodnik', 'hospodarenie-2024', 'rekonstrukcia', 'den-travnice', 'brigada-jazero'],
    'pamiatky': ['kostol', 'kastiele', 'studna', 'kaplnka']
  };

  const files = manifest[collectionId] || [];
  const grid = container.querySelector('.news-grid') || container.querySelector('.attractions-grid') || container;

  let html = '';
  for (const file of files) {
    try {
      const res = await fetch(`content/${collectionId}/${file}.md`);
      if (!res.ok) continue;
      const text = await res.text();
      const fm = parseFrontMatter(text);

      if (collectionId === 'aktuality') {
        html += renderNewsCard(fm);
      } else if (collectionId === 'pamiatky') {
        html += renderAttractionCard(fm, files.indexOf(file) < 2);
      }
    } catch (e) { console.error(e); }
  }
  if (html) grid.innerHTML = html;
}

function parseFrontMatter(text) {
  const fmMatch = text.match(/^---([\s\S]*?)---/);
  const data = {};
  if (fmMatch) {
    const lines = fmMatch[1].split('\n');
    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        data[key] = val;
      }
    });
  }
  data.body = text.replace(/^---[\s\S]*?---/, '').trim();
  return data;
}

function renderNewsCard(data) {
  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('sk', { month: 'short' }).replace('.', '');
  const year = date.getFullYear();

  return `
    <article class="news-card">
      <div class="news-date">
        <span class="nd-day">${day}</span>
        <span class="nd-month">${month} ${year}</span>
      </div>
      <div class="news-body">
        <span class="news-cat">${data.category || 'Všeobecné'}</span>
        <h3>${data.title}</h3>
        <p>${data.description || ''}</p>
        <a href="#" class="news-link">Čítať viac →</a>
      </div>
    </article>
  `;
}

function renderAttractionCard(data, isFeatured) {
  return `
    <div class="attraction-card ${isFeatured ? 'featured' : ''}">
        <div class="attraction-img-wrap">
            ${data.image ? `<img src="${data.image}" alt="${data.title}" />` : `
            <div class="photo-placeholder">
                <div class="ph-inner">
                    <span class="ph-icon">🏛️</span>
                    <span class="ph-label">${data.title}</span>
                </div>
            </div>`}
            <div class="attraction-badge">${data.badge || 'Pamiatka'}</div>
        </div>
        <div class="attraction-body">
            <h3>${data.title}</h3>
            ${typeof marked !== 'undefined' ? marked.parse(data.body) : `<p>${data.body}</p>`}
            <span class="attraction-year">${data.year || ''}</span>
        </div>
    </div>
  `;
}

function renderJSONContent(el, id, data) {
  if (id === 'kontakt') {
    const addressEl = el.querySelector('[data-field="address"]');
    const phoneEl = el.querySelector('[data-field="phone"]');
    const emailEl = el.querySelector('[data-field="email"]');
    const hoursEl = el.querySelector('[data-field="hours"]');
    const webEl = el.querySelector('[data-field="website"]');

    if (addressEl) addressEl.textContent = data.address;
    if (phoneEl) phoneEl.textContent = data.phone;
    if (emailEl) emailEl.textContent = data.email;
    if (hoursEl) hoursEl.textContent = data.hours;
    if (webEl) {
      webEl.textContent = data.website;
      webEl.href = `https://${data.website}`;
    }
  } else if (id === 'index') {
    const statsInner = el.querySelector('.stats-inner');
    if (data.stats && statsInner) {
      statsInner.innerHTML = data.stats.map((stat, index) => `
        <div class="stat-item">
          <span class="stat-number" data-count="${stat.number}">${stat.number}</span>
          <span class="stat-label">${stat.label}</span>
        </div>
        ${index < data.stats.length - 1 ? '<div class="stat-divider"></div>' : ''}
      `).join('');

      statsInner.querySelectorAll('.stat-number').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count, 10));
      });
    }
  } else if (id === 'historia') {
    const timeline = el.querySelector('.timeline') || el;
    const entries = data.entries || data;
    timeline.innerHTML = entries.map((item, index) => `
      <div class="tl-item ${index % 2 !== 0 ? 'right' : ''}">
        <div class="tl-dot"></div>
        <div class="tl-card">
          <span class="tl-year">${item.year}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      </div>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', loadCMSContent);
