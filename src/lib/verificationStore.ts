// Simple global-backed verification code store for Next.js API routes
// NOTE: In production, replace with Redis/DB or signed tokens.

export type VerificationRecord = {
  code: string;
  expiresAt: number; // epoch ms
};

// Ensure singleton across dev hot-reloads
const g = globalThis as unknown as {
  __verificationStore?: Map<string, VerificationRecord>;
};

if (!g.__verificationStore) {
  g.__verificationStore = new Map<string, VerificationRecord>();
}

export const codeStore = g.__verificationStore!;

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveCode(email: string, code: string, ttlMs: number) {
  const record: VerificationRecord = { code, expiresAt: Date.now() + ttlMs };
  codeStore.set(email, record);
}

export function verifyAndConsume(email: string, code: string): {
  ok: boolean;
  error?: string;
} {
  const entry = codeStore.get(email);
  if (!entry) return { ok: false, error: 'No code found. Please request a new one.' };
  if (Date.now() > entry.expiresAt) {
    codeStore.delete(email);
    return { ok: false, error: 'Code expired. Please request a new one.' };
  }
  if (entry.code !== code) return { ok: false, error: 'Invalid verification code.' };
  codeStore.delete(email);
  return { ok: true };
}
