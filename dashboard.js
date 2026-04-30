// SocialBench live dashboard — reads aggregated views from Supabase
// and renders the headline + per-gate + per-domain + per-episode tables.

(function () {
  'use strict';

  const cfg = window.SOCIALBENCH_SUPABASE || {};
  if (!cfg.url || !cfg.anon_key || cfg.anon_key === 'REPLACE_WITH_ANON_KEY') {
    document.getElementById('loading').textContent =
      'Supabase config missing — edit config.js with your anon key.';
    return;
  }
  const sb = window.supabase.createClient(cfg.url, cfg.anon_key);

  const pct = (n, d) => (d ? `${(100 * n / d).toFixed(1)}%` : '—');

  function bar(passed, total, color = 'green') {
    if (!total) return '';
    const w = Math.max(0, Math.min(100, 100 * passed / total));
    const cls = color === 'green' ? '' : color;
    return `<span class="bar-wrap"><span class="bar-fill ${cls}" style="width:${w}%"></span></span>`;
  }

  async function loadAll() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('cards').style.display    = 'none';
    document.getElementById('t-gates').style.display  = 'none';
    document.getElementById('t-domain').style.display = 'none';
    document.getElementById('t-eps').style.display    = 'none';

    const [over, perDom, perEp] = await Promise.all([
      sb.from('v_dashboard_overall').select('*').single(),
      sb.from('v_dashboard_per_domain').select('*'),
      sb.from('v_dashboard_per_episode').select('*'),
    ]);

    if (over.error) { showError(over.error.message); return; }

    // ── headline cards ──
    const o = over.data;
    document.getElementById('c-eps').textContent = o.n_episodes;
    document.getElementById('c-qs').textContent  = o.n_questions;
    document.getElementById('c-joint').textContent =
      pct(o.n_joint_pass, o.n_b_complete);
    document.getElementById('c-joint-meta').textContent =
      `${o.n_joint_pass} / ${o.n_b_complete} B-complete questions`;
    document.getElementById('c-p7').textContent =
      `${o.n_p7_a} / ${o.n_p7_b} / ${o.n_p7_c}`;

    // ── per-gate table ──
    const totalsB = o.n_b_complete;
    const gates = [
      ['Gate 1 — same answer index',     o.n_gate1_pass, totalsB],
      ['Gate 2 — A evidence ⊆ B scope',  o.n_gate2_pass, totalsB],
      ['Gate 3 — per-atom labels agree', o.n_gate3_pass, totalsB],
      ['Joint — all three',              o.n_joint_pass, totalsB],
    ];
    const gtbody = document.querySelector('#t-gates tbody');
    gtbody.innerHTML = gates.map(([name, p, t]) => `
      <tr>
        <td>${name}</td>
        <td class="num">${t}</td>
        <td class="num">${p}</td>
        <td class="num">${pct(p, t)} ${bar(p, t,
          p / (t || 1) > 0.85 ? 'green' :
          p / (t || 1) > 0.65 ? 'amber' : 'red')}</td>
      </tr>
    `).join('');

    // ── per-domain table ──
    const dtbody = document.querySelector('#t-domain tbody');
    dtbody.innerHTML = (perDom.data || []).map(r => `
      <tr>
        <td>${r.domain}</td>
        <td class="num">${r.n_episodes}</td>
        <td class="num">${r.n_questions}</td>
        <td class="num">${pct(r.g1_pass, r.g1_total)}</td>
        <td class="num">${pct(r.g2_pass, r.g2_total)}</td>
        <td class="num">${pct(r.g3_pass, r.g3_total)}</td>
        <td class="num">${pct(r.joint_pass, r.joint_total)}</td>
      </tr>
    `).join('');

    // ── per-episode table — top 50 by joint pass rate ──
    const eps = (perEp.data || []).slice().sort((a, b) =>
      (b.n_joint_pass / (b.n_b_records || 1)) -
      (a.n_joint_pass / (a.n_b_records || 1))
    ).slice(0, 50);
    const etbody = document.querySelector('#t-eps tbody');
    etbody.innerHTML = eps.map(r => `
      <tr style="cursor: pointer" onclick="window.location.href='solve.html?ep=${encodeURIComponent(r.episode_id)}'">
        <td><code>${r.episode_id}</code></td>
        <td>${r.domain}</td>
        <td class="num">${r.n_questions}</td>
        <td class="num">${r.n_gate1_pass}</td>
        <td class="num">${r.n_joint_pass}</td>
      </tr>
    `).join('');

    document.getElementById('loading').style.display  = 'none';
    document.getElementById('cards').style.display    = 'grid';
    document.getElementById('t-gates').style.display  = 'table';
    document.getElementById('t-domain').style.display = 'table';
    document.getElementById('t-eps').style.display    = 'table';
  }

  function showError(msg) {
    document.getElementById('loading').textContent = 'Error: ' + msg;
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadAll().catch(e => showError(e.message || String(e)));
    document.getElementById('btn-refresh').addEventListener('click', loadAll);
  });
})();
