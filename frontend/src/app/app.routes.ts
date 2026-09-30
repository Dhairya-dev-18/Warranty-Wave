import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthService } from './core/auth.service';
import { authGuard, roleGuard } from './core/role.guard';

const CUST = ['CUSTOMER', 'DEALER'];

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register.component').then(m => m.RegisterComponent) },
  {
    path: '', canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: () => inject(AuthService).homeRoute() },
      { path: 'dashboard', canActivate: [roleGuard], data: { roles: ['ADJUSTER', 'CREDIT_OFFICER', 'ADMIN'] },
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // Customer / Dealer
      { path: 'vehicles', canActivate: [roleGuard], data: { roles: CUST },
        loadComponent: () => import('./customer/vehicles.component').then(m => m.VehiclesComponent) },
      { path: 'warranties', canActivate: [roleGuard], data: { roles: CUST },
        loadComponent: () => import('./customer/buy-warranty.component').then(m => m.BuyWarrantyComponent) },
      { path: 'claims', canActivate: [roleGuard], data: { roles: CUST },
        loadComponent: () => import('./customer/claims.component').then(m => m.ClaimsComponent) },
      { path: 'claims/new', canActivate: [roleGuard], data: { roles: CUST },
        loadComponent: () => import('./customer/claim-new.component').then(m => m.ClaimNewComponent) },
      { path: 'finance', canActivate: [roleGuard], data: { roles: ['CUSTOMER'] },
        loadComponent: () => import('./customer/finance-list.component').then(m => m.FinanceListComponent) },
      { path: 'finance/apply', canActivate: [roleGuard], data: { roles: ['CUSTOMER'] },
        loadComponent: () => import('./customer/finance-apply.component').then(m => m.FinanceApplyComponent) },
      { path: 'contracts/:id', canActivate: [roleGuard], data: { roles: ['CUSTOMER'] },
        loadComponent: () => import('./customer/contract-detail.component').then(m => m.ContractDetailComponent) },

      // Adjuster
      { path: 'adjuster/pending', canActivate: [roleGuard], data: { roles: ['ADJUSTER'] },
        loadComponent: () => import('./adjuster/pending-claims.component').then(m => m.PendingClaimsComponent) },

      // Credit officer
      { path: 'credit/queue', canActivate: [roleGuard], data: { roles: ['CREDIT_OFFICER'] },
        loadComponent: () => import('./credit/review-queue.component').then(m => m.ReviewQueueComponent) },
      { path: 'credit/:id', canActivate: [roleGuard], data: { roles: ['CREDIT_OFFICER'] },
        loadComponent: () => import('./credit/assessment-detail.component').then(m => m.AssessmentDetailComponent) },

      // Admin
      { path: 'admin/plans', canActivate: [roleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('./admin/plans-crud.component').then(m => m.PlansCrudComponent) },
      { path: 'admin/users', canActivate: [roleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('./admin/users.component').then(m => m.UsersComponent) },
      { path: 'admin/rates', canActivate: [roleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('./admin/rate-config.component').then(m => m.RateConfigComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
