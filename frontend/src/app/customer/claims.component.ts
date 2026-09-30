import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Col, DataTableComponent } from '../shared/data-table.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-claims', standalone: true, imports: [RouterLink, DataTableComponent, ...MATERIAL],
  template: `
  <div class="row"><h2 class="title" style="margin:0">Warranty claims</h2>
    <a mat-flat-button color="primary" routerLink="/claims/new"><mat-icon>add</mat-icon> New claim</a></div>
  <app-data-table [cols]="cols" [rows]="rows()" />`,
})
export class ClaimsComponent implements OnInit {
  private api = inject(ApiService);
  rows = signal<any[]>([]);
  cols: Col[] = [
    { key: 'id', label: '#' }, { key: 'vehicleVin', label: 'VIN' }, { key: 'part', label: 'Part' },
    { key: 'costEstimate', label: 'Estimate', type: 'money' }, { key: 'status', label: 'Status', type: 'status' },
    { key: 'decisionNote', label: 'Decision note' }, { key: 'createdAt', label: 'Filed on', type: 'date' },
  ];
  ngOnInit() { this.api.get('/claims').subscribe(r => this.rows.set(r)); }
}
