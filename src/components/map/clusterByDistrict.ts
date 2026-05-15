// 자치구(district) 단위로 핀을 그룹핑해 클러스터 표시용 데이터로 변환.
// 줌아웃 상태에서 14k+ 핀을 자치구별 ~16개 클러스터로 압축 → DOM 부담 ↓.

export type Clusterable = {
  district: string | null;
  lat: number;
  lng: number;
};

export type ClusterGroup = {
  key: string;
  lat: number;
  lng: number;
  count: number;
};

export function clusterByDistrict<T extends Clusterable>(pins: T[]): ClusterGroup[] {
  const acc = new Map<string, { latSum: number; lngSum: number; count: number }>();

  for (const p of pins) {
    const key = p.district?.trim();
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
