import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface StatCard { label: string; value: string | number; icon: string; tone?: 'ok' | 'warn' | 'bad'; }

@Component({
  selector: 'app-dashboard-cards', standalone: true, imports: [MatIconModule],
  template: `
  <div class="cards">
    @for (c of cards; track c.label) {
      <div class="card" [class]="'card ' + (c.tone ?? '')">
        <mat-icon>{{ c.icon }}</mat-icon>
        <div><div class="v">{{ c.value }}</div><div class="l">{{ c.label }}</div></div>
      </div>
    }
  </div>`,
  styles: [`.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:16px;margin-bottom:24px}
    .card{display:flex;gap:14px;align-items:center;padding:18px;background:var(--ww-surface);border:1px solid var(--ww-border);border-radius:14px;color:var(--ww-ink);box-shadow:var(--ww-shadow);transition:transform .16s ease,box-shadow .16s ease}
    .card:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(31,55,88,.1)}
    .card mat-icon{color:var(--ww-primary);background:var(--ww-primary-soft);border-radius:13px;padding:10px;box-sizing:content-box}
    .warn mat-icon{color:#8a5a00;background:#fff1d6}.bad mat-icon{color:#a4231b;background:#fde3e1}.ok mat-icon{color:#14622b;background:#e0f4e5}
    .v{font-size:22px;font-weight:600;color:var(--ww-ink)}.l{font-size:13px;color:var(--ww-muted)}`],
})
export class DashboardCardsComponent { @Input() cards: StatCard[] = []; }
