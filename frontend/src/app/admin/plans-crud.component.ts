import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, errMsg } from '../core/api.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { Col, DataTableComponent } from '../shared/data-table.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-plan-dialog', standalone: true, imports: [ReactiveFormsModule, MatDialogModule, ...MATERIAL],
  template: `
  <h2 mat-dialog-title>{{ plan ? 'Edit' : 'New' }} warranty plan</h2>
  <mat-dialog-content>
    <form [formGroup]="f" class="col">
      <mat-form-field><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
      <mat-form-field><mat-label>Duration (months)</mat-label><input matInput type="number" formControlName="durationMonths" /></mat-form-field>
      <mat-form-field><mat-label>Kilometre limit</mat-label><input matInput type="number" formControlName="kmLimit" /></mat-form-field>
      <mat-form-field><mat-label>Covered parts (comma separated)</mat-label><input matInput formControlName="coveredParts" placeholder="ENGINE,GEARBOX,AC" /></mat-form-field>
      <mat-form-field><mat-label>Price (₹)</mat-label><input matInput type="number" formControlName="price" /></mat-form-field>
    </form>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-flat-button color="primary" [disabled]="f.invalid" [mat-dialog-close]="f.getRawValue()">Save</button>
  </mat-dialog-actions>`,
  styles: ['.col{display:flex;flex-direction:column;min-width:min(420px,80vw)}'],
})
export class PlanDialogComponent {
  f;
  constructor(@Inject(MAT_DIALOG_DATA) public plan: any, fb: FormBuilder) {
    this.f = fb.nonNullable.group({
      name: [plan?.name ?? '', Validators.required], durationMonths: [plan?.durationMonths ?? 36, [Validators.required, Validators.min(1)]],
      kmLimit: [plan?.kmLimit ?? 60000, [Validators.required, Validators.min(1)]], coveredParts: [plan?.coveredParts ?? '', Validators.required],
      price: [plan?.price ?? 0, [Validators.required, Validators.min(0)]],
    });
  }
}

@Component({
  selector: 'app-plans-crud', standalone: true, imports: [DataTableComponent, ...MATERIAL],
  template: `
  <div class="row"><h2 class="title" style="margin:0">Warranty plans</h2>
    <button mat-flat-button color="primary" (click)="edit()"><mat-icon>add</mat-icon> New plan</button></div>
  <app-data-table [cols]="cols" [rows]="rows()" [actions]="act" />
  <ng-template #act let-r>
    <button mat-icon-button (click)="edit(r)" aria-label="Edit"><mat-icon>edit</mat-icon></button>
    <button mat-icon-button color="warn" (click)="remove(r)" aria-label="Delete"><mat-icon>delete</mat-icon></button>
  </ng-template>`,
})
export class PlansCrudComponent implements OnInit {
  private api = inject(ApiService); private dialog = inject(MatDialog); private snack = inject(MatSnackBar);
  rows = signal<any[]>([]);
  cols: Col[] = [
    { key: 'name', label: 'Plan' }, { key: 'durationMonths', label: 'Months' }, { key: 'kmLimit', label: 'KM limit' },
    { key: 'coveredParts', label: 'Covered parts' }, { key: 'price', label: 'Price', type: 'money' },
  ];
  ngOnInit() { this.load(); }
  load() { this.api.get('/warranty-plans').subscribe(r => this.rows.set(r)); }
  edit(p?: any) {
    this.dialog.open(PlanDialogComponent, { data: p ?? null }).afterClosed().subscribe(v => {
      if (!v) return;
      (p ? this.api.put(`/warranty-plans/${p.id}`, v) : this.api.post('/warranty-plans', v)).subscribe({
        next: () => { this.snack.open('Plan saved', 'OK', { duration: 3000 }); this.load(); },
        error: e => this.snack.open(errMsg(e), 'OK', { duration: 4000 }),
      });
    });
  }
  remove(p: any) {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Delete plan', message: `Delete "${p.name}"?`, confirmText: 'Delete' } }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.delete(`/warranty-plans/${p.id}`).subscribe({
        next: () => { this.snack.open('Plan deleted', 'OK', { duration: 3000 }); this.load(); },
        error: e => this.snack.open(errMsg(e), 'OK', { duration: 4000 }),
      });
    });
  }
}
