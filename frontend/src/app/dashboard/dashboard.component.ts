import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../core/api.service';
import { DashboardCardsComponent, StatCard } from '../shared/dashboard-cards.component';
import { StatusChipComponent } from '../shared/status-chip.component';

@Component({
  selector: 'app-dashboard', standalone: true, imports: [DashboardCardsComponent, StatusChipComponent, MatProgressBarModule],
  template: `
  <h2 class="title">Dashboard</h2>
  @if (s(); as d) {
    <app-dashboard-cards [cards]="cards()" />
    <h3>Claims by status</h3>
    <div class="bars">
      @for (k of statuses; track k) {
        <div class="bar"><app-status-chip [value]="k" />
          <mat-progress-bar mode="determinate" [value]="d.totalClaims ? (d.claimsByStatus[k] / d.totalClaims) * 100 : 0" />
          <b>{{ d.claimsByStatus[k] }}</b></div>
      }
    </div>
  } @else { <mat-progress-bar mode="indeterminate" /> }`,
  styles: [`.bars{display:grid;gap:12px;max-width:720px;background:var(--ww-surface);border:1px solid var(--ww-border);border-radius:14px;padding:18px;box-shadow:var(--ww-shadow)}
    .bar{display:grid;grid-template-columns:130px 1fr 32px;gap:12px;align-items:center}`],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  s = signal<any>(null);
  statuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED'];
  cards = computed<StatCard[]>(() => {
    const d = this.s(); if (!d) return [];
    return [
      { label: 'Total claims', value: d.totalClaims, icon: 'assignment' },
      { label: 'Claim approval rate', value: d.approvalRate + '%', icon: 'thumb_up', tone: 'ok' },
      { label: 'Active contracts', value: d.activeContracts, icon: 'description' },
      { label: 'Outstanding loans', value: '₹' + Math.round(d.outstandingLoans).toLocaleString('en-IN'), icon: 'account_balance' },
      { label: 'Overdue EMIs', value: d.overdueEmis, icon: 'warning', tone: d.overdueEmis ? 'bad' : 'ok' },
      { label: 'Credit reviews pending', value: d.pendingCreditReviews, icon: 'fact_check', tone: d.pendingCreditReviews ? 'warn' : 'ok' },
    ];
  });
  ngOnInit() { this.api.get('/dashboard/summary').subscribe(r => this.s.set(r)); }
}
