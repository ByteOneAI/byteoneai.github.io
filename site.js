(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // progress bar
  var bar = document.createElement('div'); bar.id = 'scroll-progress'; document.body.appendChild(bar);
  var header = document.querySelector('.site-header');
  var art = document.querySelector('.hero-art');
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

  // ---------- dynamic hero tiles ----------
  var heroArt = document.querySelector('.hero-art');
  if (heroArt) buildTiles(heroArt);
  function buildTiles(host){
    var layout = ['white','light','light','blue','empty',
                  'light','blue','light','light','navy',
                  'white','light','logo','light','blue',
                  'blue','light','light','navy','light',
                  'empty','light','blue','light','white'];
    var N = 5, LOGO = 12, cycle = ['light','light','light','blue','blue','navy','white','empty'];
    var grid = document.createElement('div'); grid.className = 'tiles';
    var tiles = layout.map(function(state, i){
      var b = document.createElement('button'); b.type = 'button'; b.className = 't'; b.tabIndex = -1;
      b.setAttribute('aria-hidden', 'true');
      if (i === LOGO) { b.classList.add('logo'); b.innerHTML = '<span class="bar"></span><span class="ldot"></span>'; }
      else { b.dataset.state = state; b.innerHTML = '<span class="dot"></span>'; }
      b.style.setProperty('--o', reduce ? 1 : 0); b.style.setProperty('--s', reduce ? 1 : .55);
      grid.appendChild(b); return b;
    });
    host.innerHTML = ''; host.appendChild(grid);
    var rc = function(i){ return [Math.floor(i / N), i % N]; };
    if (reduce) return;

    // 1. assemble: tiles pop in from the centre outwards
    tiles.forEach(function(t, i){
      var p = rc(i), d = Math.hypot(p[0] - 2, p[1] - 2);
      setTimeout(function(){ t.style.setProperty('--o', 1); t.style.setProperty('--s', 1); }, 120 + d * 140);
    });

    // 2. ambient life: a random tile changes state every so often
    function shuffle(){
      var i; do { i = Math.floor(Math.random() * tiles.length); } while (i === LOGO);
      var t = tiles[i], cur = t.dataset.state, next;
      do { next = cycle[Math.floor(Math.random() * cycle.length)]; } while (next === cur);
      t.style.setProperty('--s', .82);
      setTimeout(function(){ t.dataset.state = next; t.style.setProperty('--s', 1); }, 180);
    }
    var ambient = setInterval(shuffle, 850);

    // 3. ripple wave from a tile (logo by default)
    function wave(from){
      var o = rc(from);
      tiles.forEach(function(t, i){
        if (i === from && i !== LOGO) return;
        var p = rc(i), d = Math.hypot(p[0] - o[0], p[1] - o[1]);
        setTimeout(function(){
          t.classList.add('glow', 'spark'); t.style.setProperty('--s', i === LOGO ? 1.06 : 1.12);
          setTimeout(function(){ t.classList.remove('glow', 'spark'); t.style.setProperty('--s', 1); }, 320);
        }, d * 95);
      });
    }
    setTimeout(function(){ wave(LOGO); }, 1500);
    var waves = setInterval(function(){ wave(LOGO); }, 6500);

    // 4. pointer: grid tilts in 3D, nearby tiles lift towards the pointer
    var area = host.closest('.hero') || host, fine = matchMedia('(pointer: fine)').matches;
    if (fine) {
      area.addEventListener('pointermove', function(e){
        var r = grid.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 1.2)));
        var ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 1.2)));
        grid.style.setProperty('--ry', (nx * 10) + 'deg'); grid.style.setProperty('--rx', (-ny * 10) + 'deg');
        tiles.forEach(function(t){
          var tr = t.getBoundingClientRect(), dx = e.clientX - (tr.left + tr.width / 2), dy = e.clientY - (tr.top + tr.height / 2);
          var dist = Math.hypot(dx, dy), k = Math.max(0, 1 - dist / 170);
          t.style.setProperty('--tx', (dx * k * .12) + 'px'); t.style.setProperty('--ty', (dy * k * .12) + 'px');
          if (!t.classList.contains('glow')) t.style.setProperty('--s', 1 + k * .14);
        });
      });
      area.addEventListener('pointerleave', function(){
        grid.style.setProperty('--ry', '0deg'); grid.style.setProperty('--rx', '0deg');
        tiles.forEach(function(t){ t.style.setProperty('--tx', '0px'); t.style.setProperty('--ty', '0px'); t.style.setProperty('--s', 1); });
      });
    }

    // 5. click / tap a tile: it turns blue and sends out a ripple
    tiles.forEach(function(t, i){
      t.addEventListener('click', function(){
        if (i !== LOGO) t.dataset.state = t.dataset.state === 'blue' ? 'navy' : 'blue';
        wave(i);
      });
    });

    // pause when the tiles are off screen or the tab is hidden
    var running = true;
    function setRun(on){
      if (on === running) return; running = on;
      if (on) { ambient = setInterval(shuffle, 850); waves = setInterval(function(){ wave(LOGO); }, 6500); }
      else { clearInterval(ambient); clearInterval(waves); }
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function(en){ setRun(en[0].isIntersecting && !document.hidden); }).observe(grid);
    document.addEventListener('visibilitychange', function(){ setRun(!document.hidden); });
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
