import { countSteps, medalLabel } from './data.js';
import { spoilerLabel, isSpoilerHidden, applyFilters, KIND_OPTIONS } from './filters.js';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtCount(n) {
  return Number(n).toLocaleString('en-US');
}

function renderSteps(guide) {
  const lines = guide.split('\n').filter((l) => l.trim());
  return '<ol class="steps">' + lines.map((line) => {
    const m = line.match(/^\d+\.\s*\[(CONFIRMED|SINGLE|UNCONFIRMED)\]\s*(.*)$/s);
    if (!m) return '<li>' + esc(line.replace(/^\d+\.\s*/, '')) + '</li>';
    const conf = m[1].toLowerCase();
    let text = esc(m[2]);
    text = text.replace(/\[(\d+)\]/g, '<span class="cite">[$1]</span>');
    return '<li>' + text + ' <span class="badge ' + conf + '">' + m[1] + '</span></li>';
  }).join('') + '</ol>';
}

export function auditStrip(trophies, sources, disputes) {
  const steps = countSteps(trophies);
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) grades[t.grade] += 1;
  const hidden = trophies.filter((t) => t.hidden).length;
  const citedGuides = trophies.filter((t) => t.guide.includes('[')).length;
  const single = trophies.filter((t) => t.confidence === 'single').length;
  const unconfirmed = trophies.filter((t) => t.confidence === 'unconfirmed').length;
  const watch = trophies.filter((t) => t.missable === 'watch').length;
  const possibly = trophies.filter((t) => t.missable === 'possibly').length;
  return '<section class="audit" aria-label="Audit strip"><div class="row">'
    + '<span><b>55/55</b> official</span>'
    + '<span><b>1P 2G 6S 46B</b></span>'
    + '<span><b>' + hidden + '</b> PSN-hidden</span>'
    + '<span><b>' + citedGuides + '/55</b> guides cite sources</span>'
    + '<span><b>' + steps.cited + '/' + steps.total + '</b> steps cited</span>'
    + '<span><b>' + sources.length + '</b> sources read 20 Nov 2026</span>'
    + '<span><b>' + possibly + '</b> possibly missable</span>'
    + '<span><b>' + watch + '</b> watch</span>'
    + '<span><b>' + unconfirmed + '</b> unconfirmed</span>'
    + '<span><b>' + single + '</b> single-source</span>'
    + '<span><b>' + disputes.length + '</b> disagree</span>'
    + '</div></section>';
}

export function progressBar(trophies, store) {
  const earned = trophies.filter((t) => store.isEarned(t.id)).length;
  const pct = Math.round((earned / trophies.length) * 100);
  const byKind = {};
  for (const t of trophies) for (const k of t.kind) { byKind[k] = byKind[k] || [0, 0]; byKind[k][1] += 1; if (store.isEarned(t.id)) byKind[k][0] += 1; }
  const kinds = Object.entries(byKind).map(([k, v]) => k + ' ' + v[0] + '/' + v[1]).join(' · ');
  return '<div class="progress" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><div style="width:' + pct + '%"></div></div>'
    + '<p><b>' + earned + '/55 earned (' + pct + '%)</b> — ' + esc(kinds) + '</p>';
}

function countWidget(t, store) {
  if (t.count == null) return '';
  const cur = store.getCount(t.id);
  return '<span class="count"><button type="button" data-dec="' + t.id + '" aria-label="Decrease count">−</button>'
    + fmtCount(cur) + '/' + fmtCount(t.count) + ' ' + esc(t.countLabel || '')
    + '<button type="button" data-inc="' + t.id + '" aria-label="Increase count">+</button></span>';
}

