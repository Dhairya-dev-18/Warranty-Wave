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
  styles: [`.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
    .card{display:flex;gap:14px;align-items:center;padding:16px;background:#fff;border:1px solid #e3e6ea;border-radius:10px}
    .card mat-icon{color:#1a5fb4;background:#e6effa;border-radius:50%;padding:10px;box-sizing:content-box}
    .warn mat-icon{color:#8a5a00;background:#fff1d6}.bad mat-icon{color:#a4231b;background:#fde3e1}.ok mat-icon{color:#14622b;background:#e0f4e5}
    .v{font-size:22px;font-weight:600}.l{font-size:13px;color:#5f6b73}`],
})
export class DashboardCardsComponent { @Input() cards: StatCard[] = []; }
