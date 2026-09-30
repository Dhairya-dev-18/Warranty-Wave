import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Col, DataTableComponent } from '../shared/data-table.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-review-queue', standalone: true, imports: [RouterLink, DataTableComponent, ...MATERIAL],
  template: `
  <h2 class="title">Credit review queue</h2>
  <p class="muted">Applications scoring 550 to 699 need a credit officer decision.</p>
  <app-data-table [cols]="cols" [rows]="rows()" [actions]="open" />
  <ng-template #open let-r><a mat-flat-button color="primary" [routerLink]="['/credit', r.id]">Assess</a></ng-template>`,
})
export class ReviewQueueComponent implements OnInit {
  private api = inject(ApiService);
  rows = signal<any[]>([]);
  cols: Col[] = [
    { key: 'id', label: '#' }, { key: 'customerName', label: 'Applicant' }, { key: 'vehicleVin', label: 'VIN' },
    { key: 'amount', label: 'Vehicle price', type: 'money' }, { key: 'tenureMonths', label: 'Months' },
    { key: 'score', label: 'Score' }, { key: 'riskBand', label: 'Band' }, { key: 'status', label: 'Status', type: 'status' },
  ];
  ngOnInit() { this.api.get('/finance/applications', { status: 'MANUAL_REVIEW' }).subscribe(r => this.rows.set(r)); }
}
