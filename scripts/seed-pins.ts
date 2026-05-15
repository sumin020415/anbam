// scripts/seed-pins.ts
// 부산 CCTV / 보안등 데이터를 공공 OpenAPI 에서 받아 Supabase 에 시드한다.
//
// 실행 예:
//   npm run seed -- --target=cctv --dry-run
//   npm run seed -- --target=cctv
//   npm run seed -- --target=lamp           (보안등 키 발급 후)
//   npm run seed -- --target=all
//
// 환경변수 (.env.local):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   KOREA_DATA_API_KEY        (CCTV — data.go.kr, Decoding 키)
//   SAFETYDATA_API_KEY        (보안등 — safetydata.go.kr)

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import proj4 from 'proj4';

// Next.js 의 .env.local 을 명시적으로 로드 (dotenv 기본은 .env 만 봄)
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================================
// Env
// ============================================================
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KOREA_DATA_API_KEY = process.env.KOREA_DATA_API_KEY;
const SAFETYDATA_API_KEY = process.env.SAFETYDATA_API_KEY;

if (!SUPA_URL || !SUPA_KEY) {
  console.error('[seed-pins] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

// ============================================================
// CLI args
// ============================================================
type Target = 'cctv' | 'lamp' | 'all';

type Args = {
  target: Target;
  dryRun: boolean;
  maxPages: number | null;
};

function parseArgs(argv: string[]): Args {
  const out: Args = { target: 'all', dryRun: false, maxPages: null };
  for (const a of argv) {
    if (a === '--dry-run') out.dryRun = true;
    else if (a.startsWith('--target=')) {
      const v = a.split('=', 2)[1];
      if (v === 'cctv' || v === 'lamp' || v === 'all') out.target = v;
      else throw new Error(`알 수 없는 --target 값: ${v}`);
    } else if (a.startsWith('--max-pages=')) {
      const n = parseInt(a.split('=', 2)[1], 10);
      if (!Number.isFinite(n) || n <= 0) throw new Error('--max-pages 값은 양의 정수여야 합니다.');
      out.maxPages = n;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const admin: SupabaseClient = createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ============================================================
// HTTP 유틸 — 재시도 + 일반 브라우저 헤더 (한국 정부 API 호환성)
// ============================================================
const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) anbam-seed/1.0',
  Accept: 'application/json, */*;q=0.1',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
};

async function fetchWithRetry(
  url: string | URL,
  init: RequestInit = {},
  retries = 5,
  delayMs = 2000,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { ...FETCH_HEADERS, ...(init.headers ?? {}) },
      });
      // HTTP 5xx (서버 timeout 등 일시 에러) 도 retry
      if (res.status >= 500 && res.status < 600 && attempt < retries) {
        console.warn(`[fetch:retry] ${attempt}/${retries} HTTP ${res.status} → 재시도`);
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      console.warn(`[fetch:retry] ${attempt}/${retries} 실패: ${(err as Error).message}`);
      if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  throw lastErr;
}

// ============================================================
// CCTV — data.go.kr 행정안전부_CCTV정보 조회서비스
// ============================================================
const CCTV_API = 'https://apis.data.go.kr/1741000/cctv_info/info';
// 행정안전부 CCTV API 는 numOfRows 최대값이 100 (요청해도 100 으로 잘림)
const CCTV_PAGE_SIZE = 100;

type CctvApiRow = {
  WGS84_LAT?: string;
  WGS84_LOT?: string;
  LCTN_LOTNO_ADDR?: string;
  LCTN_ROAD_NM_ADDR?: string;
  INSTL_PRPS_SE_NM?: string;
  MNG_NO?: string;
};

type CctvSeedRow = {
  district: string | null;
  dong: string | null;
  lat: number;
  lng: number;
  purpose: string | null;
};

async function fetchCctvPage(pageNo: number, numOfRows = CCTV_PAGE_SIZE): Promise<CctvApiRow[]> {
  if (!KOREA_DATA_API_KEY) throw new Error('KOREA_DATA_API_KEY 환경변수가 없습니다.');

  const url = new URL(CCTV_API);
  url.searchParams.set('serviceKey', KOREA_DATA_API_KEY);
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(numOfRows));
  url.searchParams.set('returnType', 'JSON');

  const res = await fetchWithRetry(url);
  if (!res.ok) {
    const body = await res.text();
    console.error('[cctv:fetch] HTTP', res.status, body.slice(0, 400));
    throw new Error(`CCTV API 호출 실패 (HTTP ${res.status})`);
  }

  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

function mapCctv(row: CctvApiRow): CctvSeedRow | null {
  const lotno = (row.LCTN_LOTNO_ADDR ?? '').trim();
  const road = (row.LCTN_ROAD_NM_ADDR ?? '').trim();

  // 부산 필터 — 지번 또는 도로명 어느 한쪽이라도 "부산광역시" 로 시작하면 OK
  const useAddr = lotno.startsWith('부산광역시')
    ? lotno
    : road.startsWith('부산광역시')
      ? road
      : null;
  if (!useAddr) return null;

  const parts = useAddr.split(/\s+/);
  const district = parts[1]; // 예: "해운대구"
  const dong = parts[2]; // 예: "우동"
  // cctvs.district / cctvs.dong 는 NOT NULL — 자치구/동 추출 실패 시 row skip
  if (!district || !dong) return null;

  const lat = parseFloat(row.WGS84_LAT ?? '');
  const lng = parseFloat(row.WGS84_LOT ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    district,
    dong,
    lat,
    lng,
    purpose: (row.INSTL_PRPS_SE_NM ?? '').trim() || null,
  };
}

async function seedCctv() {
  console.log('\n=== CCTV 시드 시작 ===');
  let totalFetched = 0;
  let totalInserted = 0;
  let buffer: CctvSeedRow[] = [];
  let firstMatched: CctvSeedRow | null = null;
  const FLUSH_THRESHOLD = 500;

  // 디버그: 전체 row 수 확인 (1회)
  try {
    const debugUrl = new URL(CCTV_API);
    debugUrl.searchParams.set('serviceKey', KOREA_DATA_API_KEY!);
    debugUrl.searchParams.set('pageNo', '1');
    debugUrl.searchParams.set('numOfRows', '1');
    debugUrl.searchParams.set('returnType', 'JSON');
    const debugRes = await fetchWithRetry(debugUrl);
    const debugJson = await debugRes.json();
    const totalCount = debugJson?.response?.body?.totalCount;
    console.log(`[cctv] totalCount = ${totalCount} (예상 페이지 수 @numOfRows=${CCTV_PAGE_SIZE} = ${Math.ceil(Number(totalCount) / CCTV_PAGE_SIZE)})`);
  } catch (err) {
    console.warn('[cctv] totalCount 조회 실패:', (err as Error).message);
  }

  // dry-run 이 아니면 시작 시 한 번만 cctvs 비움 (streaming INSERT 전 한 번)
  if (!args.dryRun) {
    console.log('[cctv] 기존 cctvs 데이터 삭제 중…');
    const { error: delErr } = await admin.from('cctvs').delete().gt('id', 0);
    if (delErr) {
      console.error('[cctv:delete]', delErr);
      throw new Error('CCTV 시드 실패 (기존 데이터 삭제)');
    }
  }

  const flush = async () => {
    if (args.dryRun || buffer.length === 0) return;
    const { error } = await admin.from('cctvs').insert(buffer);
    if (error) {
      console.error('[cctv:insert]', error);
      throw new Error(`CCTV 시드 실패 (INSERT, totalInserted=${totalInserted})`);
    }
    totalInserted += buffer.length;
    console.log(`[cctv] flushed ${buffer.length} → totalInserted=${totalInserted}`);
    buffer = [];
  };

  let failedPages = 0;
  const MAX_CONSECUTIVE_FAILURES = 10; // 연속 실패 한도

  for (let page = 1; ; page++) {
    let list: CctvApiRow[];
    try {
      list = await fetchCctvPage(page, CCTV_PAGE_SIZE);
    } catch (err) {
      failedPages++;
      console.warn(`[cctv] page=${page} 실패 (${failedPages}/${MAX_CONSECUTIVE_FAILURES}) → skip: ${(err as Error).message}`);
      if (failedPages >= MAX_CONSECUTIVE_FAILURES) {
        console.error('[cctv] 연속 실패 한도 초과 → 시드 중단 (이미 INSERT 된 부분은 보존)');
        break;
      }
      // 잔여 buffer 라도 flush 후 다음 페이지로
      await flush();
      continue;
    }
    failedPages = 0; // 성공 시 카운터 리셋

    if (list.length === 0) {
      console.log(`[cctv] page=${page} 빈 응답 → 종료`);
      break;
    }
    totalFetched += list.length;

    for (const row of list) {
      const mapped = mapCctv(row);
      if (mapped) {
        if (!firstMatched) firstMatched = mapped;
        buffer.push(mapped);
      }
    }
    console.log(
      `[cctv] page=${page} fetched=${list.length} totalFetched=${totalFetched} busanBuffer=${buffer.length} totalInserted=${totalInserted}`,
    );

    // 버퍼가 임계치 넘으면 즉시 INSERT (중간 실패 시 부분 보존)
    if (buffer.length >= FLUSH_THRESHOLD) await flush();

    if (args.maxPages && page >= args.maxPages) {
      console.log(`[cctv] --max-pages=${args.maxPages} 도달 → 종료`);
      break;
    }
  }

  // 마지막 잔여 버퍼 INSERT
  await flush();

  const total = args.dryRun ? buffer.length : totalInserted;
  console.log(`[cctv] 전체 fetched=${totalFetched}, 부산 매칭=${total}`);
  if (firstMatched) console.log('[cctv] sample[0]:', firstMatched);
  if (args.dryRun) console.log('[cctv] --dry-run → DB 작업 생략');
  else console.log(`[cctv] ✅ 완료: ${totalInserted} rows`);
}

// ============================================================
// Lamp — data.go.kr 전국보안등정보표준데이터
// endpoint: https://api.data.go.kr/openapi/tn_pubr_public_scrty_lmp_api
// 응답: response.body.items[]  (좌표 WGS84, 주소 텍스트로 부산 필터)
// ============================================================
const LAMP_API = 'https://api.data.go.kr/openapi/tn_pubr_public_scrty_lmp_api';
const LAMP_PAGE_SIZE = 1000;

type LampApiRow = {
  lmpLcNm?: string;
  installationCo?: string;
  rdnmadr?: string; // 도로명주소
  lnmadr?: string; // 지번주소
  latitude?: string;
  longitude?: string;
  installationYear?: string;
  installationType?: string;
  phoneNumber?: string;
  institutionNm?: string;
  referenceDate?: string;
  insttCode?: string;
  insttNm?: string;
};

type LampSeedRow = {
  district: string | null;
  dong: string | null;
  lat: number;
  lng: number;
};

async function fetchLampPage(pageNo: number, numOfRows = LAMP_PAGE_SIZE): Promise<LampApiRow[]> {
  if (!KOREA_DATA_API_KEY) throw new Error('KOREA_DATA_API_KEY 환경변수가 없습니다.');

  const url = new URL(LAMP_API);
  url.searchParams.set('serviceKey', KOREA_DATA_API_KEY);
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(numOfRows));
  url.searchParams.set('type', 'json');

  const res = await fetchWithRetry(url);
  if (!res.ok) {
    const body = await res.text();
    console.error('[lamp:fetch] HTTP', res.status, body.slice(0, 400));
    throw new Error(`보안등 API 호출 실패 (HTTP ${res.status})`);
  }

  const json = await res.json();
  const items = json?.response?.body?.items ?? [];
  return Array.isArray(items) ? items : [items];
}

function isBusanAddr(addr: string): boolean {
  return addr.startsWith('부산광역시') || addr.startsWith('부산시');
}

function mapLamp(row: LampApiRow): LampSeedRow | null {
  // 부산 필터 — 도로명/지번 어느 한쪽이라도 부산이면 OK
  const rdnm = (row.rdnmadr ?? '').trim();
  const lnm = (row.lnmadr ?? '').trim();
  const useAddr = isBusanAddr(rdnm) ? rdnm : isBusanAddr(lnm) ? lnm : null;
  if (!useAddr) return null;

  const parts = useAddr.split(/\s+/);
  const district = parts[1]; // 예: "해운대구"
  const dong = parts[2];
  // lamps.district / lamps.dong 도 NOT NULL — 추출 실패 시 row skip
  if (!district || !dong) return null;

  const lat = parseFloat(row.latitude ?? '');
  const lng = parseFloat(row.longitude ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { district, dong, lat, lng };
}

async function seedLamp() {
  console.log('\n=== 보안등 시드 시작 ===');
  if (!KOREA_DATA_API_KEY) {
    console.warn('[lamp] KOREA_DATA_API_KEY 가 .env.local 에 없음 → 보안등 시드 건너뜀.');
    return;
  }

  // 디버그: 전체 row 수 확인 (1회)
  try {
    const debugUrl = new URL(LAMP_API);
    debugUrl.searchParams.set('serviceKey', KOREA_DATA_API_KEY);
    debugUrl.searchParams.set('pageNo', '1');
    debugUrl.searchParams.set('numOfRows', '1');
    debugUrl.searchParams.set('type', 'json');
    const debugRes = await fetchWithRetry(debugUrl);
    const debugJson = await debugRes.json();
    const totalCount = debugJson?.response?.body?.totalCount;
    console.log(
      `[lamp] totalCount = ${totalCount} (예상 페이지 수 @numOfRows=${LAMP_PAGE_SIZE} = ${Math.ceil(Number(totalCount) / LAMP_PAGE_SIZE)})`,
    );
  } catch (err) {
    console.warn('[lamp] totalCount 조회 실패:', (err as Error).message);
  }

  let totalFetched = 0;
  let totalInserted = 0;
  let buffer: LampSeedRow[] = [];
  let firstMatched: LampSeedRow | null = null;
  const FLUSH_THRESHOLD = 500;

  // dry-run 이 아니면 시작 시 한 번만 lamps 비움 (streaming INSERT 전 한 번)
  if (!args.dryRun) {
    console.log('[lamp] 기존 lamps 데이터 삭제 중…');
    const { error: delErr } = await admin.from('lamps').delete().gt('id', 0);
    if (delErr) {
      console.error('[lamp:delete]', delErr);
      throw new Error('보안등 시드 실패 (기존 데이터 삭제)');
    }
  }

  const flush = async () => {
    if (args.dryRun || buffer.length === 0) return;
    const { error } = await admin.from('lamps').insert(buffer);
    if (error) {
      console.error('[lamp:insert]', error);
      throw new Error(`보안등 시드 실패 (INSERT, totalInserted=${totalInserted})`);
    }
    totalInserted += buffer.length;
    console.log(`[lamp] flushed ${buffer.length} → totalInserted=${totalInserted}`);
    buffer = [];
  };

  let failedPages = 0;
  const MAX_CONSECUTIVE_FAILURES = 10; // 연속 실패 한도

  for (let page = 1; ; page++) {
    let list: LampApiRow[];
    try {
      list = await fetchLampPage(page, LAMP_PAGE_SIZE);
    } catch (err) {
      failedPages++;
      console.warn(
        `[lamp] page=${page} 실패 (${failedPages}/${MAX_CONSECUTIVE_FAILURES}) → skip: ${(err as Error).message}`,
      );
      if (failedPages >= MAX_CONSECUTIVE_FAILURES) {
        console.error('[lamp] 연속 실패 한도 초과 → 시드 중단 (이미 INSERT 된 부분은 보존)');
        break;
      }
      // 잔여 buffer 라도 flush 후 다음 페이지로
      await flush();
      continue;
    }
    failedPages = 0; // 성공 시 카운터 리셋

    if (list.length === 0) {
      console.log(`[lamp] page=${page} 빈 응답 → 종료`);
      break;
    }
    totalFetched += list.length;

    let matchedThisPage = 0;
    for (const row of list) {
      const mapped = mapLamp(row);
      if (mapped) {
        if (!firstMatched) firstMatched = mapped;
        // 디버그: 처음 5개 부산 매칭 row 의 원본 주소 출력
        if (totalInserted + buffer.length < 5) {
          console.log(
            `[lamp:debug:busan] rdnmadr="${row.rdnmadr}", lnmadr="${row.lnmadr}", insttNm="${row.insttNm}"`,
          );
        }
        buffer.push(mapped);
        matchedThisPage++;
      }
    }
    console.log(
      `[lamp] page=${page} fetched=${list.length} totalFetched=${totalFetched} busanBuffer=${buffer.length} totalInserted=${totalInserted} (+${matchedThisPage})`,
    );

    // 버퍼가 임계치 넘으면 즉시 INSERT (중간 실패 시 부분 보존)
    if (buffer.length >= FLUSH_THRESHOLD) await flush();

    if (args.maxPages && page >= args.maxPages) {
      console.log(`[lamp] --max-pages=${args.maxPages} 도달 → 종료`);
      break;
    }
  }

  // 마지막 잔여 버퍼 INSERT
  await flush();

  const total = args.dryRun ? buffer.length : totalInserted;
  console.log(`[lamp] 전체 fetched=${totalFetched}, 부산 매칭=${total}`);
  if (firstMatched) console.log('[lamp] sample[0]:', firstMatched);
  if (args.dryRun) console.log('[lamp] --dry-run → DB 작업 생략');
  else console.log(`[lamp] ✅ 완료: ${totalInserted} rows`);
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('[seed-pins] args=', args);
  console.log('[seed-pins] supabase=', SUPA_URL);

  if (args.target === 'cctv' || args.target === 'all') {
    await seedCctv();
  }
  if (args.target === 'lamp' || args.target === 'all') {
    await seedLamp();
  }
  console.log('\n[seed-pins] 모든 작업 완료');
}

main().catch((err) => {
  console.error('\n[seed-pins] 실패:', err);
  process.exit(1);
});
