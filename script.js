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

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
  });
});

/* ===== SCROLL REVEAL ===== */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

function initReveals() {
  document.querySelectorAll('.about-card, .attraction-card, .news-card, .nature-list li').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObs.observe(el);
  });
}

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

/* ===== CMS CONTENT LOADING ===== */
async function loadCMSContent() {
  const cmsElements = document.querySelectorAll('[data-cms-id]');

  for (const el of cmsElements) {
    const id = el.dataset.cmsId;
    const type = el.dataset.cmsType || 'md';

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
  const basePath = `content/${collectionId}`;
  const grid = container.querySelector('.news-grid') || container.querySelector('.attractions-grid') || container;

  try {
    /* 1. Fetch manifest (no GitHub API needed — served from GitHub Pages) */
    const manifestRes = await fetch(`${basePath}/_manifest.json`);
    if (!manifestRes.ok) throw new Error('Manifest not found');
    const fileList = await manifestRes.json();

    /* 2. Fetch each .md file directly from GitHub Pages */
    const items = [];
    for (const filename of fileList) {
      const res = await fetch(`${basePath}/${filename}`);
      if (!res.ok) continue;
      const text = await res.text();
      const fm = parseFrontMatter(text);
      fm._filename = filename;
      items.push(fm);
    }

    /* 3. Sort aktuality by date (newest first) */
    if (collectionId === 'aktuality') {
      items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }

    /* 4. Render */
    let html = '';
    items.forEach((fm, i) => {
      if (collectionId === 'aktuality') {
        html += renderNewsCard(fm);
      } else if (collectionId === 'pamiatky') {
        html += renderAttractionCard(fm, i < 2);
      }
    });

    if (html) {
      grid.innerHTML = html;
      initReveals();
    }
  } catch (err) {
    console.error('Collection load error:', err);
  }
}

function parseFrontMatter(text) {
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data = {};
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const clean = line.replace(/\r$/, '');
      const idx = clean.indexOf(':');
      if (idx < 1) return;
      const key = clean.slice(0, idx).trim();
      let val = clean.slice(idx + 1).trim();
      /* Strip surrounding quotes */
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      data[key] = val;
    });
  }
  data.body = text.replace(/^---[\s\S]*?---/, '').trim();
  return data;
}

function renderNewsCard(data) {
  const d = new Date(data.date || Date.now());
  return `
    <article class="news-card">
      <div class="news-date">
        <span class="nd-day">${d.getDate()}</span>
        <span class="nd-month">${d.toLocaleString('sk', { month: 'short' }).replace('.', '')} ${d.getFullYear()}</span>
      </div>
      <div class="news-body">
        <span class="news-cat">${data.category || 'Novinka'}</span>
        <h3>${data.title}</h3>
        <p>${data.description || ''}</p>
        <a href="#" class="news-link">Čítať viac →</a>
      </div>
    </article>`;
}

function renderAttractionCard(data, isFeatured) {
  return `
    <div class="attraction-card ${isFeatured ? 'featured' : ''}">
        <div class="attraction-img-wrap">
            ${data.image ? `<img src="${data.image}" />` : `<div class="photo-placeholder"><div class="ph-inner">🏛️<br/>${data.title}</div></div>`}
            <div class="attraction-badge">${data.badge || 'Pamiatka'}</div>
        </div>
        <div class="attraction-body">
            <h3>${data.title}</h3>
            ${typeof marked !== 'undefined' ? marked.parse(data.body) : data.body}
            <span class="attraction-year">${data.year || ''}</span>
        </div>
    </div>`;
}

