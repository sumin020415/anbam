'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  const handle = async () => {
    await signOut(createClient());
    router.push('/');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handle}
      className="w-full rounded-anbam bg-point py-3 font-bold text-ink-1 shadow-card"
    >
      로그아웃
    </button>
  );
}
