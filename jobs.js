/* Jobs: reads jobs.json (written by the HireBee bot after each scan) and shows it.
   Used by jobs.html (full list) and index.html (latest jobs, #latest-jobs). */
(function () {
  var C = window.HIREBEE || {};
  var bot = (C.botUsername || '').replace(/^@/, '');
  var PAGE = 30;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function ago(ts) {
    var s = Math.max(0, Date.now() / 1000 - ts);
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    var d = Math.round(s / 86400);
    return d === 1 ? 'yesterday' : d + ' days ago';
  }
  function tailorUrl(j) { return bot ? 'https://t.me/' + bot + '?start=job_' + j.id : ''; }

  function card(j) {
    var url = safeUrl(j.u), tailor = tailorUrl(j);
    var where = j.lb ? '<span class="pill b">In Lebanon</span>' : j.g ? '<span class="pill p">Gulf · relocation</span>' :
      (j.r || /remote|anywhere|worldwide/i.test(j.l) ? '<span class="pill g">Remote · open to Lebanon</span>' : '');
    var fresh = (Date.now() / 1000 - j.d) < 86400 ? '<span class="pill">New</span>' : '';
    var title = url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(j.t) + '</a>' : esc(j.t);
    return '<li class="job">' +
      '<div class="job-body">' +
        '<h3>' + title + '</h3>' +
        '<p class="job-meta">' + [esc(j.c), esc(j.l)].filter(Boolean).join(' · ') + '</p>' +
        '<p class="job-tags">' + where + fresh + '<span class="pill n">' + esc(j.f) + '</span></p>' +
        '<p class="job-src">via ' + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(j.s) + '</a>' : esc(j.s)) + ' · ' + ago(j.d) + '</p>' +
      '</div>' +
      '<div class="job-actions">' +
        (tailor ? '<a class="btn yellow small" href="' + esc(tailor) + '">Tailor my CV</a>' : '') +
        (url ? '<a class="btn line small" href="' + esc(url) + '" target="_blank" rel="noopener">View job<span aria-hidden="true">&nbsp;↗</span></a>' : '') +
      '</div></li>';
  }

  function load() {
    return fetch('jobs.json?v=' + Math.floor(Date.now() / 300000), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  /* ---------- home page: latest jobs ---------- */
  var latest = document.getElementById('latest-jobs');
  if (latest) {
    load().then(function (feed) {
      var jobs = (feed.jobs || []);
      if (!jobs.length) return;
      var local = jobs.filter(function (j) { return j.lb; }).slice(0, 3);
      var remote = jobs.filter(function (j) { return !j.lb; }).slice(0, 6 - local.length);
      var pick = local.concat(remote).sort(function (a, b) { return b.d - a.d; });
      latest.querySelector('ol').innerHTML = pick.map(card).join('');
      var n = latest.querySelector('[data-job-count]');
      if (n) n.textContent = feed.count.toLocaleString('en');
      latest.hidden = false;
    }).catch(function () { /* no jobs yet: the section stays hidden */ });
    return;
  }

  /* ---------- jobs page ---------- */
  var list = document.getElementById('list');
  if (!list) return;
  var state = { all: [], shown: PAGE, where: 'all', field: '', q: '' };
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  state.q = params.get('q') || '';
  state.where = ['lb', 'remote', 'gulf'].indexOf(params.get('where')) >= 0 ? params.get('where') : 'all';
  state.field = params.get('field') || '';
  $('q').value = state.q;

  function matches(j) {
    if (state.where === 'lb' && !j.lb) return false;
    if (state.where === 'remote' && (j.lb || j.g)) return false;
    if (state.where === 'gulf' && !j.g) return false;
    if (state.field && j.f !== state.field) return false;
    if (state.q) {
      var hay = (j.t + ' ' + j.c + ' ' + j.l + ' ' + j.f).toLowerCase();
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }
  function syncUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.where !== 'all') p.set('where', state.where);
    if (state.field) p.set('field', state.field);
    history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
  }
  function render() {
    var hits = state.all.filter(matches);
    list.innerHTML = hits.slice(0, state.shown).map(card).join('');
    $('count').textContent = hits.length ? hits.length.toLocaleString('en') + (hits.length === 1 ? ' job' : ' jobs') : '';
    $('more').hidden = hits.length <= state.shown;
    $('empty').hidden = hits.length > 0;
    document.querySelectorAll('.seg button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-where') === state.where));
    });
    syncUrl();
  }

  var timer;
  $('q').addEventListener('input', function (e) {
    clearTimeout(timer);
    timer = setTimeout(function () { state.q = e.target.value.trim(); state.shown = PAGE; render(); }, 150);
  });
  document.querySelectorAll('.seg button').forEach(function (b) {
    b.addEventListener('click', function () { state.where = b.getAttribute('data-where'); state.shown = PAGE; render(); });
  });
  $('field').addEventListener('change', function (e) { state.field = e.target.value; state.shown = PAGE; render(); });
  $('more').addEventListener('click', function () { state.shown += PAGE; render(); });

  load().then(function (feed) {
    state.all = feed.jobs || [];
    var fields = {};
    state.all.forEach(function (j) { fields[j.f] = (fields[j.f] || 0) + 1; });
    var sel = $('field');
    Object.keys(fields).sort(function (a, b) { return a === 'Other' ? 1 : b === 'Other' ? -1 : fields[b] - fields[a]; })
      .forEach(function (f) {
        var o = document.createElement('option');
        o.value = f; o.textContent = f + ' (' + fields[f] + ')';
        sel.appendChild(o);
      });
    if (state.field && !fields[state.field]) state.field = '';
    sel.value = state.field;
    $('jobs-summary').innerHTML = '<b>' + (feed.count || 0).toLocaleString('en') + '</b> open jobs: <b>' +
      (feed.in_lebanon || 0).toLocaleString('en') + '</b> in Lebanon' +
      (feed.in_gulf ? ', <b>' + feed.in_gulf.toLocaleString('en') + '</b> in the Gulf' : '') +
      ', the rest remote. Updated ' + ago(feed.updated) + '.';
    if (!feed.in_gulf) { var gb = document.querySelector('.seg [data-where="gulf"]'); if (gb) gb.hidden = true; }
    var src = Object.keys(feed.sources || {});
    if (src.length) {
      $('attribution').textContent = 'Jobs on this page come from ' + src.join(', ') +
        '. Each job links to its original posting and names where it came from. HireBee isn\'t the employer: always apply through the original posting.';
    }
    if (!state.all.length) {
      $('empty-title').textContent = 'The first jobs are on their way';
      $('empty-text').textContent = 'HireBee updates this page after every scan. Check back in a few hours.';
    }
    render();
  }).catch(function () {
    $('jobs-summary').textContent = 'Remote jobs open to Lebanon and jobs in Lebanon, updated every few hours.';
    $('empty-title').textContent = 'The first jobs are on their way';
    $('empty-text').textContent = 'HireBee updates this page after every scan. Check back in a few hours, or open HireBee in Telegram to get matched now.';
    $('empty').hidden = false;
  });
})();
