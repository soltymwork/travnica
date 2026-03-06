/* ===== NAVBAR ===== */
var navbar=document.getElementById('navbar'),backToTop=document.getElementById('backToTop');
window.addEventListener('scroll',function(){var y=window.scrollY;if(navbar)navbar.classList.toggle('scrolled',y>60);if(backToTop)backToTop.classList.toggle('visible',y>400);});

/* ===== HAMBURGER ===== */
var hamburger=document.getElementById('hamburger'),navLinks=document.getElementById('navLinks');
if(hamburger&&navLinks){hamburger.addEventListener('click',function(){navLinks.classList.toggle('open');var s=hamburger.querySelectorAll('span'),o=navLinks.classList.contains('open');s[0].style.transform=o?'rotate(45deg) translate(5px,5px)':'';s[1].style.opacity=o?'0':'1';s[2].style.transform=o?'rotate(-45deg) translate(5px,-5px)':'';});navLinks.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){navLinks.classList.remove('open');hamburger.querySelectorAll('span').forEach(function(s){s.style.transform='';s.style.opacity='1';});});});}

/* ===== SCROLL REVEAL ===== */
var revealObs=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting){en.target.style.opacity='1';en.target.style.transform='translateY(0)';}});},{threshold:0.1});
function initReveals(){document.querySelectorAll('.about-card,.attraction-card,.news-card,.nature-list li').forEach(function(el){el.style.opacity='0';el.style.transform='translateY(24px)';el.style.transition='opacity .5s ease,transform .5s ease';revealObs.observe(el);});}

/* ===== COUNTER ===== */
function animateCounter(el,t){var d=2000,st=performance.now();function u(n){var e=Math.min((n-st)/d,1);el.textContent=Math.round(t*(1-Math.pow(1-e,3))).toLocaleString('sk');if(e<1)requestAnimationFrame(u);}requestAnimationFrame(u);}

/* ===== FRONTMATTER PARSER ===== */
function parseFM(text){var d={},m=text.match(/^---\r?\n([\s\S]*?)\r?\n---/);if(m){m[1].split('\n').forEach(function(line){var c=line.replace(/\r$/,''),i=c.indexOf(':');if(i<1)return;var k=c.slice(0,i).trim(),v=c.slice(i+1).trim();if((v[0]==='"'&&v[v.length-1]==='"')||(v[0]==="'"&&v[v.length-1]==="'"))v=v.slice(1,-1);d[k]=v;});}d.body=text.replace(/^---[\s\S]*?---/,'').trim();return d;}

/* ===== LOAD COLLECTION FROM MANIFEST ===== */
async function loadCollection(path){
  try{
    var r=await fetch(path+'/manifest.json');
    if(!r.ok)return[];
    var files=await r.json(),items=[];
    for(var i=0;i<files.length;i++){
      try{var res=await fetch(path+'/'+files[i]);if(!res.ok)continue;var fm=parseFM(await res.text());items.push(fm);}catch(e){}
    }
    items.sort(function(a,b){return(parseInt(a.order)||999)-(parseInt(b.order)||999);});
    return items;
  }catch(e){console.error('Collection error:',path,e);return[];}
}

