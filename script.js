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
  const user = 'soltymwork';
  const repo = 'travnica';
  const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/content/${collectionId}`;
  const grid = container.querySelector('.news-grid') || container.querySelector('.attractions-grid') || container;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('API failed');
    const files = await response.json();
    const validFiles = files.filter(f => f.name.endsWith('.md'));

    let html = '';
    for (const file of validFiles) {
      const res = await fetch(file.download_url);
      if (!res.ok) continue;
      const text = await res.text();
      const fm = parseFrontMatter(text);

      if (collectionId === 'aktuality') {
        html += renderNewsCard(fm);
      } else if (collectionId === 'pamiatky') {
        html += renderAttractionCard(fm, validFiles.indexOf(file) < 2);
      }
    }
    if (html) {
      grid.innerHTML = html;
      initReveals();
    }
  } catch (err) {
    console.error(err);
  }
}

function parseFrontMatter(text) {
  const fmMatch = text.match(/^---([\s\S]*?)---/);
  const data = {};
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const p = line.split(':');
      if (p.length >= 2) data[p[0].trim()] = p.slice(1).join(':').trim();
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
  }
}

document.addEventListener('DOMContentLoaded', loadCMSContent);
