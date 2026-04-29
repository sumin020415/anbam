// 테스트 페이지
import { createClient } from '@/lib/supabase/server';

export default async function TestPage() {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('cctvs')
    .select('*', { count: 'exact', head: true });

  return (
    <main className="p-8 font-mono">
      <h1 className="text-2xl mb-4">🔌 Supabase Connection Test</h1>
      {error ? (
        <p className="text-red-500">ERROR: {error.message}</p>
      ) : (
        <p className="text-green-600">Connected! cctvs count: {count ?? 0}</p>
      )}
    </main>
  );
}