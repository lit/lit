import 'api-viewer-element';
import '../components/button/text-button.js';
import '../components/button/filled-button.js';
import '../components/button/toggle-button.js';
import '../components/checkbox/checkbox.js';
import 'dark-mode-toggle';

const darkModeToggle = document.querySelector('dark-mode-toggle');

if (darkModeToggle.mode === 'dark') {
  document.body.classList.add('dark');
}

darkModeToggle.addEventListener('colorschemechange', () => {
  document.body.classList.toggle('dark');
});

(async () => {
  const ave = document.querySelector('api-viewer');

  if (!ave) {
    return;
  }

  const originalSelect = ave._onSelect;

  ave._onSelect = (e) => {
    originalSelect.call(ave, e);
    localStorage.setItem('ave-last-selected', ave.selected);
  };

  await ave.jsonFetched;
  await ave.jsonFetched;

  const lastSelected = localStorage.getItem('ave-last-selected');

  if (lastSelected) {
    ave.selected = lastSelected;
  }
  ave.requestUpdate();
})();
