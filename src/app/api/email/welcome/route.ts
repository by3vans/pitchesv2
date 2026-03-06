import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send';
import { z } from 'zod';

const WelcomeEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = WelcomeEmailSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const { email, name } = result.data;
    await sendWelcomeEmail(email, name ?? 'there');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[api/email/welcome]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
