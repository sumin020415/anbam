import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[check-email] SUPABASE_SERVICE_ROLE_KEY is not set');
    return NextResponse.json(
      { error: 'SERVICE_KEY_MISSING' },
      { status: 500 },
    );
  }

  const target = parsed.data.email.toLowerCase();
  const perPage = 1000;

  try {
    const admin = createAdminClient();

    for (let page = 1; page <= 10; page++) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) {
        console.error('[check-email] listUsers error:', error);
        return NextResponse.json(
          { error: 'LIST_USERS_FAILED', message: error.message },
          { status: 500 },
        );
      }
      if (data.users.some((u) => u.email?.toLowerCase() === target)) {
        return NextResponse.json({ taken: true });
      }
      if (data.users.length < perPage) break;
    }

    return NextResponse.json({ taken: false });
  } catch (e) {
    console.error('[check-email] unexpected error:', e);
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json(
      { error: 'INTERNAL', message },
      { status: 500 },
    );
  }
}
