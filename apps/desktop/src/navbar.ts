export function createNavbar(): HTMLElement {
  const navbar = document.createElement('nav');
  navbar.className = 'navbar';

  const brand = document.createElement('span');
  brand.className = 'navbar__brand';
  brand.textContent = 'Desktop App';

  const actions = document.createElement('div');
  actions.className = 'navbar__actions';

  const homeLink = document.createElement('a');
  homeLink.href = '#';
  homeLink.textContent = 'Home';

  const settingsLink = document.createElement('a');
  settingsLink.href = '#';
  settingsLink.textContent = 'Settings';

  actions.append(homeLink, settingsLink);
  navbar.append(brand, actions);

  return navbar;
}
