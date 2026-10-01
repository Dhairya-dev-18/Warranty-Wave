import { CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { StatusChipComponent } from './status-chip.component';

export interface Col { key: string; label: string; type?: 'text' | 'money' | 'date' | 'status' | 'percent'; }

@Component({
  selector: 'app-data-table', standalone: true,
  imports: [MatTableModule, NgTemplateOutlet, CurrencyPipe, DatePipe, StatusChipComponent],
  template: `
  <div class="wrap">
    <table mat-table [dataSource]="rows">
      @for (c of cols; track c.key) {
        <ng-container [matColumnDef]="c.key">
          <th mat-header-cell *matHeaderCellDef>{{ c.label }}</th>
          <td mat-cell *matCellDef="let r">
            @switch (c.type) {
              @case ('money') { {{ val(r, c.key) | currency:'INR':'symbol':'1.0-2' }} }
              @case ('date') { {{ val(r, c.key) | date:'dd MMM yyyy' }} }
              @case ('status') { <app-status-chip [value]="val(r, c.key)" /> }
              @case ('percent') { {{ val(r, c.key) }}% }
              @default { {{ val(r, c.key) }} }
            }
          </td>
        </ng-container>
      }
      @if (actions) {
        <ng-container matColumnDef="_actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r" class="act">
            <ng-container [ngTemplateOutlet]="actions" [ngTemplateOutletContext]="{ $implicit: r }" />
          </td>
        </ng-container>
      }
      <tr mat-header-row *matHeaderRowDef="displayed"></tr>
      <tr mat-row *matRowDef="let r; columns: displayed"></tr>
      <tr class="mat-row" *matNoDataRow><td class="mat-cell empty" [attr.colspan]="displayed.length">No records found</td></tr>
    </table>
  </div>`,
  styles: [`.wrap{overflow-x:auto;background:var(--ww-surface);border-radius:14px;border:1px solid var(--ww-border);box-shadow:var(--ww-shadow)}
    table{width:100%}.empty{padding:28px;text-align:center;color:var(--ww-muted)}.act{text-align:right;white-space:nowrap}`],
})
export class DataTableComponent {
  @Input({ required: true }) cols: Col[] = [];
  @Input() rows: any[] = [];
  @Input() actions?: TemplateRef<any>;
  get displayed() { return [...this.cols.map(c => c.key), ...(this.actions ? ['_actions'] : [])]; }
  val(r: any, k: string) { return k.split('.').reduce((o, p) => o?.[p], r); }
}
