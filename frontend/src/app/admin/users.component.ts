import { Component, OnInit, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, errMsg } from '../core/api.service';
import { Col, DataTableComponent } from '../shared/data-table.component';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-users', standalone: true, imports: [DataTableComponent, ...MATERIAL],
  template: `
  <h2 class="title">Users</h2>
  <app-data-table [cols]="cols" [rows]="rows()" [actions]="act" />
  <ng-template #act let-r>
    <mat-form-field style="width:190px;margin:8px 0 -18px">
      <mat-label>Role</mat-label>
      <mat-select [value]="r.role" (selectionChange)="setRole(r, $event.value)">
        @for (x of roles; track x) { <mat-option [value]="x">{{ x }}</mat-option> }
      </mat-select>
    </mat-form-field>
  </ng-template>`,
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService); private snack = inject(MatSnackBar);
  rows = signal<any[]>([]);
  roles = ['CUSTOMER', 'DEALER', 'ADJUSTER', 'CREDIT_OFFICER', 'ADMIN'];
  cols: Col[] = [{ key: 'id', label: '#' }, { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role', type: 'status' }];
  ngOnInit() { this.load(); }
  load() { this.api.get('/users').subscribe(r => this.rows.set(r)); }
  setRole(u: any, role: string) {
    this.api.put(`/users/${u.id}`, { role }).subscribe({
      next: () => { this.snack.open(`${u.name} is now ${role}`, 'OK', { duration: 3000 }); this.load(); },
      error: e => this.snack.open(errMsg(e), 'OK', { duration: 4000 }),
    });
  }
}
