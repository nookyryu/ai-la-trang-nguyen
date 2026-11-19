/**
 * Công cụ tự động mở headless browser, chụp ảnh kiểm tra 4 kỳ thi và lúc chuyển nền.
 * Cách chạy: mở server game trước (npm run dev hoặc tsx server.ts), sau đó chạy:
 *   node tools/chup-anh-kiem-tra-nen.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/AD/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright');

const OUT_DIR = path.resolve(import.meta.dirname, '../docs/kiem-tra-nen');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Xoá các file PNG cũ nếu có
['ky-1-khao-hach.png', 'ky-2-thi-huong.png', 'ky-3-thi-hoi.png', 'ky-4-thi-dinh.png'].forEach((f) => {
  const p = path.join(OUT_DIR, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Đã xoá file PNG cũ: ${f}`);
  }
});

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function chupVaLuuAnh(page, fileName) {
  const outPath = path.join(OUT_DIR, fileName);
  const buf = await page.screenshot({ type: 'png' });
  let q = 80;
  let compressed = await sharp(buf).jpeg({ quality: q, mozjpeg: true }).toBuffer();
  while (compressed.length > 400 * 1024 && q > 50) {
    q -= 5;
    compressed = await sharp(buf).jpeg({ quality: q, mozjpeg: true }).toBuffer();
  }
  fs.writeFileSync(outPath, compressed);
  console.log(`Đã chụp: ${fileName} (${(compressed.length / 1024).toFixed(1)} KB, chất lượng=${q})`);
}

const HO = ['Minh', 'Lan', 'Tuấn', 'Hoa', 'Long', 'Thảo', 'Nam', 'Vy', 'Khánh', 'An', 'Bình', 'Trang', 'Hùng', 'My', 'Phúc'];

async function bomSiTu(page, n = 60) {
  await page.evaluate(({ n, HO }) => {
    const room = window.__room;
    if (!room) return;
    const ans = ['A', 'B', 'C', 'D'];
    const now = Date.now();
    for (let i = 0; i < n; i++) {
      const id = `situ_${i + 1}`;
      const name = `${HO[i % HO.length]}_${i + 1}`;
      const c = ans[Math.floor(Math.random() * ans.length)];
      room.chat({ id, name, avatar: '', comment: c }, now);
    }
  }, { n, HO });
}

async function main() {
  console.log('Khởi động trình duyệt chụp ảnh kiểm tra nền 4 kỳ (chơi thật)...');
  let browser;
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

  console.log('Mở trang stage...');
  await page.goto('http://localhost:3007/?view=stage&mute=1', { waitUntil: 'networkidle' });
  await sleep(1500);

  // 1. Chơi thật Kỳ 1 (Khảo hạch) - đảm bảo KHÔNG dùng xemNenKy
  console.log('Bắt đầu chơi thật Kỳ 1 (Khảo hạch)...');
  await page.evaluate(() => {
    const room = window.__room;
    room.xemNenKy = null;
    room.batDau(Date.now());
    room.phase = 'hoi';
    room.shownAt = Date.now();
    room.endsAt = Date.now() + 60000;
  });
  await bomSiTu(page, 60);
  await sleep(1000);

  await chupVaLuuAnh(page, 'ky-1-khao-hach.jpg');

  // 2. Chuyển sang Kỳ 2 (Thi Hương) và chụp ảnh ở giữa transition (khoảng 0.6s)
  console.log('Chuyển sang Kỳ 2 (Thi Hương), chụp ảnh giữa lúc đổi nền (0.6s)...');
  await page.evaluate(() => {
    const room = window.__room;
    room.xemNenKy = null;
    const targetIdx = room.cauList.findIndex((c) => c.vong === 1);
    room.idx = targetIdx >= 0 ? targetIdx : 5;
    room.phase = 'hoi';
    room.shownAt = Date.now();
    room.endsAt = Date.now() + 60000;
  });
  // Đợi đúng 600ms (0.6s sau khi chuyển kỳ)
  await sleep(600);
  await chupVaLuuAnh(page, 'chuyen-nen-0.6s.jpg');

  // Đợi thêm 1s để hoàn thành transition 1.2s của Kỳ 2
  await sleep(1000);
  // Gán câu hỏi dài 3 dòng để kiểm tra không lọng và cờ nào chạm chữ
  await page.evaluate(() => {
    const room = window.__room;
    if (room && room.cauList && room.cauList[room.idx]) {
      room.cauList[room.idx].q.q = 'Vùng có lực hút cực mạnh trong vũ trụ mà ngay cả ánh sáng cũng không thể thoát ra ngoài được gọi là gì?';
    }
  });
  await bomSiTu(page, 60);
  await sleep(600);
  await chupVaLuuAnh(page, 'ky-2-thi-huong.jpg');

  // 3. Chuyển sang Kỳ 3 (Thi Hội)
  console.log('Chuyển sang Kỳ 3 (Thi Hội)...');
  await page.evaluate(() => {
    const room = window.__room;
    room.xemNenKy = null;
    const targetIdx = room.cauList.findIndex((c) => c.vong === 2);
    room.idx = targetIdx >= 0 ? targetIdx : 10;
    room.phase = 'hoi';
    room.shownAt = Date.now();
    room.endsAt = Date.now() + 60000;
  });
  await sleep(1500); // Đợi chuyển nền hoàn tất
  await bomSiTu(page, 60);
  await sleep(600);
  await chupVaLuuAnh(page, 'ky-3-thi-hoi.jpg');

  // 4. Chuyển sang Kỳ 4 (Thi Đình)
  console.log('Chuyển sang Kỳ 4 (Thi Đình)...');
  await page.evaluate(() => {
    const room = window.__room;
    room.xemNenKy = null;
    const targetIdx = room.cauList.findIndex((c) => c.vong === 3);
    room.idx = targetIdx >= 0 ? targetIdx : 15;
    room.phase = 'hoi';
    room.shownAt = Date.now();
    room.endsAt = Date.now() + 60000;
  });
  await sleep(1500); // Đợi chuyển nền hoàn tất
  await bomSiTu(page, 60);
  await sleep(600);
  await chupVaLuuAnh(page, 'ky-4-thi-dinh.jpg');

  await browser.close();
  console.log('Hoàn tất chụp 5 ảnh kiểm tra nền chất lượng cao JPG <= 400KB!');
}

main().catch((err) => {
  console.error('Lỗi khi chụp ảnh kiểm tra nền:', err);
  process.exit(1);
});