function detailPane(t, ctx) {
  const { store, data } = ctx;
  const hidden = isSpoilerHidden(t, store);
  const steps = renderSteps(t.guide);
  const firstStep = t.guide.split('\n')[0].replace(/^\d+\.\s*\[(CONFIRMED|SINGLE|UNCONFIRMED)\]\s*/, '').replace(/\[\d+\]/g, '');
  let html = '<section class="detail" id="detail"><h2>' + (hidden ? 'Story trophy' : esc(t.name)) + '</h2>';
  html += '<p><span class="medal ' + t.grade + '">' + medalLabel(t.grade) + '</span><b>' + t.grade + '</b>'
    + (t.hidden ? '<span class="badge hidden">PSN-hidden</span>' : '<span class="badge hidden">visible</span>')
    + t.kind.map((k) => '<span class="chip">' + esc(k) + '</span>').join('')
    + '<span class="chip">stage ' + esc(String(t.stage)) + '</span>'
    + (t.missable === 'possibly' ? '<span class="badge missable">POSSIBLY MISSABLE</span>' : '')
    + (t.missable === 'watch' ? '<span class="badge watch">WATCH</span>' : '')
    + (t.missable === 'unconfirmed' ? '<span class="badge unconfirmed">UNCONFIRMED</span>' : '')
    + '<span class="badge ' + t.confidence + '">' + t.confidence.toUpperCase() + '</span></p>';
  html += '<p><b>Official description</b> — PlayStation / Exophase [9]: <i>' + esc(t.description) + '</i></p>';
  html += '<p><b>IN SHORT</b> — ' + esc(firstStep) + '</p>';
  if (t.count != null) {
    html += '<p><b>Count tracker:</b> ' + countWidget(t, store) + (t.countNote ? ' <span class="srclist">' + esc(t.countNote) + '</span>' : '') + '</p>';
  }
  if (t.missable === 'possibly' || t.missable === 'watch') {
    html += '<div class="missbox"><b>MISSABLE WINDOW</b> — ' + esc(t.missableNote || '') + ' Keep a manual save before the window closes.</div>';
  }
  if (t.missable === 'unconfirmed') {
    html += '<div class="missbox"><b>NOT YET CONFIRMED</b> — ' + esc(t.missableNote || 'No source confirms the method yet.') + '</div>';
  }
  if (t.dispute) {
    html += '<div class="callbox"><b>SOURCES DIFFER</b><br>Version A: ' + esc(t.dispute.a) + '<br>Version B: ' + esc(t.dispute.b)
      + '<br><b>OUR CALL:</b> ' + esc(t.dispute.call) + '</div>';
  }
  html += steps;
  const srcs = t.sources.map((n) => {
    const s = data.sources.find((x) => x.id === n);
    return s ? '[' + n + '] ' + esc(s.name) : '[' + n + ']';
  }).join(' · ');
  html += '<p class="srclist"><b>Sources:</b> ' + srcs + ' — read 20 Nov 2026.</p>';
  html += '<label><b>Your note</b><br><textarea class="note" data-note="' + t.id + '" rows="2" placeholder="Your own note for this trophy…">' + esc(store.getNote(t.id)) + '</textarea></label>';
  html += '</section>';
  return html;
}

