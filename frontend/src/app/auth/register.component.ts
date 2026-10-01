import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../core/auth.service';
import { errMsg } from '../core/api.service';
import { MATERIAL } from '../shared/material';

@Component({
  selector: 'app-register', standalone: true, imports: [ReactiveFormsModule, RouterLink, ...MATERIAL],
  template: `
  <div class="bg"><mat-card class="box">
    <h1>Create account</h1>
    <form [formGroup]="f" (ngSubmit)="submit()">
      <mat-form-field class="full"><mat-label>Full name</mat-label><input matInput formControlName="name" /></mat-form-field>
      <mat-form-field class="full"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" /></mat-form-field>
      <mat-form-field class="full"><mat-label>Password (min 6)</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
      <mat-form-field class="full"><mat-label>I am a</mat-label>
        <mat-select formControlName="role"><mat-option value="CUSTOMER">Customer</mat-option><mat-option value="DEALER">Dealer</mat-option></mat-select>
      </mat-form-field>
      @if (error()) { <p class="err">{{ error() }}</p> }
      <button mat-flat-button color="primary" class="full" [disabled]="f.invalid || busy()">Register</button>
    </form>
    <p class="reg">Already registered? <a routerLink="/login">Sign in</a></p>
  </mat-card></div>`,
  styles: [`.bg{min-height:100vh;display:grid;place-items:center;background:radial-gradient(ellipse at top left,var(--ww-primary-soft),transparent 48%),var(--ww-bg);padding:20px}
    .box{width:100%;max-width:440px;padding:32px;border-radius:20px!important}h1{margin:0 0 22px;color:var(--ww-primary);font-size:27px;letter-spacing:-.04em}.full{width:100%}.err{color:var(--ww-danger);background:var(--ww-danger-bg);border-radius:8px;padding:10px 12px}.reg{text-align:center;color:var(--ww-muted)}a{color:var(--ww-primary);font-weight:600}`],
})
export class RegisterComponent {
  private auth = inject(AuthService); private router = inject(Router); private snack = inject(MatSnackBar);
  f = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required], email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]], role: ['CUSTOMER' as 'CUSTOMER' | 'DEALER'],
  });
  busy = signal(false); error = signal('');
  submit() {
    this.busy.set(true); this.error.set('');
    this.auth.register(this.f.getRawValue()).subscribe({
      next: () => { this.snack.open('Account created. Please sign in.', 'OK', { duration: 3500 }); this.router.navigateByUrl('/login'); },
      error: e => { this.error.set(errMsg(e)); this.busy.set(false); },
    });
  }
}
