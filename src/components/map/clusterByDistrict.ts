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

// 부산 16 자치구·군의 클러스터 표시 좌표.
// 행정 중심 (구청/군청) 좌표를 베이스로 하되, **부산 시내 자치구 (중구/서구/동구/영도구/부산진구)**
// 는 시각 분리 위해 500m~2km 외곽으로 offset.
// 이유: 부산 시내 자치구 거리가 1.4~3.5km (줌 6 에서 34~84px) 라 ClusterPin 48px 끼리
// 시각적으로 거의 같은 자리 → LAMP 같이 자치구당 row 많은 데이터는 8~9 개만 보임.
// 정확성 ±500m~2km trade-off 하지만 16 자치구 모두 표시 보장.
const BUSAN_DISTRICT_CENTER: Record<string, [number, number]> = {
  강서구: [35.2122, 128.9803],
  금정구: [35.2429, 129.0925],
  기장군: [35.2447, 129.2222],
  남구: [35.1335, 129.0838],
  동구: [35.138, 129.05], // 행정 (35.129, 129.0455) → ~1.0km 북동 (시내 분리)
  동래구: [35.2049, 129.0837],
  부산진구: [35.17, 129.05], // 행정 (35.1626, 129.0533) → ~800m 북 (시내 분리)
  북구: [35.1972, 128.9905],
  사상구: [35.1525, 128.9914],
  사하구: [35.1063, 128.9748],
  서구: [35.09, 129.015], // 행정 (35.0978, 129.0244) → ~1.2km 남서 (시내 분리)
  수영구: [35.1454, 129.1132],
  연제구: [35.1762, 129.0792],
  영도구: [35.075, 129.08], // 행정 (35.0911, 129.0681) → ~2.0km 남동 (영도 섬 내부)
  중구: [35.1014, 129.0285], // 행정 (35.1064, 129.0335) → ~700m 남서 (시내 분리)
  해운대구: [35.1631, 129.1635],
};

// 도로명 접미사 (시드 매핑이 도로명을 dong 자리에 넣은 경우 skip).
const ROAD_SUFFIXES = ['로', '길', '대로', '거리', '번길'];
// 도로명 + 번지/호수 결합 패턴 — "용소로52-2", "수영성로26번길12", "동명로105번길27".
// `endsWith` 만으론 못 잡힘 (끝이 숫자/하이픈).
const ROAD_WITH_NUMBER_RE =
  /(로|길|대로|거리|번길)\s*\d+(번길)?(\s*\d+)?(-\d+)?$/;

// 비정상 placeholder 값 — DB 의 dong 자리에 들어가는 의미없는 값들.
const INVALID_DONG_VALUES = new Set(['-', '도로명주소', '주소', '미상', 'N/A']);

// dong 정규화 5 단계:
//   1. 비정상 placeholder skip — "-" / "도로명주소" 등 → null
//   2. 도로명 단독 skip — "민락수변로" / "수영성로26번길" → null
//   3. 도로명+번지 결합 skip — "용소로52-2" / "동명로105번길27" → null
//   4. 첫 "동/읍/면" 까지 추출 (lazy) — trailing 모든 형식 제거:
//      - 동: "청산동6" → "청산동", "남포동6번지" → "남포동", "봉래동1가" → "봉래동",
//             "망미동212-9" → "망미동", "광복동A호" → "광복동"
//      - 읍/면 (기장군 전체): "기장읍" → "기장읍", "철마면" → "철마면"
//      - "동래동" 같이 "동" 두 번: lazy 라 첫 매칭 "동래동" (래 + 동) 유지
//   5. 행정동 → 법정동 — "남천1동" / "광안제2동" → "남천동" / "광안동"
// null 반환 시 호출자가 `${district} (기타)` 또는 `(도로명)` fallback 그룹.
export function normalizeDong(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // 1. 비정상 placeholder skip
  if (INVALID_DONG_VALUES.has(trimmed)) return null;
  // 2. 도로명 단독 skip
  if (ROAD_SUFFIXES.some((s) => trimmed.endsWith(s))) return null;
  // 3. 도로명+번지/호수 결합 skip
  if (ROAD_WITH_NUMBER_RE.test(trimmed)) return null;
  // 4. 첫 "동/읍/면" 까지만 추출 (lazy)
  const placeMatch = trimmed.match(/^(.+?(?:동|읍|면))/);
  if (!placeMatch) return null;
  // 5. 행정동 → 법정동
  return placeMatch[1].replace(/(\d+|제\d+)동$/, '동');
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

// 부산 16 자치구 화이트리스트로 정규화 + 자치구 행정 중심 좌표로 고정.
// row 평균 좌표 대신 `BUSAN_DISTRICT_CENTER` 사용 → 자치구별 클러스터가 항상 일정 위치에 표시되어
// 부산 시내 자치구끼리 (중구/동구/서구/부산진구 등) 평균 좌표가 가깝게 모여 큰 클러스터가
// 작은 클러스터를 시각적으로 가리는 함정 방지.
// 결과는 count 내림차순 정렬 — 작은 카운트가 React render 순서 뒤로 가 DOM 뒤에 오면
// 같은 위치/근접 위치에서 작은 클러스터가 z-index 자연스럽게 위로 와 가려지지 않음.
export function clusterByDistrict<T extends Clusterable>(pins: T[]): ClusterGroup[] {
  const counts = new Map<string, number>();
  for (const p of pins) {
    const d = p.district?.trim();
    if (!d || !isBusanDistrict(d)) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const out: ClusterGroup[] = [];
  for (const [key, count] of counts) {
    const [lat, lng] = BUSAN_DISTRICT_CENTER[key];
    out.push({ key, lat, lng, count });
  }
  out.sort((a, b) => b.count - a.count);
  return out;
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