export function renderTracker(view, ctx) {
  const { data, store, filter, openId } = ctx;
  const list = applyFilters(data.trophies, filter, store);
  let html = auditStrip(data.trophies, data.sources, data.disputes);
  html += progressBar(data.trophies, store);
  html += '<div class="filters">'
    + '<select id="kindSel" aria-label="Filter by kind">' + KIND_OPTIONS.map(([v, l]) => '<option value="' + v + '"' + (filter.kind === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>'
    + '<select id="gradeSel" aria-label="Filter by grade">' + ['all', 'platinum', 'gold', 'silver', 'bronze'].map((g) => '<option value="' + g + '"' + (filter.grade === g ? ' selected' : '') + '>' + (g === 'all' ? 'All grades' : g) + '</option>').join('') + '</select>'
    + '<input type="search" id="searchBox" placeholder="Search trophies…" value="' + esc(filter.q) + '">'
    + '<label><input type="checkbox" id="hiddenOnly"' + (filter.hiddenOnly ? ' checked' : '') + '> PSN-hidden</label>'
    + '<label><input type="checkbox" id="disputedOnly"' + (filter.disputedOnly ? ' checked' : '') + '> Disputed</label>'
    + '<label><input type="checkbox" id="notEarnedOnly"' + (filter.notEarnedOnly ? ' checked' : '') + '> Not earned</label>'
    + '<span>' + list.length + ' shown</span></div>';
  if (openId) {
    const t = data.trophies.find((x) => x.id === openId);
    if (t) html += detailPane(t, ctx);
  }
  html += '<table class="list"><thead><tr><th></th><th>Trophy</th><th>Grade</th><th>Kind</th><th>Count</th><th></th></tr></thead><tbody>';
  for (const t of list) {
    const hidden = isSpoilerHidden(t, store);
    const earned = store.isEarned(t.id);
    html += '<tr data-open="' + t.id + '"' + (earned ? ' class="earned"' : '') + '>'
      + '<td><input type="checkbox" data-earn="' + t.id + '"' + (earned ? ' checked' : '') + ' aria-label="Mark earned"></td>'
      + '<td><span class="medal ' + t.grade + '">' + medalLabel(t.grade) + '</span>'
      + (hidden ? '<span class="spoiler">' + esc(spoilerLabel(t)) + '</span>' : '<span class="tname">' + esc(t.name) + '</span><br><span class="tdesc">' + esc(t.description) + '</span>')
      + '</td>'
      + '<td>' + t.grade + '</td>'
      + '<td>' + t.kind.map((k) => '<span class="chip">' + esc(k) + '</span>').join('') + '</td>'
      + '<td>' + countWidget(t, store) + '</td>'
      + '<td>' + (t.missable === 'possibly' ? '<span class="badge missable">POSSIBLY</span>' : '') + (t.missable === 'watch' ? '<span class="badge watch">WATCH</span>' : '') + (t.confidence === 'unconfirmed' ? '<span class="badge unconfirmed">UNCONF.</span>' : '') + '</td></tr>';
  }
  html += '</tbody></table>';
  view.innerHTML = html;
  view.querySelector('#kindSel').addEventListener('change', (e) => ctx.setFilter({ kind: e.target.value }));
  view.querySelector('#gradeSel').addEventListener('change', (e) => ctx.setFilter({ grade: e.target.value }));
  view.querySelector('#searchBox').addEventListener('input', (e) => ctx.setFilter({ q: e.target.value }));
  view.querySelector('#hiddenOnly').addEventListener('change', (e) => ctx.setFilter({ hiddenOnly: e.target.checked }));
  view.querySelector('#disputedOnly').addEventListener('change', (e) => ctx.setFilter({ disputedOnly: e.target.checked }));
  view.querySelector('#notEarnedOnly').addEventListener('change', (e) => ctx.setFilter({ notEarnedOnly: e.target.checked }));
  view.querySelectorAll('[data-earn]').forEach((box) => box.addEventListener('click', (e) => {
    e.stopPropagation();
    store.toggleEarned(Number(box.dataset.earn));
    ctx.setFilter({});
  }));
  view.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); store.bumpCount(Number(b.dataset.inc), 1); ctx.setFilter({}); }));
  view.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); store.bumpCount(Number(b.dataset.dec), -1); ctx.setFilter({}); }));
  view.querySelectorAll('[data-open]').forEach((row) => row.addEventListener('click', () => ctx.goDetail(Number(row.dataset.open))));
  const note = view.querySelector('[data-note]');
  if (note) note.addEventListener('change', () => store.setNote(Number(note.dataset.note), note.value));
}

function nextUp(trophies, store) {
  const out = [];
  const t28 = trophies.find((t) => t.id === 28);
  if (!store.isEarned(28)) out.push('Chapter 1 — do the balcony meditation for Positive Mental Attitude (#28) BEFORE Chapter 1 ends, and keep a manual Chapter 1 save.');
  const shoot = trophies.find((t) => t.id === 17);
  const sc = store.getCount(17);
  if (!store.isEarned(17)) out.push('Shooting Range — ' + sc + '/42 gold medals for The Shootist (#17). Work them in Stage 2; all 42 are needed for 100%.');
  const challenges = store.getCount(32);
  if (!store.isEarned(32)) out.push('Challenges — ' + challenges + '/50 for One Last Thing (#32). Aim for 70 of 80 for 100% completion.');
  if (out.length < 3) {
    const next = trophies.find((t) => !store.isEarned(t.id) && t.kind.includes('story'));
    if (next) out.push('Story — finish the next story trophy: ' + next.name + ' (#' + next.id + ').');
  }
  if (out.length < 3) out.push('Free roam — scan vehicles (200/277) and animals (100/255) while travelling; they count toward 100%.');
  return out.slice(0, 3);
}

