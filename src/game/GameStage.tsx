import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameState } from './useGame';
import type { DanhHieuMon, Hang, View } from './thi';
import { GAME, type MonId, type Muc } from './config';
import { MonIcon } from './MonIcon';

// Tải trước cả 4 ảnh nền và đồ trang trí
const anhLoi = new Set<string>();
const anhTrangTriLoi = new Set<string>();
if (typeof window !== 'undefined') {
  GAME.nenKy.forEach((url) => {
    const img = new window.Image();
    img.src = url;
    img.onerror = () => {
      console.warn(`[GameStage] Không tải được ảnh nền "${url}", tự dùng nen2.jpg thay thế.`);
      anhLoi.add(url);
    };
  });
  GAME.trangTri?.forEach((item) => {
    const img = new window.Image();
    img.src = item.src;
    img.onerror = () => {
      console.warn(`[GameStage] Không tải được đồ trang trí "${item.src}", bỏ qua.`);
      anhTrangTriLoi.add(item.src);
    };
  });
}

function layAnhNenKy(ky: number): string {
  const url = GAME.nenKy[ky] || GAME.nenKy[0];
  if (anhLoi.has(url)) return GAME.nenKy[0];
  return url;
}

/**
 * Màn hình live 1080x1920 – Mùa 2: Trạng Nguyên Muôn Môn.
 * Vẽ đè lên ảnh nền 4 kỳ thi, giữ nguyên vùng an toàn:
 *   bảng đen x 218-862, y 518-850 · ông đồ x 0-215, y 556-922 · già làng x 870+, y 862+
 *   thẻ "Bạn có biết?" x 218-862, y 858-1000 (chỉ lúc công bố, không che ông đồ hay hàng ghế chính)
 *   các dãy bàn sĩ tử y 1055-1660 · bảng vàng nhỏ y 96-348 · băng rôn quà y 110-330
 */
const GOLD = '#d9a441';
const CREAM = '#fff1cc';
const PHAN = '#faf6ec'; // chữ phấn sáng rõ trên điện thoại
const PANEL = 'rgba(38,18,8,.82)';

export function GameStage({ game }: { game: GameState }) {
  const v = game.view;

  // Chọn ảnh nền theo kỳ thi hoặc theo nút xem trước
  let kyMucTieu = 0;
  if (v?.xemNenKy !== null && v?.xemNenKy !== undefined) {
    kyMucTieu = v.xemNenKy;
  } else if (!v || v.phase === 'cho') {
    kyMucTieu = 0;
  } else if (v.phase === 'vinhQuy') {
    kyMucTieu = 3;
  } else {
    kyMucTieu = Math.max(0, Math.min(3, v.vong ?? 0));
  }

  const targetBg = layAnhNenKy(kyMucTieu);
  const [currentBg, setCurrentBg] = useState(() => layAnhNenKy(0));
  const [prevBg, setPrevBg] = useState<string | null>(null);
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => {
    if (targetBg === currentBg) return;
    setPrevBg(currentBg);
    setCurrentBg(targetBg);
    setTransitionKey((k) => k + 1);
    const timer = setTimeout(() => setPrevBg(null), 1300);
    return () => clearTimeout(timer);
  }, [targetBg]);

  if (!v) return <div className="absolute inset-0" />;
  const bigBoard = v.phase === 'bangVang' || v.phase === 'vinhQuy';
  const dangThi = ['quay', 'doc', 'hoi', 'chot', 'dapAn'].includes(v.phase);
  const monInfo = GAME.mon[v.mon] ?? GAME.mon['lich-su'];
  const coBanCoBiet = v.phase === 'dapAn' && !!v.giaiThich;

  return (
    <div className="absolute inset-0 select-none" style={{ color: CREAM }}>
      {/* 2 lớp ảnh nền chuyển mờ dần 1.2 giây không nháy đen */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {prevBg && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('${prevBg}')`,
              backgroundSize: '1080px 1920px',
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
        <div
          key={transitionKey}
          className={`absolute inset-0 ${prevBg ? 'nen-chuyen-mo' : ''}`}
          style={{
            backgroundImage: `url('${currentBg}')`,
            backgroundSize: '1080px 1920px',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>

      <CayDa currentBg={currentBg} prevBg={prevBg} transitionKey={transitionKey} kyMucTieu={kyMucTieu} />
      <TrangTri kyMucTieu={kyMucTieu} />
      <DanLang />
      <SanThi v={v} />
      <TreCon ten={v.treCon} />

      {!bigBoard && <DongCau v={v} tieuDe={game.caiDat.tieuDe} />}

      {/* Khung bảng đen chính đổi sắc theo môn học (hoặc ánh vàng hoàng kim ở Câu Trạng Nguyên) */}
      {!bigBoard && (
        <div
          className="pointer-events-none absolute overflow-hidden rounded-[20px] border-[3px] transition-colors duration-500"
          style={{
            left: 218,
            top: 518,
            width: 644,
            height: 332,
            background: dangThi ? monInfo.nen : 'rgba(22, 11, 6, 0.80)',
            borderColor: v.laTrangNguyen ? '#ffd34d' : dangThi ? monInfo.mau : 'rgba(217, 164, 65, 0.7)',
            boxShadow: v.laTrangNguyen
              ? '0 0 38px rgba(255, 211, 77, 0.72), inset 0 0 28px rgba(255, 211, 77, 0.22)'
              : dangThi
              ? `0 8px 34px ${monInfo.glow}, inset 0 0 24px rgba(0, 0, 0, 0.48)`
              : '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.4)',
            zIndex: 2,
          }}
        >
          {/* Dải màu nhấn trên đỉnh khung theo môn */}
          <div
            className="h-[6px] w-full"
            style={{
              background: v.laTrangNguyen
                ? 'linear-gradient(90deg, #b45309, #fde047, #fff7cc, #fde047, #b45309)'
                : dangThi
                ? `linear-gradient(90deg, ${monInfo.mau}, ${monInfo.mauSang}, ${monInfo.mau})`
                : `linear-gradient(90deg, #8a5a18, ${GOLD}, #8a5a18)`,
            }}
          />
        </div>
      )}

      {!bigBoard && v.phase === 'quay' && <VongQuayMon v={v} />}
      {!bigBoard && v.phase !== 'quay' && <BangDen v={v} />}
      {!bigBoard && v.phase !== 'quay' && <DapAn v={v} />}

      {/* Khu dưới bảng đen: thẻ Bạn có biết (lúc công bố) hoặc Cứu trợ / Dòng nhắc + Tab kỳ */}
      {!bigBoard && coBanCoBiet && <TheBanCoBiet v={v} />}
      {!bigBoard && !coBanCoBiet && (
        <>
          <TabKy v={v} />
          {v.cuu && !v.ketQua ? <CuuTro v={v} /> : <DongNhac v={v} />}
        </>
      )}

      {!bigBoard && <BangNho v={v} />}

      <MC v={v} ten={game.caiDat.tenOngDo} />

      {/* Màn bảng lớn: tờ giấy dó phủ giữa sân */}
      {bigBoard && (
        <div className="absolute inset-0" style={{ zIndex: 2000 }}>
          <div
            className="absolute overflow-hidden rounded-[14px] border-4"
            style={{
              left: 60,
              top: 120,
              width: 960,
              height: 1340,
              borderColor: GOLD,
              background: 'radial-gradient(ellipse at 50% 40%,#fbf0d6 0%,#f3e2bb 75%,#ead39f 100%)',
            }}
          />
          <BangVang v={v} />
        </div>
      )}

      {(v.phase === 'vinhQuy' || v.qua?.big) && <PhaoGiay />}
      <BangQua v={v} />
    </div>
  );
}

