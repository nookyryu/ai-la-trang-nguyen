// Lõi game Ai Là Trạng Nguyên – Mùa 2: không React, thời gian truyền vào (now) để test được.
// Trang stage chạy 1 bản KyThi, trang điều khiển chỉ vẽ lại ảnh chụp view().
import { GAME, MON_LIST, type Level, type MonDanhHieuId, type MonId, type Muc, type Vong } from './config';
import { doanGioi, lenhGioi, lenhMien, type Gioi, type Mien } from './gioiTinh';
import { sinhToan } from './toan';

export interface McQ {
  id: string;
  q: string;
  right: string;
  wrong: string[];
  mon: MonId;
  muc: Muc;
  giaiThich?: string;
  laMoi: boolean;
  level?: Level;
}

const LEVELS: Level[] = ['de', 'vua', 'kho', 'dinh', 'meo'];
const MUCS = new Set(['1', '2', '3', '4', '5']);

/** Băm chuỗi thành số nguyên dương cố định để quy đổi mức 4–5 cho câu cũ nhất quán */
function bamChuoi(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Suy môn học từ tên file (cả kho mới cau-hoi-moi/ và kho cũ cau-hoi/) */
export function monTuTenFile(fileName: string): MonId {
  const base = fileName.replace(/^.*[\\/]/, '').replace(/\.txt$/i, '').toLowerCase();
  if ((MON_LIST as string[]).includes(base)) return base as MonDanhHieuId;
  if (base === 'toan-nhanh') return 'toan-nhanh';
  // Quy đổi 14 file kho dự phòng cũ -> 7 môn + đố mẹo
  if (base.startsWith('meo-')) return 'do-meo';
  if (base.startsWith('lich-su-') || base === 'dinh-khoa-cu-danh-nhan') return 'lich-su';
  if (base.startsWith('dia-ly-') || base === 'the-gioi') return 'dia-ly';
  if (base.startsWith('khoa-hoc-') || base === 'dong-thuc-vat' || base === 'sinh-hoc-suc-khoe') return 'khoa-hoc';
  if (base.startsWith('van-hoc-')) return 'van-hoc';
  if (base.startsWith('van-hoa-')) return 'van-hoa';
  if (base.startsWith('phat-minh-') || base === 'dinh-tong-hop') return 'xa-hoi';
  return 'xa-hoi';
}

/** Quy đổi nhóm cũ [de/vua/kho/dinh/meo] -> mức 1..5 */
export function quyDoiMucCu(level: Level, id: string): Muc {
  if (level === 'de') return 1;
  if (level === 'vua') return 2;
  if (level === 'kho') return 3;
  if (level === 'dinh') return bamChuoi(id) % 2 === 0 ? 4 : 5;
  // [meo]: đố mẹo xuất hiện ở kỳ 3–4 (mức 3–5)
  return ([3, 4, 5] as Muc[])[bamChuoi(id) % 3];
}

/**
 * Đọc file trắc nghiệm:
 * - Định dạng mới (cau-hoi-moi/*.txt): dòng "[1]".."[5]", mỗi dòng 6 cột "câu | đúng | sai | sai | sai | Bạn có biết"
 * - Định dạng cũ (cau-hoi/*.txt): dòng "[de]".."[meo]", mỗi dòng 5 cột "câu | đúng | sai | sai | sai"
 */
export function parseMc(text: string, errors: string[] = [], fileName = '', laMoiMacDinh = false): McQ[] {
  const out: McQ[] = [];
  const monFile = monTuTenFile(fileName);
  let oldLevel: Level | '' = '';
  let newMuc: Muc | 0 = 0;

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const sec = /^\[(\w+)\]$/.exec(line);
    if (sec) {
      const tag = sec[1];
      if (MUCS.has(tag)) {
        newMuc = Number(tag) as Muc;
        oldLevel = '';
      } else if (LEVELS.includes(tag as Level)) {
        oldLevel = tag as Level;
        newMuc = 0;
      } else {
        newMuc = 0;
        oldLevel = '';
        errors.push(`dòng ${i + 1}: nhóm lạ ${line}`);
      }
      return;
    }
    const parts = line.split('|').map((s) => s.trim());
    if (newMuc) {
      if (parts.length !== 6 || parts.some((p) => !p)) {
        errors.push(`dòng ${i + 1}: sai cú pháp mới (cần 6 cột)`);
        return;
      }
      const [q, right, w1, w2, w3, giaiThich] = parts;
      out.push({
        id: `${q}|${right}`,
        q,
        right,
        wrong: [w1, w2, w3],
        mon: monFile,
        muc: newMuc,
        giaiThich,
        laMoi: true,
      });
      return;
    }
    if (oldLevel) {
      if (parts.length !== 5 || parts.some((p) => !p)) {
        errors.push(`dòng ${i + 1}: sai cú pháp cũ (cần 5 cột)`);
        return;
      }
      const [q, right, ...wrong] = parts;
      const id = `${q}|${right}`;
      out.push({
        id,
        q,
        right,
        wrong,
        mon: oldLevel === 'meo' ? 'do-meo' : monFile,
        muc: quyDoiMucCu(oldLevel, id),
        laMoi: laMoiMacDinh,
        level: oldLevel,
      });
      return;
    }
    errors.push(`dòng ${i + 1}: thiếu nhóm [1..5] hoặc [de..meo]`);
  });
  return out;
}

