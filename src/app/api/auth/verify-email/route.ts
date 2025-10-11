import { NextRequest, NextResponse } from 'next/server';
import { verifyAndConsume } from '@/lib/verificationStore';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email, verification_code } = await req.json();

    if (!email || !verification_code) {
      return NextResponse.json({ success: false, message: 'Email and code are required' }, { status: 400 });
    }

    const result = verifyAndConsume(String(email), String(verification_code).trim());
    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
