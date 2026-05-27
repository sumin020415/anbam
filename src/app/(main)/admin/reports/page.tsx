import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/services/profiles';
import { getAllReports } from '@/lib/services/reports';
import AdminReportsView from '@/components/admin/AdminReportsView';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) notFound();

  const reports = await getAllReports(supabase);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-1">신고 관리</h1>
      <p className="mt-1 text-sm text-ink-2">
        접수된 신고를 검토하고 상태 변경 + 답변을 작성합니다. 답변은 신고자
        마이페이지 &quot;내 신고&quot; 에 표시됩니다.
      </p>
      <div className="mt-6">
        <AdminReportsView reports={reports} />
      </div>
    </main>
  );
}
