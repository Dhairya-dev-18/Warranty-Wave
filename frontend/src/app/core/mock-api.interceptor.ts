/**
 * In-memory fake backend so the UI can be built and demoed before the Spring Boot APIs exist.
 * It follows the endpoints in the project documentation (section 5.4) plus a few list endpoints
 * the UI needs (marked "ASSUMED"). Data resets on page refresh.
 * Turn off in app.config.ts (USE_MOCK_API) once the real backend is ready.
 */
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { buildSchedule, emi, round2 } from './emi';
import { Role } from './models';

const today = () => new Date().toISOString().slice(0, 10);
const DB_KEY = 'ww.mock-db';
const addMonths = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10);
};
const nextId = (a: any[]) => (a.length ? Math.max(...a.map(x => x.id)) + 1 : 1);
const fail = (status: number, message: string): never => { throw { status, message }; };

interface DbUser { id: number; name: string; email: string; password: string; role: Role; }

const cfg = { bandA: 8.5, bandB: 11, bandC: 14, lateFeePercent: 2, approveThreshold: 700, reviewThreshold: 550 };

const db = {
  users: [
    { id: 1, name: 'Asha Customer', email: 'customer@demo.com', password: 'demo123', role: 'CUSTOMER' },
    { id: 2, name: 'Dev Dealer', email: 'dealer@demo.com', password: 'demo123', role: 'DEALER' },
    { id: 3, name: 'Alok Adjuster', email: 'adjuster@demo.com', password: 'demo123', role: 'ADJUSTER' },
    { id: 4, name: 'Chitra Credit', email: 'officer@demo.com', password: 'demo123', role: 'CREDIT_OFFICER' },
    { id: 5, name: 'Admin User', email: 'admin@demo.com', password: 'demo123', role: 'ADMIN' },
  ] as DbUser[],
  vehicles: [{ id: 1, vin: 'MA3EWDE1S00123456', make: 'Maruti', model: 'Swift', year: 2024, currentMileage: 12000, ownerId: 1 }] as any[],
  plans: [
    { id: 1, name: 'Basic Powertrain', durationMonths: 36, kmLimit: 60000, coveredParts: 'ENGINE,GEARBOX,TRANSMISSION', price: 15000 },
    { id: 2, name: 'Comprehensive', durationMonths: 60, kmLimit: 100000, coveredParts: 'ENGINE,GEARBOX,TRANSMISSION,AC,ELECTRICALS,SUSPENSION', price: 32000 },
  ] as any[],
  warranties: [] as any[],
  claims: [] as any[],
  apps: [] as any[],
  contracts: [] as any[],
  emis: [] as any[],
};

/* ---------- helpers ---------- */
const vehicleOf = (id: number) => db.vehicles.find(v => v.id === id);
const bandRate = (b: string) => (b === 'A' ? cfg.bandA : b === 'B' ? cfg.bandB : cfg.bandC);

function need(u: DbUser | null, ...roles: Role[]): DbUser {
  if (!u) return fail(401, 'Please log in');
  if (roles.length && !roles.includes(u.role)) return fail(403, 'You do not have access to this action');
  return u;
}

function toWarranty(w: any) {
  const v = vehicleOf(w.vehicleId); const p = db.plans.find(x => x.id === w.planId);
  return { ...w, vehicleVin: v?.vin, vehicleName: `${v?.make} ${v?.model}`, planName: p?.name, coveredParts: p?.coveredParts };
}
function toClaim(c: any) {
  const w = db.warranties.find(x => x.id === c.warrantyId); const v = vehicleOf(w?.vehicleId);
  return { ...c, vehicleVin: v?.vin, customerName: db.users.find(u => u.id === v?.ownerId)?.name };
}
function toApp(a: any) {
  const c = db.contracts.find(x => x.applicationId === a.id);
  return { ...a, vehicleVin: vehicleOf(a.vehicleId)?.vin, customerName: db.users.find(u => u.id === a.customerId)?.name, contractId: c?.id ?? null };
}
function toContract(c: any) {
  const rows = db.emis.filter(e => e.contractId === c.id);
  return {
    ...c, vehicleVin: vehicleOf(db.apps.find(a => a.id === c.applicationId)?.vehicleId)?.vin,
    paidCount: rows.filter(e => e.status === 'PAID').length,
    outstanding: round2(rows.filter(e => e.status !== 'PAID').reduce((s, e) => s + e.principalPart, 0)),
  };
}

