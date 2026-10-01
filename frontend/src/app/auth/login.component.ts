import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errMsg } from '../core/api.service';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-login', standalone: true, imports: [ReactiveFormsModule, RouterLink, ...MATERIAL],
  template: `
  <div class="bg"><mat-card class="box">
    <h1>WarrantyWave</h1><p class="sub">Automotive warranty &amp; financing</p>
    <form [formGroup]="f" (ngSubmit)="submit()">
      <mat-form-field class="full"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" autocomplete="username" /></mat-form-field>
      <mat-form-field class="full"><mat-label>Password</mat-label><input matInput type="password" formControlName="password" autocomplete="current-password" /></mat-form-field>
      @if (error()) { <p class="err">{{ error() }}</p> }
      <button mat-flat-button color="primary" class="full" [disabled]="f.invalid || busy()">Sign in</button>
    </form>
    <p class="reg">New here? <a routerLink="/register">Create an account</a></p>
    <div class="demo"><span>Demo logins (password demo123):</span>
      @for (d of demos; track d) { <button mat-stroked-button type="button" (click)="fill(d)">{{ d.split('@')[0] }}</button> }
    </div>
  </mat-card></div>`,
  styles: [`.bg{min-height:100vh;display:grid;place-items:center;background:radial-gradient(ellipse at top left,var(--ww-primary-soft),transparent 48%),var(--ww-bg);padding:20px}
    .box{width:100%;max-width:440px;padding:32px;border-radius:20px!important}h1{margin:0;color:var(--ww-primary);font-size:28px;letter-spacing:-.04em}.sub{margin:6px 0 24px;color:var(--ww-muted)}
    .full{width:100%}.err{color:var(--ww-danger);background:var(--ww-danger-bg);border-radius:8px;padding:10px 12px;margin:0 0 12px}.reg{text-align:center;color:var(--ww-muted)}
    a{color:var(--ww-primary);font-weight:600}.demo{display:flex;flex-wrap:wrap;gap:7px;align-items:center;font-size:12px;color:var(--ww-muted);margin-top:18px;padding-top:16px;border-top:1px solid var(--ww-border)}.demo span{width:100%;margin-bottom:3px}`],
})
export class LoginComponent {
  private auth = inject(AuthService); private router = inject(Router);
  f = inject(FormBuilder).nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  busy = signal(false); error = signal('');
  demos = ['customer@demo.com', 'dealer@demo.com', 'adjuster@demo.com', 'officer@demo.com', 'admin@demo.com'];
  fill(email: string) { this.f.setValue({ email, password: 'demo123' }); }
  submit() {
    this.busy.set(true); this.error.set('');
    const { email, password } = this.f.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.auth.homeRoute()),
      error: e => { this.error.set(errMsg(e)); this.busy.set(false); },
    });
  }
}
