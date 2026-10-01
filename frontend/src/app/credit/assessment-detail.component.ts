import { CurrencyPipe } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, errMsg } from '../core/api.service';
import { StatusChipComponent } from '../shared/status-chip.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-assessment-detail', standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, StatusChipComponent, ...MATERIAL],
  template: `
  @if (a(); as x) {
    <div class="row"><h2 class="title" style="margin:0">Application #{{ x.id }} · {{ x.customerName }}</h2><app-status-chip [value]="x.status" /></div>
    <mat-card class="mb"><mat-card-content>
      <div class="score"><b>{{ x.score }}</b><span class="muted"> / 850 · Risk band {{ x.riskBand }}</span></div>
      <div class="meter">
        <div class="fill" [style.width.%]="pct(x.score)"></div>
        <i class="tick" [style.left.%]="pct(550)"></i><i class="tick" [style.left.%]="pct(700)"></i>
      </div>
      <div class="scale muted"><span>300</span><span [style.left.%]="pct(550)">550 review</span><span [style.left.%]="pct(700)">700 auto-approve</span></div>
    </mat-card-content></mat-card>

    <div class="two">
      <mat-card><mat-card-content>
        <h3>Applicant &amp; request</h3>
        <div class="line"><span>Vehicle</span><b>{{ x.vehicleVin }}</b></div>
        <div class="line"><span>Product</span><b>{{ x.type }}</b></div>
        <div class="line"><span>Vehicle price</span><b>{{ x.amount | currency:'INR':'symbol':'1.0-0' }}</b></div>
        <div class="line"><span>Down payment</span><b>{{ x.downPayment | currency:'INR':'symbol':'1.0-0' }}</b></div>
        <div class="line"><span>Tenure</span><b>{{ x.tenureMonths }} months</b></div>
        <div class="line"><span>Monthly income</span><b>{{ x.monthlyIncome | currency:'INR':'symbol':'1.0-0' }}</b></div>
        <div class="line"><span>Existing EMIs</span><b>{{ x.existingEmi | currency:'INR':'symbol':'1.0-0' }}</b></div>
        <div class="line"><span>Bureau score</span><b>{{ x.creditHistoryScore }}</b></div>
      </mat-card-content></mat-card>
      <mat-card><mat-card-content>
        <h3>Score breakdown</h3>
        @for (r of x.reasons; track r.factor) {
          <div class="line"><span>{{ r.factor }}<br><small class="muted">{{ r.note }}</small></span>
            <b [class.neg]="r.points < 0">{{ r.points > 0 ? '+' : '' }}{{ r.points }}</b></div>
        }
        <div class="line total"><span>Final score</span><b>{{ x.score }}</b></div>
      </mat-card-content></mat-card>
    </div>

    @if (x.status === 'MANUAL_REVIEW') {
      <mat-card style="margin-top:16px"><mat-card-content>
        <h3>Your decision</h3>
        <mat-form-field><mat-label>Decision note (required to reject)</mat-label><textarea matInput rows="3" [(ngModel)]="note"></textarea></mat-form-field>
        <div class="row" style="justify-content:flex-end;margin:0">
          <button mat-stroked-button color="warn" [disabled]="!note.trim() || busy()" (click)="decide(false)">Reject</button>
          <button mat-flat-button color="primary" [disabled]="busy()" (click)="decide(true)">Approve &amp; create contract</button>
        </div>
      </mat-card-content></mat-card>
    } @else if (x.decisionNote) { <p class="muted">Decision note: {{ x.decisionNote }}</p> }
  } @else { <mat-progress-bar mode="indeterminate" /> }
  <p><a routerLink="/credit/queue">← Back to queue</a></p>`,
  styles: [`.score{font-size:32px;color:var(--ww-ink)}.meter{position:relative;height:14px;background:var(--ww-hover);border-radius:7px;margin:12px 0 4px}
    .fill{height:100%;background:linear-gradient(90deg,#d64545,#e6a700,#2e9d54);border-radius:7px}
    .tick{position:absolute;top:-3px;width:2px;height:20px;background:var(--ww-ink)}
    .scale{position:relative;height:18px;font-size:12px}.scale span{position:absolute;transform:translateX(-50%)}.scale span:first-child{left:0;transform:none}
    .two{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
    .line{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--ww-border);color:var(--ww-ink)}
    .neg{color:#c23b32}.total{border-bottom:0;font-size:16px}`],
})
export class AssessmentDetailComponent implements OnInit {
  @Input() id!: string;
  private api = inject(ApiService); private snack = inject(MatSnackBar); private router = inject(Router);
  a = signal<any>(null); note = ''; busy = signal(false);
  pct(score: number) { return Math.max(0, Math.min(100, ((score - 300) / 550) * 100)); }
  ngOnInit() { this.api.get(`/finance/applications/${this.id}`).subscribe(r => this.a.set(r)); }
  decide(approve: boolean) {
    this.busy.set(true);
    this.api.put(`/finance/applications/${this.id}/decision`, { approve, note: this.note }).subscribe({
      next: () => { this.snack.open(approve ? 'Approved. Contract created.' : 'Application rejected', 'OK', { duration: 3500 }); this.router.navigateByUrl('/credit/queue'); },
      error: e => { this.snack.open(errMsg(e), 'OK', { duration: 4000 }); this.busy.set(false); },
    });
  }
}