/* ---------- credit engine (documentation section 1.6) ---------- */
function scoreIt(b: any) {
  const principal = b.amount - b.downPayment;
  const newEmi = emi(principal, cfg.bandB, b.tenureMonths); // indicative rate for DTI
  const dti = (b.existingEmi + newEmi) / b.monthlyIncome;
  const dtiPts = dti < 0.3 ? 150 : dti <= 0.45 ? 80 : -100;
  const bureau = Math.round((Math.min(900, Math.max(300, b.creditHistoryScore)) - 300) / 600 * 200);
  const downPct = b.downPayment / b.amount;
  const reasons = [
    { factor: 'Base score', points: 300, note: 'Every applicant starts at 300' },
    { factor: 'Debt-to-income', points: dtiPts, note: `DTI ${(dti * 100).toFixed(1)}% (existing + new EMI vs income)` },
    { factor: 'Credit bureau score', points: bureau, note: `Bureau score ${b.creditHistoryScore} mapped to 0-200` },
    { factor: 'Down payment', points: downPct >= 0.2 ? 50 : 0, note: `${(downPct * 100).toFixed(1)}% of vehicle price (20% needed)` },
    { factor: 'Income stability', points: b.stableIncome ? 50 : 0, note: b.stableIncome ? 'Stable income' : 'Income not marked stable' },
  ];
  const score = reasons.reduce((s, r) => s + r.points, 0);
  const decision = score >= cfg.approveThreshold ? 'APPROVE' : score >= cfg.reviewThreshold ? 'REVIEW' : 'REJECT';
  const band = score >= 750 ? 'A' : score >= 650 ? 'B' : 'C';
  return { score, band, decision, reasons };
}

function createContract(app: any, startDate = today()) {
  const rate = bandRate(app.riskBand);
  const principal = app.amount - app.downPayment;
  const contract = {
    id: nextId(db.contracts), applicationId: app.id, principal, interestRate: rate,
    tenureMonths: app.tenureMonths, emi: emi(principal, rate, app.tenureMonths), startDate, status: 'ACTIVE',
  };
  db.contracts.push(contract);
  buildSchedule(principal, rate, app.tenureMonths).forEach(r => db.emis.push({
    id: nextId(db.emis), contractId: contract.id, installmentNo: r.installmentNo, dueDate: addMonths(startDate, r.installmentNo),
    principalPart: r.principalPart, interestPart: r.interestPart, amount: r.amount, lateFee: 0, status: 'PENDING', paidDate: null,
  }));
  return contract;
}

function createApplication(b: any, userId: number) {
  const v = vehicleOf(+b.vehicleId);
  if (!v) fail(404, 'Vehicle not found');
  const n = { ...b, amount: +b.amount, downPayment: +b.downPayment, tenureMonths: +b.tenureMonths, monthlyIncome: +b.monthlyIncome,
    existingEmi: +b.existingEmi, creditHistoryScore: +b.creditHistoryScore, stableIncome: !!b.stableIncome };
  if (n.amount - n.downPayment <= 0) fail(400, 'Down payment must be less than the vehicle price');
  const s = scoreIt(n);
  const app = {
    id: nextId(db.apps), customerId: userId, ...n, createdAt: new Date().toISOString(), score: s.score, riskBand: s.band,
    decision: s.decision, reasons: s.reasons, decisionNote: '',
    status: s.decision === 'APPROVE' ? 'APPROVED' : s.decision === 'REVIEW' ? 'MANUAL_REVIEW' : 'REJECTED',
  };
  db.apps.push(app);
  if (app.status === 'APPROVED') createContract(app);
  return app;
}

