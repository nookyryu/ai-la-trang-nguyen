/**
 * Công cụ đo thời gian tạo trước giọng đọc cả ván (prefetch) và đo độ trễ khi lấy từ cache.
 * Cách chạy: mở server game trước (node server.ts), sau đó chạy:
 *   node tools/do-tao-giong.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { KyThi, parseMc } from '../src/game/thi.ts';

const bankFiles = fs.readdirSync(path.resolve(import.meta.dirname, '../src/game/cau-hoi'))
  .filter(f => f.endsWith('.txt'))
  .flatMap(f => parseMc(fs.readFileSync(path.resolve(import.meta.dirname, '../src/game/cau-hoi', f), 'utf8')));

const room = new KyThi(bankFiles);
room.batDau(Date.now());
const cacLoi = room.cacLoiTrongVan();

console.log(`Đã chọn ván mới với ${room.cauList.length} câu, tổng số lời đọc: ${cacLoi.length}`);

async function prefetchItem(text) {
  const t0 = Date.now();
  const r = await fetch(`http://localhost:3007/api/tts?rate=1&text=${encodeURIComponent(text)}`);
  const buf = await r.arrayBuffer();
  return { time: Date.now() - t0, bytes: buf.byteLength };
}

async function doThoiGian() {
  console.log('--- ĐO THỜI GIAN TẠO GIỌNG CẢ VÁN (Độ đồng thời = 2) ---');
  const tStart = Date.now();

  // Đo riêng câu 1 (lời 0: đề, lời 1: đáp án)
  const t0 = Date.now();
  const res0 = await prefetchItem(cacLoi[0]);
  const timeCau1 = Date.now() - t0;
  console.log(`Đề câu 1 tạo xong trong: ${timeCau1}ms (${res0.bytes} bytes)`);

  // Hàng đợi concurrency = 2 cho 39 câu còn lại
  const queue = cacLoi.slice(1);
  let active = 0;
  let idx = 0;

  await new Promise((resolve) => {
    function drain() {
      if (idx >= queue.length && active === 0) {
        return resolve();
      }
      while (active < 2 && idx < queue.length) {
        const text = queue[idx++];
        active++;
        prefetchItem(text).finally(() => {
          active--;
          drain();
        });
      }
    }
    drain();
  });

  const tongThoiGian = Date.now() - tStart;
  console.log(`Tạo xong toàn bộ ván (${cacLoi.length} lời) trong: ${(tongThoiGian / 1000).toFixed(2)}s`);

  // Đo độ trễ khi lấy từ cache (câu 1, câu 10, câu 20)
  console.log('\n--- ĐO ĐỘ TRỄ KHI PHÁT (CACHE HIT) ---');
  // Câu 1: index 0
  const tDoc1 = Date.now();
  await prefetchItem(cacLoi[0]);
  const latency1 = Date.now() - tDoc1;

  // Câu 10: index 18 (9 * 2)
  const tDoc10 = Date.now();
  await prefetchItem(cacLoi[18]);
  const latency10 = Date.now() - tDoc10;

  // Câu 20: index 38 (19 * 2)
  const tDoc20 = Date.now();
  await prefetchItem(cacLoi[38]);
  const latency20 = Date.now() - tDoc20;

  console.log(`Độ trễ đọc đề: Câu 1 = ${latency1}ms, Câu 10 = ${latency10}ms, Câu 20 = ${latency20}ms`);
}

doThoiGian().catch(err => console.error(err));
