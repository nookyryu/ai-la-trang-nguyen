import { useEffect, useMemo, useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import { GAME, type Muc } from './config';
import { thongKeNganHang } from './nganHang';

const HO = ['Minh', 'Lan', 'Tuấn', 'Hoa', 'Long', 'Thảo', 'Nam', 'Vy', 'Khánh', 'An', 'Bình', 'Trang', 'Hùng', 'My', 'Phúc'];

/** Giả lập n người gõ đáp án trong vài giây (chỉ để thử, không cần live) */
function giaLap(n: number, trongMs: number) {
  for (let i = 0; i < n; i++) {
    const id = Math.floor(Math.random() * 100_000);
    setTimeout(() => {
      emitTest('chat', {
        username: `situ${id}`,
        nickname: `${HO[id % HO.length]}_${id % 1000}`,
        comment: 'ABCD'[Math.floor(Math.random() * 4)],
        createTime: Date.now() - 300 - Math.random() * 800,
      });
    }, Math.random() * trongMs);
  }
}

const MUCS: Muc[] = [1, 2, 3, 4, 5];

/** Nút riêng của game trên trang điều khiển */
export function GameControls() {
  const btn = 'rounded-xl px-4 py-2 font-semibold';
  const [tieuDe, setTieuDe] = useState('');
  const [tenOngDo, setTenOngDo] = useState('');
  const [daLuu, setDaLuu] = useState('');
  const [dangXemNen, setDangXemNen] = useState<string | null>(null);
  const [moBangCau, setMoBangCau] = useState(true);

  const thongKe = useMemo(() => thongKeNganHang(), []);

  const chonXemNen = (ky: string) => {
    sendControl('custom', `xemNen:${ky}`);
    setDangXemNen(ky === 'auto' ? null : ky);
  };

  useEffect(() => {
    if (!dangXemNen) return;
    const t = setTimeout(() => setDangXemNen(null), 20_000);
    return () => clearTimeout(t);
  }, [dangXemNen]);

  useEffect(() => {
    fetch('/api/cai-dat').then((r) => r.json()).then((c) => {
      setTieuDe(c.tieuDe ?? '');
      setTenOngDo(c.tenOngDo ?? '');
    }).catch(() => {});
  }, []);

  const luu = async () => {
    const r = await fetch('/api/cai-dat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tieuDe, tenOngDo }) });
    setDaLuu(r.ok ? 'Đã lưu, màn hình đổi ngay' : 'Lưu không được');
  };

  const o = 'w-full rounded-lg bg-black/40 px-3 py-2 text-white outline-none ring-1 ring-white/15 focus:ring-amber-400';

  return (
    <div className="space-y-3 rounded-2xl bg-white/5 p-4">
      <div className="font-bold text-amber-300">Ai Là Trạng Nguyên – Mùa 2: Trạng Nguyên Muôn Môn</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm text-white/70">
          Chữ trên mái tranh (tối đa 30 ký tự)
          <input className={o} value={tieuDe} maxLength={30} placeholder={GAME.tieuDeMacDinh} onChange={(e) => setTieuDe(e.target.value)} />
        </label>
        <label className="text-sm text-white/70">
          Tên ông đồ (bảng tên trên đầu)
          <input className={o} value={tenOngDo} maxLength={30} placeholder={GAME.tenOngDoMacDinh} onChange={(e) => setTenOngDo(e.target.value)} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button className={`${btn} bg-emerald-700 text-white`} onClick={luu}>💾 Lưu tên</button>
        <span className="text-sm text-white/60">{daLuu || 'Để trống là dùng tên mặc định'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className={`${btn} bg-amber-600 text-white`}
          onClick={() => {
            setDangXemNen(null);
            sendControl('custom', 'batdau');
          }}
        >
          ▶ Bắt đầu ván mới ngay
        </button>
        <button className={`${btn} bg-red-800 text-white`} onClick={() => sendControl('custom', 'bocau')}>
          🚫 Bỏ câu này
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-white/80">
        <span className="text-white/60">Xem nền:</span>
        <button className="rounded-lg bg-stone-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-600" onClick={() => chonXemNen('0')}>
          Kỳ 1 (Làng)
        </button>
        <button className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700" onClick={() => chonXemNen('1')}>
          Kỳ 2 (Hương)
        </button>
        <button className="rounded-lg bg-orange-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700" onClick={() => chonXemNen('2')}>
          Kỳ 3 (Hội)
        </button>
        <button className="rounded-lg bg-purple-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-800" onClick={() => chonXemNen('3')}>
          Kỳ 4 (Đình)
        </button>
        <button className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700" onClick={() => chonXemNen('auto')}>
          Tự động
        </button>
        {dangXemNen !== null && (
          <span className="text-xs italic text-amber-300">(Đang xem trước, tự trở lại sau 20 giây)</span>
        )}
      </div>
      <div className="text-sm text-white/60">Giả lập (bấm lúc đang hiện 4 đáp án):</div>
      <div className="flex flex-wrap gap-2">
        <button className={`${btn} bg-white/10 text-white`} onClick={() => giaLap(1, 500)}>1 người</button>
        <button className={`${btn} bg-white/10 text-white`} onClick={() => giaLap(60, 6000)}>60 người</button>
        <button className={`${btn} bg-white/10 text-white`} onClick={() => giaLap(500, 8000)}>500 người</button>
      </div>

      {/* Bảng xem / đếm câu theo Môn × Mức */}
      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
        <button
          type="button"
          onClick={() => setMoBangCau((x) => !x)}
          className="flex w-full items-center justify-between text-left text-sm font-bold text-amber-200"
        >
          <span>
            📚 Kho câu hỏi: {thongKe.tongMoi} câu mới · {thongKe.tongCu.toLocaleString('vi-VN')} câu dự phòng
          </span>
          <span className="text-xs text-white/60">{moBangCau ? '▲ Thu gọn' : '▼ Mở xem'}</span>
        </button>
        {moBangCau && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs text-white/85">
              <thead>
                <tr className="border-b border-white/10 text-white/60">
                  <th className="py-1 pr-2">Môn</th>
                  {MUCS.map((m) => (
                    <th key={m} className="px-1.5 py-1 text-center">M{m}</th>
                  ))}
                  <th className="px-2 py-1 text-right text-emerald-300">Mới</th>
                  <th className="pl-2 py-1 text-right text-white/50">Dự phòng</th>
                </tr>
              </thead>
              <tbody>
                {thongKe.ds.map((row) => {
                  const info = GAME.mon[row.mon];
                  return (
                    <tr key={row.mon} className="border-b border-white/5 last:border-0">
                      <td className="py-1 pr-2 font-semibold whitespace-nowrap">
                        <span className="mr-1">{info.emoji}</span>
                        <span style={{ color: info.mauSang }}>{info.ten}</span>
                      </td>
                      {MUCS.map((m) => {
                        const n = row.moi[m];
                        const skip = row.mon === 'do-meo' && m < 3;
                        return (
                          <td
                            key={m}
                            className={`px-1.5 py-1 text-center tabular-nums ${
                              skip ? 'text-white/25' : n >= 12 ? 'text-emerald-300 font-semibold' : 'text-amber-300'
                            }`}
                          >
                            {skip ? '–' : n}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 text-right font-bold tabular-nums text-emerald-300">{row.tongMoi}</td>
                      <td className="pl-2 py-1 text-right tabular-nums text-white/50">{row.tongCu}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
