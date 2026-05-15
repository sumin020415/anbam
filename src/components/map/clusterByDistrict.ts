// 핀 그룹핑 utility — 자치구(district) / 동(dong) 단위 2 종 제공.
// 줌아웃 = 자치구 (~16 개), 줌 중간 = 동 (~150~200 개), 줌인 = 개별 핀.

export type Clusterable = {
  district: string | null;
  dong?: string | null;
  lat: number;
  lng: number;
};

// 부산광역시 16 자치구·군 화이트리스트.
// 시드 매핑 함수의 split 가 일부 주소 형식에서 district 자리에 동/도로명을 넣는 경우가 있어
// (예: district="명지동" / "대저1동" / "유엔평화로") 클러스터에서 걸러낼 안전망.
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

export function isBusanDistrict(value: string): boolean {
  return BUSAN_DISTRICTS.has(value);
}

// 도로명 접미사 (시드 매핑이 도로명을 dong 자리에 넣은 경우 skip).
const ROAD_SUFFIXES = ['로', '길', '대로', '거리', '번길'];
// 도로명 + 번지/호수 결합 패턴 — "용소로52-2", "수영성로26번길12", "동명로105번길27".
// `endsWith` 만으론 못 잡힘 (끝이 숫자/하이픈).
const ROAD_WITH_NUMBER_RE =
  /(로|길|대로|거리|번길)\s*\d+(번길)?(\s*\d+)?(-\d+)?$/;

// dong 정규화 4 단계:
//   1. 끝의 지번 번지 단편 제거 — "망미동212-9" / "남천동3-37" → "망미동" / "남천동"
//   2. 도로명 단독 skip — "민락수변로" / "수영성로26번길" → null
//   3. 도로명+번지 결합 skip — "용소로52-2" / "동명로105번길27" → null
//   4. 행정동 → 법정동 — "남천1동" / "광안제2동" → "남천동" / "광안동"
// null 반환 시 호출자가 클러스터에서 제외.
export function normalizeDong(raw: string): string | null {
  let trimmed = raw.trim();
  if (!trimmed) return null;
  // 1. "동N-N..." / "동N" 패턴 제거 (지번 번지)
  trimmed = trimmed.replace(/(동)\s*\d+[-\d]*$/, '$1');
  // 2. 도로명 단독 skip
  if (ROAD_SUFFIXES.some((s) => trimmed.endsWith(s))) return null;
  // 3. 도로명+번지/호수 결합 skip
  if (ROAD_WITH_NUMBER_RE.test(trimmed)) return null;
  // 4. 행정동 → 법정동
  return trimmed.replace(/(\d+|제\d+)동$/, '동');
}

export type ClusterGroup = {
  key: string;
  lat: number;
  lng: number;
  count: number;
};

function clusterByKey<T extends Clusterable>(
  pins: T[],
  keyOf: (p: T) => string | null,
): ClusterGroup[] {
  const acc = new Map<string, { latSum: number; lngSum: number; count: number }>();

  for (const p of pins) {
    const key = keyOf(p);
    if (!key) continue;
    const cur = acc.get(key);
    if (cur) {
      cur.latSum += p.lat;
      cur.lngSum += p.lng;
      cur.count += 1;
    } else {
      acc.set(key, { latSum: p.lat, lngSum: p.lng, count: 1 });
    }
  }

  const out: ClusterGroup[] = [];
  for (const [key, v] of acc) {
    out.push({
      key,
      lat: v.latSum / v.count,
      lng: v.lngSum / v.count,
      count: v.count,
    });
  }
  return out;
}

// 부산 16 자치구 화이트리스트로 정규화 — 자치구 자리에 잘못 들어간 동/도로명 row 제외.
export function clusterByDistrict<T extends Clusterable>(pins: T[]): ClusterGroup[] {
  return clusterByKey(pins, (p) => {
    const d = p.district?.trim();
    if (!d || !isBusanDistrict(d)) return null;
    return d;
  });
}

// 자치구 + 동 결합 키 (예: "해운대구 우동"). 도로명/dong-null row 도 자치구별 그룹으로 합류.
// dong 은 `normalizeDong` 으로 법정동 기준 합침 (남천1동/남천2동 → 남천동, 망미동212-9 → 망미동).
// CCTV 25.5% / LAMP 도 비슷한 비율이 도로명만 가지는 row — 시드가 `LCTN_LOTNO_ADDR` 부재 시
// `LCTN_ROAD_NM_ADDR` fallback 한 결과. skip 하지 말고 자치구 단독 그룹으로 합류해 데이터 보존.
export function clusterByDong<T extends Clusterable>(pins: T[]): ClusterGroup[] {
  return clusterByKey(pins, (p) => {
    const d = p.district?.trim();
    if (!d || !isBusanDistrict(d)) return null;
    const dongRaw = p.dong?.trim();
    if (!dongRaw) return `${d} (기타)`;
    const dong = normalizeDong(dongRaw);
    if (!dong) return `${d} (도로명)`;
    return `${d} ${dong}`;
  });
}
