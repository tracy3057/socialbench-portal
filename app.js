// SocialBench portal — minimal interactivity (no backend).

(function () {
  'use strict';

  // Highlight active sidebar link based on the current page filename.
  function highlightActive() {
    const here = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.sidebar nav a').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href === here) a.classList.add('active');
      else a.classList.remove('active');
    });
  }

  // Wire (a)/(b)/(c) radio rows so clicking anywhere on the row selects it.
  function wireRadioRows() {
    document.querySelectorAll('.radio-row').forEach(row => {
      const radio = row.querySelector('input[type="radio"]');
      if (!radio) return;
      row.addEventListener('click', (ev) => {
        if (ev.target.tagName.toLowerCase() !== 'input') {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', {bubbles: true}));
        }
      });
      const refresh = () => {
        document.querySelectorAll(`.radio-row input[name="${radio.name}"]`).forEach(r => {
          r.closest('.radio-row').classList.toggle('selected', r.checked);
        });
      };
      radio.addEventListener('change', refresh);
      // run once on load
      refresh();
    });
  }

  // Optional: simple confirmation on the action buttons so the user sees
  // the click registered (the portal has no backend; this is just a hint).
  function wireDemoButtons() {
    document.querySelectorAll('[data-demo-confirm]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const msg = btn.getAttribute('data-demo-confirm');
        // Lightweight inline acknowledgement instead of alert()
        let ack = btn.parentElement.querySelector('.demo-ack');
        if (!ack) {
          ack = document.createElement('div');
          ack.className = 'demo-ack hint';
          btn.parentElement.appendChild(ack);
        }
        ack.textContent = msg + '  (demo only — no data is sent.)';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    highlightActive();
    wireRadioRows();
    wireDemoButtons();
  });
})();