// ---------------- Vòng quay môn học & Thang độ khó 5 mức ----------------

const MUC_COLORS = ['#4ade80', '#a3e635', '#facc15', '#fb923c', '#f87171'];

/** Thang độ khó 5 mức dạng 5 bậc sáng dần */
function ThangMuc({ muc, compact }: { muc: Muc; compact?: boolean }) {
  return (
    <div className="flex items-center gap-1.5" title={`Độ khó mức ${muc}/5`}>
      <div className="flex items-end gap-[3px]">
        {[1, 2, 3, 4, 5].map((lv) => {
          const on = lv <= muc;
          return (
            <span
              key={lv}
              className="rounded-sm"
              style={{
                width: compact ? 6 : 7,
                height: (compact ? 7 : 9) + lv * (compact ? 2.5 : 3.2),
                background: on ? MUC_COLORS[lv - 1] : 'rgba(255,255,255,0.18)',
                boxShadow: on ? `0 0 8px ${MUC_COLORS[lv - 1]}` : undefined,
              }}
            />
          );
        })}
      </div>
      <span className={`${compact ? 'text-[17px]' : 'text-[19px]'} font-extrabold tracking-wide text-[#ffe9a8]`}>
        MỨC {muc}/5
      </span>
    </div>
  );
}

/** Tạo cung tròn SVG cho 1 múi của vòng quay 8 môn (tâm 120,120 bán kính 112) */
function slicePath(i: number, n: number, r = 112, cx = 120, cy = 120) {
  const step = (2 * Math.PI) / n;
  // Múi 0 nằm chính giữa đỉnh 12 giờ (-90° = -PI/2)
  const a0 = -Math.PI / 2 - step / 2 + i * step;
  const a1 = a0 + step;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  return `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
}

/** Vòng quay môn học (~2s quay mượt + dừng ở môn trúng, chỉ dùng transform) */
function VongQuayMon({ v }: { v: View }) {
  const monInfo = GAME.mon[v.mon] ?? GAME.mon['lich-su'];
  const slices = GAME.monQuay;
  const targetIdx = slices.indexOf(v.mon as (typeof slices)[number]);
  const finalDeg = targetIdx >= 0 ? 1080 - targetIdx * (360 / slices.length) : 1080;

  return (
    <div
      className="absolute flex items-center justify-between px-5"
      style={{ left: 218, top: 524, width: 644, height: 324, zIndex: 12 }}
    >
      {/* Bên trái: Vòng quay 8 môn tròn kiểu gameshow */}
      <div className="relative flex h-[256px] w-[256px] shrink-0 items-center justify-center">
        {/* Mũi tên chỉ 12 giờ */}
        <div
          className="absolute left-1/2 top-[-8px] z-20 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '14px solid transparent',
            borderRight: '14px solid transparent',
            borderTop: '24px solid #fde047',
            filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.7))',
          }}
        />
        <motion.div
          key={`wheel-${v.cauSo}`}
          initial={{ rotate: 0 }}
          animate={{ rotate: finalDeg }}
          transition={{ duration: 1.75, ease: [0.12, 0.88, 0.2, 1] }}
          className="h-[244px] w-[244px]"
        >
          <svg viewBox="0 0 240 240" className="h-full w-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.65)]">
            <circle cx="120" cy="120" r="118" fill="#451a03" stroke={GOLD} strokeWidth="4" />
            {slices.map((id, i) => {
              const info = GAME.mon[id];
              const midAngle = -Math.PI / 2 + (i * 2 * Math.PI) / slices.length;
              const tx = 120 + 76 * Math.cos(midAngle);
              const ty = 120 + 76 * Math.sin(midAngle);
              return (
                <g key={id}>
                  <path d={slicePath(i, slices.length)} fill={info.wheelColor} stroke="#fde68a" strokeWidth="1.6" />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="24"
                  >
                    {info.emoji}
                  </text>
                </g>
              );
            })}
            {/* Tâm vòng quay */}
            <circle cx="120" cy="120" r="24" fill="url(#hubGrad)" stroke="#fef08a" strokeWidth="3" />
            <text x="120" y="121" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="900" fill="#4a1a0c">
              MÔN
            </text>
            <defs>
              <radialGradient id="hubGrad">
                <stop offset="0%" stopColor="#fff7cc" />
                <stop offset="100%" stopColor="#d97706" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Bên phải: Thẻ công bố môn trúng + bậc độ khó */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center pl-4 text-center">
        <div
          className={`rounded-full px-4 py-1 text-[19px] font-extrabold tracking-wider ${v.laTrangNguyen ? 'tn-shimmer' : ''}`}
          style={{
            background: v.laTrangNguyen ? 'linear-gradient(90deg,#f59e0b,#fde047,#f59e0b)' : 'rgba(255,255,255,.12)',
            color: v.laTrangNguyen ? '#4a1a0c' : '#ffe9a8',
          }}
        >
          {v.laTrangNguyen ? '👑 CÂU HỎI TRẠNG NGUYÊN ×2' : '🎯 VÒNG QUAY MÔN HỌC'}
        </div>

        <div className="mt-2 flex items-center gap-3 text-[20px] font-bold text-[#f5e7c4]">
          <span>CÂU {v.cauSo}/{v.tongCau}</span>
          <span>·</span>
          <ThangMuc muc={v.muc} compact />
        </div>

        <motion.div
          key={`mon-card-${v.cauSo}`}
          initial={{ scale: 0.72, opacity: 0.25, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 1.05, type: 'spring', stiffness: 360, damping: 18 }}
          className="mt-3 flex w-full flex-col items-center rounded-[18px] border-[3px] px-4 py-3"
          style={{
            borderColor: monInfo.mauSang,
            background: `linear-gradient(135deg, ${monInfo.mau}55, rgba(16,10,8,0.88))`,
            boxShadow: `0 0 26px ${monInfo.glow}`,
          }}
        >
          <div className="flex items-center gap-3">
            <MonIcon mon={v.mon} size={52} />
            <div className="text-left">
              <div className="text-[36px] font-extrabold leading-tight text-white">{monInfo.ten}</div>
              <div className="text-[19px] font-bold" style={{ color: monInfo.mauSang }}>
                {monInfo.danhHieu ? `Tranh danh hiệu ${monInfo.danhHieu}` : 'Thử thách nhẩm nhanh!'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ---------------- sân thi: sĩ tử ngồi bàn, có tên trên đầu ----------------

const HANG: [number, number, number[]][] = [
  [1418, 135, [380, 762, 217, 55, 945]],
  [1293, 110, [395, 714, 253, 866, 105]],
  [1575, 165, [369, 838, 159]],
  [1195, 100, [401, 691, 276, 820, 154, 947]],
  [1118, 88, [405, 672, 290, 790, 180, 905]],
  [1055, 80, [410, 655, 305, 760, 205, 865]],
];
const GHE = HANG.flatMap(([y, w, xs]) => xs.map((x) => ({ x, y, w }))).slice(0, GAME.soGhe);

const bam = (id: string) => [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

function SanThi({ v }: { v: View }) {
  const lo = v.phase === 'dapAn';
  const ds = v.ghe.map((h, i) => ({ h, g: GHE[i] })).filter((x) => x.g).sort((a, b) => a.g.y - b.g.y);
  return (
    <>
      {ds.map(({ h, g }) => (
        <SiTu key={h.id} h={h} x={g.x} y={g.y} w={g.w} lo={lo} />
      ))}
    </>
  );
}

function SiTu({ h, x, y, w, lo }: { h: Hang; x: number; y: number; w: number; lo: boolean }) {
  const full = w * 1.65;
  const hien = full * 0.56;
  const rong = full * 0.46;
  const lat = bam(h.id) % 2 === 1;
  const top3 = h.hang <= 3 && h.diem > 0;
  const goc = Math.max(16, Math.round(w * 0.18));
  const soChu = [...h.name].length + (top3 ? 2 : 0) + (h.chuoi >= 3 ? 2 : 0);
  const chu = Math.max(11, Math.min(goc, Math.floor((w * 1.25 - 16) / (soChu * 0.58))));
  const nhay = lo && h.gain > 0;
  return (
    <motion.div
      className="absolute"
      style={{ left: x - rong / 2, top: y - hien + w * 0.06, width: rong, zIndex: Math.round(y) }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: nhay ? [0, -w * 0.18, 0] : 0 }}
      transition={nhay ? { duration: 0.5, repeat: 2 } : { duration: 0.35 }}
    >
      <div
        className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full px-2 font-bold"
        style={{
          bottom: hien + 2,
          fontSize: chu,
          lineHeight: 1.25,
          maxWidth: w * 1.25,
          background: top3 ? 'linear-gradient(#ffd34d,#e8a33d)' : 'rgba(30,14,6,.82)',
          color: top3 ? '#4a1a0c' : CREAM,
          border: `2px solid ${top3 ? '#fff3c4' : 'rgba(217,164,65,.7)'}`,
        }}
      >
        {top3 && <span>{['👑', '🥈', '🥉'][h.hang - 1]}</span>}
        <span className="truncate">{h.name}</span>
        {h.chuoi >= 3 && <span className="shrink-0">🔥</span>}
      </div>
      <AnimatePresence>
        {lo && h.gain !== 0 && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-extrabold"
            style={{
              bottom: hien + chu * 1.6,
              fontSize: chu * 1.1,
              color: h.gain > 0 ? '#7dff9a' : '#ff8a80',
              textShadow: '0 2px 4px #000',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -6 }}
            exit={{ opacity: 0 }}
          >
            {h.gain > 0 ? `+${h.gain}` : h.gain}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="overflow-hidden" style={{ height: hien }}>
        <img
          src={`/assets/nv/lang/lung-${h.gioi === 'nu' ? 'nu' : 'nam'}.webp`}
          draggable={false}
          className="mx-auto block max-w-none"
          style={{ height: full, transform: lat ? 'scaleX(-1)' : undefined, filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.35))' }}
        />
      </div>
    </motion.div>
  );
}

const DAM_TRE = [
  { left: 470, dur: 13, delay: 0, nu: false },
  { left: 530, dur: 15.5, delay: -5, nu: true },
  { left: 500, dur: 11.5, delay: -8, nu: false },
  { left: 560, dur: 14, delay: -2.5, nu: true },
  { left: 485, dur: 16.5, delay: -11, nu: true },
  { left: 545, dur: 12.5, delay: -6.5, nu: false },
];
function TreCon({ ten }: { ten: string[] }) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1500 }}>
      {DAM_TRE.map((t, i) => (
        <div key={i} className="tre-chay absolute" style={{ left: t.left, top: 880, animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}>
          {ten[i] && (
            <div
              className="absolute bottom-full left-1/2 mb-1 max-w-[150px] -translate-x-1/2 truncate whitespace-nowrap rounded-full border-2 px-2 text-[17px] font-bold leading-[24px]"
              style={{ background: 'rgba(30,14,6,.82)', borderColor: 'rgba(217,164,65,.7)', color: CREAM }}
            >
              {ten[i]}
            </div>
          )}
          <div className="tre-lat" style={{ animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}>
            <img className="tre-nhun" src={`/assets/nv/lang/${t.nu ? 'tre-nu' : 'tre-nam'}.webp`} style={{ height: t.nu ? 118 : 128, animationDelay: `${i * -0.13}s` }} draggable={false} />
          </div>
        </div>
      ))}
    </div>
  );
}

const LA = Array.from({ length: 9 }, (_, i) => ({
  left: 40 + ((i * 113) % 1000),
  delay: i * 1.7,
  dur: 11 + (i % 4) * 2.5,
  size: 20 + (i % 3) * 7,
  mau: ['#6f8f2f', '#9aa83a', '#c9a23a', '#7c6a2b'][i % 4],
}));
function CayDa({ currentBg, prevBg, transitionKey, kyMucTieu }: { currentBg: string; prevBg: string | null; transitionKey: number; kyMucTieu: number }) {
  if (kyMucTieu >= 2) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      {prevBg && (
        <div className="absolute left-0 top-0" style={{ width: 1080, height: 380 }}>
          <div
            className="cay-rung absolute inset-0"
            style={{
              backgroundImage: `url('${prevBg}')`,
              backgroundSize: '1080px 1920px',
              backgroundPosition: 'top left',
              WebkitMaskImage: 'linear-gradient(#000 70%, transparent)',
              maskImage: 'linear-gradient(#000 70%, transparent)',
            }}
          />
        </div>
      )}
      <div key={transitionKey} className={`absolute left-0 top-0 ${prevBg ? 'nen-chuyen-mo' : ''}`} style={{ width: 1080, height: 380 }}>
        <div
          className="cay-rung absolute inset-0"
          style={{
            backgroundImage: `url('${currentBg}')`,
            backgroundSize: '1080px 1920px',
            backgroundPosition: 'top left',
            WebkitMaskImage: 'linear-gradient(#000 70%, transparent)',
            maskImage: 'linear-gradient(#000 70%, transparent)',
          }}
        />
      </div>
      {LA.map((l, i) => (
        <svg key={i} className="la-roi absolute" viewBox="0 0 20 30" style={{ left: l.left, top: -40, width: l.size, height: l.size * 1.5, animationDelay: `${l.delay}s`, animationDuration: `${l.dur}s` }}>
          <path d="M10 1 C17 8 18 20 10 29 C2 20 3 8 10 1 Z" fill={l.mau} />
          <path d="M10 3 L10 27" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
        </svg>
      ))}
    </div>
  );
}

function TrangTri({ kyMucTieu }: { kyMucTieu: number }) {
  const ds = (GAME.trangTri || []).filter(
    (item) => kyMucTieu >= item.ky && (!item.kyHet || kyMucTieu <= item.kyHet) && !anhTrangTriLoi.has(item.src),
  );
  if (ds.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      {ds.map((item) => (
        <div
          key={item.id}
          className="trang-tri-hien absolute"
          style={{ left: item.left, top: item.top, width: item.width, height: item.height, zIndex: item.zIndex || 6 }}
        >
          <div className="h-full w-full" style={{ transform: item.flipX ? 'scaleX(-1)' : undefined }}>
            <img src={item.src} className={`h-full w-full object-contain ${item.className || ''}`} draggable={false} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DanLang() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ong-quat.webp" style={{ left: 958, top: 872, height: 140 }} draggable={false} />
      <img className="cu-ngoi absolute" src="/assets/nv/lang/gia-lang.webp" style={{ left: 870, top: 862, height: 158, animationDelay: '1.3s' }} draggable={false} />
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ba-non.webp" style={{ left: 985, top: 1010, height: 130, animationDelay: '0.6s' }} draggable={false} />
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ba-cuoc.webp" style={{ left: 990, top: 1140, height: 150, animationDelay: '2s' }} draggable={false} />
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ong-gay.webp" style={{ left: 6, top: 930, height: 140, animationDelay: '0.9s' }} draggable={false} />
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ba-om-goi.webp" style={{ left: 0, top: 1080, height: 140, animationDelay: '1.7s' }} draggable={false} />
    </div>
  );
}

// ---------------- mái tranh, đồng hồ vòng tiến độ, bảng đen ----------------

function DongCau({ v, tieuDe }: { v: View; tieuDe: string }) {
  const showTimer = v.phase === 'hoi';
  const low = showTimer && v.con <= 5;
  const monInfo = GAME.mon[v.mon] ?? GAME.mon['lich-su'];
  const plank = { background: PANEL, borderColor: GOLD };
  const ratio = v.tongGiay > 0 ? Math.max(0, Math.min(1, v.con / v.tongGiay)) : 0;
  const r = 38;
  const C = 2 * Math.PI * r;
  return (
    <>
      <div className="absolute flex flex-col items-center justify-center gap-1 rounded-[14px] border-[3px] px-3" style={{ ...plank, left: 150, top: 362, width: 210, height: 78 }}>
        <span className="text-[28px] font-extrabold leading-none">{v.phase === 'cho' ? 'ĐỢI VÁN MỚI' : `CÂU ${Math.min(v.cauSo, v.tongCau)}/${v.tongCau}`}</span>
        <span className="flex gap-1.5">
          {GAME.vong.map((_, i) => (
            <span key={i} className="h-4 w-7 rounded-full" style={{ background: v.phase === 'cho' ? '#6b5236' : i < v.vong ? '#c8102e' : i === v.vong ? GOLD : '#6b5236' }} />
          ))}
        </span>
      </div>

      {/* Tên game treo giữa mái tranh */}
      <div
        className="absolute flex items-center justify-center gap-3 whitespace-nowrap rounded-[18px] px-3 text-center font-extrabold"
        style={{
          left: 372,
          top: 352,
          width: 540,
          height: 96,
          fontSize: Math.max(22, Math.min(42, Math.floor(410 / ([...tieuDe].length * (tieuDe === tieuDe.toUpperCase() ? 0.74 : 0.6))))),
          border: `4px double ${GOLD}`,
          outline: '2px solid #3a0d05',
          background: 'linear-gradient(#8a2a14,#4f1309)',
          color: '#ffd977',
          textShadow: '0 3px 0 #3a0d05, 0 0 16px rgba(255,211,77,.55)',
          boxShadow: '0 8px 22px rgba(0,0,0,.5), inset 0 0 18px rgba(255,200,90,.25)',
        }}
      >
        <span className="text-[34px]">🏮</span>
        <span className="truncate py-2" style={{ lineHeight: 1.45 }}>{tieuDe}</span>
        <span className="text-[34px]">🏮</span>
      </div>

      {/* Đồng hồ tròn có vòng tiến độ SVG */}
      {showTimer && (
        <motion.div
          key={low ? `${v.cauSo}-${v.con}` : v.cauSo}
          initial={low ? { scale: 1.28 } : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={low ? { type: 'spring', stiffness: 520, damping: 14 } : undefined}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            left: 758,
            top: 582,
            width: 92,
            height: 92,
            zIndex: 25,
            background: low ? 'radial-gradient(#b91c1c, #5c0a0a)' : 'radial-gradient(rgba(30,18,12,.95), rgba(14,8,6,.95))',
            boxShadow: low ? '0 0 26px rgba(239,68,68,.95)' : `0 6px 18px rgba(0,0,0,.55), 0 0 16px ${monInfo.glow}`,
          }}
        >
          <svg viewBox="0 0 92 92" className="absolute inset-0 -rotate-90">
            <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="7" />
            <circle
              cx="46"
              cy="46"
              r={r}
              fill="none"
              stroke={low ? '#fef08a' : monInfo.mauSang}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - ratio)}
              style={{ transition: 'stroke-dashoffset 0.25s linear' }}
            />
          </svg>
          <span className="relative text-[42px] font-extrabold tabular-nums" style={{ color: low ? '#fff7cc' : '#ffe9a8' }}>
            {v.con}
          </span>
        </motion.div>
      )}

      {/* Hết giờ: dấu đỏ đóng trên mái tranh */}
      <AnimatePresence>
        {v.phase === 'chot' && (
          <motion.div
            key={`chot-${v.cauSo}`}
            initial={{ scale: 2.6, rotate: -14, opacity: 0 }}
            animate={{ scale: 1, rotate: -6, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 520, damping: 16 }}
            className="absolute flex items-center justify-center rounded-[16px] border-[7px] text-[60px] font-extrabold tracking-wider"
            style={{
              left: 330,
              top: 352,
              width: 420,
              height: 104,
              zIndex: 20,
              borderColor: '#c8102e',
              color: '#c8102e',
              background: 'rgba(255,243,214,.96)',
              boxShadow: '0 8px 30px rgba(0,0,0,.45)',
            }}
          >
            HẾT GIỜ!
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Tab kỳ thi (hoặc Câu hỏi Trạng Nguyên ×2) phía dưới trái bảng đen */
function TabKy({ v }: { v: View }) {
  const tn = v.laTrangNguyen;
  return (
    <div
      className={`absolute flex items-center justify-center whitespace-nowrap rounded-[14px] border-[3px] px-2 font-extrabold ${tn ? 'tn-shimmer text-[17px]' : v.vongNhan.length > 9 ? 'text-[21px]' : 'text-[25px]'}`}
      style={{
        left: 220,
        top: 866,
        width: 206,
        height: 48,
        zIndex: 1700,
        borderColor: tn ? '#fff3c4' : GOLD,
        background: tn ? 'linear-gradient(#ffd34d,#c27803)' : 'linear-gradient(#7a2414,#561409)',
        color: tn ? '#4a1a0c' : '#ffd977',
        boxShadow: tn ? '0 0 28px rgba(255,211,77,.92)' : undefined,
      }}
    >
      {v.phase === 'cho' ? 'SẮP THI' : tn ? '👑 TRẠNG NGUYÊN ×2' : v.vongNhan}
    </div>
  );
}

/** Chữ phấn trên bảng đen: màn chờ / giới thiệu kỳ / thanh nhận diện môn + câu hỏi */
function BangDen({ v }: { v: View }) {
  const phan = { color: PHAN, textShadow: '0 2px 6px rgba(0,0,0,.55)' };
  const full = { left: 230, top: 530, width: 620, height: 312 };
  if (v.phase === 'cho') {
    return (
      <div className="absolute flex flex-col items-center justify-center text-center" style={{ ...full, ...phan, zIndex: 10 }}>
        <div className="rounded-full border border-amber-400/50 bg-amber-500/15 px-4 py-0.5 text-[20px] font-extrabold tracking-wide text-[#fde047]">
          MÙA 2 · TRẠNG NGUYÊN MUÔN MÔN
        </div>
        <div className="mt-2 text-[46px] font-extrabold leading-tight" style={{ color: '#ffe27a' }}>
          Ván mới sau {v.con} giây
        </div>
        <div className="mt-3 space-y-1 text-[26px] font-semibold leading-snug">
          <div>4 kỳ · 16 câu · 8 môn học · gõ A, B, C, D</div>
          <div>Giỏi môn nào phong Trạng môn đó (≥ 2 câu đúng)</div>
          <div>Gõ Bắc, Trung, Nam để thi đua 3 miền</div>
        </div>
      </div>
    );
  }
  if (v.phase === 'vong') {
    const i = v.vongInfo;
    const mucMin = GAME.vong[v.vong]?.muc[0] ?? 1;
    const mucMax = GAME.vong[v.vong]?.muc[GAME.vong[v.vong].muc.length - 1] ?? 5;
    return (
      <motion.div
        key={v.vongTen}
        initial={{ scale: 2.0, rotate: -6, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ ...full, ...phan, zIndex: 10 }}
      >
        <div className="text-[26px] font-bold tracking-wide opacity-85">Kỳ thi {v.vong + 1} / 4 · Mức khó {mucMin}–{mucMax}</div>
        <div className="text-[66px] font-extrabold leading-tight" style={{ color: '#ffe27a' }}>{v.vongTen}</div>
        <div className="mt-2 text-[29px] font-semibold">{i.cau} câu · {i.giay} giây mỗi câu</div>
        <div className="text-[29px] font-semibold">
          Đúng tới <b style={{ color: '#9dffb3' }}>+{i.diem}</b> · Sai <b style={{ color: '#ff8a80' }}>−{i.tru}</b>
        </div>
      </motion.div>
    );
  }

  const monInfo = GAME.mon[v.mon] ?? GAME.mon['lich-su'];
  const showTimer = v.phase === 'hoi';

  return (
    <>
      {/* Thanh nhận diện môn học + thang độ khó 5 mức ở đầu bảng đen */}
      <div
        className="absolute flex items-center justify-between px-3"
        style={{ left: 226, top: 528, width: 628, height: 42, zIndex: 12 }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full border-2 px-3 py-0.5"
            style={{
              borderColor: monInfo.mauSang,
              background: `${monInfo.mau}55`,
              boxShadow: `0 0 12px ${monInfo.glow}`,
            }}
          >
            <MonIcon mon={v.mon} size={26} />
            <span className="text-[21px] font-extrabold uppercase tracking-wide text-white">{monInfo.ten}</span>
          </div>
          {v.laTrangNguyen && (
            <span className="tn-shimmer rounded-full border-2 border-[#fff3c4] bg-gradient-to-r from-[#f59e0b] to-[#fde047] px-2.5 py-0.5 text-[17px] font-black text-[#4a1a0c]">
              👑 TRẠNG NGUYÊN ×2
            </span>
          )}
        </div>
        <ThangMuc muc={v.muc} />
      </div>

      {/* Câu hỏi */}
      <motion.div
        key={`q-${v.cauSo}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="absolute flex flex-col items-center justify-center overflow-hidden px-3 text-center"
        style={{
          left: 230,
          top: 574,
          width: showTimer ? 520 : 616,
          height: 134,
          ...phan,
          zIndex: 10,
        }}
      >
        <div
          className={`${
            v.q.length > 76
              ? 'text-[27px] leading-[1.22]'
              : v.q.length > 50
              ? 'text-[31px] leading-[1.24]'
              : 'text-[36px] leading-[1.25]'
          } font-extrabold`}
        >
          {v.q}
        </div>
        {v.phase === 'doc' && (
          <div className="mt-1.5 text-[21px] font-bold" style={{ color: monInfo.mauSang }}>
            🎙️ Ông đồ đang đọc đề…
          </div>
        )}
      </motion.div>
    </>
  );
}

