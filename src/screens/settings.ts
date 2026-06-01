export type ThemeName = 'white' | 'grey' | 'dark';

const THEME_KEY = 'd2d_theme';

const THEMES: { key: ThemeName; name: string; swatches: string[] }[] = [
  { key: 'white', name: 'White',  swatches: ['#2563eb', '#6b7280', '#f9fafb', '#ffffff'] },
  { key: 'grey',  name: 'Grey',   swatches: ['#2563eb', '#4b5563', '#e5e7eb', '#f3f4f6'] },
  { key: 'dark',  name: 'Dark',   swatches: ['#3b82f6', '#1d4ed8', '#1f2937', '#111827'] },
];

export function getSavedTheme(): ThemeName | null {
  return localStorage.getItem(THEME_KEY) as ThemeName | null;
}

export function applyTheme(theme: ThemeName | null): void {
  document.documentElement.className = theme ? `theme-${theme}` : '';
}

export function initSettings(): void {
  document.getElementById('theme-grid')!.addEventListener('click', e => {
    const card = (e.target as Element).closest<HTMLElement>('.theme-card');
    if (!card) return;
    const theme = card.dataset.theme as ThemeName;
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    markActive(theme);
  });
}

export function renderSettings(): void {
  const saved = getSavedTheme();
  document.getElementById('theme-grid')!.innerHTML = THEMES.map(t => `
    <button class="theme-card${saved === t.key ? ' active' : ''}" data-theme="${t.key}" type="button">
      <div class="theme-swatches">
        ${t.swatches.map(c => `<span class="swatch" style="background:${c}"></span>`).join('')}
      </div>
      <div class="theme-name">${t.name}</div>
      <span class="theme-check" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      </span>
    </button>
  `).join('');
}

function markActive(theme: ThemeName): void {
  document.querySelectorAll<HTMLElement>('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === theme);
  });
}
