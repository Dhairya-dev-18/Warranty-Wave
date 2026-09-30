import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, errMsg } from '../core/api.service';
import { Col, DataTableComponent } from '../shared/data-table.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-vehicles', standalone: true, imports: [ReactiveFormsModule, DataTableComponent, ...MATERIAL],
  template: `
  <h2 class="title">Vehicles</h2>
  <mat-card class="mb"><mat-card-content>
    <form [formGroup]="f" (ngSubmit)="save()" class="grid">
      <mat-form-field><mat-label>VIN (17 characters)</mat-label>
        <input matInput formControlName="vin" maxlength="17" style="text-transform:uppercase" />
        <mat-error>Enter a valid 17-character VIN (no I, O or Q)</mat-error></mat-form-field>
      <mat-form-field><mat-label>Make</mat-label><input matInput formControlName="make" /></mat-form-field>
      <mat-form-field><mat-label>Model</mat-label><input matInput formControlName="model" /></mat-form-field>
      <mat-form-field><mat-label>Year</mat-label><input matInput type="number" formControlName="year" /></mat-form-field>
      <mat-form-field><mat-label>Current mileage (km)</mat-label><input matInput type="number" formControlName="currentMileage" /></mat-form-field>
      <div><button mat-flat-button color="primary" [disabled]="f.invalid || busy()">Add vehicle</button></div>
    </form>
  </mat-card-content></mat-card>
  <app-data-table [cols]="cols" [rows]="rows()" />`,
})
export class VehiclesComponent implements OnInit {
  private api = inject(ApiService); private snack = inject(MatSnackBar);
  rows = signal<any[]>([]); busy = signal(false);
  cols: Col[] = [
    { key: 'vin', label: 'VIN' }, { key: 'make', label: 'Make' }, { key: 'model', label: 'Model' },
    { key: 'year', label: 'Year' }, { key: 'currentMileage', label: 'Mileage (km)' },
  ];
  f = inject(FormBuilder).nonNullable.group({
    vin: ['', [Validators.required, Validators.pattern(/^[A-HJ-NPR-Za-hj-npr-z0-9]{17}$/)]],
    make: ['', Validators.required], model: ['', Validators.required],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1990), Validators.max(2100)]],
    currentMileage: [0, [Validators.required, Validators.min(0)]],
  });
  ngOnInit() { this.load(); }
  load() { this.api.get('/vehicles').subscribe(r => this.rows.set(r)); }
  save() {
    this.busy.set(true);
    this.api.post('/vehicles', this.f.getRawValue()).subscribe({
      next: () => { this.snack.open('Vehicle added', 'OK', { duration: 3000 }); this.f.reset({ year: new Date().getFullYear(), currentMileage: 0 }); this.busy.set(false); this.load(); },
      error: e => { this.snack.open(errMsg(e), 'OK', { duration: 4000 }); this.busy.set(false); },
    });
  }
}
