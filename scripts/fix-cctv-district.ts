// scripts/fix-cctv-district.ts
// CCTV 의 district 가 부산 16 자치구 화이트리스트에 없는 row 를
// Kakao Local REST API (coord2regioncode) 로 좌표 → 행정구역 변환해 보정한다.
//
// 사전 — `.env.local` 에 `KAKAO_REST_API_KEY` 등록 필요
//   (Kakao Developers > 내 애플리케이션 > 앱 키 > REST API 키 — JavaScript 키와 다른 키)
//
// 실행:
//   npm run fix-cctv-district -- --dry-run
//   npm run fix-cctv-district
//
// 결과: fix-cctv-district-{ts}.json (모든 row 의 before/after + status)

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

if (!SUPA_URL || !SUPA_KEY) {
  console.error(
    '[fix-cctv] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.',
  );
  process.exit(1);
}
if (!KAKAO_REST_API_KEY) {
  console.error(
    '[fix-cctv] KAKAO_REST_API_KEY 환경변수가 필요합니다. Kakao Developers > 앱 > 앱 키 > REST API 키.',
  );
  process.exit(1);
}

const BUSAN_DISTRICTS = new Set([
  '강서구',
  '금정구',
  '기장군',
  '남구',
  '동구',
  '동래구',
  '부산진구',
  '북구',
  '사상구',
  '사하구',
  '서구',
  '수영구',
  '연제구',
  '영도구',
  '중구',
  '해운대구',
]);

const args = {
  dryRun: process.argv.includes('--dry-run'),
};

const admin: SupabaseClient = createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Kakao Local API rate limit (무료: 일 100,000 호출, 초당 ~10).
// 안전하게 100ms 간격 (초당 10) — 784 row × 100ms ≈ 78 초.
const RATE_LIMIT_MS = 100;
const RETRY = 3;

type Coord2RegionDoc = {
  region_type: 'H' | 'B'; // H=행정동, B=법정동
  code: string;
  address_name: string;
  region_1depth_name: string; // 예: "부산광역시"
  region_2depth_name: string; // 예: "강서구"
  region_3depth_name: string; // 예: "명지1동"
};

async function coord2RegionCode(lat: number, lng: number): Promise<Coord2RegionDoc[]> {
  const url = new URL('https://dapi.kakao.com/v2/local/geo/coord2regioncode.json');
  url.searchParams.set('x', String(lng));
  url.searchParams.set('y', String(lat));

  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRY; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
      });
      if (!res.ok) {
        if (res.status >= 500 && attempt < RETRY) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
      }
      const json = await res.json();
      return (json?.documents ?? []) as Coord2RegionDoc[];
    } catch (err) {
      lastErr = err;
      if (attempt >= RETRY) break;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastErr;
}

type BrokenRow = {
  id: number;
  district: string;
  dong: string | null;
  lat: number;
  lng: number;
};

async function fetchBrokenRows(): Promise<BrokenRow[]> {
  const districtList = Array.from(BUSAN_DISTRICTS)
    .map((d) => `"${d}"`)
    .join(',');
  const all: BrokenRow[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from('cctvs')
      .select('id, district, dong, lat, lng')
      .not('district', 'in', `(${districtList})`)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as BrokenRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

type FixStatus = 'fixed' | 'not_busan' | 'no_match' | 'error';

type FixResult = {
  id: number;
  oldDistrict: string;
  oldDong: string | null;
  newDistrict: string | null;
  newDong: string | null;
  lat: number;
  lng: number;
  status: FixStatus;
  error?: string;
};

async function main() {
  console.log('[fix-cctv] args=', args);
  console.log('[fix-cctv] supabase=', SUPA_URL);

  console.log('[fix-cctv] 깨진 row 조회 중…');
  const rows = await fetchBrokenRows();
  console.log(`[fix-cctv] 깨진 row = ${rows.length} 개`);
  if (rows.length === 0) {
    console.log('[fix-cctv] 보정할 row 없음 → 종료');
    return;
  }

  const results: FixResult[] = [];
  let fixed = 0;
  let notBusan = 0;
  let noMatch = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      const docs = await coord2RegionCode(r.lat, r.lng);
      // 행정동 우선, 없으면 법정동 fallback
      const doc =
        docs.find((d) => d.region_type === 'H') ?? docs.find((d) => d.region_type === 'B');

      if (!doc) {
        results.push({
          id: r.id,
          oldDistrict: r.district,
          oldDong: r.dong,
          newDistrict: null,
          newDong: null,
          lat: r.lat,
          lng: r.lng,
          status: 'no_match',
        });
        noMatch++;
      } else if (
        doc.region_1depth_name !== '부산광역시' ||
        !BUSAN_DISTRICTS.has(doc.region_2depth_name)
      ) {
        // 좌표가 실제로 부산 밖 (양산/김해/거제 등) — 데이터 자체가 부산 외 row
        results.push({
          id: r.id,
          oldDistrict: r.district,
          oldDong: r.dong,
          newDistrict: doc.region_2depth_name,
          newDong: doc.region_3depth_name,
          lat: r.lat,
          lng: r.lng,
          status: 'not_busan',
        });
        notBusan++;
      } else {
        const newDistrict = doc.region_2depth_name;
        const newDong = doc.region_3depth_name;
        if (!args.dryRun) {
          const { error } = await admin
            .from('cctvs')
            .update({ district: newDistrict, dong: newDong })
            .eq('id', r.id);
          if (error) throw error;
        }
        results.push({
          id: r.id,
          oldDistrict: r.district,
          oldDong: r.dong,
          newDistrict,
          newDong,
          lat: r.lat,
          lng: r.lng,
          status: 'fixed',
        });
        fixed++;
      }
    } catch (err) {
      results.push({
        id: r.id,
        oldDistrict: r.district,
        oldDong: r.dong,
        newDistrict: null,
        newDong: null,
        lat: r.lat,
        lng: r.lng,
        status: 'error',
        error: (err as Error).message,
      });
      errors++;
      console.warn(`[fix-cctv] id=${r.id} 실패: ${(err as Error).message}`);
    }

    if ((i + 1) % 50 === 0 || i === rows.length - 1) {
      console.log(
        `[fix-cctv] 진행 ${i + 1}/${rows.length} (fixed=${fixed}, not_busan=${notBusan}, no_match=${noMatch}, errors=${errors})`,
      );
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log(
    `\n[fix-cctv] 완료: fixed=${fixed}, not_busan=${notBusan}, no_match=${noMatch}, errors=${errors}`,
  );

  const logFile = `fix-cctv-district-${Date.now()}.json`;
  writeFileSync(logFile, JSON.stringify(results, null, 2));
  console.log(`[fix-cctv] 결과 로그: ${logFile}`);

  if (args.dryRun) console.log('[fix-cctv] --dry-run → DB 업데이트 생략됨');
}

main().catch((err) => {
  console.error('\n[fix-cctv] 실패:', err);
  process.exit(1);
});
