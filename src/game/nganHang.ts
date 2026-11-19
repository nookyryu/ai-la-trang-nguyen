/// <reference types="vite/client" />
// Tải chung kho câu hỏi mới (cau-hoi-moi/*.txt) và kho dự phòng cũ (cau-hoi/*.txt)
// để dùng ở cả useGame.ts và bảng thống kê trên GameControls.tsx.
import { MON_LIST, type MonDanhHieuId, type Muc } from './config';
import { parseMc, type McQ } from './thi';

const newFiles = import.meta.glob<string>('./cau-hoi-moi/*.txt', { query: '?raw', import: 'default', eager: true });
const oldFiles = import.meta.glob<string>('./cau-hoi/*.txt', { query: '?raw', import: 'default', eager: true });

export const BANK_MOI: McQ[] = Object.entries(newFiles).flatMap(([p, t]) => parseMc(t, [], p, true));
export const BANK_CU: McQ[] = Object.entries(oldFiles).flatMap(([p, t]) => parseMc(t, [], p, false));
export const BANK: McQ[] = [...BANK_MOI, ...BANK_CU];

export interface ThongKeMon {
  mon: MonDanhHieuId;
  moi: Record<Muc, number>;
  cu: Record<Muc, number>;
  tongMoi: number;
  tongCu: number;
}

export function thongKeNganHang(): {
  ds: ThongKeMon[];
  tongMoi: number;
  tongCu: number;
} {
  const empty = (): Record<Muc, number> => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const map = new Map<MonDanhHieuId, ThongKeMon>(
    MON_LIST.map((m) => [m, { mon: m, moi: empty(), cu: empty(), tongMoi: 0, tongCu: 0 }]),
  );
  for (const q of BANK_MOI) {
    const row = map.get(q.mon as MonDanhHieuId);
    if (!row) continue;
    row.moi[q.muc]++;
    row.tongMoi++;
  }
  for (const q of BANK_CU) {
    const row = map.get(q.mon as MonDanhHieuId);
    if (!row) continue;
    row.cu[q.muc]++;
    row.tongCu++;
  }
  return {
    ds: MON_LIST.map((m) => map.get(m)!),
    tongMoi: BANK_MOI.length,
    tongCu: BANK_CU.length,
  };
}
