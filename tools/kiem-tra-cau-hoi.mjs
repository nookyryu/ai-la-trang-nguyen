// Kiểm tra bộ câu hỏi (cả kho mới cau-hoi-moi/ và kho dự phòng cau-hoi/):
//   node tools/kiem-tra-cau-hoi.mjs [--csv <file>] [file...]
// Báo lỗi cú pháp (5 cột cũ / 6 cột mới), độ dài câu / đáp án / Bạn có biết,
// đáp án trùng, câu trùng (cả giữa kho mới và kho cũ), câu thuần tiếng Anh, từ dễ sai theo thời gian, từ CẤM.
// In bảng đếm môn × mức cho kho mới.
import fs from 'node:fs';
import path from 'node:path';

const DIR_CU = path.resolve(import.meta.dirname, '../src/game/cau-hoi');
const DIR_MOI = path.resolve(import.meta.dirname, '../src/game/cau-hoi-moi');
const OLD_LEVELS = ['de', 'vua', 'kho', 'dinh', 'meo'];
const NEW_MUCS = ['1', '2', '3', '4', '5'];
const MON_ORDER = ['lich-su', 'dia-ly', 'khoa-hoc', 'hoa-hoc', 'van-hoc', 'van-hoa', 'xa-hoi', 'do-meo'];

const rawArgs = process.argv.slice(2);
let csvFile = null;
const targetFiles = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--csv' && i + 1 < rawArgs.length) {
    csvFile = rawArgs[++i];
  } else if (!rawArgs[i].startsWith('--')) {
    targetFiles.push(path.resolve(rawArgs[i]));
  }
}

const listTxt = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.txt')).sort().map((f) => path.join(dir, f)) : [];

const files = targetFiles.length ? targetFiles : [...listTxt(DIR_MOI), ...listTxt(DIR_CU)];

const plain = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const NHAY_CAM = /(hiện nay|mới nhất|năm nay|gần đây nhất|tính đến)/i;
const HOI_TINH = /thuộc tỉnh nào/i;

// 1. Danh sách từ CẤM (gặp thì báo LỖI, thoát mã 1)
const TU_CAM = [
  'tự tử', 'tự vẫn', 'tuẫn tiết', 'tự thiêu', 'tự sát',
  'chặt đầu', 'xử chém', 'chém đầu', 'xử tử', 'hành quyết', 'thảm sát', 'tra tấn',
  'cờ bạc', 'cá cược', 'kèo', 'xổ số', 'lô đề', 'đốt pháo',
];

// 2. Danh sách từ CẦN XEM (báo CẢNH BÁO, không tính là lỗi)
const TU_CAN_XEM = [
  'giết', 'chém', 'ám sát', 'đầu độc', 'xác chết', 'giết mồi', 'tử hình',
  'thuốc lá', 'thuốc phiện', 'ma túy', 'rượu', 'bia',
];

// 3. Danh sách ngoại lệ vô hại
const NGOAI_LE = [
  'Mù Cang Chải', 'sương mù', 'cá mập', 'hoa súng', 'khẩu súng', 'Đại Ngu',
  'giết sâu bọ', 'Biển Chết', 'Thung lũng Chết',
  'rượu gừng', 'rượu cần', 'rượu nếp', 'ngâm rượu', 'bầu rượu', 'chén rượu', 'ly rượu', 'uống rượu', 'rượu vang',
  'thuốc ho', 'thuốc bắc', 'thuốc nam', 'bốc thuốc', 'thang thuốc', 'uống thuốc', 'viên thuốc', 'vị thuốc', 'cây thuốc',
  'Thất trảm sớ', 'Hà thành đầu độc', 'Chiến tranh thuốc phiện',
  'bia đá', 'bia tiến sĩ', 'tấm bia', 'bắn bia', 'của bia', 'bia Văn Miếu', 'Kiếm chém', 'rượu bia',
];

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const taoRegexTu = (tu) => new RegExp(`(?<![\\p{L}\\p{M}])${escapeRegExp(tu)}(?![\\p{L}\\p{M}])`, 'giu');

