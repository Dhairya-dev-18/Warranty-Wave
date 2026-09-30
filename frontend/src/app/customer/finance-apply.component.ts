import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, errMsg } from '../core/api.service';
import { emi } from '../core/emi';
import { StatusChipComponent } from '../shared/status-chip.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-finance-apply', standalone: true, imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, StatusChipComponent, ...MATERIAL],
  template: `
  <h2 class="title">Apply for a vehicle loan or lease</h2>
  @if (result(); as r) {
    <mat-card><mat-card-content>
      <div class="row"><h3 style="margin:0">Application #{{ r.id }}</h3><app-status-chip [value]="r.status" /></div>
      <p>Credit score <b>{{ r.score }}</b> · Risk band <b>{{ r.riskBand }}</b></p>
      @for (x of r.reasons; track x.factor) { <div class="line"><span>{{ x.factor }}<small class="muted"> — {{ x.note }}</small></span><b>{{ x.points > 0 ? '+' : '' }}{{ x.points }}</b></div> }
      @switch (r.status) {
        @case ('APPROVED') { <p>Approved. Your contract and EMI schedule are ready.</p><a mat-flat-button color="primary" [routerLink]="['/contracts', r.contractId]">View contract</a> }
        @case ('MANUAL_REVIEW') { <p>Your application needs a manual review by a credit officer. Track it under My finance.</p><a mat-stroked-button routerLink="/finance">My finance</a> }
        @default { <p>Unfortunately this application was not approved. You can reapply with a larger down payment or a lower amount.</p><button mat-stroked-button (click)="result.set(null)">Start again</button> }
      }
    </mat-card-content></mat-card>
  } @else {
    <mat-card><mat-card-content>
      <mat-stepper linear #stepper>
        <mat-step [stepControl]="g1" label="Vehicle &amp; terms">
          <form [formGroup]="g1" class="grid pad">
            <mat-form-field><mat-label>Vehicle</mat-label>
              <mat-select formControlName="vehicleId">@for (v of vehicles(); track v.id) { <mat-option [value]="v.id">{{ v.make }} {{ v.model }} ({{ v.vin }})</mat-option> }</mat-select></mat-form-field>
            <mat-form-field><mat-label>Product</mat-label>
              <mat-select formControlName="type"><mat-option value="LOAN">Loan</mat-option><mat-option value="LEASE">Lease</mat-option></mat-select></mat-form-field>
            <mat-form-field><mat-label>Vehicle price (₹)</mat-label><input matInput type="number" formControlName="amount" /></mat-form-field>
            <mat-form-field><mat-label>Down payment (₹)</mat-label><input matInput type="number" formControlName="downPayment" /></mat-form-field>
            <mat-form-field><mat-label>Tenure</mat-label>
              <mat-select formControlName="tenureMonths">@for (t of tenures; track t) { <mat-option [value]="t">{{ t }} months</mat-option> }</mat-select></mat-form-field>
          </form>
          @if (preview() > 0) { <p class="muted">Indicative EMI at 11%: <b>{{ preview() | currency:'INR':'symbol':'1.0-0' }}</b> / month (final rate depends on your risk band).</p> }
          <button mat-flat-button color="primary" matStepperNext [disabled]="g1.invalid">Next</button>
        </mat-step>
        <mat-step [stepControl]="g2" label="Your financials">
          <form [formGroup]="g2" class="grid pad">
            <mat-form-field><mat-label>Monthly income (₹)</mat-label><input matInput type="number" formControlName="monthlyIncome" /></mat-form-field>
            <mat-form-field><mat-label>Existing EMIs per month (₹)</mat-label><input matInput type="number" formControlName="existingEmi" /></mat-form-field>
            <mat-form-field><mat-label>Credit bureau score (300-900)</mat-label><input matInput type="number" formControlName="creditHistoryScore" /></mat-form-field>
            <mat-checkbox formControlName="stableIncome">My income is stable (salaried / 2+ years in business)</mat-checkbox>
          </form>
          <button mat-button matStepperPrevious>Back</button>
          <button mat-flat-button color="primary" matStepperNext [disabled]="g2.invalid">Next</button>
        </mat-step>
        <mat-step label="Review &amp; submit">
          <div class="pad">
            <div class="line"><span>Product</span><b>{{ g1.value.type }}</b></div>
            <div class="line"><span>Vehicle price</span><b>{{ g1.value.amount | currency:'INR':'symbol':'1.0-0' }}</b></div>
            <div class="line"><span>Down payment</span><b>{{ g1.value.downPayment | currency:'INR':'symbol':'1.0-0' }}</b></div>
            <div class="line"><span>Amount financed</span><b>{{ (g1.value.amount ?? 0) - (g1.value.downPayment ?? 0) | currency:'INR':'symbol':'1.0-0' }}</b></div>
            <div class="line"><span>Tenure</span><b>{{ g1.value.tenureMonths }} months</b></div>
            <div class="line"><span>Indicative EMI</span><b>{{ preview() | currency:'INR':'symbol':'1.0-0' }}</b></div>
          </div>
          <button mat-button matStepperPrevious>Back</button>
          <button mat-flat-button color="primary" (click)="submit()" [disabled]="busy()">Submit application</button>
        </mat-step>
      </mat-stepper>
    </mat-card-content></mat-card>
  }`,
  styles: [`.pad{padding-top:16px}.line{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eef0f2}`],
})
export class FinanceApplyComponent implements OnInit {
  private api = inject(ApiService); private snack = inject(MatSnackBar); private fb = inject(FormBuilder);
  vehicles = signal<any[]>([]); result = signal<any>(null); busy = signal(false);
  tenures = [12, 24, 36, 48, 60, 72, 84];
  g1 = this.fb.group({
    vehicleId: [null as number | null, Validators.required], type: ['LOAN', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]], downPayment: [0, [Validators.required, Validators.min(0)]],
    tenureMonths: [36, Validators.required],
  });
  g2 = this.fb.group({
    monthlyIncome: [null as number | null, [Validators.required, Validators.min(1)]], existingEmi: [0, [Validators.required, Validators.min(0)]],
    creditHistoryScore: [null as number | null, [Validators.required, Validators.min(300), Validators.max(900)]], stableIncome: [true],
  });
  ngOnInit() { this.api.get('/vehicles').subscribe(r => this.vehicles.set(r)); }
  preview() { const v = this.g1.value; return emi((v.amount ?? 0) - (v.downPayment ?? 0), 11, v.tenureMonths ?? 0); }
  submit() {
    this.busy.set(true);
    this.api.post('/finance/applications', { ...this.g1.value, ...this.g2.value }).subscribe({
      next: r => { this.result.set(r); this.busy.set(false); },
      error: e => { this.snack.open(errMsg(e), 'OK', { duration: 5000 }); this.busy.set(false); },
    });
  }
}
