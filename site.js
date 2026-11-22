(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // progress bar
  var bar = document.createElement('div'); bar.id = 'scroll-progress'; document.body.appendChild(bar);
  var header = document.querySelector('.site-header');
  var art = document.querySelector('.hero-art svg');
  var ticking = false;
  function onScroll(){
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (header) header.classList.toggle('scrolled', y > 8);
    if (art && !reduce && innerWidth > 900) art.style.transform = 'translateY(' + Math.min(y * 0.12, 80) + 'px)';
    ticking = false;
  }
  addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
  onScroll();

  // hero tiles assemble on load
  var heroArt = document.querySelector('.hero-art');
  if (heroArt) {
    heroArt.querySelectorAll('svg > *').forEach(function(t, i){ t.classList.add('tile'); t.style.setProperty('--d', (i * 45) + 'ms'); });
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ heroArt.classList.add('in'); }); });
  }

  // scroll reveal
  var targets = [];
  document.querySelectorAll('.hero-text > *, .hero > div > *:not(.hero-chip)').forEach(function(el, i){
    if (!el.closest('.hero-art')) { el.style.setProperty('--d', (i * 90) + 'ms'); targets.push(el); }
  });
  document.querySelectorAll('section:not(.hero) h2, section:not(.hero) article, footer > div').forEach(function(el){ targets.push(el); });
  document.querySelectorAll('section:not(.hero) *').forEach(function(el){
    var p = el.parentElement, cs = p && getComputedStyle(p);
    if (cs && cs.display === 'grid' && !el.closest('article') && targets.indexOf(el) < 0) {
      el.style.setProperty('--d', (Array.prototype.indexOf.call(p.children, el) * 110) + 'ms');
      targets.push(el);
      if (el.tagName === 'A') el.classList.add('lift');
    }
  });
  if (!('IntersectionObserver' in window) || reduce) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
  targets = targets.filter(function(el, i){
    return targets.indexOf(el) === i && !el.hidden && !/^(SCRIPT|STYLE)$/.test(el.tagName) &&
      !el.closest('.hero-chip, [hidden], #contact-form') && el.getClientRects().length > 0;
  });
  targets.forEach(function(el){ el.classList.add('reveal'); io.observe(el); });
  // safety net: anything left once the reader reaches the bottom is shown
  addEventListener('scroll', function(){
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 120)
      targets.forEach(function(el){ el.classList.add('in'); });
  }, {passive:true});
})();
