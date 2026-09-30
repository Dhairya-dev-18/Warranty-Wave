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
  styles: [`.bg{min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#e6effa,#f7f9fc);padding:16px}
    .box{width:100%;max-width:400px;padding:28px}h1{margin:0;color:#1a5fb4}.sub{margin:4px 0 20px;color:#5f6b73}
    .full{width:100%}.err{color:#a4231b;margin:0 0 12px}.reg{text-align:center}
    .demo{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px;color:#5f6b73;margin-top:8px}.demo span{width:100%}`],
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
