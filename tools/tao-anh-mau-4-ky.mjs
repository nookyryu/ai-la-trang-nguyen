/**
 * Ghép ảnh xem trước 4 kỳ thi đặt cạnh nhau để trình chủ kênh duyệt:
 * - Kỳ 1: Khảo hạch (mộc mạc nguyên bản)
 * - Kỳ 2: Thi Hương (+ cờ ngũ sắc, + 2 lọng đỏ)
 * - Kỳ 3: Thi Hội (+ đèn lồng đỏ ấm, + 2 bình hoa đào/mai)
 * - Kỳ 4: Thi Đình (+ rèm lụa vàng, + lọng vàng, + thảm đỏ hoa văn, + đôi hạc đồng)
 * 
 * Xuất ra: docs/kiem-tra-nen/mau-4-ky.jpg
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const BG_DIR = path.join(ROOT, 'public/assets/bg');
const TT_DIR = path.join(ROOT, 'public/assets/trang-tri');
const OUT_DIR = path.join(ROOT, 'docs/kiem-tra-nen');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function renderKy(ky) {
  const bgFiles = [
    'nen2.jpg',
    'nen-thi-huong.jpg',
    'nen-thi-hoi.jpg',
    'nen-thi-dinh.jpg',
  ];
  const bgPath = path.join(BG_DIR, bgFiles[ky]);
  const composites = [];

  // Helper tải và resize ảnh trang trí
  const getOverlay = async (name, width, height, flipX = false) => {
    let pipeline = sharp(path.join(TT_DIR, `${name}.webp`)).resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    if (flipX) pipeline = pipeline.flop();
    return await pipeline.toBuffer();
  };

  // Kỳ 2: Thi Hương (+ Cờ ngũ sắc, + Lọng đỏ trên nền trường huyện)
  if (ky === 1) {
    const coBuf = await getOverlay('co-ngu-sac', 880, 110);
    composites.push({ input: coBuf, left: 100, top: 415 });

    const longTrai = await getOverlay('long-do', 120, 260);
    const longPhai = await getOverlay('long-do', 120, 260, true);
    composites.push({ input: longTrai, left: 165, top: 460 });
    composites.push({ input: longPhai, left: 795, top: 460 });
  }

  // Kỳ 3 (Thi Hội) và Kỳ 4 (Thi Đình) đã là tranh toàn cảnh hoàn chỉnh do AI vẽ đồng bộ từ đầu đến chân!

  let bgBuffer = await sharp(bgPath).toBuffer();
  if (composites.length > 0) {
    bgBuffer = await sharp(bgBuffer).composite(composites).toBuffer();
  }
  return await sharp(bgBuffer)
    .resize(540, 960) // Scale xuống 50% để ghép 4 kỳ vào 1 ảnh gọn gàng
    .toBuffer();
}

async function main() {
  console.log('Đang tạo ảnh xem trước 4 kỳ thi...');
  const k1 = await renderKy(0);
  const k2 = await renderKy(1);
  const k3 = await renderKy(2);
  const k4 = await renderKy(3);

  // Nhãn tiêu đề cho từng kỳ
  const W_PANEL = 540;
  const H_PANEL = 960;
  const TOTAL_W = W_PANEL * 4;
  const TOTAL_H = H_PANEL + 60; // 60px trên cùng làm thanh tiêu đề

  // Tạo banner tiêu đề SVG
  const titleSvg = `
    <svg width="${TOTAL_W}" height="60" viewBox="0 0 ${TOTAL_W} 60" xmlns="http://www.w3.org/2000/svg">
      <rect width="${TOTAL_W}" height="60" fill="#1b0e07"/>
      <text x="${W_PANEL * 0 + W_PANEL/2}" y="40" font-family="'Be Vietnam Pro', sans-serif" font-size="22" font-weight="bold" fill="#fff1cc" text-anchor="middle">KỲ 1: TRƯỜNG LÀNG (Mộc mạc)</text>
      <text x="${W_PANEL * 1 + W_PANEL/2}" y="40" font-family="'Be Vietnam Pro', sans-serif" font-size="22" font-weight="bold" fill="#facc15" text-anchor="middle">KỲ 2: THI HƯƠNG (+ Cờ ngũ sắc, Lọng đỏ)</text>
      <text x="${W_PANEL * 2 + W_PANEL/2}" y="40" font-family="'Be Vietnam Pro', sans-serif" font-size="22" font-weight="bold" fill="#fb923c" text-anchor="middle">KỲ 3: THI HỘI (HUYỆN PHỦ + Đèn lồng, Hoa đào)</text>
      <text x="${W_PANEL * 3 + W_PANEL/2}" y="40" font-family="'Be Vietnam Pro', sans-serif" font-size="22" font-weight="bold" fill="#f43f5e" text-anchor="middle">KỲ 4: THI ĐÌNH (KINH ĐÔ + Thảm đỏ, Rèm vàng, Hạc)</text>
    </svg>
  `;

  const canvas = sharp({
    create: {
      width: TOTAL_W,
      height: TOTAL_H,
      channels: 3,
      background: '#1b0e07',
    },
  });

  const outPath = path.join(OUT_DIR, 'mau-4-ky.jpg');
  await canvas
    .composite([
      { input: Buffer.from(titleSvg), left: 0, top: 0 },
      { input: k1, left: 0, top: 60 },
      { input: k2, left: W_PANEL, top: 60 },
      { input: k3, left: W_PANEL * 2, top: 60 },
      { input: k4, left: W_PANEL * 3, top: 60 },
    ])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(outPath);

  const stat = fs.statSync(outPath);
  console.log(`Đã tạo ảnh mẫu 4 kỳ: ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error('Lỗi ghép ảnh mẫu:', err);
  process.exit(1);
});