export function renderRoadmap(view, ctx) {
  const { data, store } = ctx;
  const steps = nextUp(data.trophies, store);
  let html = auditStrip(data.trophies, data.sources, data.disputes);
  html += '<section class="planner"><h2>Next up — your 3 steps</h2><ol>'
    + steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>'
    + '<p>Reminder: save manually at the start and end of every chapter. There is no mission replay. [1][6]</p></section>';
  html += '<section class="stage"><h3>Stage 0 — Before you start</h3>'
    + '<p>Save manually at the start and end of EVERY chapter — missions cannot be replayed. Cheats disable trophies and saves. One playthrough is enough. About 200 hours (range 100–300, see dispute D5). Difficulty 4/10. All 55 trophies are offline, none are online. An Irredeemable profile cannot be undone. Hourglass quests expire — they do not count toward trophies. [1][2][4][6]</p></section>';
  html += '<section class="stage"><h3>Stage 1 — Story, Chapters 1–5 (60–80 hours)</h3>'
    + '<p>Finish the story and the optional missions. Scan vehicles and animals as you travel. <b>Do the Chapter 1 balcony meditation</b> for Positive Mental Attitude — the one possibly missable step. Save manually every chapter. Trophies: 12 story plus the character strands that appear. [1][2]</p></section>';
  html += '<section class="stage"><h3>Stage 2 — 100% Completion + 70/80 challenges (~100 hours)</h3>'
    + '<p>After the story: Progress &gt; Stats &gt; 100% Completion. The checklist is about 60% of true completion. Required for 100%: all robberies, underwater discoveries, shooting range challenges, drone races, and the Bret quest. 200/277 vehicles, 100/255 animals, 15/18 card sets. Challenges: 50 for the trophy, 70 of 80 for 100%. [1][2]</p></section>';
  html += '<section class="stage"><h3>Stage 3 — Strangers &amp; Freaks + cleanup (~10 hours)</h3>'
    + '<p>Remaining character finales, misc trophies, then the platinum. [1]</p></section>';
  view.innerHTML = html;
}

export function renderMissables(view, ctx) {
  const { data, store } = ctx;
  const t28 = data.trophies.find((t) => t.id === 28);
  const watch = data.trophies.filter((t) => t.missable === 'watch');
  let html = auditStrip(data.trophies, data.sources, data.disputes);
  html += '<h2>Missables — what can actually be missed</h2>';
  html += '<div class="missbox"><b>1 POSSIBLY MISSABLE — Positive Mental Attitude (#28).</b> One meditation sits on Jason\u2019s balcony in Chapter 1, the morning after Down to Earth, when Lucia invites you to meditate. It is gone once Chapter 1 ends. Do it before Chapter 1 ends and keep a manual Chapter 1 save. Guides say 18 spots for the trophy; the 100% list stops at 15 — do all 18 so either count is covered. [1][2][3][6]</div>';
  html += '<h3>7 to watch</h3><table class="data"><thead><tr><th>Trophy</th><th>Why watch</th></tr></thead><tbody>';
  for (const t of watch) {
    html += '<tr><td><span class="medal ' + t.grade + '">' + medalLabel(t.grade) + '</span><b>' + esc(t.name) + '</b> (#' + t.id + ')</td><td>' + esc(t.missableNote || '') + '</td></tr>';
  }
  html += '</tbody></table>';
  html += '<p><b>Everything else is obtainable in free roam after the story.</b> Story trophies are not missable — free roam stays open, and everything 100% needs is still reachable after the final mission. The only thing that needs a manual save is the Chapter 1 balcony. [1][6]</p>';
  html += '<p>Positive Mental Attitude progress: ' + store.getCount(28) + '/18 meditation spots.</p>';
  view.innerHTML = html;
}

export function renderSources(view, ctx) {
  const { data } = ctx;
  let html = auditStrip(data.trophies, data.sources, data.disputes);
  html += '<h2>Sources — every claim shows its work</h2>';
  html += '<table class="data"><thead><tr><th>#</th><th>Source</th><th>Used for</th><th>Cited by</th></tr></thead><tbody>';
  for (const s of data.sources) {
    const citedBy = data.trophies.filter((t) => t.sources.includes(s.id)).length;
    html += '<tr><td><b>[' + s.id + ']</b></td><td><b>' + esc(s.name) + '</b><br><span class="srclist">' + esc(s.url) + '</span></td><td>' + esc(s.usedFor) + '</td><td>' + citedBy + ' of 55 guides</td></tr>';
  }
  html += '</tbody></table>';
  html += '<h3>Disputes — both versions, and our call</h3><table class="data"><thead><tr><th>#</th><th>Dispute</th><th>Version A</th><th>Version B</th><th>Our call</th></tr></thead><tbody>';
  for (const d of data.disputes) {
    html += '<tr><td><b>' + d.id + '</b></td><td>' + esc(d.title) + '</td><td>' + esc(d.a) + '</td><td>' + esc(d.b) + '</td><td>' + esc(d.call) + '</td></tr>';
  }
  html += '</tbody></table>';
  html += '<p class="srclist"><b>How we verified:</b> ' + esc(data.method) + ' All sources read ' + esc(data.readDate) + '.</p>';
  view.innerHTML = html;
}