const seen = new Map();
const seenQ = new Map(); // phát hiện câu hỏi trùng y hệt phần đề
const demCu = Object.fromEntries(OLD_LEVELS.map((l) => [l, 0]));
const demMoi = {};
let tongMoi = 0;
let loi = 0;
let canhBao = 0;
const danhSachCanhBao = [];

const bao = (f, i, msg, line) => {
  loi++;
  console.log(`${path.basename(f)}:${i + 1}  [LỖI] ${msg}\n    ${line}`);
};

const canhBaoItem = (f, i, tu, msg, line) => {
  canhBao++;
  danhSachCanhBao.push({ file: path.basename(f), dong: i + 1, tu, loai: msg, noiDung: line });
  console.log(`${path.basename(f)}:${i + 1}  [CẢNH BÁO] ${msg}\n    ${line}`);
};

for (const f of files) {
  const isNewDir = path.dirname(f) === DIR_MOI;
  const monKey = path.basename(f, '.txt');
  let oldLevel = '';
  let newMuc = '';

  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const sec = /^\[(\w+)\]$/.exec(line);
    if (sec) {
      if (NEW_MUCS.includes(sec[1])) {
        newMuc = sec[1];
        oldLevel = '';
      } else if (OLD_LEVELS.includes(sec[1])) {
        oldLevel = sec[1];
        newMuc = '';
      } else {
        newMuc = '';
        oldLevel = '';
        bao(f, i, 'nhóm lạ', line);
      }
      return;
    }

    const p = line.split('|').map((s) => s.trim());
    const laMoi = Boolean(newMuc) || isNewDir;

    if (laMoi) {
      if (!newMuc || p.length !== 6 || p.some((x) => !x)) {
        return bao(f, i, 'sai cú pháp mới (cần 6 cột: câu | đúng | sai | sai | sai | Bạn có biết, dưới [1]..[5])', line);
      }
    } else {
      if (!oldLevel || p.length !== 5 || p.some((x) => !x)) {
        return bao(f, i, 'sai cú pháp cũ (cần 5 cột: câu | đúng | sai | sai | sai, dưới [de]..[meo])', line);
      }
    }

    const q = p[0];
    const opts = p.slice(1, 5);
    const giaiThich = laMoi ? p[5] : '';

    if (new Set(opts.map(plain)).size !== 4) bao(f, i, 'đáp án trùng nhau (kể cả khi bỏ dấu)', line);
    const maxOpt = laMoi ? 22 : 24;
    const maxQ = laMoi ? 100 : 110;
    if (opts.some((o) => o.length > maxOpt)) bao(f, i, `đáp án dài quá ${maxOpt} ký tự`, line);
    if (q.length > maxQ) bao(f, i, `câu hỏi dài quá ${maxQ} ký tự (${q.length})`, line);
    if (!VI.test(q)) bao(f, i, 'câu hỏi không có chữ tiếng Việt có dấu', line);
    if (NHAY_CAM.test(q) || (giaiThich && NHAY_CAM.test(giaiThich))) bao(f, i, 'có từ dễ sai theo thời gian (hiện nay / mới nhất...)', line);
    if (laMoi && HOI_TINH.test(q)) bao(f, i, 'câu hỏi "thuộc tỉnh nào" (tránh do sáp nhập tỉnh)', line);
    if (/[%×÷=<>]|\d\/\d/.test(line)) bao(f, i, 'có ký hiệu ông đồ khó đọc (%, ×, ÷, =, <, >, phân số)', line);

    if (laMoi) {
      if (giaiThich.length > 160) bao(f, i, `phần "Bạn có biết" dài quá 160 ký tự (${giaiThich.length})`, line);
      if (!VI.test(giaiThich)) bao(f, i, 'phần "Bạn có biết" không có chữ tiếng Việt có dấu', line);
      if (monKey === 'do-meo' && Number(newMuc) < 3) bao(f, i, 'đố mẹo chỉ nên ở mức 3–5', line);
    }

    const key = plain(q) + '|' + plain(opts[0]);
    if (seen.has(key)) bao(f, i, `trùng câu với ${seen.get(key)}`, line);
    else seen.set(key, `${path.basename(f)}:${i + 1}`);

    const qKey = plain(q);
    if (laMoi && seenQ.has(qKey)) {
      bao(f, i, `trùng câu hỏi với ${seenQ.get(qKey)}`, line);
    } else if (!seenQ.has(qKey)) {
      seenQ.set(qKey, `${path.basename(f)}:${i + 1}`);
    }

    if (laMoi) {
      demMoi[monKey] ??= { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      demMoi[monKey][newMuc]++;
      tongMoi++;
    } else {
      demCu[oldLevel]++;
    }

    // Kiểm tra từ CẤM và CẦN XEM
    let dongDaLoc = line;
    for (const nl of NGOAI_LE) {
      dongDaLoc = dongDaLoc.replace(taoRegexTu(nl), (m) => ' '.repeat(m.length));
    }
    for (const cam of TU_CAM) {
      if (taoRegexTu(cam).test(dongDaLoc)) bao(f, i, `chứa từ CẤM: "${cam}"`, line);
    }
    for (const cx of TU_CAN_XEM) {
      if (taoRegexTu(cx).test(dongDaLoc)) canhBaoItem(f, i, cx, `từ nhạy cảm cần xem: "${cx}"`, line);
    }
  });
}

