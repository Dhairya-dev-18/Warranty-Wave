import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export const errMsg = (e: any): string => e?.error?.message ?? e?.message ?? 'Something went wrong';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  get<T = any>(url: string, params?: Record<string, string>): Observable<T> {
    return this.http.get<T>('/api' + url, { params: new HttpParams({ fromObject: params ?? {} }) });
  }
  post<T = any>(url: string, body: unknown = {}): Observable<T> { return this.http.post<T>('/api' + url, body); }
  put<T = any>(url: string, body: unknown = {}): Observable<T> { return this.http.put<T>('/api' + url, body); }
  delete<T = any>(url: string): Observable<T> { return this.http.delete<T>('/api' + url); }
}
