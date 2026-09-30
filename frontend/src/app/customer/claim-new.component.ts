import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, errMsg } from '../core/api.service';
import { MATERIAL } from '../shared/material';

const PARTS = ['ENGINE', 'GEARBOX', 'TRANSMISSION', 'AC', 'ELECTRICALS', 'SUSPENSION', 'BRAKES', 'INFOTAINMENT'];

@Component({
  selector: 'app-claim-new', standalone: true, imports: [ReactiveFormsModule, ...MATERIAL],
  template: `
  <h2 class="title">File a warranty claim</h2>
  <mat-card><mat-card-content>
    <p class="muted">The system automatically checks that the warranty is active, mileage is within the plan limit, and the part is covered.</p>
    <form [formGroup]="f" (ngSubmit)="submit()">
      <div class="grid">
        <mat-form-field><mat-label>Warranty</mat-label>
          <mat-select formControlName="warrantyId">
            @for (w of warranties(); track w.id) { <mat-option [value]="w.id">{{ w.vehicleName }} · {{ w.planName }} ({{ w.status }})</mat-option> }
          </mat-select></mat-form-field>
        <mat-form-field><mat-label>Failed part</mat-label>
          <mat-select formControlName="part">@for (p of parts; track p) { <mat-option [value]="p">{{ p }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field><mat-label>Cost estimate (₹)</mat-label><input matInput type="number" formControlName="costEstimate" /></mat-form-field>
      </div>
      <mat-form-field><mat-label>Describe the issue</mat-label><textarea matInput rows="3" formControlName="description"></textarea></mat-form-field>
      <button mat-flat-button color="primary" [disabled]="f.invalid || busy()">Submit claim</button>
    </form>
    @if (!warranties().length) { <p class="muted">No warranties yet. Attach a plan under "Buy warranty" first.</p> }
  </mat-card-content></mat-card>`,
})
export class ClaimNewComponent implements OnInit {
  private api = inject(ApiService); private snack = inject(MatSnackBar); private router = inject(Router);
  parts = PARTS; warranties = signal<any[]>([]); busy = signal(false);
  f = inject(FormBuilder).group({
    warrantyId: [null as number | null, Validators.required], part: ['', Validators.required],
    costEstimate: [null as number | null, [Validators.required, Validators.min(1)]], description: ['', Validators.required],
  });
  ngOnInit() { this.api.get('/warranties').subscribe(r => this.warranties.set(r)); }
  submit() {
    this.busy.set(true);
    this.api.post('/claims', this.f.value).subscribe({
      next: c => {
        const msg = c.status === 'REJECTED' ? c.decisionNote : `Claim #${c.id} submitted and is now under review`;
        this.snack.open(msg, 'OK', { duration: 6000 }); this.router.navigateByUrl('/claims');
      },
      error: e => { this.snack.open(errMsg(e), 'OK', { duration: 4000 }); this.busy.set(false); },
    });
  }
}
