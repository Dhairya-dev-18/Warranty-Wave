export type Role = 'CUSTOMER' | 'DEALER' | 'ADJUSTER' | 'CREDIT_OFFICER' | 'ADMIN';

export interface Session { token: string; id: number; name: string; email: string; role: Role; }

export interface Reason { factor: string; points: number; note: string; }
