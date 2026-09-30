import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, errMsg } from '../core/api.service';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-rate-config', standalone: true, imports: [ReactiveFormsModule, ...MATERIAL],
  template: `
  <h2 class="title">Rates &amp; scoring rules</h2>
  <form [formGroup]="f" (ngSubmit)="save()">
    <mat-card class="mb"><mat-card-content>
      <h3>Interest rate by risk band (% per year)</h3>
      <div class="grid">
        <mat-form-field><mat-label>Band A</mat-label><input matInput type="number" step="0.1" formControlName="bandA" /></mat-form-field>
        <mat-form-field><mat-label>Band B</mat-label><input matInput type="number" step="0.1" formControlName="bandB" /></mat-form-field>
        <mat-form-field><mat-label>Band C</mat-label><input matInput type="number" step="0.1" formControlName="bandC" /></mat-form-field>
      </div>
    </mat-card-content></mat-card>
    <mat-card class="mb"><mat-card-content>
      <h3>Credit thresholds &amp; late fee</h3>
      <div class="grid">
        <mat-form-field><mat-label>Auto-approve at or above</mat-label><input matInput type="number" formControlName="approveThreshold" /></mat-form-field>
        <mat-form-field><mat-label>Manual review at or above</mat-label><input matInput type="number" formControlName="reviewThreshold" /></mat-form-field>
        <mat-form-field><mat-label>Late fee (% of EMI, once)</mat-label><input matInput type="number" step="0.1" formControlName="lateFeePercent" /></mat-form-field>
      </div>
    </mat-card-content></mat-card>
    <button mat-flat-button color="primary" [disabled]="f.invalid || busy()">Save changes</button>
  </form>`,
})
export class RateConfigComponent implements OnInit {
  private api = inject(ApiService); private snack = inject(MatSnackBar);
  busy = signal(false);
  private n = () => [null as number | null, [Validators.required, Validators.min(0)]] as const;
  f = inject(FormBuilder).group({
    bandA: this.n(), bandB: this.n(), bandC: this.n(), approveThreshold: this.n(), reviewThreshold: this.n(), lateFeePercent: this.n(),
  });
  ngOnInit() { this.api.get('/config/rates').subscribe(r => this.f.patchValue(r)); }
  save() {
    const v = this.f.getRawValue();
    if ((v.reviewThreshold ?? 0) >= (v.approveThreshold ?? 0)) { this.snack.open('Review threshold must be below the approve threshold', 'OK', { duration: 4000 }); return; }
    this.busy.set(true);
    this.api.put('/config/rates', v).subscribe({
      next: () => { this.snack.open('Configuration saved', 'OK', { duration: 3000 }); this.busy.set(false); },
      error: e => { this.snack.open(errMsg(e), 'OK', { duration: 4000 }); this.busy.set(false); },
    });
  }
}
