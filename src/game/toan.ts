// Câu toán nhẩm máy tự sinh: không bao giờ hết câu, không cần kiểm tra sự thật.
// Mùa 2: giữ 1 câu/ván ở Kỳ 2 (Thi Hương), hiện như môn "Toán nhanh".
import type { Muc } from './config';
import type { McQ } from './thi';

const ri = (rand: () => number, a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

/** Sinh 1 câu toán; 3 đáp án sai là số gần đúng (lệch 1, lệch 10, đảo chữ số...) để không đoán mò được */
export function sinhToan(cap: number, rand: () => number = Math.random, muc: Muc = 3): McQ {
  let q: string;
  let kq: number;
  let giaiThich: string;
  const k = ri(rand, 0, 1);
  if (cap <= 1) {
    const a = ri(rand, 12, 49), b = ri(rand, 11, 39);
    if (k) {
      q = `${a} cộng ${b} bằng bao nhiêu?`;
      kq = a + b;
      giaiThich = 'Mẹo nhẩm cộng nhanh: cộng hàng chục trước rồi cộng hàng đơn vị sẽ rất ít khi nhầm.';
    } else {
      q = `${a + b} trừ ${b} bằng bao nhiêu?`;
      kq = a;
      giaiThich = 'Mẹo nhẩm trừ nhanh: làm tròn số trừ lên hàng chục gần nhất rồi bù lại phần dư.';
    }
  } else if (cap === 2) {
    if (k) {
      const a = ri(rand, 12, 29), b = ri(rand, 3, 9);
      q = `${a} nhân ${b} bằng bao nhiêu?`;
      kq = a * b;
      const chuc = Math.floor(a / 10) * 10;
      const dv = a % 10;
      giaiThich = `Tách ${a} thành ${chuc} cộng ${dv}, nhân từng phần với ${b} rồi cộng lại là ra ngay ${kq}.`;
    } else {
      const a = ri(rand, 120, 480), b = ri(rand, 25, 99);
      q = `${a} cộng ${b} bằng bao nhiêu?`;
      kq = a + b;
      giaiThich = `Nhẩm nhanh: cộng ${a} với 100 rồi bớt đi ${100 - b} sẽ ra ngay đáp án ${kq}!`;
    }
  } else if (cap === 3) {
    if (k) {
      const a = ri(rand, 11, 19), b = ri(rand, 11, 19);
      q = `${a} nhân ${b} bằng bao nhiêu?`;
      kq = a * b;
      giaiThich = 'Nhẩm nhân hai số từ 11 đến 19: lấy số đầu cộng chữ số cuối số kia, nhân 10 rồi cộng tích hai chữ số cuối.';
    } else {
      const b = ri(rand, 6, 9), c = ri(rand, 12, 39);
      q = `${b * c} chia ${b} bằng bao nhiêu?`;
      kq = c;
      giaiThich = 'Nhẩm chia nhanh: kiểm tra chữ số tận cùng của tích sẽ loại ngay được hai đáp án sai!';
    }
  } else {
    const a = ri(rand, 12, 25), b = ri(rand, 3, 9), c = ri(rand, 11, 49);
    if (k) {
      q = `${a} nhân ${b} rồi cộng ${c} bằng bao nhiêu?`;
      kq = a * b + c;
      giaiThich = `Tính ${a} nhân ${b} được ${a * b}, sau đó cộng thêm ${c} là ra đúng ${kq}.`;
    } else {
      q = `${a + c} trừ ${c} rồi nhân ${b} bằng bao nhiêu?`;
      kq = a * b;
      giaiThich = `Làm gọn bước đầu: ${a + c} trừ ${c} còn đúng ${a}, nhân với ${b} là ra ${kq}.`;
    }
  }
  const sai = new Set<number>();
  const dao = Number(String(kq).split('').reverse().join(''));
  for (const d of [kq + 1, kq - 1, kq + 10, kq - 10, dao, kq + 2, kq - 2, kq + 11]) {
    if (d > 0 && d !== kq && sai.size < 3 && rand() < 0.75) sai.add(d);
  }
  for (let d = 3; sai.size < 3; d++) if (kq + d !== kq) sai.add(kq + d);
  return {
    id: `toan:${q}`,
    q,
    right: String(kq),
    wrong: [...sai].map(String),
    mon: 'toan-nhanh',
    muc,
    giaiThich,
    laMoi: true,
    level: 'vua',
  };
}