// "Đáp Án  C." -> "dapanc"
export const plain = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');

/** "a", "C.", "đáp án b", "chọn D", "câu c" -> 0..3; câu nói thường -> null */
export function choiceOf(comment: string): number | null {
  const m = /^(?:dapan|chon|cau)?([abcd])$/.exec(plain(comment));
  return m ? 'abcd'.indexOf(m[1]) : null;
}

/** Điểm 1 câu đúng: đúng ngay = tối đa, sát giờ = diemSan * tối đa */
export function diemDung(max: number, ms: number, totalMs: number) {
  const left = Math.max(0, Math.min(1, 1 - ms / totalMs));
  return Math.round(max * (GAME.diemSan + (1 - GAME.diemSan) * left));
}

export type Phase = 'cho' | 'vong' | 'quay' | 'doc' | 'hoi' | 'chot' | 'dapAn' | 'bangVang' | 'vinhQuy';

export interface SiTu {
  id: string;
  name: string;
  avatar: string;
  diem: number;
  chuoi: number;
  msDung: number; // tổng thời gian các câu đúng, để xếp khi bằng điểm
  vaoLuc: number;
  gain: number; // điểm câu vừa rồi (để hiện +/-)
  saiLien?: number; // sai liền mấy câu (để ông đồ trêu)
  monDung: Partial<Record<MonDanhHieuId, { so: number; ms: number }>>; // thống kê đúng theo từng môn
}

export interface DanhHieuMon {
  mon: MonDanhHieuId;
  danhHieu: string;
  id: string;
  name: string;
  avatar: string;
  soDung: number;
  ms: number;
}

interface Cau {
  q: McQ;
  opts: string[];
  ans: number;
  vong: number;
}

export type Ev =
  | { t: 'batDau' }
  | { t: 'cho' }
  | { t: 'vong'; vong: number }
  | { t: 'quay'; mon: MonId; muc: Muc; cauSo: number; laTrangNguyen: boolean }
  | { t: 'doc'; text: string; mon: MonId; laTrangNguyen: boolean }
  | { t: 'chot' }
  | { t: 'nhac' }
  | { t: 'dapAn'; chu: string; dap: string; soDung: number; soNop: number; nhanh?: string; msNhanh?: number; giaiThich?: string }
  | { t: 'bangVang'; vong: string; dau?: string }
  | { t: 'vinhQuy'; top: string[]; mien?: { mien: Mien; diem: number }; trangMon: { danhHieu: string; name: string }[] }
  | { t: 'cuuTro' }
  | { t: 'thach' }
  | { t: 'dauBang'; name: string }
  | { t: 'mienKem'; mien: Mien }
  | { t: 'saiLien'; id: string; name: string }
  | { t: 'latKeo' };

export interface Hang {
  hang: number;
  id: string;
  name: string;
  avatar: string;
  diem: number;
  danhHieu: string;
  gain: number;
  gioi: Gioi; // chọn ảnh nhân vật nam / nữ
  // dấu hiệu trên tên
  mien?: Mien;
  chuoi: number; // đang đúng liền mấy câu
  trangTruoc: boolean; // Trạng Nguyên ván trước
  dauTuan: boolean; // đang đứng đầu bảng vàng tuần
}