if (csvFile) {
  const bom = '\uFEFF';
  const header = 'File,Dòng,Từ khớp,Loại cảnh báo,Nội dung câu\n';
  const rows = danhSachCanhBao
    .map((r) => `"${r.file}",${r.dong},"${r.tu}","${r.loai}","${r.noiDung.replace(/"/g, '""')}"`)
    .join('\n');
  fs.writeFileSync(csvFile, bom + header + rows, 'utf8');
  console.log(`\nĐã xuất ${danhSachCanhBao.length} cảnh báo ra file CSV: ${csvFile}`);
}

// In bảng đếm Môn × Mức cho kho mới
const monKeys = [...MON_ORDER.filter((m) => demMoi[m]), ...Object.keys(demMoi).filter((m) => !MON_ORDER.includes(m))];
if (monKeys.length) {
  console.log('\n=== Bảng đếm câu MỚI (môn × mức) ===');
  console.log('Môn          | M1 | M2 | M3 | M4 | M5 | Tổng');
  console.log('-------------|----|----|----|----|----|-----');
  const colSum = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const m of monKeys) {
    const r = demMoi[m];
    const sum = NEW_MUCS.reduce((a, k) => a + r[k], 0);
    NEW_MUCS.forEach((k) => (colSum[k] += r[k]));
    console.log(
      `${m.padEnd(12)} | ${String(r[1]).padStart(2)} | ${String(r[2]).padStart(2)} | ${String(r[3]).padStart(2)} | ${String(r[4]).padStart(2)} | ${String(r[5]).padStart(2)} | ${String(sum).padStart(4)}`,
    );
  }
  console.log('-------------|----|----|----|----|----|-----');
  console.log(
    `${'TỔNG MỚI'.padEnd(12)} | ${String(colSum[1]).padStart(2)} | ${String(colSum[2]).padStart(2)} | ${String(colSum[3]).padStart(2)} | ${String(colSum[4]).padStart(2)} | ${String(colSum[5]).padStart(2)} | ${String(tongMoi).padStart(4)}`,
  );
}

const tongCu = Object.values(demCu).reduce((a, b) => a + b, 0);
if (tongCu) {
  console.log('\nKho dự phòng cũ (cau-hoi/):', demCu, 'tổng', tongCu);
}
if (canhBao) console.log(`${canhBao} cảnh báo cần xem xét`);
console.log(loi ? `${loi} lỗi` : 'Không có lỗi');
process.exitCode = loi ? 1 : 0;
