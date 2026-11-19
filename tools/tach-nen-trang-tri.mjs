/**
 * Tách nền trắng cho các món đồ trang trí trong public/assets/trang-tri/goc/
 * Xuất ra: public/assets/trang-tri/<tên>.webp (nền trong suốt, <= 200 KB)
 * 
 * Cách chạy:
 *   node tools/tach-nen-trang-tri.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const GOC_DIR = path.join(ROOT, 'docs/trang-tri-goc');
const OUT_DIR = path.join(ROOT, 'public/assets/trang-tri');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const ITEMS = [
  'co-ngu-sac',
  'long-do',
  'den-long',
  'binh-hoa',
  'rem-lua-vang',
  'long-vang',
  'tham-do',
  'hac-dong',
];

async function tachNenTrang(name, tol = 28) {
  const srcPath = path.join(GOC_DIR, `${name}.jpg`);
  if (!fs.existsSync(srcPath)) {
    console.warn(`Không tìm thấy file gốc: ${srcPath}`);
    return;
  }

  const { data, info } = await sharp(srcPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // Lấy màu nền từ các góc và viền
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];

  const border = [];
  for (let x = 0; x < W; x++) {
    border.push(x);
    border.push((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    border.push(y * W);
    border.push(y * W + W - 1);
  }

  // Đếm khoảng cách với màu trắng thuần (255, 255, 255)
  const isBg = new Uint8Array(W * H);
  const queue = [];

  // Khởi tạo các điểm viền gần trắng làm hạt giống loang (flood-fill)
  for (const idx of border) {
    const [r, g, b] = px(idx);
    if (r >= 255 - tol && g >= 255 - tol && b >= 255 - tol) {
      isBg[idx] = 1;
      queue.push(idx);
    }
  }

  // Loang từ viền vào
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % W;
    const y = Math.floor(idx / W);

    const neighbors = [];
    if (x > 0) neighbors.push(idx - 1);
    if (x < W - 1) neighbors.push(idx + 1);
    if (y > 0) neighbors.push(idx - W);
    if (y < H - 1) neighbors.push(idx + W);

    for (const n of neighbors) {
      if (!isBg[n]) {
        const [r, g, b] = px(n);
        // Nếu gần màu trắng
        if (r >= 255 - tol && g >= 255 - tol && b >= 255 - tol) {
          isBg[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  // Tạo ảnh RGBA
  const outBuf = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const [r, g, b] = px(i);
    outBuf[i * 4] = r;
    outBuf[i * 4 + 1] = g;
    outBuf[i * 4 + 2] = b;
    if (isBg[i]) {
      outBuf[i * 4 + 3] = 0; // hoàn toàn trong suốt
    } else {
      // Làm mềm viền nếu gần ngưỡng
      const minC = Math.min(r, g, b);
      if (minC > 240) {
        outBuf[i * 4 + 3] = Math.max(0, Math.min(255, Math.round((255 - minC) * 16)));
      } else {
        outBuf[i * 4 + 3] = 255;
      }
    }
  }

  // Cắt bớt khoảng trống thừa xung quanh (trim) và lưu ra WebP
  const outPath = path.join(OUT_DIR, `${name}.webp`);
  await sharp(outBuf, { raw: { width: W, height: H, channels: 4 } })
    .trim({ threshold: 10 })
    .webp({ quality: 85, effort: 6 })
    .toFile(outPath);

  const stat = fs.statSync(outPath);
  console.log(`Đã tách nền: ${name}.webp (${(stat.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('Bắt đầu tách nền cho 8 món trang trí...');
  for (const item of ITEMS) {
    await tachNenTrang(item);
  }
  console.log('Hoàn tất tách nền toàn bộ đồ trang trí!');
}

main().catch(err => {
  console.error('Lỗi khi tách nền:', err);
  process.exit(1);
});
