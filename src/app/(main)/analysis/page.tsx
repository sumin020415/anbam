import AnalysisTabs from '@/components/analysis/AnalysisTabs';
import {
  getDistrictPinCounts,
  getDistrictPostCounts,
  getPostsHourlyDistribution,
  getPostsTrend,
} from '@/lib/services/analytics';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 300;

export default async function AnalysisPage() {
  const supabase = await createClient();
  const [pins, postCounts, trend, hourly] = await Promise.all([
    getDistrictPinCounts(supabase),
    getDistrictPostCounts(supabase),
    getPostsTrend(supabase, 30),
    getPostsHourlyDistribution(supabase),
  ]);

  return (
    <main className="px-4 sm:px-6 lg:px-10 xl:px-20 py-6">
      <AnalysisTabs
        postCounts={postCounts}
        cctvCounts={pins.cctv}
        lampCounts={pins.lamp}
        trend={trend}
        hourly={hourly}
      />
    </main>
  );
}
