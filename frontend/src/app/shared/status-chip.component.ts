import { Component, Input } from '@angular/core';

const TONES: Record<string, string> = {
  SUBMITTED: 'info', UNDER_REVIEW: 'warn', MANUAL_REVIEW: 'warn', PENDING: 'muted', REVIEW: 'warn',
  APPROVED: 'ok', APPROVE: 'ok', ACTIVE: 'ok', PAID: 'ok', SETTLED: 'info', CLOSED: 'muted',
  REJECTED: 'bad', REJECT: 'bad', OVERDUE: 'bad', DEFAULTED: 'bad', EXPIRED: 'muted', CANCELLED: 'muted',
};

@Component({
  selector: 'app-status-chip', standalone: true,
  template: `<span class="chip" [class]="tone">{{ label }}</span>`,
  styles: [`
    .chip{display:inline-block;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:.02em;white-space:nowrap}
    .ok{background:#e0f4e5;color:#14622b}.bad{background:#fde3e1;color:#a4231b}.warn{background:#fff1d6;color:#8a5a00}
    .info{background:#e0ecfb;color:#154c9a}.muted{background:#eceff1;color:#4b555c}
    :host-context(html[data-theme='dark']) .ok{background:#1e4930;color:#a3e3b5}:host-context(html[data-theme='dark']) .bad{background:#542e32;color:#ffb4ac}
    :host-context(html[data-theme='dark']) .warn{background:#514125;color:#f6d28a}:host-context(html[data-theme='dark']) .info{background:#263f5b;color:#aed7ff}
    :host-context(html[data-theme='dark']) .muted{background:#344254;color:#d0d8e3}`],
})
export class StatusChipComponent {
  @Input() value: string | null | undefined = '';
  get label() { return (this.value ?? '').replace(/_/g, ' '); }
  get tone() { return 'chip ' + (TONES[this.value ?? ''] ?? 'muted'); }
}