/* ===== CMS LOADER ===== */
async function loadCMSContent(){
  var els=document.querySelectorAll('[data-cms-id]');
  for(var i=0;i<els.length;i++){
    var el=els[i],id=el.dataset.cmsId,type=el.dataset.cmsType||'md';
    try{
      /* --- COLLECTION (folder with manifest) --- */
      if(type==='collection'){
        var items=await loadCollection('content/'+id);
        var grid=el.querySelector('.news-grid')||el.querySelector('.attractions-grid')||el.querySelector('.timeline')||el;
        var html='';

        if(id==='aktuality'){
          items.sort(function(a,b){return new Date(b.date||0)-new Date(a.date||0);});
          for(var j=0;j<items.length;j++){var d=items[j],dt=new Date(d.date||Date.now());html+='<article class="news-card"><div class="news-date"><span class="nd-day">'+dt.getDate()+'</span><span class="nd-month">'+dt.toLocaleString('sk',{month:'short'}).replace('.','')+' '+dt.getFullYear()+'</span></div><div class="news-body"><span class="news-cat">'+(d.category||'Novinka')+'</span><h3>'+(d.title||'')+'</h3><p>'+(d.description||'')+'</p><a href="#" class="news-link">Čítať viac →</a></div></article>';}
        }
        else if(id==='pamiatky'){
          for(var j=0;j<items.length;j++){var d=items[j];var img=d.image?'<img src="'+d.image+'" />':'<div class="photo-placeholder"><div class="ph-inner">🏛️<br/>'+(d.title||'')+'</div></div>';var bd=(typeof marked!=='undefined'&&d.body)?marked.parse(d.body):(d.body||'');html+='<div class="attraction-card '+(j<2?'featured':'')+'"><div class="attraction-img-wrap">'+img+'<div class="attraction-badge">'+(d.badge||'Pamiatka')+'</div></div><div class="attraction-body"><h3>'+(d.title||'')+'</h3>'+bd+'<span class="attraction-year">'+(d.year||'')+'</span></div></div>';}
        }
        else if(id==='historia'){
          for(var j=0;j<items.length;j++){var d=items[j];html+='<div class="tl-item '+(j%2!==0?'right':'')+'"><div class="tl-dot"></div><div class="tl-card"><span class="tl-year">'+(d.year||'')+'</span><h3>'+(d.title||'')+'</h3><p>'+(d.body||'')+'</p></div></div>';}
        }
        else if(id==='o-obci-cards'||id==='priroda-cards'){
          for(var j=0;j<items.length;j++){var d=items[j];html+='<div class="about-card"><div class="about-icon">'+(d.icon||'')+'</div><h3>'+(d.title||'')+'</h3><p>'+(d.body||'')+'</p></div>';}
        }
        else if(id==='quicklinks'){
          var hdr=el.querySelector('.section-header');
          var qg=el.querySelector('.quicklinks-grid')||el;
          for(var j=0;j<items.length;j++){var d=items[j];html+='<a href="'+(d.url||'#')+'" class="ql-card"><span class="ql-icon">'+(d.icon||'')+'</span><h3>'+(d.title||'')+'</h3><p>'+(d.body||'')+'</p><span class="ql-arrow">→</span></a>';}
          qg.innerHTML=html;initReveals();continue;
        }
        else if(id==='stats'){
          var si=el.querySelector('.stats-inner')||el;
          for(var j=0;j<items.length;j++){var d=items[j];html+='<div class="stat-item"><span class="stat-number" data-count="'+d.number+'">0</span><span class="stat-label">'+(d.label||'')+'</span></div>';if(j<items.length-1)html+='<div class="stat-divider"></div>';}
          si.innerHTML=html;continue;
        }
        else if(id==='priroda-features'){
          for(var j=0;j<items.length;j++){var d=items[j];html+='<li><span class="nl-icon">'+(d.icon||'')+'</span><div><strong>'+(d.title||'')+'</strong><p>'+(d.body||'')+'</p></div></li>';}
        }
        else if(id==='footer-links'){
          for(var j=0;j<items.length;j++){var d=items[j];html+='<li><a href="'+(d.url||'#')+'" target="_blank" rel="noopener">'+(d.title||'')+'</a></li>';}
          el.innerHTML=html;continue;
        }

        if(html){grid.innerHTML=html;initReveals();}
        continue;
      }

      /* --- FILE (single md or json) --- */
      var response=await fetch('content/'+id+'.'+type);
      if(!response.ok)continue;

      if(type==='md'){
        var text=await response.text();
        el.innerHTML=(typeof marked!=='undefined')?marked.parse(text.replace(/^---[\s\S]*?---/,'').trim()):text.replace(/^---[\s\S]*?---/,'').trim();
      }
      else if(type==='json'){
        var data=await response.json();
        /* HERO */
        if(id==='hero'){
          var hc=el.querySelector('.hero-content');if(!hc)continue;
          var e=hc.querySelector('.hero-eyebrow');if(e)e.textContent=data.eyebrow||'';
          var t=hc.querySelector('.hero-title');if(t)t.textContent=data.title||'';
          var s=hc.querySelector('.hero-subtitle');if(s)s.innerHTML=(data.subtitle||'')+'<br />Prvá zmienka: <strong>'+(data.highlight||'')+'</strong>';
          var b=hc.querySelector('.hero-badges');
          if(b&&data.badges){b.innerHTML=data.badges.split(',').map(function(x){return'<span class="badge">'+x.trim()+'</span>';}).join('');}
          var c=hc.querySelector('.btn-primary');if(c){c.textContent=data.cta_text||'Spoznajte nás';c.href=data.cta_link||'o-obci.html';}
        }
        /* KONTAKT */
        else if(id==='kontakt'){
          ['address','phone','email','hours','website'].forEach(function(f){var item=el.querySelector('[data-field="'+f+'"]');if(item){item.textContent=data[f]||'';if(f==='website'&&data[f])item.href='https://'+data[f];}});
        }
        /* FOOTER SETTINGS */
        else if(id==='footer-settings'){
          var fp=el.querySelector('.footer-brand p');if(fp)fp.textContent=data.brand_text||'';
          var fa=el.querySelector('.social-link');if(fa&&data.facebook_url)fa.href=data.facebook_url;
          var fc=el.querySelector('.footer-copyright');if(fc)fc.textContent=data.copyright||'';
          var fcr=el.querySelector('.footer-credit');if(fcr)fcr.textContent=data.credit||'';
        }
      }
    }catch(err){console.error('CMS error ['+id+']:',err);}
  }
  /* After all CMS content loaded, init scroll animations */
  initScrollAnimations();
}

/* ===== SCROLL ANIMATIONS ===== */
function initScrollAnimations(){
  /* Stats counter - animate only when scrolled into view */
  var statsObs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        en.target.querySelectorAll('.stat-number').forEach(function(s){
          animateCounter(s,parseInt(s.dataset.count)||0);
        });
        statsObs.unobserve(en.target);
      }
    });
  },{threshold:0.3});
  document.querySelectorAll('.stats-bar').forEach(function(el){statsObs.observe(el);});

  /* Timeline items - reveal one by one on scroll */
  var tlObs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        en.target.classList.add('tl-visible');
        tlObs.unobserve(en.target);
      }
    });
  },{threshold:0.15,rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('.tl-item').forEach(function(el,i){
    el.style.transitionDelay=(i*0.1)+'s';
    tlObs.observe(el);
  });
}

document.addEventListener('DOMContentLoaded',loadCMSContent);
