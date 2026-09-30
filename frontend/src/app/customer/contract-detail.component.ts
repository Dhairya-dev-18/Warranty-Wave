import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { ApiService, errMsg } from '../core/api.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { DashboardCardsComponent, StatCard } from '../shared/dashboard-cards.component';
import { Col, DataTableComponent } from '../shared/data-table.component';
import { StatusChipComponent } from '../shared/status-chip.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-contract-detail', standalone: true,
  imports: [RouterLink, CurrencyPipe, DataTableComponent, DashboardCardsComponent, StatusChipComponent, ...MATERIAL],
  template: `
  @if (contract(); as c) {
    <div class="row"><h2 class="title" style="margin:0">Contract #{{ c.id }} · {{ c.vehicleVin }}</h2><app-status-chip [value]="c.status" /></div>
    <app-dashboard-cards [cards]="cards()" />
    @if (next(); as n) {
      <mat-card class="mb"><mat-card-content class="row" style="margin:0">
        <div>Next EMI: <b>#{{ n.installmentNo }}</b>, due {{ n.dueDate }}
          @if (n.lateFee > 0) { · <span class="late">includes late fee {{ n.lateFee | currency:'INR':'symbol':'1.0-2' }}</span> }</div>
        <button mat-flat-button color="primary" (click)="pay(n)" [disabled]="busy()">Pay {{ n.amount + n.lateFee | currency:'INR':'symbol':'1.0-2' }}</button>
      </mat-card-content></mat-card>
    }
    <h3>EMI schedule</h3>
    <app-data-table [cols]="cols" [rows]="schedule()" />
  } @else { <mat-progress-bar mode="indeterminate" /> }
  <p><a routerLink="/finance">← Back to my finance</a></p>`,
  styles: ['.late{color:#a4231b}'],
})
export class ContractDetailComponent implements OnInit {
  @Input() id!: string; // bound from the route (withComponentInputBinding)
  private api = inject(ApiService); private dialog = inject(MatDialog); private snack = inject(MatSnackBar);
  contract = signal<any>(null); schedule = signal<any[]>([]); busy = signal(false);
  next = computed(() => this.schedule().find(r => r.status !== 'PAID'));
  cards = computed<StatCard[]>(() => {
    const c = this.contract(); if (!c) return [];
    const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
    return [
      { label: 'Principal', value: money(c.principal), icon: 'payments' },
      { label: `Rate · ${c.tenureMonths} months`, value: c.interestRate + '%', icon: 'percent' },
      { label: 'Monthly EMI', value: money(c.emi), icon: 'event_repeat' },
      { label: 'Outstanding principal', value: money(c.outstanding), icon: 'account_balance_wallet' },
      { label: 'Installments paid', value: `${c.paidCount} / ${c.tenureMonths}`, icon: 'task_alt', tone: 'ok' },
    ];
  });
  cols: Col[] = [
    { key: 'installmentNo', label: '#' }, { key: 'dueDate', label: 'Due date', type: 'date' }, { key: 'amount', label: 'EMI', type: 'money' },
    { key: 'principalPart', label: 'Principal', type: 'money' }, { key: 'interestPart', label: 'Interest', type: 'money' },
    { key: 'lateFee', label: 'Late fee', type: 'money' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'paidDate', label: 'Paid on', type: 'date' },
  ];
  ngOnInit() { this.load(); }
  load() {
    this.api.get(`/contracts/${this.id}`).subscribe(c => this.contract.set(c));
    this.api.get(`/contracts/${this.id}/schedule`).subscribe(s => this.schedule.set(s));
  }
  pay(n: any) {
    const total = (n.amount + n.lateFee).toLocaleString('en-IN');
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Pay EMI', message: `Pay ₹${total} for installment #${n.installmentNo}?`, confirmText: 'Pay now' } })
      .afterClosed().subscribe(ok => {
        if (!ok) return;
        this.busy.set(true);
        this.api.post(`/contracts/${this.id}/pay`).subscribe({
          next: r => { this.snack.open(`Paid ₹${r.paid.toLocaleString('en-IN')}` + (r.contract.status === 'CLOSED' ? '. Contract closed!' : ''), 'OK', { duration: 4000 }); this.busy.set(false); this.load(); },
          error: e => { this.snack.open(errMsg(e), 'OK', { duration: 4000 }); this.busy.set(false); },
        });
      });
  }
}
