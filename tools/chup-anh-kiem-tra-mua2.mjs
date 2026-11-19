/**
 * Kiểm tra toàn diện Mùa 2 trên cổng 3507:
 * - Tự bật server cổng 3507, ghi lại PID và chỉ tắt đúng PID đó trong finally.
 * - Mở trang stage (?view=stage&mute=1) ở 1080x1920, chạy trọn 1 ván giả lập 60 người và 1 ván giả lập 500 người.
 * - Chụp 8 ảnh nhỏ (JPG <= 250 KB) lưu vào docs/kiem-tra-mua2/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/AD/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright');

const PORT = 3507;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.resolve(ROOT, 'docs/kiem-tra-mua2');
fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/api/cai-dat`);
      if (r.ok) return;
    } catch {
      // chưa sẵn sàng
    }
    await sleep(300);
  }
  throw new Error(`Server cổng ${PORT} không phản hồi sau ${timeoutMs}ms`);
}

async function chup(page, fileName, width = 720, fullPage = false) {
  const outPath = path.join(OUT_DIR, fileName);
  const buf = await page.screenshot({ type: 'png', fullPage });
  let q = 80;
  let out = await sharp(buf).resize({ width, withoutEnlargement: true }).jpeg({ quality: q, mozjpeg: true }).toBuffer();
  while (out.length > 250 * 1024 && q > 50) {
    q -= 5;
    out = await sharp(buf).resize({ width, withoutEnlargement: true }).jpeg({ quality: q, mozjpeg: true }).toBuffer();
  }
  fs.writeFileSync(outPath, out);
  console.log(`Đã chụp: ${fileName} (${(out.length / 1024).toFixed(1)} KB, q=${q})`);
}

const HO = ['Minh', 'Lan', 'Tuấn', 'Hoa', 'Long', 'Thảo', 'Nam', 'Vy', 'Khánh', 'An', 'Bình', 'Trang', 'Hùng', 'My', 'Phúc'];
const MIENS = ['Bắc', 'Trung', 'Nam'];

async function chayTronVan(page, soNguoi) {
  return page.evaluate(({ soNguoi, HO, MIENS }) => {
    const room = window.__room;
    if (!room) throw new Error('Không tìm thấy window.__room');
    const t0 = performance.now();
    let now = Date.now();
    room.batDau(now);
    // Chọn miền cho 1/3 người chơi
    for (let i = 0; i < Math.min(soNguoi, 120); i++) {
      room.chat({ id: `u_${i}`, name: `${HO[i % HO.length]}_${i + 1}`, avatar: '', comment: MIENS[i % 3] }, now);
    }
    let soCau = 0;
    let maxGuard = 4000;
    while (room.phase !== 'vinhQuy' && maxGuard-- > 0) {
      if (room.phase === 'doc') {
        room.docXong(now);
      } else if (room.phase === 'hoi') {
        soCau++;
        const ans = room.cau.ans;
        const letters = ['A', 'B', 'C', 'D'];
        for (let i = 0; i < soNguoi; i++) {
          // 15 người đầu giỏi (tỉ lệ đúng cao) để tạo danh hiệu môn phong phú
          const c = i < 15 ? (i % 3 === 0 ? letters[ans] : letters[(ans + (soCau + i) % 2) % 4]) : letters[(i + soCau) % 4];
          room.chat({ id: `u_${i}`, name: `${HO[i % HO.length]}_${i + 1}`, avatar: '', comment: c }, now + 400 + (i % 60) * 120);
        }
        now += 30_000;
        room.tick(now);
      } else {
        now += 15_000;
        room.tick(now);
      }
    }
    const v = room.view(now);
    return {
      ok: room.phase === 'vinhQuy',
      soCau,
      soSiTu: v.soSiTu,
      top1: v.top[0]?.name ?? '',
      top1Diem: v.top[0]?.diem ?? 0,
      soDanhHieuMon: v.danhHieuMon.length,
      danhHieuMon: v.danhHieuMon.map((d) => `${d.danhHieu}:${d.name}`),
      ms: Math.round(performance.now() - t0),
    };
  }, { soNguoi, HO, MIENS });
}

async function main() {
  console.log(`Khởi động server thử trên cổng ${PORT}...`);
  const tsxCli = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const srv = spawn(process.execPath, [tsxCli, 'server.ts'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production', VIENEU_VOICE: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  srv.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  console.log(`Server PID = ${srv.pid}`);

  let browser;
  const pageErrors = [];
  try {
    await waitServer(25000);
    console.log(`Server cổng ${PORT} đã sẵn sàng!`);

    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    }

    const context = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(`${BASE}/?view=stage&mute=1&test=1`, { waitUntil: 'networkidle' });
    await sleep(1200);

    // 1. Chạy thử trọn 1 ván 60 người
    const kq60 = await chayTronVan(page, 60);
    console.log('Ván 60 người:', JSON.stringify(kq60));
    if (!kq60.ok || kq60.soCau !== 16) throw new Error('Ván 60 người không hoàn tất 16 câu');

    // 2. Chạy thử trọn 1 ván 500 người
    const kq500 = await chayTronVan(page, 500);
    console.log('Ván 500 người:', JSON.stringify(kq500));
    if (!kq500.ok || kq500.soCau !== 16) throw new Error('Ván 500 người không hoàn tất 16 câu');

    // Chụp màn Vinh Quy (có Tam Khôi + Danh hiệu môn) ngay từ kết quả ván 500 người!
    await page.evaluate(() => {
      const room = window.__room;
      room.endsAt = Date.now() + 120_000;
    });
    await sleep(1300);
    await chup(page, '08-vinh-quy-danh-hieu-mon.jpg');

    // 3. Chụp màn Bảng vàng (có danh hiệu môn sau kỳ thi)
    await page.evaluate(() => {
      const room = window.__room;
      room.phase = 'bangVang';
      room.endsAt = Date.now() + 120_000;
    });
    await sleep(900);
    await chup(page, '07-bang-vang.jpg');

    // 4. Bắt đầu ván mới để chụp Vòng quay, 3 môn khác màu, Câu 16 Trạng Nguyên ×2, Công bố + Bạn có biết
    const monIndices = await page.evaluate(({ HO, MIENS }) => {
      const room = window.__room;
      const now = Date.now();
      room.batDau(now);
      // Thêm 60 sĩ tử + miền để sân thi và bảng vàng sống động
      for (let i = 0; i < 60; i++) {
        room.chat({ id: `s_${i}`, name: `${HO[i % HO.length]}_${i + 1}`, avatar: '', comment: MIENS[i % 3] }, now);
      }
      // Tìm chỉ số 3 câu có 3 môn khác nhau rõ màu (ưu tiên 3 kỳ khác nhau)
      const list = room.cauList;
      const seen = new Set();
      const picks = [];
      for (let i = 0; i < list.length - 1; i++) {
        if (!seen.has(list[i].q.mon) && list[i].q.mon !== 'toan-nhanh') {
          seen.add(list[i].q.mon);
          picks.push({ idx: i, mon: list[i].q.mon, vong: list[i].vong });
          if (picks.length === 3) break;
        }
      }
      return {
        picks,
        lastMon: list[15].q.mon,
      };
    }, { HO, MIENS });

    // Chụp 01: Vòng quay môn học
    await page.evaluate((idx) => {
      const room = window.__room;
      room.idx = idx;
      room.phase = 'quay';
      room.endsAt = Date.now() + 120_000;
    }, monIndices.picks[0].idx);
    await sleep(1650); // để vòng quay gần dừng + thẻ môn hiện rõ
    await chup(page, '01-vong-quay-mon.jpg');

    // Chụp 02, 03, 04: Đang hỏi 3 môn khác màu (môn 3 chọn câu 16 Trạng Nguyên ×2 + 500 người + cứu trợ!)
    const captureHoi = async (idx, fileName, soNguoi, themTim = false) => {
      await page.evaluate(({ idx, soNguoi, HO, themTim }) => {
        const room = window.__room;
        const now = Date.now();
        room.idx = idx;
        room.phase = 'hoi';
        room.shownAt = now - 2500;
        const tongMs = (room.cau.vong === 0 ? 10 : room.cau.vong === 1 ? 15 : room.cau.vong === 2 ? 20 : 25) * 1000;
        room.endsAt = now + Math.round(tongMs * 0.72);
        room.answers.clear();
        room.counts = [0, 0, 0, 0];
        room.ketQua = null;
        room.cuu = { tim: 0, xong: false, loai: [] };
        if (themTim) room.tim(135);
        const letters = ['A', 'B', 'C', 'D'];
        for (let i = 0; i < soNguoi; i++) {
          room.chat({ id: `s_${i}`, name: `${HO[i % HO.length]}_${i + 1}`, avatar: '', comment: letters[(i + idx) % 4] }, now);
        }
      }, { idx, soNguoi, HO, themTim });
      await sleep(1400);
      await chup(page, fileName);
    };

    await captureHoi(monIndices.picks[0].idx, '02-dang-hoi-mon-1.jpg', 60);
    await captureHoi(monIndices.picks[1].idx, '03-dang-hoi-mon-2.jpg', 60);
    await captureHoi(monIndices.picks[2].idx, '04-dang-hoi-mon-3.jpg', 60);
    await captureHoi(15, '05-cau16-trang-nguyen.jpg', 500, true);

    // Chụp 06: Công bố đáp án + thẻ "Bạn có biết?"
    await page.evaluate((idx) => {
      const room = window.__room;
      const now = Date.now();
      room.idx = idx;
      room.phase = 'chot';
      room.endsAt = now - 10;
      room.tick(now); // chạy chamCau -> pha dapAn
      room.endsAt = now + 120_000;
    }, monIndices.picks[1].idx);
    await sleep(1700); // chờ nhấp nháy + thanh phần trăm + thẻ Bạn có biết hiện đầy đủ
    await chup(page, '06-cong-bo-ban-co-biet.jpg');

    // Chụp 09: Trang điều khiển (fullPage để thấy rõ bảng đếm câu Môn × Mức)
    const adminPage = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
    adminPage.on('pageerror', (err) => pageErrors.push(err.message));
    await adminPage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await sleep(1000);
    await chup(adminPage, '09-trang-dieu-khien.jpg', 960, true);
    await adminPage.close();

    if (pageErrors.length) {
      console.error('Lỗi trang:', pageErrors);
      process.exitCode = 1;
    } else {
      console.log('Hoàn tất kiểm tra & chụp ảnh Mùa 2: 0 lỗi trình duyệt!');
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (srv.pid) {
      console.log(`Tắt server thử PID = ${srv.pid}...`);
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /PID ${srv.pid} /T /F`, { stdio: 'ignore' });
        } else {
          process.kill(srv.pid, 'SIGTERM');
        }
      } catch {
        // đã tắt
      }
    }
  }
}

main().catch((err) => {
  console.error('Lỗi chạy kiểm tra Mùa 2:', err);
  process.exit(1);
});
