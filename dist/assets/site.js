'use strict';
try { if (localStorage.getItem('frostmoon-theme') === 'dark') document.body.classList.add('dark'); } catch {}
document.querySelectorAll('.theme-button').forEach(button => button.addEventListener('click', () => {
  const dark = document.body.classList.toggle('dark');
  button.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
  try { localStorage.setItem('frostmoon-theme', dark ? 'dark' : 'light'); } catch {}
}));
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const choice = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  document.querySelectorAll('.note-card').forEach(card => { card.hidden = choice !== 'all' && card.dataset.category !== choice; if (!card.hidden) count++; });
  const empty = document.querySelector('.filter-empty'); if (empty) empty.hidden = count > 0;
}));
