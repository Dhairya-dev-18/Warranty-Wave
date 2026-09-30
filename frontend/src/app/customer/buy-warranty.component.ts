import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, errMsg } from '../core/api.service';
import { Col, DataTableComponent } from '../shared/data-table.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-buy-warranty', standalone: true, imports: [ReactiveFormsModule, DataTableComponent, ...MATERIAL],
  template: `
  <h2 class="title">Buy a warranty plan</h2>
  <mat-card class="mb"><mat-card-content>
    <form [formGroup]="f" (ngSubmit)="buy()" class="grid">
      <mat-form-field><mat-label>Vehicle</mat-label>
        <mat-select formControlName="vehicleId">
          @for (v of vehicles(); track v.id) { <mat-option [value]="v.id">{{ v.make }} {{ v.model }} ({{ v.vin }})</mat-option> }
        </mat-select></mat-form-field>
      <mat-form-field><mat-label>Plan</mat-label>
        <mat-select formControlName="planId">
          @for (p of plans(); track p.id) { <mat-option [value]="p.id">{{ p.name }}</mat-option> }
        </mat-select></mat-form-field>
      <div><button mat-flat-button color="primary" [disabled]="f.invalid || busy()">Attach plan</button></div>
    </form>
    @if (selected(); as p) {
      <p class="muted">Covers <b>{{ p.durationMonths }} months</b> or <b>{{ p.kmLimit }} km</b> · Parts: {{ p.coveredParts }} · Price: <b>₹{{ p.price }}</b>.
        Start and end dates are calculated automatically.</p>
    }
    @if (!vehicles().length) { <p class="muted">Add a vehicle first (Vehicles menu).</p> }
  </mat-card-content></mat-card>
  <h3>Warranties</h3>
  <app-data-table [cols]="cols" [rows]="warranties()" />`,
})
export class BuyWarrantyComponent implements OnInit {
  private api = inject(ApiService); private snack = inject(MatSnackBar);
  vehicles = signal<any[]>([]); plans = signal<any[]>([]); warranties = signal<any[]>([]); busy = signal(false);
  f = inject(FormBuilder).group({ vehicleId: [null as number | null, Validators.required], planId: [null as number | null, Validators.required] });
  planId = signal<number | null>(null);
  selected = computed(() => this.plans().find(p => p.id === this.planId()));
  cols: Col[] = [
    { key: 'vehicleVin', label: 'VIN' }, { key: 'planName', label: 'Plan' }, { key: 'startDate', label: 'Start', type: 'date' },
    { key: 'endDate', label: 'End', type: 'date' }, { key: 'status', label: 'Status', type: 'status' },
  ];
  ngOnInit() {
    this.api.get('/vehicles').subscribe(r => this.vehicles.set(r));
    this.api.get('/warranty-plans').subscribe(r => this.plans.set(r));
    this.f.controls.planId.valueChanges.subscribe(v => this.planId.set(v));
    this.load();
  }
  load() { this.api.get('/warranties').subscribe(r => this.warranties.set(r)); }
  buy() {
    this.busy.set(true);
    this.api.post('/warranties', this.f.value).subscribe({
      next: () => { this.snack.open('Warranty attached', 'OK', { duration: 3000 }); this.busy.set(false); this.load(); },
      error: e => { this.snack.open(errMsg(e), 'OK', { duration: 4000 }); this.busy.set(false); },
    });
  }
}