/* ---------- router ---------- */
function route(m: string, p: string, q: URLSearchParams, b: any, u: DbUser | null): any {
  let g: RegExpMatchArray | null;
  const mt = (method: string, re: RegExp) => (m === method ? p.match(re) : null);

  // Auth
  if (mt('POST', /^\/auth\/login$/)) {
    const x = db.users.find(y => y.email === b.email && y.password === b.password);
    if (!x) fail(401, 'Invalid email or password');
    return { token: 'mock-' + x!.id, id: x!.id, name: x!.name, email: x!.email, role: x!.role };
  }
  if (mt('POST', /^\/auth\/register$/)) {
    if (db.users.some(y => y.email === b.email)) fail(409, 'Email already registered');
    db.users.push({ id: nextId(db.users), name: b.name, email: b.email, password: b.password, role: b.role });
    return {};
  }

  // Vehicles
  if (mt('GET', /^\/vehicles$/)) { const x = need(u, 'CUSTOMER', 'DEALER'); return db.vehicles.filter(v => x.role === 'DEALER' || v.ownerId === x.id); }
  if (mt('POST', /^\/vehicles$/)) {
    const x = need(u, 'CUSTOMER', 'DEALER');
    if (db.vehicles.some(v => v.vin === String(b.vin).toUpperCase())) fail(409, 'A vehicle with this VIN already exists');
    const v = { id: nextId(db.vehicles), ...b, vin: String(b.vin).toUpperCase(), ownerId: x.id };
    db.vehicles.push(v); return v;
  }

  // Warranty plans
  if (mt('GET', /^\/warranty-plans$/)) { need(u); return db.plans; }
  if (mt('POST', /^\/warranty-plans$/)) { need(u, 'ADMIN'); const x = { id: nextId(db.plans), ...b }; db.plans.push(x); return x; }
  if ((g = mt('PUT', /^\/warranty-plans\/(\d+)$/))) {
    need(u, 'ADMIN'); const i = db.plans.findIndex(x => x.id === +g![1]); if (i < 0) fail(404, 'Plan not found');
    db.plans[i] = { ...db.plans[i], ...b }; return db.plans[i];
  }
  if ((g = mt('DELETE', /^\/warranty-plans\/(\d+)$/))) {
    need(u, 'ADMIN');
    if (db.warranties.some(w => w.planId === +g![1])) fail(409, 'Plan is in use by a warranty and cannot be deleted');
    db.plans = db.plans.filter(x => x.id !== +g![1]); return {};
  }

  // Warranties  (GET is ASSUMED)
  if (mt('GET', /^\/warranties$/)) {
    const x = need(u, 'CUSTOMER', 'DEALER');
    return db.warranties.filter(w => x.role === 'DEALER' || vehicleOf(w.vehicleId)?.ownerId === x.id).map(toWarranty);
  }
  if (mt('POST', /^\/warranties$/)) {
    need(u, 'CUSTOMER', 'DEALER');
    const plan = db.plans.find(x => x.id === +b.planId); if (!plan || !vehicleOf(+b.vehicleId)) fail(404, 'Vehicle or plan not found');
    const start = today();
    const w = { id: nextId(db.warranties), vehicleId: +b.vehicleId, planId: plan.id, startDate: start, endDate: addMonths(start, plan.durationMonths), status: 'ACTIVE' };
    db.warranties.push(w); return toWarranty(w);
  }

  // Claims
  if (mt('GET', /^\/claims$/)) {
    const x = need(u); const st = q.get('status');
    return db.claims.map(toClaim)
      .filter(c => (!st || c.status === st) && (x.role !== 'CUSTOMER' || vehicleOf(db.warranties.find(w => w.id === c.warrantyId)?.vehicleId)?.ownerId === x.id))
      .sort((a, c) => c.id - a.id);
  }
  if (mt('POST', /^\/claims$/)) {
    need(u, 'CUSTOMER', 'DEALER');
    const w = db.warranties.find(x => x.id === +b.warrantyId); if (!w) fail(404, 'Warranty not found');
    const v = vehicleOf(w.vehicleId); const plan = db.plans.find(x => x.id === w.planId);
    let reject = '';
    if (w.status !== 'ACTIVE' || today() > w.endDate) reject = 'Warranty is expired or inactive';
    else if (v.currentMileage > plan.kmLimit) reject = `Mileage ${v.currentMileage} km exceeds the plan limit of ${plan.kmLimit} km`;
    else if (!plan.coveredParts.split(',').includes(String(b.part).toUpperCase())) reject = `${b.part} is not covered by the ${plan.name} plan`;
    const c = { id: nextId(db.claims), warrantyId: w.id, part: String(b.part).toUpperCase(), description: b.description, costEstimate: +b.costEstimate,
      status: reject ? 'REJECTED' : 'UNDER_REVIEW', decisionNote: reject ? 'Auto-rejected: ' + reject : '', createdAt: new Date().toISOString() };
    db.claims.push(c); return toClaim(c);
  }
  if ((g = mt('PUT', /^\/claims\/(\d+)\/(approve|reject|settle)$/))) {
    need(u, 'ADJUSTER'); const c = db.claims.find(x => x.id === +g![1]); if (!c) fail(404, 'Claim not found');
    const act = g[2];
    if (act === 'settle') { if (c.status !== 'APPROVED') fail(422, 'Only approved claims can be settled'); c.status = 'SETTLED'; }
    else {
      if (c.status !== 'UNDER_REVIEW') fail(422, 'Claim is not under review');
      if (act === 'reject' && !String(b?.note ?? '').trim()) fail(400, 'A note is required to reject a claim');
      c.status = act === 'approve' ? 'APPROVED' : 'REJECTED'; c.decisionNote = b?.note ?? '';
    }
    return toClaim(c);
  }

  // Finance
  if (mt('GET', /^\/finance\/applications$/)) {
    const x = need(u); const st = q.get('status');
    return db.apps.filter(a => (!st || a.status === st) && (x.role !== 'CUSTOMER' || a.customerId === x.id)).map(toApp).sort((a, c) => c.id - a.id);
  }
  if ((g = mt('GET', /^\/finance\/applications\/(\d+)$/))) {
    need(u); const a = db.apps.find(x => x.id === +g![1]); if (!a) fail(404, 'Application not found'); return toApp(a);
  }
  if (mt('POST', /^\/finance\/applications$/)) { const x = need(u, 'CUSTOMER'); return toApp(createApplication(b, x.id)); }
  if ((g = mt('PUT', /^\/finance\/applications\/(\d+)\/decision$/))) {
    need(u, 'CREDIT_OFFICER'); const a = db.apps.find(x => x.id === +g![1]); if (!a) fail(404, 'Application not found');
    if (a.status !== 'MANUAL_REVIEW') fail(422, 'Application is not awaiting manual review');
    if (!b.approve && !String(b.note ?? '').trim()) fail(400, 'A note is required to reject an application');
    a.status = b.approve ? 'APPROVED' : 'REJECTED'; a.decision = b.approve ? 'APPROVE' : 'REJECT'; a.decisionNote = b.note ?? '';
    if (b.approve) createContract(a);
    return toApp(a);
  }

  // Contracts
  if (mt('GET', /^\/contracts$/)) { // ASSUMED
    const x = need(u, 'CUSTOMER'); return db.contracts.filter(c => db.apps.find(a => a.id === c.applicationId)?.customerId === x.id).map(toContract);
  }
  if ((g = mt('GET', /^\/contracts\/(\d+)$/))) { need(u); const c = db.contracts.find(x => x.id === +g![1]); if (!c) fail(404, 'Contract not found'); return toContract(c); }
  if ((g = mt('GET', /^\/contracts\/(\d+)\/schedule$/))) { need(u); return db.emis.filter(e => e.contractId === +g![1]).sort((a, c) => a.installmentNo - c.installmentNo); }
  if ((g = mt('POST', /^\/contracts\/(\d+)\/pay$/))) {
    need(u, 'CUSTOMER'); const c = db.contracts.find(x => x.id === +g![1]); if (!c) fail(404, 'Contract not found');
    if (c.status !== 'ACTIVE') fail(422, 'Contract is not active');
    const e = db.emis.filter(x => x.contractId === c.id && x.status !== 'PAID').sort((a, z) => a.installmentNo - z.installmentNo)[0];
    if (!e) fail(422, 'No unpaid installments');
    const paid = round2(e.amount + e.lateFee); e.status = 'PAID'; e.paidDate = today();
    if (!db.emis.some(x => x.contractId === c.id && x.status !== 'PAID')) c.status = 'CLOSED';
    return { paid, contract: toContract(c) };
  }

  // Dashboard
  if (mt('GET', /^\/dashboard\/summary$/)) {
    need(u, 'ADJUSTER', 'CREDIT_OFFICER', 'ADMIN');
    const by: Record<string, number> = { SUBMITTED: 0, UNDER_REVIEW: 0, APPROVED: 0, REJECTED: 0, SETTLED: 0 };
    db.claims.forEach(c => by[c.status]++);
    const decided = by['APPROVED'] + by['SETTLED'] + by['REJECTED'];
    const active = db.contracts.filter(c => c.status === 'ACTIVE').map(toContract);
    return {
      claimsByStatus: by, totalClaims: db.claims.length,
      approvalRate: decided ? Math.round(((by['APPROVED'] + by['SETTLED']) / decided) * 100) : 0,
      activeContracts: active.length, outstandingLoans: round2(active.reduce((s, c) => s + c.outstanding, 0)),
      overdueEmis: db.emis.filter(e => e.status === 'OVERDUE').length,
      pendingCreditReviews: db.apps.filter(a => a.status === 'MANUAL_REVIEW').length,
    };
  }

  // Admin (users + rate config are ASSUMED)
  if (mt('GET', /^\/users$/)) { need(u, 'ADMIN'); return db.users.map(({ password, ...r }) => r); }
  if ((g = mt('PUT', /^\/users\/(\d+)$/))) { need(u, 'ADMIN'); const x = db.users.find(y => y.id === +g![1]); if (!x) fail(404, 'User not found'); x!.role = b.role; return {}; }
  if (mt('GET', /^\/config\/rates$/)) { need(u, 'ADMIN'); return cfg; }
  if (mt('PUT', /^\/config\/rates$/)) { need(u, 'ADMIN'); Object.assign(cfg, b); return cfg; }

  return fail(404, `No mock for ${m} ${p}`);
}