/** 4 ô đáp án mang sắc màu môn học, hiệu ứng bật mở kiểu gameshow */
function DapAn({ v }: { v: View }) {
  if (v.phase === 'cho' || v.phase === 'vong') return null;
  const monInfo = GAME.mon[v.mon] ?? GAME.mon['lich-su'];
  const total = v.counts ? v.counts.reduce((a, b) => a + b, 0) : 0;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const text = v.opts[i];
        const right = v.dung === i;
        const loai = !!v.cuu?.loai.includes(i);
        const dim = (v.dung >= 0 && !right) || loai;
        const pct = v.counts && total ? Math.round((v.counts[i] / total) * 100) : 0;
        return (
          <motion.div
            key={`${v.cauSo}-${i}`}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{
              opacity: text ? (dim ? 0.42 : 1) : 0.28,
              y: 0,
              scale: right ? 1.04 : 1,
              x: dim && v.dung >= 0 ? [0, -6, 6, -4, 4, 0] : 0,
            }}
            transition={{ delay: text && v.phase === 'hoi' ? i * 0.08 : 0, x: { duration: 0.4, delay: 0.4 } }}
            className="absolute flex flex-col justify-center rounded-[13px] border-[3px] px-2.5"
            style={{
              left: i % 2 ? 546 : 234,
              top: i < 2 ? 714 : 778,
              width: 300,
              height: 58,
              borderStyle: right || text ? 'solid' : 'dashed',
              borderColor: right ? '#86efac' : text ? `${monInfo.mauSang}aa` : 'rgba(245,241,230,.38)',
              background: right
                ? 'linear-gradient(135deg, rgba(22,163,74,.68), rgba(21,128,61,.55))'
                : text
                ? `linear-gradient(135deg, ${monInfo.mau}2b, rgba(14,10,8,.55))`
                : 'rgba(255,255,255,.04)',
              color: PHAN,
              boxShadow: right ? '0 0 26px rgba(134,239,172,.78)' : undefined,
              zIndex: 10,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[22px] font-black"
                style={{
                  background: right ? '#fef08a' : monInfo.mau,
                  color: right ? '#14532d' : '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,.4)',
                }}
              >
                {'ABCD'[i]}
              </span>
              <span className={`${(text?.length ?? 0) > 16 ? 'text-[21px]' : 'text-[25px]'} truncate font-bold ${loai ? 'line-through opacity-55' : ''}`}>
                {text ?? '…'}
              </span>
              {loai && <span className="ml-auto text-[22px]">✂️</span>}
              {v.counts && <span className="ml-auto shrink-0 text-[20px] font-extrabold text-[#fef08a]">{pct}%</span>}
            </div>
            {v.counts && (
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/45">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: right ? '#86efac' : '#f87171' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 1.2 }}
                />
              </div>
            )}
            {right && <div className="nhap-nhay pointer-events-none absolute -inset-[3px] rounded-[13px]" />}
          </motion.div>
        );
      })}
    </>
  );
}