function renderJSONContent(el, id, data) {
  if (id === 'kontakt') {
    const fields = ['address', 'phone', 'email', 'hours', 'website'];
    fields.forEach(f => {
      const item = el.querySelector(`[data-field="${f}"]`);
      if (item) {
        item.textContent = data[f];
        if (f === 'website') item.href = `https://${data[f]}`;
      }
    });

  } else if (id === 'index' && data.stats) {
    const inner = el.querySelector('.stats-inner');
    if (!inner) return;
    inner.innerHTML = data.stats.map((s, i) => `
      <div class="stat-item">
        <span class="stat-number" data-count="${s.number}">${s.number}</span>
        <span class="stat-label">${s.label}</span>
      </div>
      ${i < data.stats.length - 1 ? '<div class="stat-divider"></div>' : ''}`).join('');
    inner.querySelectorAll('.stat-number').forEach(s => animateCounter(s, parseInt(s.dataset.count)));

  } else if (id === 'historia') {
    const tl = el.querySelector('.timeline') || el;
    tl.innerHTML = (data.entries || []).map((item, i) => `
      <div class="tl-item ${i % 2 !== 0 ? 'right' : ''}">
        <div class="tl-dot"></div>
        <div class="tl-card">
          <span class="tl-year">${item.year}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      </div>`).join('');

  } else if ((id === 'o-obci-cards' || id === 'priroda-cards') && data.cards) {
    el.innerHTML = data.cards.map(c => `
      <div class="about-card">
        <div class="about-icon">${c.icon}</div>
        <h3>${c.title}</h3>
        <p>${c.text}</p>
      </div>`).join('');
    initReveals();

  } else if (id === 'hero') {
    const heroContent = el.querySelector('.hero-content');
    if (heroContent) {
      heroContent.querySelector('.hero-eyebrow').textContent = data.eyebrow || '';
      heroContent.querySelector('.hero-title').textContent = data.title || '';
      const subtitle = heroContent.querySelector('.hero-subtitle');
      if (subtitle) {
        subtitle.innerHTML = `${data.subtitle || ''}<br />Prvá zmienka: <strong>${data.highlight || ''}</strong>`;
      }
      const badges = heroContent.querySelector('.hero-badges');
      if (badges && data.badges) {
        badges.innerHTML = data.badges.map(b => `<span class="badge">${b}</span>`).join('');
      }
      const cta = heroContent.querySelector('.btn-primary');
      if (cta) {
        cta.textContent = data.cta_text || 'Spoznajte nás';
        cta.href = data.cta_link || 'o-obci.html';
      }
    }

  } else if (id === 'quicklinks' && data.links) {
    const header = el.querySelector('.section-header');
    if (header) {
      header.querySelector('.section-tag').textContent = data.tag || '';
      header.querySelector('h2').textContent = data.title || '';
    }
    const grid = el.querySelector('.quicklinks-grid');
    if (grid) {
      grid.innerHTML = data.links.map(l => `
        <a href="${l.url}" class="ql-card">
          <span class="ql-icon">${l.icon}</span>
          <h3>${l.title}</h3>
          <p>${l.text}</p>
          <span class="ql-arrow">→</span>
        </a>`).join('');
    }

  } else if (id === 'priroda-list' && data.features) {
    el.innerHTML = data.features.map(f => `
      <li>
        <span class="nl-icon">${f.icon}</span>
        <div>
          <strong>${f.title}</strong>
          <p>${f.text}</p>
        </div>
      </li>`).join('');
    initReveals();

  } else if (id === 'footer') {
    const inner = el.querySelector('.footer-inner');
    if (!inner) return;
    inner.innerHTML = `
      <div class="footer-top">
        <div class="footer-brand">
          <span class="logo-icon">⚜</span>
          <span class="footer-name">Obec Trávnica</span>
          <p>${data.brand_text || ''}</p>
          <div class="footer-social">
            ${data.facebook_url ? `<a href="${data.facebook_url}" target="_blank" rel="noopener" class="social-link" title="Facebook">
              <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
              </svg>
            </a>` : ''}
          </div>
        </div>
        <div class="footer-links-col">
          <h4>Navigácia</h4>
          <ul>
            <li><a href="o-obci.html">O obci</a></li>
            <li><a href="historia.html">História</a></li>
            <li><a href="pamiatky.html">Pamiatky</a></li>
            <li><a href="priroda.html">Príroda</a></li>
            <li><a href="kontakt.html">Kontakt</a></li>
          </ul>
        </div>
        <div class="footer-links-col">
          <h4>Užitočné linky</h4>
          <ul>
            ${(data.useful_links || []).map(l => `<li><a href="${l.url}" target="_blank" rel="noopener">${l.title}</a></li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>${data.copyright || ''}</p>
        <p>${data.credit || ''}</p>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadCMSContent);