/* ---------- seed data so every role has something to see ---------- */
(function seed() {
  const start = today();
  const w = { id: 1, vehicleId: 1, planId: 1, startDate: addMonths(start, -6), endDate: addMonths(start, 30), status: 'ACTIVE' };
  db.warranties.push(w);
  db.claims.push({ id: 1, warrantyId: 1, part: 'ENGINE', description: 'Engine knocking at idle', costEstimate: 18000, status: 'UNDER_REVIEW', decisionNote: '', createdAt: new Date().toISOString() });
  // approved loan with one paid EMI and one overdue EMI (shows late fee)
  createApplication({ vehicleId: 1, type: 'LOAN', amount: 600000, downPayment: 150000, tenureMonths: 36, monthlyIncome: 120000, existingEmi: 5000, creditHistoryScore: 780, stableIncome: true }, 1);
  const c = db.contracts[0]; c.startDate = addMonths(start, -3);
  db.emis.filter(e => e.contractId === c.id).forEach(e => { e.dueDate = addMonths(c.startDate, e.installmentNo); });
  db.emis[0].status = 'PAID'; db.emis[0].paidDate = db.emis[0].dueDate;
  db.emis[1].status = 'OVERDUE'; db.emis[1].lateFee = round2(db.emis[1].amount * cfg.lateFeePercent / 100);
  // borderline application waiting for the credit officer
  createApplication({ vehicleId: 1, type: 'LOAN', amount: 800000, downPayment: 100000, tenureMonths: 60, monthlyIncome: 90000, existingEmi: 15000, creditHistoryScore: 700, stableIncome: true }, 1);
})();

function persistDb() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* Storage may be unavailable. */ }
}

try {
  const saved = localStorage.getItem(DB_KEY);
  if (saved) Object.assign(db, JSON.parse(saved));
  else persistDb();
} catch {
  persistDb();
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const url = new URL(req.urlWithParams, 'http://mock');
  const path = url.pathname.replace(/^\/api/, '');
  if (/^\/(auth|vehicles|warranty-plans|warranties|claims|users|config\/rates|dashboard\/summary|finance|contracts)(\/|$)/.test(path)) return next(req);
  const auth = req.headers.get('Authorization');
  const user = auth ? db.users.find(x => 'mock-' + x.id === auth.replace('Bearer ', '')) ?? null : null;
  return timer(250).pipe(mergeMap(() => {
    try {
      const body = route(req.method, path, url.searchParams, req.body, user);
      if (req.method !== 'GET') persistDb();
      return of(new HttpResponse({ status: 200, body: JSON.parse(JSON.stringify(body ?? {})) }));
    } catch (e: any) {
      return throwError(() => new HttpErrorResponse({ status: e.status ?? 500, error: { message: e.message ?? 'Mock error' } }));
    }
  }));
};