const shuffle = <T,>(a: T[], rand: () => number) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export class KyThi {
  phase: Phase = 'cho';
  endsAt = 0;
  private cauList: Cau[] = [];
  private idx = 0;
  private shownAt = 0;
  private answers = new Map<string, { chon: number; ms: number }>();
  private counts = [0, 0, 0, 0];
  private recent: string[] = []; // tên vừa nộp bài (không lộ đáp án)
  private ketQua: { soDung: number; nhanh: { name: string; ms: number; diem: number }[] } | null = null;
  private skew = 0;
  private skewN = 0;
  private events: Ev[] = [];
  siTu = new Map<string, SiTu>();
  /** Xem trước ảnh nền kỳ thi (null = tự động theo kỳ) */
  xemNenKy: number | null = null;
  /** Người chơi tự gõ "trai" / "gái" / "nữ": nhớ cả buổi, qua nhiều ván */
  gioiChon = new Map<string, Gioi>();
  /** Bảng vàng tuần (server cộng dồn điểm các ván trong tuần), chỉ để hiện */
  tuan: { id?: string; name: string; avatar: string; diem: number }[] = [];
  /** Phe miền người chơi chọn (gõ Bắc / Trung / Nam): nhớ cả buổi */
  mienChon = new Map<string, Mien>();
  private trangTruoc: string | null = null; // id Trạng Nguyên ván trước
  private trangMoi: string | null = null;
  /** Cứu trợ bằng tim ở Thi Đình: đủ tim thì loại 2 đáp án sai cho cả phòng */
  private cuu = { tim: 0, xong: false, loai: [] as number[] };
  private dauTruoc: string | null = null; // ai đang dẫn đầu ván
  private dauBaoCau = -99; // câu lần cuối hô đổi ngôi
  private mienBaoCau = 0;

  // ---------- quà: mỗi lần hiện 1 băng rôn, người khác xếp hàng (quà KHÔNG cho lợi thế trong game) ----------
  private quaCho: Qua[] = [];
  private nhacDa = false; // đã nhắc giữa giờ ở câu này chưa
  private khach: { id: string; name: string }[] = []; // người bình luận gần đây nhất

  /** Tên cho đám trẻ chạy giữa sân: người đã thi mà hết ghế, rồi tới người vừa bình luận chưa có ghế */
  treCon(ghe: Hang[]) {
    const coGhe = new Set(ghe.map((h) => h.id));
    const ds: string[] = [];
    for (const h of this.bxh(GAME.soGhe + GAME.soTre, true).slice(GAME.soGhe)) ds.push(h.name);
    for (const k of this.khach) if (!coGhe.has(k.id) && !ds.includes(k.name)) ds.push(k.name);
    return ds.slice(0, GAME.soTre);
  }
  qua: (Qua & { den: number }) | null = null;

  /** Có người tặng quà. Cùng người tặng liên tục thì gộp vào băng rôn đang chờ. */
  tangQua(q: Omit<Qua, 'at'>, now: number) {
    const cu = this.qua?.id === q.id && this.qua.gift === q.gift ? this.qua : this.quaCho.find((x) => x.id === q.id && x.gift === q.gift);
    if (cu) {
      cu.count += q.count;
      cu.coins += q.coins;
      cu.big ||= q.big;
      return;
    }
    this.quaCho.push({ ...q, at: now });
    // quà to chen lên trước; hàng chờ có trần, quá thì bỏ quà nhỏ cũ nhất
    this.quaCho.sort((a, b) => Number(b.big) - Number(a.big));
    if (this.quaCho.length > 6) this.quaCho.pop();
    this.chayQua(now);
  }

  private chayQua(now: number) {
    if (this.qua && now < this.qua.den) return;
    const q = this.quaCho.shift();
    this.qua = q ? { ...q, at: now, den: now + (q.big ? GAME.quaToSec : GAME.quaSec) * 1000 } : null;
  }

  constructor(
    private bank: McQ[],
    /** id câu -> lúc hỏi gần nhất; game ưu tiên câu mới chưa hỏi -> câu cũ chưa hỏi -> câu lâu chưa hỏi */
    public used: Record<string, number> = {},
    private rand: () => number = Math.random,
  ) {}

  /** Bắt đầu đếm ngược tới ván mới */
  cho(now: number) {
    this.phase = 'cho';
    this.endsAt = now + GAME.choSec * 1000;
    this.events.push({ t: 'cho' });
  }

  batDau(now: number) {
    this.xemNenKy = null;
    this.trangTruoc = this.trangMoi;
    this.dauTruoc = null;
    this.dauBaoCau = -99;
    this.mienBaoCau = 0;
    this.siTu.clear();
    this.cauList = this.chonCau(now);
    this.idx = 0;
    this.events.push({ t: 'batDau' });
    this.moVong(now);
  }

  /** Lấy các sự kiện cần đọc từ lần gọi trước */
  lay(): Ev[] {
    return this.events.splice(0);
  }

  /** Số thứ tự câu đang hỏi (1–16); docText(cauSo) là đề câu kế tiếp */
  get cauSo() {
    return this.idx + 1;
  }

  get cau(): Cau | undefined {
    return this.cauList[this.idx];
  }

  private get vong(): Vong {
    return GAME.vong[this.cau?.vong ?? 0];
  }

  /**
   * Bốc 16 câu (4 kỳ × 4 câu) đúng luật Mùa 2:
   * - Đúng mức khó theo kỳ, câu sau không dễ hơn câu trước
   * - 1 câu Toán nhanh ở Kỳ 2
   * - Mỗi môn tối đa 3 câu/ván, không 2 câu liền cùng môn
   * - Đố mẹo chỉ ở Kỳ 3–4, tối đa 2 câu/ván
   * - Ưu tiên câu mới chưa hỏi -> câu cũ chưa hỏi -> câu mới đã hỏi (lâu nhất) -> câu cũ đã hỏi
   */
  private chonCau(now: number): Cau[] {
    const taken = new Set<string>();
    const monCount: Partial<Record<MonId, number>> = {};
    let prevMon: MonId | null = null;
    let doMeoCount = 0;
    const out: Cau[] = [];

    const tierOf = (q: McQ) => {
      const u = this.used[q.id];
      if (u === Number.MAX_SAFE_INTEGER) return 4;
      if (!u) return q.laMoi ? 0 : 1;
      return q.laMoi ? 2 : 3;
    };

    const pickOne = (vongIdx: number, targetMuc: Muc): McQ | null => {
      const allowDoMeo = vongIdx >= GAME.doMeoTuKy && doMeoCount < GAME.doMeoMaxMoiVan;

      const filterWith = (strictMuc: boolean, strictMax: boolean, strictAdj: boolean, strictDoMeo: boolean) =>
        this.bank.filter((q) => {
          if (taken.has(q.id)) return false;
          if (strictMuc && q.muc !== targetMuc) return false;
          if (strictDoMeo && q.mon === 'do-meo' && !allowDoMeo) return false;
          if (strictMax && (monCount[q.mon] ?? 0) >= GAME.monMaxMoiVan) return false;
          if (strictAdj && q.mon === prevMon) return false;
          return true;
        });

      // Thử từ chặt nhất rồi mới nới nếu kho thử quá nhỏ
      let pool = filterWith(true, true, true, true);
      if (!pool.length) pool = filterWith(false, true, true, true);
      if (!pool.length) pool = filterWith(true, false, true, true);
      if (!pool.length) pool = filterWith(true, false, false, true);
      if (!pool.length) pool = filterWith(false, false, false, true);
      if (!pool.length) pool = filterWith(false, false, false, false);
      if (!pool.length) return null;

      // Xáo ngẫu nhiên trước khi sắp để giữ sự đa dạng giữa các ván
      const shuffled = shuffle([...pool], this.rand);
      shuffled.sort((a, b) => {
        const ta = tierOf(a);
        const tb = tierOf(b);
        if (ta !== tb) return ta - tb;
        // Nếu phải nới mức khó, ưu tiên câu gần mức mục tiêu nhất
        const da = Math.abs(a.muc - targetMuc);
        const db = Math.abs(b.muc - targetMuc);
        if (da !== db) return da - db;
        // Nếu đã hỏi rồi: ưu tiên câu lâu chưa hỏi nhất
        if (ta >= 2) {
          const ua = this.used[a.id] ?? 0;
          const ub = this.used[b.id] ?? 0;
          if (ua !== ub) return ua - ub;
        }
        // Cùng tier chưa hỏi: ưu tiên môn xuất hiện ít hơn trong ván (rải đều 7–8 môn, tạo cơ hội danh hiệu môn)
        return (monCount[a.mon] ?? 0) - (monCount[b.mon] ?? 0);
      });
      return shuffled[0] ?? null;
    };

    GAME.vong.forEach((v, vi) => {
      for (let si = 0; si < v.muc.length; si++) {
        const muc = v.muc[si];
        let q: McQ | null = null;
        if (v.toan && si === v.toan.viTri) {
          q = sinhToan(v.toan.cap, this.rand, v.toan.muc);
        } else {
          q = pickOne(vi, muc);
          if (q) {
            taken.add(q.id);
            this.used[q.id] = now;
            monCount[q.mon] = (monCount[q.mon] ?? 0) + 1;
            if (q.mon === 'do-meo') doMeoCount++;
          }
        }
        if (!q) continue;
        prevMon = q.mon;
        const opts = shuffle([q.right, ...q.wrong], this.rand);
        out.push({ q, opts, ans: opts.indexOf(q.right), vong: vi });
      }
    });
    return out;
  }

  private moVong(now: number) {
    this.phase = 'vong';
    this.endsAt = now + GAME.vongSec * 1000;
    this.events.push({ t: 'vong', vong: this.cau?.vong ?? 0 });
  }

  /** Vòng quay môn học (~2,4 giây) trước mỗi câu */
  private moQuay(now: number) {
    const c = this.cau!;
    this.phase = 'quay';
    this.endsAt = now + GAME.quaySec * 1000;
    this.answers.clear();
    this.counts = [0, 0, 0, 0];
    this.recent = [];
    this.ketQua = null;
    this.nhacDa = false;
    this.cuu = { tim: 0, xong: false, loai: [] };
    this.events.push({
      t: 'quay',
      mon: c.q.mon,
      muc: c.q.muc,
      cauSo: this.idx + 1,
      laTrangNguyen: this.laLatKeo,
    });
  }

  private moCau(now: number) {
    const c = this.cau!;
    this.phase = 'doc';
    this.endsAt = now + GAME.docMaxSec * 1000;
    if (this.laLatKeo) this.events.push({ t: 'latKeo' });
    else if (this.idx > 0 && this.rand() < GAME.thachTiLe) this.events.push({ t: 'thach' });
    this.events.push({ t: 'doc', text: this.docText(this.idx)!, mon: c.q.mon, laTrangNguyen: this.laLatKeo });
  }

  /** Lời đọc đề câu thứ i (để tạo giọng sẵn trước khi tới câu đó) */
  docText(i: number) {
    const c = this.cauList[i];
    if (!c) return null;
    const opts = c.opts.map((o, k) => `${'ABCD'[k]}, ${o}.`).join(' ');
    return `Câu ${i + 1}. ${c.q.q} ${opts}`;
  }

  /** Câu cuối ván (câu 16): Câu hỏi Trạng Nguyên mức 5, điểm nhân đôi (cả cộng lẫn trừ) */
  get laLatKeo() {
    return this.cauList.length > 0 && this.idx === this.cauList.length - 1;
  }

  /** Cả phòng thả tim. Ở Thi Đình, đủ tim trong lúc quay / đọc đề / trả lời thì loại 2 đáp án sai. */
  tim(n: number) {
    const c = this.cau;
    if (!c || c.vong !== GAME.vong.length - 1 || this.cuu.xong || (this.phase !== 'quay' && this.phase !== 'doc' && this.phase !== 'hoi')) return;
    this.cuu.tim += n;
    if (this.cuu.tim < GAME.cuuTroTim) return;
    this.cuu.xong = true;
    const sai = shuffle([0, 1, 2, 3].filter((i) => i !== c.ans), this.rand);
    this.cuu.loai = sai.slice(0, 2);
    this.events.push({ t: 'cuuTro' });
  }

  /** Lời công bố đáp án câu đang hỏi hoặc câu i (tạo giọng sẵn trong lúc mọi người trả lời) */
  dapAnText(i?: number) {
    const c = i !== undefined ? this.cauList[i] : this.cau;
    return c ? `${'ABCD'[c.ans]}, ${c.opts[c.ans]}!` : '';
  }

  /** Lời đọc "Bạn có biết?" cho câu i (nếu có) */
  giaiThichText(i?: number) {
    const c = i !== undefined ? this.cauList[i] : this.cau;
    return c?.q.giaiThich ? `Bạn có biết? ${c.q.giaiThich}` : '';
  }

  /** Toàn bộ lời đọc đề, công bố đáp án và "Bạn có biết?" của cả ván để tạo trước giọng */
  cacLoiTrongVan(): string[] {
    const ds: string[] = [];
    for (let i = 0; i < this.cauList.length; i++) {
      const doc = this.docText(i);
      if (doc) ds.push(doc);
      const dap = this.dapAnText(i);
      if (dap) ds.push(dap);
      const gt = this.giaiThichText(i);
      if (gt) ds.push(gt);
    }
    return ds;
  }

  /** Giọng đọc xong đề: hiện 4 đáp án, bắt đầu tính giờ */
  docXong(now: number) {
    if (this.phase !== 'doc') return;
    this.phase = 'hoi';
    this.shownAt = now;
    this.endsAt = now + this.vong.giay * 1000;
  }

  /** Bỏ câu đang hỏi (câu lỗi): không ai được điểm, sang câu tiếp */
  boCau(now: number) {
    if (this.phase !== 'quay' && this.phase !== 'doc' && this.phase !== 'hoi') return;
    // câu viết tay bị bỏ: đẩy xuống cuối hàng mãi mãi (chỉ hỏi lại khi đã hết sạch câu khác)
    const id = this.cau?.q.id;
    if (id && !id.startsWith('toan:')) this.used[id] = Number.MAX_SAFE_INTEGER;
    this.answers.clear();
    this.sauDapAn(now);
  }

  /**
   * 1 bình luận. createTime = giờ TikTok gắn lúc người xem gửi.
   * Trả về true nếu được tính là bài nộp.
   */
  chat(e: { id: string; name: string; avatar: string; comment: string; createTime?: number }, now: number) {
    // ai bình luận cũng được nhớ tên (để chạy trên sân thành đám trẻ nếu chưa có ghế)
    this.khach = [{ id: e.id, name: e.name }, ...this.khach.filter((k) => k.id !== e.id)].slice(0, 12);
    if (e.createTime) {
      const d = now - e.createTime;
      this.skew = this.skewN ? Math.min(this.skew + 5, d) : d;
      this.skewN++;
    }
    const g = lenhGioi(e.comment);
    if (g) {
      this.gioiChon.set(e.id, g);
      return false;
    }
    const m = lenhMien(e.comment);
    if (m) {
      this.mienChon.set(e.id, m);
      return false;
    }
    if (this.phase !== 'hoi') return false;
    const chon = choiceOf(e.comment);
    if (chon === null || this.answers.has(e.id)) return false;
    const sentAt = e.createTime && this.skewN > 1 ? e.createTime + this.skew : now;
    if (sentAt < this.shownAt - GAME.earlySendGraceMs) return false; // gửi lúc đáp án chưa hiện: không tính, không mất lượt
    const total = this.vong.giay * 1000;
    this.answers.set(e.id, { chon, ms: Math.max(0, Math.min(total, sentAt - this.shownAt)) });
    this.counts[chon]++;
    const s = this.siTu.get(e.id);
    if (s) {
      s.name = e.name;
      s.avatar = e.avatar || s.avatar;
    } else {
      this.siTu.set(e.id, {
        id: e.id,
        name: e.name,
        avatar: e.avatar,
        diem: 0,
        chuoi: 0,
        msDung: 0,
        vaoLuc: now,
        gain: 0,
        monDung: {},
      });
    }
    this.recent = [e.name, ...this.recent.filter((n) => n !== e.name)].slice(0, 5);
    return true;
  }

  tick(now: number) {
    this.chayQua(now);
    // giữa giờ (câu từ 15 giây) ông đồ giục 1 câu, đỡ im lặng
    if (this.phase === 'hoi' && !this.nhacDa && this.vong.giay >= 15 && now >= this.shownAt + this.vong.giay * 500) {
      this.nhacDa = true;
      this.events.push({ t: 'nhac' });
    }
    if (now < this.endsAt) return;
    switch (this.phase) {
      case 'cho':
        return this.batDau(now);
      case 'vong':
        return this.moQuay(now);
      case 'quay':
        return this.moCau(now);
      case 'doc':
        return this.docXong(now);
      case 'hoi':
        // hết giờ: khoá bài, trống dồn hồi hộp rồi mới công bố (chưa chấm để bảng điểm không lộ đáp án)
        this.phase = 'chot';
        this.endsAt = now + GAME.chotSec * 1000;
        this.events.push({ t: 'chot' });
        return;
      case 'chot':
        return this.chamCau(now);
      case 'dapAn':
        return this.sauDapAn(now);
      case 'bangVang':
        return this.idx < this.cauList.length ? this.moVong(now) : this.moVinhQuy(now);
      case 'vinhQuy':
        return this.cho(now);
    }
  }

  private chamCau(now: number) {
    const c = this.cau!;
    const v = this.vong;
    const total = v.giay * 1000;
    const nhan = this.laLatKeo ? GAME.latKeoNhan : 1;
    const mon = c.q.mon;
    const coDanhHieuMon = mon !== 'toan-nhanh';
    let treuSai: SiTu | null = null;
    const nhanh: { name: string; ms: number; diem: number }[] = [];
    for (const s of this.siTu.values()) s.gain = 0;
    for (const s of this.siTu.values()) {
      const a = this.answers.get(s.id);
      if (!a) {
        s.chuoi = 0; // bỏ câu thì mất chuỗi
        continue;
      }
      if (a.chon === c.ans) {
        let p = diemDung(v.diem, a.ms, total) * nhan;
        s.chuoi++;
        if (s.chuoi % GAME.chuoiMoi === 0) p += GAME.chuoiThuong;
        s.diem += p;
        s.gain = p;
        s.msDung += a.ms;
        s.saiLien = 0;
        if (coDanhHieuMon) {
          const cur = s.monDung[mon] ?? { so: 0, ms: 0 };
          cur.so += 1;
          cur.ms += a.ms;
          s.monDung[mon] = cur;
        }
        nhanh.push({ name: s.name, ms: a.ms, diem: p });
      } else {
        const tru = Math.min(s.diem, Math.round(v.diem * GAME.saiTru) * nhan);
        s.diem -= tru;
        s.gain = -tru;
        s.chuoi = 0;
        s.saiLien = (s.saiLien ?? 0) + 1;
        if (s.saiLien === 3 && !treuSai) treuSai = s;
      }
    }
    nhanh.sort((a, b) => a.ms - b.ms);
    this.ketQua = { soDung: nhanh.length, nhanh: nhanh.slice(0, 3) };
    if (treuSai) this.events.push({ t: 'saiLien', id: treuSai.id, name: treuSai.name });
    // đổi ngôi đầu bảng: hô tên người mới dẫn đầu (giãn cách vài câu cho đỡ lặp)
    const dau = this.bxh(1)[0];
    if (dau && dau.id !== this.dauTruoc) {
      if (this.dauTruoc && this.idx - this.dauBaoCau >= GAME.dauBangCach) {
        this.events.push({ t: 'dauBang', name: dau.name });
        this.dauBaoCau = this.idx;
      }
      this.dauTruoc = dau.id;
    }
    // phe miền đang thua (có người chơi, kém xa miền dẫn đầu): cổ vũ 5 câu 1 lần
    if (this.idx - this.mienBaoCau >= GAME.mienCach) {
      const ds = (Object.entries(this.diemMien()) as [Mien, { diem: number; nguoi: number }][]).filter(([, x]) => x.nguoi > 0);
      if (ds.length >= 2) {
        ds.sort((a, b) => a[1].diem - b[1].diem);
        if (ds[ds.length - 1][1].diem > ds[0][1].diem * 1.5) {
          this.events.push({ t: 'mienKem', mien: ds[0][0] });
          this.mienBaoCau = this.idx;
        }
      }
    }
    this.phase = 'dapAn';
    const sec = c.q.giaiThich ? GAME.dapAnGiaiThichSec : GAME.dapAnSec;
    this.endsAt = now + sec * 1000;
    this.events.push({
      t: 'dapAn',
      chu: 'ABCD'[c.ans],
      dap: c.opts[c.ans],
      soDung: nhanh.length,
      soNop: this.answers.size,
      nhanh: nhanh[0]?.name,
      msNhanh: nhanh[0]?.ms,
      giaiThich: c.q.giaiThich,
    });
  }

  private sauDapAn(now: number) {
    const vongCu = this.cau?.vong ?? 0;
    this.idx++;
    if (this.idx < this.cauList.length && this.cau!.vong === vongCu) return this.moQuay(now);
    this.phase = 'bangVang';
    this.endsAt = now + GAME.bangVangSec * 1000;
    this.events.push({ t: 'bangVang', vong: GAME.vong[vongCu].ten, dau: this.bxh(1)[0]?.name });
  }

  private moVinhQuy(now: number) {
    this.phase = 'vinhQuy';
    this.endsAt = now + GAME.vinhQuySec * 1000;
    const top = this.bxh(3);
    this.trangMoi = top[0]?.id ?? null;
    const mien = (Object.entries(this.diemMien()) as [Mien, { diem: number; nguoi: number }][])
      .filter(([, x]) => x.diem > 0)
      .sort((a, b) => b[1].diem - a[1].diem)[0];
    const trangMon = this.danhHieuMon().map((d) => ({ danhHieu: d.danhHieu, name: d.name }));
    this.events.push({
      t: 'vinhQuy',
      top: top.map((h) => h.name),
      mien: mien && { mien: mien[0], diem: mien[1].diem },
      trangMon,
    });
  }

  /**
   * Danh hiệu chuyên môn: mỗi môn (7 môn + Đố mẹo), ai đúng nhiều nhất (≥ 2 câu đúng,
   * bằng thì tổng thời gian trả lời đúng môn đó ngắn hơn, rồi ai vào trước) được phong Trạng môn đó.
   */
  danhHieuMon(): DanhHieuMon[] {
    const kq: DanhHieuMon[] = [];
    for (const mon of GAME.monDanhHieu) {
      const info = GAME.mon[mon];
      if (!info?.danhHieu) continue;
      let best: { s: SiTu; so: number; ms: number } | null = null;
      for (const s of this.siTu.values()) {
        const st = s.monDung[mon];
        if (!st || st.so < GAME.danhHieuMonToiThieu) continue;
        if (
          !best ||
          st.so > best.so ||
          (st.so === best.so && st.ms < best.ms) ||
          (st.so === best.so && st.ms === best.ms && s.vaoLuc < best.s.vaoLuc)
        ) {
          best = { s, so: st.so, ms: st.ms };
        }
      }
      if (best) {
        kq.push({
          mon,
          danhHieu: info.danhHieu,
          id: best.s.id,
          name: best.s.name,
          avatar: best.s.avatar,
          soDung: best.so,
          ms: best.ms,
        });
      }
    }
    return kq;
  }

  /** Bảng vàng: điểm cao trước; bằng điểm thì tổng thời gian đúng ngắn hơn, rồi ai vào trước */
  bxh(n = 20, caNguoiChuaDiem = false): Hang[] {
    return [...this.siTu.values()]
      .filter((s) => caNguoiChuaDiem || s.diem > 0 || s.gain !== 0)
      .sort((a, b) => b.diem - a.diem || a.msDung - b.msDung || a.vaoLuc - b.vaoLuc)
      .slice(0, n)
      .map((s, i) => ({
        hang: i + 1,
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        diem: s.diem,
        danhHieu: GAME.danhHieu(i + 1),
        gain: s.gain,
        gioi: this.gioiCua(s),
        mien: this.mienChon.get(s.id),
        chuoi: s.chuoi,
        trangTruoc: s.id === this.trangTruoc,
        dauTuan: !!s.id && this.tuan[0]?.id === s.id,
      }));
  }

  /** Tổng điểm ván này của từng phe miền */
  diemMien() {
    const kq = { bac: { diem: 0, nguoi: 0 }, trung: { diem: 0, nguoi: 0 }, nam: { diem: 0, nguoi: 0 } };
    for (const [id, m] of this.mienChon) {
      kq[m].nguoi++;
      kq[m].diem += this.siTu.get(id)?.diem ?? 0;
    }
    return kq;
  }

  /** Nam / nữ: người chơi tự chọn > đoán theo tên > cố định theo tài khoản */
  gioiCua(s: { id: string; name: string }): Gioi {
    return this.gioiChon.get(s.id) ?? doanGioi(s.name) ?? ([...s.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 2 ? 'nu' : 'nam');
  }

  /** Ảnh chụp cho màn hình (gửi cả sang trang điều khiển) */
  view(now: number) {
    const c = this.cau;
    const v = c ? GAME.vong[c.vong] : GAME.vong[0];
    const lo = this.phase === 'dapAn';
    const dangThiCau = ['quay', 'doc', 'hoi', 'chot', 'dapAn'].includes(this.phase);
    const ghe = this.bxh(GAME.soGhe, true);
    return {
      phase: this.phase,
      xemNenKy: this.xemNenKy,
      vong: c?.vong ?? 0,
      vongTen: v.ten,
      vongNhan: v.nhan,
      vongInfo: { cau: v.cau, giay: v.giay, diem: v.diem, tru: Math.round(v.diem * GAME.saiTru) },
      cauSo: this.idx + 1,
      tongCau: this.cauList.length || GAME.vong.reduce((n, x) => n + x.cau, 0),
      mon: (c?.q.mon ?? 'lich-su') as MonId,
      muc: (c?.q.muc ?? 1) as Muc,
      q: c?.q.q ?? '',
      opts: this.phase === 'hoi' || this.phase === 'chot' || lo ? c?.opts ?? [] : [],
      con: Math.max(0, Math.ceil((this.endsAt - now) / 1000)),
      conMs: Math.max(0, this.endsAt - now),
      tongGiay: v.giay,
      soNop: this.answers.size,
      counts: lo ? this.counts : null,
      dung: lo ? c?.ans ?? -1 : -1,
      ketQua: lo ? this.ketQua : null,
      giaiThich: lo ? (c?.q.giaiThich ?? null) : null,
      recent: this.recent,
      soSiTu: this.siTu.size,
      qua: this.qua && { id: this.qua.id, name: this.qua.name, avatar: this.qua.avatar, gift: this.qua.gift, count: this.qua.count, big: this.qua.big, at: this.qua.at },
      tuan: this.tuan,
      mien: this.diemMien(),
      latKeo: this.laLatKeo && dangThiCau,
      laTrangNguyen: this.laLatKeo && dangThiCau,
      cuu: c && c.vong === GAME.vong.length - 1 && dangThiCau
        ? { tim: Math.min(this.cuu.tim, GAME.cuuTroTim), can: GAME.cuuTroTim, loai: this.cuu.loai }
        : null,
      danhHieuMon: this.danhHieuMon(),
      ghe,
      treCon: this.treCon(ghe),
      top: this.bxh(this.phase === 'bangVang' || this.phase === 'vinhQuy' ? 20 : 10),
    };
  }
}

export type View = ReturnType<KyThi['view']>;

export interface Qua {
  id: string;
  name: string;
  avatar: string;
  gift: string;
  count: number;
  coins: number;
  big: boolean;
  at: number;
}
