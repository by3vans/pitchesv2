import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
    await sendWelcomeEmail(email, name ?? 'there');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[api/email/welcome]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
