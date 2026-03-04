import './index.css';

type ThemeMode = 'light' | 'dark';

const storageKey = 'desktop-theme';

function getInitialTheme(): ThemeMode {
  const savedTheme = window.localStorage.getItem(storageKey);

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(storageKey, theme);
}

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

const title = document.querySelector('h1');
if (title) {
  title.textContent = '💖 Hello Electron!';
}

const app = document.getElementById('app');
if (app) {
  const controls = document.createElement('div');
  controls.className = 'theme-controls';

  const description = document.createElement('p');
  description.textContent = 'Choose your preferred theme:';

  const lightButton = document.createElement('button');
  lightButton.textContent = 'Light mode';
  lightButton.type = 'button';
  lightButton.addEventListener('click', () => applyTheme('light'));

  const darkButton = document.createElement('button');
  darkButton.textContent = 'Dark mode';
  darkButton.type = 'button';
  darkButton.addEventListener('click', () => applyTheme('dark'));

  controls.append(description, lightButton, darkButton);
  app.append(controls);
}