/** Thẻ "Bạn có biết?" hiện ngay dưới bảng đen lúc công bố đáp án (không che ông đồ hay hàng sĩ tử chính) */
function TheBanCoBiet({ v }: { v: View }) {
  const monInfo = GAME.mon[v.mon] ?? GAME.mon['lich-su'];
  const kq = v.ketQua;
  const tomTat = kq
    ? kq.soDung > 0
      ? `✅ ${kq.soDung} đúng · ${kq.nhanh[0].name} ${(kq.nhanh[0].ms / 1000).toFixed(1).replace('.', ',')}s`
      : '😮 Chưa ai đúng câu này'
    : '';

  return (
    <motion.div
      key={`gt-${v.cauSo}`}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="absolute overflow-hidden rounded-[18px] border-[3px] px-4 py-2.5"
      style={{
        left: 218,
        top: 858,
        width: 644,
        zIndex: 1800,
        borderColor: monInfo.mauSang,
        background: 'linear-gradient(135deg, rgba(24,14,10,0.94), rgba(38,20,12,0.92))',
        boxShadow: `0 10px 28px rgba(0,0,0,.62), 0 0 22px ${monInfo.glow}`,
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-1">
        <div className="flex items-center gap-1.5 text-[22px] font-extrabold text-[#fde047]">
          <span>💡</span>
          <span>BẠN CÓ BIẾT?</span>
        </div>
        {tomTat && (
          <div className="truncate rounded-full bg-white/10 px-3 py-0.5 text-[19px] font-bold text-[#fef3c7]">
            {tomTat}
          </div>
        )}
      </div>
      <div className="mt-1.5 text-[24px] font-bold leading-snug text-[#fff8e7]">
        {v.giaiThich}
      </div>
    </motion.div>
  );
}

/** Dải dưới chân bảng đen: cách chơi, số người đã nộp, tên vừa nộp */
function DongNhac({ v }: { v: View }) {
  const kq = v.ketQua;
  const noi = kq
    ? kq.soDung > 0
      ? `✅ ${kq.soDung} người đúng · nhanh nhất ${kq.nhanh[0].name} ${(kq.nhanh[0].ms / 1000).toFixed(2).replace('.', ',')}s`
      : '😮 Chưa ai đúng câu này'
    : v.phase === 'hoi'
    ? `📜 ${v.recent.length ? `${v.recent.slice(0, 3).join(', ')} vừa nộp · ` : ''}${v.soNop} sĩ tử đã nộp`
    : 'Gõ A, B, C, D trả lời · Bắc, Trung, Nam chọn phe';
  return (
    <div className="absolute flex items-center justify-center" style={{ left: 432, top: 868, width: 430, height: 46, zIndex: 1700 }}>
      <div className="max-w-full truncate rounded-full border-2 px-4 text-[21px] font-bold leading-[40px]" style={{ background: PANEL, borderColor: GOLD }}>
        {noi}
      </div>
    </div>
  );
}

/** Thi Đình: cả phòng thả tim, đủ thì ông đồ loại 2 đáp án sai */
function CuuTro({ v }: { v: View }) {
  const c = v.cuu!;
  const xong = c.loai.length > 0;
  return (
    <div className="absolute flex items-center gap-3 rounded-full border-2 px-5" style={{ left: 432, top: 868, width: 428, height: 46, zIndex: 1700, background: PANEL, borderColor: GOLD }}>
      <span className="shrink-0 text-[22px] font-bold">{xong ? '✂️ Đã loại 2 câu sai!' : '❤️ Thả tim cứu trợ'}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-black/40">
        <motion.div
          className="h-full rounded-full"
          style={{ background: xong ? 'linear-gradient(90deg,#2f7d3a,#7dff9a)' : 'linear-gradient(90deg,#c8102e,#ff6f91)' }}
          animate={{ width: `${(c.tim / c.can) * 100}%` }}
        />
      </div>
      {!xong && <span className="shrink-0 text-[22px] font-bold tabular-nums">{c.tim}/{c.can}</span>}
    </div>
  );
}

// ---------------- bảng vàng, quà, vinh quy, danh hiệu môn ----------------

const MANH = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 137) % 1080,
  delay: (i % 10) * 0.35,
  dur: 3.2 + ((i * 7) % 10) / 5,
  w: 14 + (i % 3) * 6,
  color: ['#c8102e', '#ffd34d', '#e8a33d', '#ff5a3c'][i % 4],
}));
function PhaoGiay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 3000 }}>
      {MANH.map((m, i) => (
        <div key={i} className="phao-giay absolute top-0" style={{ left: m.left, width: m.w, height: m.w * 0.6, background: m.color, animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s` }} />
      ))}
    </div>
  );
}

const crown = (h: number) => (h === 1 ? '👑' : h === 2 ? '🥈' : h === 3 ? '🥉' : `${h}.`);

const MIEN = {
  bac: { chu: 'B', ten: 'Bắc', mau: '#e53935' },
  trung: { chu: 'T', ten: 'Trung', mau: '#e0a019' },
  nam: { chu: 'N', ten: 'Nam', mau: '#2e9e4f' },
} as const;

function DauHieu({ h }: { h: Hang }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-[22px]">
      {h.dauTuan && <span>🏆</span>}
      {h.trangTruoc && <span>🎓</span>}
      {h.chuoi >= 3 && <span className="font-extrabold text-[#ff6b4a]">🔥{h.chuoi}</span>}
      {h.mien && (
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-[17px] font-extrabold text-white" style={{ background: MIEN[h.mien].mau }}>
          {MIEN[h.mien].chu}
        </span>
      )}
    </span>
  );
}

function DiemMien({ v, big }: { v: View; big?: boolean }) {
  const ds = (Object.keys(MIEN) as (keyof typeof MIEN)[]).map((k) => ({ k, ...v.mien[k] }));
  if (!ds.some((x) => x.nguoi)) return null;
  const max = Math.max(...ds.map((x) => x.diem));
  return (
    <span className={`flex items-center gap-3 ${big ? 'text-[28px]' : 'text-[22px]'} font-bold`}>
      {ds.map((x) => (
        <span key={x.k} className="flex items-center gap-1" style={{ color: MIEN[x.k].mau }}>
          {x.diem === max && max > 0 && '👑'}
          {MIEN[x.k].ten} {x.diem.toLocaleString('vi-VN')}
        </span>
      ))}
    </span>
  );
}

function Dong({ h, big, sang }: { h: Hang; big?: boolean; sang?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${big ? 'text-[28px]' : 'text-[25px]'} font-bold leading-[1.25]`}>
      <span className="w-11 shrink-0 text-center">{crown(h.hang)}</span>
      <span className="min-w-0 flex-1 truncate">{h.name}</span>
      <DauHieu h={h} />
      <AnimatePresence>
        {h.gain !== 0 && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="shrink-0 text-[22px] font-extrabold"
            style={{ color: h.gain > 0 ? (sang ? '#1e6b2a' : '#7dff9a') : sang ? '#b3200c' : '#ff8a80' }}
          >
            {h.gain > 0 ? `+${h.gain}` : h.gain}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="w-[86px] shrink-0 text-right tabular-nums">{h.diem}</span>
    </div>
  );
}

function BangNho({ v }: { v: View }) {
  const box = { left: 90, top: 96, width: 900, height: 252, background: PANEL, borderColor: GOLD };
  if (v.phase === 'cho' && v.tuan.length) {
    return (
      <div className="absolute rounded-[18px] border-[3px] px-5 py-2" style={box}>
        <div className="flex items-baseline justify-between">
          <span className="text-[26px] font-extrabold text-[#ffd977]">🏆 BẢNG VÀNG TUẦN</span>
          <span className="text-[22px] font-semibold opacity-75">cộng điểm mọi ván</span>
        </div>
        <div className="grid grid-cols-2 gap-x-8">
          {v.tuan.slice(0, 10).map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[25px] font-bold leading-[1.25]">
              <span className="w-11 shrink-0 text-center">{crown(i + 1)}</span>
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              <span className="shrink-0 tabular-nums">{t.diem.toLocaleString('vi-VN')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const top = v.top.slice(0, 10);
  return (
    <div className="absolute rounded-[18px] border-[3px] px-5 py-2" style={box}>
      <div className="flex items-baseline justify-between">
        <span className="text-[26px] font-extrabold text-[#ffd977]">🏮 BẢNG VÀNG</span>
        {v.mien.bac.nguoi + v.mien.trung.nguoi + v.mien.nam.nguoi ? <DiemMien v={v} /> : <span className="text-[22px] font-semibold opacity-75">{v.soSiTu} sĩ tử</span>}
      </div>
      {top.length === 0 ? (
        <div className="mt-6 text-center text-[26px] font-semibold opacity-75">
          {v.soSiTu ? 'Chưa ai có điểm. Trả lời đúng để lên bảng!' : 'Chưa ai ghi danh. Gõ đáp án để vào sân thi!'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-8">
          {top.map((h) => (
            <Dong key={h.id} h={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function BangQua({ v }: { v: View }) {
  const q = v.qua;
  return (
    <AnimatePresence>
      {q && (
        <motion.div
          key={q.at}
          initial={{ y: -260, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -260, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="absolute flex items-center gap-6 rounded-[28px] border-[5px] px-8"
          style={{
            left: 70,
            top: 110,
            width: 940,
            height: 220,
            zIndex: 3100,
            borderColor: GOLD,
            background: q.big ? 'linear-gradient(135deg,#ffd34d,#e8a33d 55%,#b8741c)' : 'linear-gradient(135deg,#8a1c0c,#5a1409)',
            color: q.big ? '#4a1a0c' : CREAM,
            boxShadow: q.big ? '0 0 50px rgba(255,211,77,.8)' : '0 10px 30px rgba(0,0,0,.45)',
          }}
        >
          <Avatar h={{ name: q.name, avatar: q.avatar }} size={150} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[54px] font-extrabold leading-tight">{q.name}</div>
            <div className="truncate text-[36px] font-bold">
              tặng {q.count > 1 ? `${q.count} × ` : ''}
              {q.gift} 🎁
            </div>
            <div className="text-[28px] font-semibold opacity-85">{q.big ? 'Ông đồ vái tạ ơn tấm lòng!' : 'Ông đồ cảm ơn nhé!'}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Danh sách huy hiệu Trạng chuyên môn (hiện ở cả Bảng Vàng và Vinh Quy) */
function BangDanhHieuMon({ ds, vinh }: { ds: DanhHieuMon[]; vinh?: boolean }) {
  if (!ds.length) return null;
  return (
    <div
      className={`rounded-[16px] border-2 px-4 ${vinh ? 'mt-2 py-3' : 'mt-3 py-2'}`}
      style={{
        borderColor: '#c99335',
        background: 'rgba(138, 28, 12, 0.08)',
      }}
    >
      <div className={`text-center font-extrabold text-[#8a1c0c] ${vinh ? 'text-[26px]' : 'text-[22px]'}`}>
        🏅 {vinh ? 'PHONG TRẠNG CHUYÊN MÔN' : 'DẪN ĐẦU CHUYÊN MÔN (≥ 2 CÂU ĐÚNG)'}
      </div>
      <div className={`mt-2 grid ${ds.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
        {ds.slice(0, 8).map((d) => {
          const info = GAME.mon[d.mon as MonId];
          return (
            <div
              key={d.mon}
              className="flex items-center gap-2 rounded-xl border-2 px-3 py-1.5"
              style={{
                borderColor: info.mau,
                background: 'rgba(255, 250, 238, 0.92)',
              }}
            >
              <MonIcon mon={d.mon} size={vinh ? 30 : 24} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-[18px] font-extrabold" style={{ color: info.mau }}>
                  {d.danhHieu}
                </div>
                <div className="truncate text-[21px] font-extrabold text-[#3d1609]">
                  {d.name}
                </div>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[16px] font-extrabold text-white"
                style={{ background: info.mau }}
              >
                {d.soDung} đúng
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Bảng vàng lớn trên tờ giấy dó: hết mỗi kỳ thi (top 20 + danh hiệu môn) và vinh quy (tam khôi + phong Trạng môn + bảng) */
function BangVang({ v }: { v: View }) {
  const vinh = v.phase === 'vinhQuy';
  const [tn, bn, th] = v.top;
  const coMon = v.danhHieuMon.length > 0;
  const rest = vinh ? v.top.slice(3, coMon ? 9 : 11) : v.top.slice(0, coMon ? 12 : 20);

  return (
    <div className="absolute" style={{ left: 100, top: 146, width: 880, height: 1290, color: '#4a1a0c' }}>
      <div className={`text-center ${vinh ? 'text-[40px] italic' : 'text-[44px]'} font-extrabold text-[#8a1c0c]`}>
        {vinh ? '“Hiền tài là nguyên khí của quốc gia”' : `BẢNG VÀNG SAU ${v.vongTen.toUpperCase()}`}
      </div>
      <div className="mt-1 flex justify-center">
        <DiemMien v={v} big />
      </div>

      {vinh && tn && (
        <div className="relative mt-1" style={{ height: coMon ? 535 : 680 }}>
          {bn && <TamKhoi h={bn} left={20} top={coMon ? 125 : 170} imgH={coMon ? 315 : 400} delay={0.5} />}
          {th && <TamKhoi h={th} left={600} top={coMon ? 125 : 170} imgH={coMon ? 315 : 400} delay={0.9} />}
          <TamKhoi h={tn} left={270} top={0} imgH={coMon ? 415 : 540} delay={0.1} big />
        </div>
      )}
      {vinh && !tn && <div className="mt-24 text-center text-[36px] font-bold">Ván này chưa có sĩ tử nào</div>}

      {/* Huy hiệu Trạng chuyên môn ở cả Bảng vàng và Vinh quy */}
      {coMon && <BangDanhHieuMon ds={v.danhHieuMon} vinh={vinh} />}

      <div className={`mt-3 grid grid-cols-2 gap-x-8 gap-y-1 ${vinh ? 'border-t-2 border-[#c9a46a] pt-3' : ''}`}>
        {rest.map((h, i) => (
          <motion.div key={h.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
            <Dong h={h} sang />
            <div className="pl-12 text-[19px] font-semibold opacity-70">{h.danhHieu}</div>
          </motion.div>
        ))}
      </div>

      {!vinh && v.top.length === 0 && <div className="mt-24 text-center text-[34px] font-bold">Chưa ai ghi danh</div>}
      {!vinh && v.phase === 'bangVang' && v.cauSo <= v.tongCau && (
        <div className="absolute inset-x-0 bottom-0 text-center text-[29px] font-bold opacity-80">
          Người mới vào vẫn kịp thi kỳ sau!
        </div>
      )}
    </div>
  );
}

function Avatar({ h, size }: { h: { name: string; avatar: string }; size: number }) {
  const box = { width: size, height: size, borderColor: GOLD };
  return h.avatar ? (
    <img src={h.avatar} referrerPolicy="no-referrer" className="shrink-0 rounded-full border-[3px] object-cover" style={box} draggable={false} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full border-[3px] bg-[#8a1c0c] font-extrabold text-[#ffe9a8]" style={{ ...box, fontSize: size * 0.45 }}>
      {[...h.name][0]?.toUpperCase()}
    </span>
  );
}

function TamKhoi({ h, left, top, imgH, delay, big }: { h: Hang; left: number; top: number; imgH: number; delay: number; big?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.72 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.45, delay }}
      className="absolute flex flex-col items-center"
      style={{ left, top, width: big ? 340 : 260 }}
    >
      <img src={`/assets/nv/top/top${h.hang}-${h.gioi}.webp`} style={{ height: imgH, filter: 'drop-shadow(0 10px 12px rgba(0,0,0,.35))' }} draggable={false} />
      <div className="mt-1 flex w-full items-center justify-center gap-2">
        <Avatar h={h} size={big ? 58 : 44} />
        <span className={`${big ? 'text-[36px]' : 'text-[28px]'} min-w-0 truncate font-extrabold text-[#8a1c0c]`}>{h.name}</span>
      </div>
      <div className={`${big ? 'text-[26px]' : 'text-[22px]'} font-bold`}>{h.diem} điểm</div>
    </motion.div>
  );
}

/** Ông đồ đứng cạnh bảng đen, bên trái trước gốc đa; đổi tư thế theo pha */
function MC({ v, ten }: { v: View; ten: string }) {
  const pose =
    v.phase === 'vinhQuy' ? 'mung'
    : v.phase === 'dapAn' ? (v.ketQua?.soDung ? 'mung' : 'tiec')
    : v.phase === 'hoi' ? 'suy-nghi'
    : v.phase === 'doc' || v.phase === 'quay' || v.phase === 'bangVang' ? 'chi'
    : 'cuoi';
  return (
    <div className="pointer-events-none absolute" style={{ left: -24, top: 562, height: 360, zIndex: 1100 }}>
      <div
        className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border-2 px-3 text-[22px] font-extrabold leading-[34px]"
        style={{ background: 'linear-gradient(#ffd34d,#e8a33d)', borderColor: '#fff3c4', color: '#4a1a0c', boxShadow: '0 3px 8px rgba(0,0,0,.4)' }}
      >
        🖌️ {ten}
      </div>
      <AnimatePresence mode="popLayout">
        <motion.img
          key={pose}
          src={`/assets/nv/mc/${pose}.webp`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ height: 360, filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.45))' }}
          draggable={false}
        />
      </AnimatePresence>
    </div>
  );
}
