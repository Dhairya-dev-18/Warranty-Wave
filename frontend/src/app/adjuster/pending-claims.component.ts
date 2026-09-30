import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, errMsg } from '../core/api.service';
import { Col, DataTableComponent } from '../shared/data-table.component';
import { StatusChipComponent } from '../shared/status-chip.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-review-dialog', standalone: true, imports: [FormsModule, MatDialogModule, StatusChipComponent, ...MATERIAL],
  template: `
  <h2 mat-dialog-title>Claim #{{ c.id }} · {{ c.part }}</h2>
  <mat-dialog-content>
    <p><b>Vehicle:</b> {{ c.vehicleVin }} · <b>Customer:</b> {{ c.customerName }}</p>
    <p><b>Estimate:</b> ₹{{ c.costEstimate.toLocaleString('en-IN') }} · <b>Filed:</b> {{ c.createdAt.slice(0, 10) }}</p>
    <p><b>Issue:</b> {{ c.description }}</p>
    <p class="muted">Auto-validation passed: warranty active, mileage within limit, part covered.</p>
    <mat-form-field><mat-label>Decision note (required to reject)</mat-label><textarea matInput rows="3" [(ngModel)]="note"></textarea></mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-stroked-button color="warn" [disabled]="!note.trim()" [mat-dialog-close]="{ action: 'reject', note }">Reject</button>
    <button mat-flat-button color="primary" [mat-dialog-close]="{ action: 'approve', note }">Approve</button>
  </mat-dialog-actions>`,
})
export class ReviewDialogComponent {
  note = '';
  constructor(@Inject(MAT_DIALOG_DATA) public c: any) {}
}

@Component({
  selector: 'app-pending-claims', standalone: true, imports: [DataTableComponent, ...MATERIAL],
  template: `
  <h2 class="title">Claim review</h2>
  <mat-tab-group>
    <mat-tab [label]="'Under review (' + pending().length + ')'">
      <div class="pad"><app-data-table [cols]="cols" [rows]="pending()" [actions]="review" /></div>
    </mat-tab>
    <mat-tab [label]="'Approved - to settle (' + approved().length + ')'">
      <div class="pad"><app-data-table [cols]="cols" [rows]="approved()" [actions]="settle" /></div>
    </mat-tab>
  </mat-tab-group>
  <ng-template #review let-r><button mat-flat-button color="primary" (click)="open(r)">Review</button></ng-template>
  <ng-template #settle let-r><button mat-stroked-button (click)="markSettled(r)">Mark settled</button></ng-template>`,
  styles: ['.pad{padding-top:16px}'],
})
export class PendingClaimsComponent implements OnInit {
  private api = inject(ApiService); private dialog = inject(MatDialog); private snack = inject(MatSnackBar);
  pending = signal<any[]>([]); approved = signal<any[]>([]);
  cols: Col[] = [
    { key: 'id', label: '#' }, { key: 'vehicleVin', label: 'VIN' }, { key: 'customerName', label: 'Customer' }, { key: 'part', label: 'Part' },
    { key: 'costEstimate', label: 'Estimate', type: 'money' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'decisionNote', label: 'Note' },
  ];
  ngOnInit() { this.load(); }
  load() {
    this.api.get('/claims', { status: 'UNDER_REVIEW' }).subscribe(r => this.pending.set(r));
    this.api.get('/claims', { status: 'APPROVED' }).subscribe(r => this.approved.set(r));
  }
  open(c: any) {
    this.dialog.open(ReviewDialogComponent, { data: c, width: '520px' }).afterClosed().subscribe(res => {
      if (!res) return;
      this.api.put(`/claims/${c.id}/${res.action}`, { note: res.note }).subscribe({
        next: () => { this.snack.open(`Claim #${c.id} ${res.action === 'approve' ? 'approved' : 'rejected'}`, 'OK', { duration: 3000 }); this.load(); },
        error: e => this.snack.open(errMsg(e), 'OK', { duration: 4000 }),
      });
    });
  }
  markSettled(c: any) {
    this.api.put(`/claims/${c.id}/settle`).subscribe({
      next: () => { this.snack.open(`Claim #${c.id} settled`, 'OK', { duration: 3000 }); this.load(); },
      error: e => this.snack.open(errMsg(e), 'OK', { duration: 4000 }),
    });
  }
}
