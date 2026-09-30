import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Col, DataTableComponent } from '../shared/data-table.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-finance-list', standalone: true, imports: [RouterLink, DataTableComponent, ...MATERIAL],
  template: `
  <div class="row"><h2 class="title" style="margin:0">My finance applications</h2>
    <a mat-flat-button color="primary" routerLink="/finance/apply"><mat-icon>add</mat-icon> Apply</a></div>
  <app-data-table [cols]="cols" [rows]="rows()" [actions]="act" />
  <ng-template #act let-r>
    @if (r.contractId) { <a mat-button color="primary" [routerLink]="['/contracts', r.contractId]">View contract</a> }
    @else if (r.status === 'MANUAL_REVIEW') { <span class="muted">Awaiting credit officer</span> }
  </ng-template>`,
})
export class FinanceListComponent implements OnInit {
  private api = inject(ApiService);
  rows = signal<any[]>([]);
  cols: Col[] = [
    { key: 'id', label: '#' }, { key: 'type', label: 'Type' }, { key: 'vehicleVin', label: 'VIN' },
    { key: 'amount', label: 'Vehicle price', type: 'money' }, { key: 'tenureMonths', label: 'Months' },
    { key: 'score', label: 'Score' }, { key: 'riskBand', label: 'Band' }, { key: 'status', label: 'Status', type: 'status' },
    { key: 'summary', label: 'Reasons' },
  ];
  ngOnInit() {
    this.api.get('/finance/applications').subscribe(r => this.rows.set(r.map((a: any) => ({
      ...a, summary: a.status === 'REJECTED' ? (a.decisionNote || a.reasons.filter((x: any) => x.points <= 0 && x.factor !== 'Base score').map((x: any) => x.factor).join(', ') || 'Score below minimum') : '',
    }))));
  }
}
