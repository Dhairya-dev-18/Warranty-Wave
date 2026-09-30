import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { Role, Session } from './models';

const KEY = 'ww.session';
const load = (): Session | null => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; }
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private state = signal<Session | null>(load());

  session = this.state.asReadonly();
  role = computed(() => this.state()?.role ?? null);
  isLoggedIn = computed(() => !!this.state());
  get token() { return this.state()?.token ?? null; }

  login(email: string, password: string) {
    return this.http.post<Session>('/api/auth/login', { email, password }).pipe(
      tap(s => { localStorage.setItem(KEY, JSON.stringify(s)); this.state.set(s); }));
  }
  register(body: { name: string; email: string; password: string; role: Role }) {
    return this.http.post<void>('/api/auth/register', body);
  }
  logout() {
    localStorage.removeItem(KEY);
    this.state.set(null);
    this.router.navigateByUrl('/login');
  }
  hasRole(...roles: Role[]) { const r = this.role(); return !!r && roles.includes(r); }

  homeRoute(): string {
    switch (this.role()) {
      case 'CUSTOMER': case 'DEALER': return '/claims';
      case 'ADJUSTER': return '/adjuster/pending';
      case 'CREDIT_OFFICER': return '/credit/queue';
      case 'ADMIN': return '/dashboard';
      default: return '/login';
    }
  }
}
