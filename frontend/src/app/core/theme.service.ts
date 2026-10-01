import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>('light');

  constructor() {
    const saved = localStorage.getItem('ww-theme');
    const initial: Theme = saved === 'light' || saved === 'dark'
      ? saved
      : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.set(initial, false);
  }

  toggle(): void { this.set(this.theme() === 'light' ? 'dark' : 'light'); }

  private set(theme: Theme, persist = true): void {
    this.theme.set(theme);
    document.documentElement.dataset['theme'] = theme;
    if (persist) localStorage.setItem('ww-theme', theme);
  }
}
