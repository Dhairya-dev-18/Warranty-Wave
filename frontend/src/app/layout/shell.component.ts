import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { Role } from '../core/models';
import { StatusChipComponent } from '../shared/status-chip.component';

interface NavItem { label: string; icon: string; link: string; }

const NAV: Record<Role, NavItem[]> = {
  CUSTOMER: [
    { label: 'My vehicles', icon: 'directions_car', link: '/vehicles' },
    { label: 'Buy warranty', icon: 'verified_user', link: '/warranties' },
    { label: 'My claims', icon: 'assignment', link: '/claims' },
    { label: 'New claim', icon: 'add_circle', link: '/claims/new' },
    { label: 'Apply for finance', icon: 'request_quote', link: '/finance/apply' },
    { label: 'My finance', icon: 'account_balance', link: '/finance' },
  ],
  DEALER: [
    { label: 'Vehicles', icon: 'directions_car', link: '/vehicles' },
    { label: 'Buy warranty', icon: 'verified_user', link: '/warranties' },
    { label: 'Claims', icon: 'assignment', link: '/claims' },
    { label: 'New claim', icon: 'add_circle', link: '/claims/new' },
  ],
  ADJUSTER: [
    { label: 'Claim review', icon: 'rule', link: '/adjuster/pending' },
    { label: 'Dashboard', icon: 'dashboard', link: '/dashboard' },
  ],
  CREDIT_OFFICER: [
    { label: 'Credit review', icon: 'fact_check', link: '/credit/queue' },
    { label: 'Dashboard', icon: 'dashboard', link: '/dashboard' },
  ],
  ADMIN: [
    { label: 'Dashboard', icon: 'dashboard', link: '/dashboard' },
    { label: 'Warranty plans', icon: 'workspace_premium', link: '/admin/plans' },
    { label: 'Users', icon: 'group', link: '/admin/users' },
    { label: 'Rates & rules', icon: 'tune', link: '/admin/rates' },
  ],
};

@Component({
  selector: 'app-shell', standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, StatusChipComponent],
  template: `
  <mat-sidenav-container class="shell">
    <mat-sidenav [mode]="handset() ? 'over' : 'side'" [opened]="!handset() || open()" (closedStart)="open.set(false)">
      <div class="brand"><mat-icon>directions_car</mat-icon> WarrantyWave</div>
      <mat-nav-list>
        @for (n of nav(); track n.link) {
          <a mat-list-item [routerLink]="n.link" routerLinkActive="active" (click)="open.set(false)">
            <mat-icon matListItemIcon>{{ n.icon }}</mat-icon><span matListItemTitle>{{ n.label }}</span>
          </a>
        }
      </mat-nav-list>
    </mat-sidenav>
    <mat-sidenav-content>
      <mat-toolbar>
        @if (handset()) { <button mat-icon-button (click)="open.set(true)" aria-label="Menu"><mat-icon>menu</mat-icon></button> }
        <span class="spacer"></span>
        <span class="who">{{ auth.session()?.name }}</span>
        <app-status-chip [value]="auth.role()" />
        <button mat-icon-button (click)="auth.logout()" aria-label="Log out"><mat-icon>logout</mat-icon></button>
      </mat-toolbar>
      <main class="page"><router-outlet /></main>
    </mat-sidenav-content>
  </mat-sidenav-container>`,
  styles: [`
    .shell{height:100vh}mat-sidenav{width:250px}
    .brand{display:flex;gap:8px;align-items:center;font-size:19px;font-weight:600;padding:20px 16px;color:#1a5fb4}
    .active{background:#e6effa}.spacer{flex:1}.who{margin-right:12px;font-size:14px}
    mat-toolbar{background:#fff;border-bottom:1px solid #e3e6ea;gap:4px}
    .page{padding:24px;max-width:1200px;margin:0 auto}`],
})
export class ShellComponent {
  auth = inject(AuthService);
  open = signal(false);
  handset = toSignal(inject(BreakpointObserver).observe(Breakpoints.Handset).pipe(map(r => r.matches)), { initialValue: false });
  nav = computed(() => NAV[this.auth.role() ?? 'CUSTOMER']);
}
