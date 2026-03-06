/* ===== NAVBAR SCROLL ===== */
var navbar = document.getElementById('navbar');
var backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', function() {
  var y = window.scrollY;
  if (navbar) navbar.classList.toggle('scrolled', y > 60);
  if (backToTop) backToTop.classList.toggle('visible', y > 400);
});

/* ===== HAMBURGER MENU ===== */
var hamburger = document.getElementById('hamburger');
var navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', function() {
    navLinks.classList.toggle('open');
    var spans = hamburger.querySelectorAll('span');
    var isOpen = navLinks.classList.contains('open');
    spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
    spans[1].style.opacity = isOpen ? '0' : '1';
    spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
  });
  navLinks.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      navLinks.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(function(s) { s.style.transform = ''; s.style.opacity = '1'; });
    });
  });
}

/* ===== SCROLL REVEAL ===== */
var revealObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

function initReveals() {
  document.querySelectorAll('.about-card, .attraction-card, .news-card, .nature-list li').forEach(function(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObs.observe(el);
  });
}

/* ===== ANIMATED COUNTER ===== */
function animateCounter(el, target) {
  var duration = 2000;
  var start = performance.now();
  function update(now) {
    var elapsed = Math.min((now - start) / duration, 1);
    var eased = 1 - Math.pow(1 - elapsed, 3);
    el.textContent = Math.round(target * eased).toLocaleString('sk');
    if (elapsed < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ===== FRONTMATTER PARSER ===== */
function parseFrontMatter(text) {
  var data = {};
  var fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(function(line) {
      var clean = line.replace(/\r$/, '');
      var idx = clean.indexOf(':');
      if (idx < 1) return;
      var key = clean.slice(0, idx).trim();
      var val = clean.slice(idx + 1).trim();
      if ((val[0] === '"' && val[val.length-1] === '"') || (val[0] === "'" && val[val.length-1] === "'")) {
        val = val.slice(1, -1);
      }
      data[key] = val;
    });
  }
  data.body = text.replace(/^---[\s\S]*?---/, '').trim();
  return data;
}

/* ===== COLLECTION RENDERER ===== */
async function renderCollection(container, collectionId) {
  var basePath = 'content/' + collectionId;
  var grid = container.querySelector('.news-grid') || container.querySelector('.attractions-grid') || container;
  try {
    var manifestRes = await fetch(basePath + '/manifest.json');
    if (!manifestRes.ok) { console.warn('No manifest for ' + collectionId); return; }
    var fileList = await manifestRes.json();
    var items = [];
    for (var i = 0; i < fileList.length; i++) {
      try {
        var res = await fetch(basePath + '/' + fileList[i]);
        if (!res.ok) continue;
        var fm = parseFrontMatter(await res.text());
        items.push(fm);
      } catch(e) { console.warn('Skip file ' + fileList[i]); }
    }
    if (collectionId === 'aktuality') {
      items.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
    }
    var html = '';
    for (var j = 0; j < items.length; j++) {
      if (collectionId === 'aktuality') html += renderNewsCard(items[j]);
      else if (collectionId === 'pamiatky') html += renderAttractionCard(items[j], j < 2);
    }
    if (html) { grid.innerHTML = html; initReveals(); }
  } catch (err) { console.error('Collection error ' + collectionId, err); }
}

function renderNewsCard(d) {
  var dt = new Date(d.date || Date.now());
  return '<article class="news-card"><div class="news-date"><span class="nd-day">' + dt.getDate() + '</span><span class="nd-month">' + dt.toLocaleString('sk',{month:'short'}).replace('.','') + ' ' + dt.getFullYear() + '</span></div><div class="news-body"><span class="news-cat">' + (d.category||'Novinka') + '</span><h3>' + (d.title||'') + '</h3><p>' + (d.description||'') + '</p><a href="#" class="news-link">Čítať viac →</a></div></article>';
}

function renderAttractionCard(d, feat) {
  var img = d.image ? '<img src="'+d.image+'" />' : '<div class="photo-placeholder"><div class="ph-inner">🏛️<br/>'+(d.title||'')+'</div></div>';
  var body = (typeof marked !== 'undefined' && d.body) ? marked.parse(d.body) : (d.body||'');
  return '<div class="attraction-card '+(feat?'featured':'')+'"><div class="attraction-img-wrap">'+img+'<div class="attraction-badge">'+(d.badge||'Pamiatka')+'</div></div><div class="attraction-body"><h3>'+(d.title||'')+'</h3>'+body+'<span class="attraction-year">'+(d.year||'')+'</span></div></div>';
}

/* ===== JSON RENDERERS ===== */
function renderJSONContent(el, id, data) {
  try {
    var html = '';
    var i, c;

    if (id === 'kontakt') {
      ['address','phone','email','hours','website'].forEach(function(f) {
        var item = el.querySelector('[data-field="'+f+'"]');
        if (item) { item.textContent = data[f]||''; if (f==='website'&&data[f]) item.href='https://'+data[f]; }
      });
      return;
    }

    if (id === 'index' && data.stats) {
      var inner = el.querySelector('.stats-inner');
      if (!inner) return;
      html = '';
      for (i=0; i<data.stats.length; i++) {
        html += '<div class="stat-item"><span class="stat-number" data-count="'+data.stats[i].number+'">'+data.stats[i].number+'</span><span class="stat-label">'+data.stats[i].label+'</span></div>';
        if (i < data.stats.length-1) html += '<div class="stat-divider"></div>';
      }
      inner.innerHTML = html;
      inner.querySelectorAll('.stat-number').forEach(function(s) { animateCounter(s, parseInt(s.dataset.count)); });
      return;
    }

    if (id === 'historia' && data.entries) {
      var tl = el.querySelector('.timeline') || el;
      html = '';
      for (i=0; i<data.entries.length; i++) {
        c = data.entries[i];
        html += '<div class="tl-item '+(i%2!==0?'right':'')+'"><div class="tl-dot"></div><div class="tl-card"><span class="tl-year">'+c.year+'</span><h3>'+c.title+'</h3><p>'+c.description+'</p></div></div>';
      }
      tl.innerHTML = html;
      return;
    }

    if ((id === 'o-obci-cards' || id === 'priroda-cards') && data.cards) {
      html = '';
      for (i=0; i<data.cards.length; i++) {
        c = data.cards[i];
        html += '<div class="about-card"><div class="about-icon">'+(c.icon||'')+'</div><h3>'+(c.title||'')+'</h3><p>'+(c.text||'')+'</p></div>';
      }
      el.innerHTML = html;
      initReveals();
      return;
    }

    if (id === 'hero') {
      var hc = el.querySelector('.hero-content');
      if (!hc) return;
      var hEye = hc.querySelector('.hero-eyebrow'); if(hEye) hEye.textContent = data.eyebrow||'';
      var hTitle = hc.querySelector('.hero-title'); if(hTitle) hTitle.textContent = data.title||'';
      var hSub = hc.querySelector('.hero-subtitle'); if(hSub) hSub.innerHTML = (data.subtitle||'')+'<br />Prvá zmienka: <strong>'+(data.highlight||'')+'</strong>';
      var hBadges = hc.querySelector('.hero-badges');
      if (hBadges && data.badges) {
        html = '';
        for (i=0; i<data.badges.length; i++) {
          var b = data.badges[i];
          html += '<span class="badge">'+(typeof b==='string'?b:(b.badge||''))+'</span>';
        }
        hBadges.innerHTML = html;
      }
      var hCta = hc.querySelector('.btn-primary');
      if(hCta) { hCta.textContent = data.cta_text||'Spoznajte nás'; hCta.href = data.cta_link||'o-obci.html'; }
      return;
    }

    if (id === 'quicklinks' && data.links) {
      var qHeader = el.querySelector('.section-header');
      if (qHeader) {
        var qTag = qHeader.querySelector('.section-tag'); if(qTag) qTag.textContent = data.tag||'';
        var qH2 = qHeader.querySelector('h2'); if(qH2) qH2.textContent = data.title||'';
      }
      var qGrid = el.querySelector('.quicklinks-grid');
      if (qGrid) {
        html = '';
        for (i=0; i<data.links.length; i++) {
          c = data.links[i];
          html += '<a href="'+(c.url||'#')+'" class="ql-card"><span class="ql-icon">'+(c.icon||'')+'</span><h3>'+(c.title||'')+'</h3><p>'+(c.text||'')+'</p><span class="ql-arrow">→</span></a>';
        }
        qGrid.innerHTML = html;
      }
      return;
    }

    if (id === 'priroda-list' && data.features) {
      html = '';
      for (i=0; i<data.features.length; i++) {
        c = data.features[i];
        html += '<li><span class="nl-icon">'+(c.icon||'')+'</span><div><strong>'+(c.title||'')+'</strong><p>'+(c.text||'')+'</p></div></li>';
      }
      el.innerHTML = html;
      initReveals();
      return;
    }

    if (id === 'footer') {
      var fInner = el.querySelector('.footer-inner');
      if (!fInner) return;
      var fLinks = '';
      if (data.useful_links) {
        for (i=0; i<data.useful_links.length; i++) {
          fLinks += '<li><a href="'+(data.useful_links[i].url||'#')+'" target="_blank" rel="noopener">'+(data.useful_links[i].title||'')+'</a></li>';
        }
      }
      var fbSvg = data.facebook_url ? '<a href="'+data.facebook_url+'" target="_blank" rel="noopener" class="social-link" title="Facebook"><svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg></a>' : '';
      fInner.innerHTML = '<div class="footer-top"><div class="footer-brand"><span class="logo-icon">⚜</span><span class="footer-name">Obec Trávnica</span><p>'+(data.brand_text||'')+'</p><div class="footer-social">'+fbSvg+'</div></div><div class="footer-links-col"><h4>Navigácia</h4><ul><li><a href="o-obci.html">O obci</a></li><li><a href="historia.html">História</a></li><li><a href="pamiatky.html">Pamiatky</a></li><li><a href="priroda.html">Príroda</a></li><li><a href="kontakt.html">Kontakt</a></li></ul></div><div class="footer-links-col"><h4>Užitočné linky</h4><ul>'+fLinks+'</ul></div></div><div class="footer-bottom"><p>'+(data.copyright||'')+'</p><p>'+(data.credit||'')+'</p></div>';
      return;
    }

    console.warn('No CMS renderer for: ' + id);
  } catch(err) {
    console.error('Render error [' + id + ']:', err);
  }
}

/* ===== CMS CONTENT LOADING ===== */
async function loadCMSContent() {
  var elements = document.querySelectorAll('[data-cms-id]');
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var id = el.dataset.cmsId;
    var type = el.dataset.cmsType || 'md';
    try {
      if (type === 'collection') { await renderCollection(el, id); continue; }
      var response = await fetch('content/' + id + '.' + type);
      if (!response.ok) continue;
      if (type === 'md') {
        var text = await response.text();
        var clean = text.replace(/^---[\s\S]*?---/, '').trim();
        el.innerHTML = (typeof marked !== 'undefined') ? marked.parse(clean) : clean;
      } else if (type === 'json') {
        renderJSONContent(el, id, await response.json());
      }
    } catch(err) { console.error('CMS error ['+id+']:', err); }
  }
}

document.addEventListener('DOMContentLoaded', loadCMSContent);
