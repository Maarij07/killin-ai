import { NextRequest, NextResponse } from 'next/server';
import { generateCode, saveCode } from '@/lib/verificationStore';
import { sendVerificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req: NextRequest) {
  try {
    const { email, username } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const code = generateCode();
    saveCode(email, code, CODE_TTL_MS);

    await sendVerificationEmail(email, code, username);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send verification email';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
