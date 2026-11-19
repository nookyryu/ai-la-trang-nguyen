// Kiểm tra luật chơi Mùa 2: npx tsx src/game/thi.check.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { choiceOf, diemDung, KyThi, monTuTenFile, parseMc, type McQ } from './thi';
import { GAME, type MonId } from './config';

// Đọc đáp án
assert.equal(choiceOf('a'), 0);
assert.equal(choiceOf('C.'), 2);
assert.equal(choiceOf('đáp án b'), 1);
assert.equal(choiceOf('Chọn D'), 3);
assert.equal(choiceOf('ab'), null);
assert.equal(choiceOf('anh ơi'), null);

// Điểm tốc độ
assert.equal(diemDung(100, 0, 10_000), 100);
assert.equal(diemDung(100, 10_000, 10_000), 50);
assert.equal(diemDung(100, 5_000, 10_000), 75);

// Nạp cả kho mới (cau-hoi-moi/) và kho cũ (cau-hoi/)
const errors: string[] = [];
const dirMoi = new URL('./cau-hoi-moi/', import.meta.url);
const dirCu = new URL('./cau-hoi/', import.meta.url);
const bankMoi = fs
  .readdirSync(dirMoi)
  .filter((f) => f.endsWith('.txt'))
  .flatMap((f) => parseMc(fs.readFileSync(new URL(f, dirMoi), 'utf8'), errors, f, true));
const bankCu = fs
  .readdirSync(dirCu)
  .filter((f) => f.endsWith('.txt'))
  .flatMap((f) => parseMc(fs.readFileSync(new URL(f, dirCu), 'utf8'), errors, f, false));
assert.deepEqual(errors, []);
assert.ok(bankMoi.length >= 460, `phải có >= 460 câu mới, hiện có ${bankMoi.length}`);
assert.ok(bankMoi.every((q) => q.laMoi && !!q.giaiThich), 'câu mới phải có laMoi=true và giaiThich');
assert.ok(bankCu.length >= 4900, `kho dự phòng cũ có ${bankCu.length}`);

// Quy đổi câu cũ: [de]->1, [vua]->2, [kho]->3, [dinh]->4..5, [meo]->do-meo (3..5), môn suy theo tên file
{
  assert.equal(monTuTenFile('lich-su-vn-co-trung-dai.txt'), 'lich-su');
  assert.equal(monTuTenFile('dia-ly-vn.txt'), 'dia-ly');
  assert.equal(monTuTenFile('the-gioi.txt'), 'dia-ly');
  assert.equal(monTuTenFile('khoa-hoc-tu-nhien.txt'), 'khoa-hoc');
  assert.equal(monTuTenFile('van-hoc-tieng-viet.txt'), 'van-hoc');
  assert.equal(monTuTenFile('van-hoa-am-thuc-vn.txt'), 'van-hoa');
  assert.equal(monTuTenFile('phat-minh-nghe-thuat-the-thao.txt'), 'xa-hoi');
  assert.equal(monTuTenFile('meo-logic-tinh-huong.txt'), 'do-meo');

  const sampleOld = `
[de]
Câu dễ? | Đúng 1 | Sai 1 | Sai 2 | Sai 3
[vua]
Câu vừa? | Đúng 2 | Sai 1 | Sai 2 | Sai 3
[kho]
Câu khó? | Đúng 3 | Sai 1 | Sai 2 | Sai 3
[dinh]
Câu đình A? | Đúng 4 | Sai 1 | Sai 2 | Sai 3
Câu đình B? | Đúng 5 | Sai 1 | Sai 2 | Sai 3
[meo]
Câu mẹo? | Đúng 6 | Sai 1 | Sai 2 | Sai 3
`;
  const errs: string[] = [];
  const parsed = parseMc(sampleOld, errs, 'lich-su-vn-co-trung-dai.txt', false);
  assert.deepEqual(errs, []);
  assert.equal(parsed[0].muc, 1);
  assert.equal(parsed[0].mon, 'lich-su');
  assert.equal(parsed[0].laMoi, false);
  assert.equal(parsed[0].giaiThich, undefined);
  assert.equal(parsed[1].muc, 2);
  assert.equal(parsed[2].muc, 3);
  assert.ok(parsed[3].muc === 4 || parsed[3].muc === 5);
  assert.equal(parsed[5].mon, 'do-meo');
  assert.ok(parsed[5].muc >= 3 && parsed[5].muc <= 5);
  console.log('quy doi cau cu: OK');
}

const bank: McQ[] = [...bankMoi, ...bankCu];

// Kiểm tra 40 ván ngẫu nhiên: 16 câu đúng phân bố mức, giới hạn môn, 1 câu toán ở Kỳ 2, câu 16 mức 5
{
  const mucRange: [number, number][] = [[1, 2], [2, 3], [3, 4], [4, 5]];
  for (let run = 0; run < 40; run++) {
    const k = new KyThi(bank, {}, Math.random);
    k.batDau(1_000_000 + run * 1000);
    const list = k['cauList'];
    assert.equal(list.length, 16, 'mỗi ván phải có đúng 16 câu');
    const monDem: Partial<Record<MonId, number>> = {};
    let soToan = 0;
    let soDoMeo = 0;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      const [lo, hi] = mucRange[c.vong];
      assert.ok(c.q.muc >= lo && c.q.muc <= hi, `kỳ ${c.vong + 1} có câu mức ${c.q.muc}`);
      // trong cùng kỳ, câu sau không dễ hơn câu trước
      if (i > 0 && list[i - 1].vong === c.vong) {
        assert.ok(c.q.muc >= list[i - 1].q.muc, `kỳ ${c.vong + 1} bị giảm độ khó`);
      }
      // không 2 câu liền cùng môn (kể cả qua ranh giới kỳ)
      if (i > 0) {
        assert.notEqual(c.q.mon, list[i - 1].q.mon, `2 câu liền (${i} và ${i + 1}) cùng môn ${c.q.mon}`);
      }
      if (c.q.mon === 'toan-nhanh') {
        soToan++;
        assert.equal(c.vong, 1, 'Toán nhanh phải nằm ở Kỳ 2');
      } else {
        monDem[c.q.mon] = (monDem[c.q.mon] ?? 0) + 1;
        assert.ok(monDem[c.q.mon]! <= 3, `môn ${c.q.mon} vượt quá 3 câu/ván`);
      }
      if (c.q.mon === 'do-meo') {
        soDoMeo++;
        assert.ok(c.vong >= 2, 'Đố mẹo chỉ được ở Kỳ 3–4');
      }
      // Câu mới chưa hỏi nên phải ưu tiên 100% câu mới
      assert.equal(c.q.laMoi, true, 'khi còn câu mới chưa hỏi phải ưu tiên câu mới');
    }
    assert.equal(soToan, 1, 'mỗi ván có đúng 1 câu Toán nhanh');
    assert.ok(soDoMeo <= 2, 'Đố mẹo tối đa 2 câu/ván');
    assert.equal(list[15].q.muc, 5, 'Câu 16 (Câu hỏi Trạng Nguyên) phải mức 5');
  }
  console.log('phan bo 16 cau + gioi han mon (40 van): OK');
}

// Ưu tiên câu mới: khi hết sạch câu mới chưa hỏi thì mới rơi về câu cũ chưa hỏi
{
  const usedAllNew: Record<string, number> = {};
  for (const q of bankMoi) usedAllNew[q.id] = 500_000;
  const k = new KyThi(bank, usedAllNew, Math.random);
  k.batDau(2_000_000);
  const ky123 = k['cauList'].filter((c) => c.vong <= 2 && c.q.mon !== 'toan-nhanh');
  assert.ok(ky123.every((c) => !c.q.laMoi), 'hết câu mới chưa hỏi thì Kỳ 1–3 phải lấy 100% câu cũ chưa hỏi');
  const soCu = k['cauList'].filter((c) => c.q.mon !== 'toan-nhanh' && !c.q.laMoi).length;
  assert.ok(soCu >= 12, `phải ưu tiên lấy kho dự phòng cũ (đã lấy ${soCu}/15 câu)`);
  // Câu cũ không có giải thích -> view().giaiThich là null khi công bố
  let t = 2_000_000;
  k.tick((t += GAME.vongSec * 1000));
  k.tick((t += GAME.quaySec * 1000));
  k.docXong(t);
  k.tick((t += GAME.vong[0].giay * 1000));
  k.tick((t += GAME.chotSec * 1000));
  assert.equal(k.phase, 'dapAn');
  assert.equal(k.view(t).giaiThich, null, 'câu cũ không có Bạn có biết');
  console.log('uu tien cau moi & du phong cau cu: OK');
}

// Chạy 1 ván đầy đủ với đồng hồ giả (kiểm pha quay, doc, hoi, chot, dapAn có Bạn có biết, bangVang, vinhQuy)
let t = 1_000_000;
const k = new KyThi(bank, {}, () => 0.42);
k.cho(t);
const step = (ms: number) => {
  t += ms;
  k.tick(t);
};
step(GAME.choSec * 1000);
assert.equal(k.phase, 'vong');
assert.equal(k.view(t).tongCau, 16);
step(GAME.vongSec * 1000);
assert.equal(k.phase, 'quay'); // vòng quay môn học
step(GAME.quaySec * 1000);
assert.equal(k.phase, 'doc');

// Gõ lúc chưa hiện đáp án: không tính, không mất lượt
const ans = () => k.cau!.ans;
const ch = (c: number) => 'ABCD'[c];
assert.equal(k.chat({ id: 'an', name: 'An', avatar: '', comment: ch(ans()) }, t), false);
k.docXong(t);
assert.equal(k.phase, 'hoi');

// An đúng ngay, Bình đúng sau 5 giây, Chi sai, Dũng nói chuyện
assert.equal(k.chat({ id: 'an', name: 'An', avatar: '', comment: ch(ans()) }, t), true);
assert.equal(k.chat({ id: 'an', name: 'An', avatar: '', comment: ch((ans() + 1) % 4) }, t), false);
t += 5000;
k.chat({ id: 'binh', name: 'Bình', avatar: '', comment: `đáp án ${ch(ans())}` }, t);
k.chat({ id: 'chi', name: 'Chi', avatar: '', comment: ch((ans() + 1) % 4) }, t);
k.chat({ id: 'dung', name: 'Dũng', avatar: '', comment: 'hay quá' }, t);
assert.equal(k.view(t).soNop, 3);
assert.equal(k.view(t).counts, null);

step(GAME.vong[0].giay * 1000);
assert.equal(k.phase, 'chot');
assert.equal(k.view(t).dung, -1);
assert.ok(k.view(t).top.every((h) => h.gain === 0));
assert.equal(k.chat({ id: 'tre', name: 'Trễ', avatar: '', comment: 'a' }, t), false);
step(GAME.chotSec * 1000);
assert.equal(k.phase, 'dapAn');
const v = k.view(t);
assert.equal(v.ketQua!.soDung, 2);
assert.equal(v.top[0].name, 'An');
assert.equal(v.top[0].diem, 100);
assert.equal(v.top[1].diem, 75);
assert.ok(!!v.giaiThich, 'câu mới phải hiện Bạn có biết lúc công bố');
assert.equal(k.siTu.get('chi')!.diem, 0);

// Chống gửi sớm theo giờ TikTok: bình luận gửi trước lúc hiện đáp án nhưng tới trễ
step(GAME.dapAnGiaiThichSec * 1000);
assert.equal(k.phase, 'quay');
step(GAME.quaySec * 1000);
assert.equal(k.phase, 'doc');
k.chat({ id: 'x', name: 'X', avatar: '', comment: 'hi', createTime: t - 200 }, t);
k.chat({ id: 'x', name: 'X', avatar: '', comment: 'hi', createTime: t - 200 }, t);
k.docXong(t);
const shown = t;
t += 1500;
assert.equal(k.chat({ id: 'som', name: 'Sớm', avatar: '', comment: 'a', createTime: shown - 1400 - 200 }, t), false);
assert.equal(k.chat({ id: 'kip', name: 'Kịp', avatar: '', comment: 'a', createTime: shown + 300 - 200 }, t), true);

// Chạy hết ván: An đúng tất cả thì đỗ Trạng Nguyên, có danh hiệu môn + thưởng chuỗi
const kinds: string[] = [];
for (let guard = 0; guard < 4000 && k.phase !== 'cho'; guard++) {
  if (k.phase === 'hoi') k.chat({ id: 'an', name: 'An', avatar: '', comment: ch(ans()) }, t);
  if (k.phase === 'doc') k.docXong(t);
  else step(1000);
  kinds.push(...k.lay().map((e) => e.t));
}
assert.equal(k.phase, 'cho');
assert.ok(kinds.includes('vinhQuy'));
assert.equal(kinds.filter((x) => x === 'bangVang').length, 4);
assert.equal(kinds.filter((x) => x === 'quay').length, 16);
const an = k.siTu.get('an')!;
assert.ok(an.chuoi >= 14, `chuỗi ${an.chuoi}`);
assert.equal(k.bxh(1)[0].danhHieu, 'Trạng Nguyên');
assert.ok(k.danhHieuMon().length >= 1, 'phải có ít nhất 1 danh hiệu môn khi An đúng hết');

// Danh hiệu môn: kiểm điều kiện >= 2 câu đúng và hòa số câu thì nhanh hơn thắng
{
  let tm = 8_000_000;
  const km = new KyThi(bank, {}, () => 0.17);
  km.batDau(tm);
  // Tìm 1 môn xuất hiện >= 2 lần trong ván này
  const list = km['cauList'];
  const demMon = new Map<MonId, number>();
  for (const c of list) if (c.q.mon !== 'toan-nhanh') demMon.set(c.q.mon, (demMon.get(c.q.mon) ?? 0) + 1);
  const monTest = [...demMon.entries()].find(([, n]) => n >= 2)![0];

  let soLanMon = 0;
  for (let guard = 0; guard < 5000 && km.phase !== 'vinhQuy'; guard++) {
    if (km.phase === 'doc') km.docXong(tm);
    if (km.phase === 'hoi') {
      const dung = 'ABCD'[km.cau!.ans];
      if (km.cau!.q.mon === monTest) {
        soLanMon++;
        // Bình trả lời đúng sau 1s, An trả lời đúng sau 3s (cùng số câu nhưng Bình nhanh hơn!)
        // Chi chỉ trả lời đúng đúng 1 câu -> không đủ điều kiện (>= 2)
        km.chat({ id: 'binh', name: 'Bình', avatar: '', comment: dung }, tm + 1000);
        km.chat({ id: 'an', name: 'An', avatar: '', comment: dung }, tm + 3000);
        if (soLanMon === 1) km.chat({ id: 'chi', name: 'Chi', avatar: '', comment: dung }, tm + 100);
      }
      tm += km['vong'].giay * 1000;
      km.tick(tm);
      tm += GAME.chotSec * 1000;
      km.tick(tm);
    } else {
      tm += 1000;
      km.tick(tm);
    }
  }
  const dh = km.danhHieuMon().find((d) => d.mon === monTest);
  assert.ok(dh, `phải có danh hiệu cho môn ${monTest}`);
  assert.equal(dh.id, 'binh', 'cùng số câu đúng thì người nhanh hơn (Bình) giành danh hiệu môn');
  assert.equal(dh.danhHieu, GAME.mon[monTest].danhHieu);
  assert.ok(!km.danhHieuMon().some((d) => d.id === 'chi'), 'chỉ đúng 1 câu không được danh hiệu môn');
  console.log('danh hieu mon (>= 2 dung, hoa nhanh hon thang): OK');
}

// 500 người cùng trả lời 1 câu
const k2 = new KyThi(bank);
k2.cho(t);
t += GAME.choSec * 1000;
k2.tick(t);
t += GAME.vongSec * 1000;
k2.tick(t);
t += GAME.quaySec * 1000;
k2.tick(t);
k2.docXong(t);
for (let i = 0; i < 500; i++) k2.chat({ id: `u${i}`, name: `U${i}`, avatar: '', comment: 'ABCD'[i % 4] }, t + i * 10);
assert.equal(k2.view(t).soNop, 500);
assert.equal(k2.view(t).recent.length, 5);
console.log('thi.check (500 nguoi): OK');

// Đoán nam / nữ theo tên + lệnh tự chọn
import { doanGioi, lenhGioi } from './gioiTinh';
assert.equal(doanGioi('Minh_Tuan'), 'nam');
assert.equal(doanGioi('Lan Anh 🌸'), 'nu');
assert.equal(doanGioi('Hoàng Long'), 'nam');
assert.equal(doanGioi('NguyenThiAnh99'), 'nu');
assert.equal(doanGioi('Trần Văn An'), 'nam');
assert.equal(doanGioi('Khánh An'), null);
assert.equal(lenhGioi('Nữ'), 'nu');
assert.equal(lenhGioi('con trai'), 'nam');
assert.equal(lenhGioi('nam định'), null);
const k3 = new KyThi(bank);
k3.chat({ id: 'la', name: 'Lan Anh', avatar: '', comment: 'con trai' }, t);
assert.equal(k3.gioiCua({ id: 'la', name: 'Lan Anh' }), 'nam');
assert.equal(k3.gioiCua({ id: 'mt', name: 'Minh Tuấn' }), 'nam');
console.log('gioiTinh: OK');

// Câu toán tự sinh
import { sinhToan } from './toan';
for (let cap = 1; cap <= 4; cap++) {
  for (let i = 0; i < 500; i++) {
    const q = sinhToan(cap);
    assert.equal(q.mon, 'toan-nhanh');
    assert.ok(!!q.giaiThich);
    const opts = [q.right, ...q.wrong];
    assert.equal(new Set(opts).size, 4, q.q);
    assert.ok(opts.every((o) => Number(o) > 0), q.q);
    const expr = q.q.replace(' bằng bao nhiêu?', '').replace(/ rồi /g, ' ').replace(/cộng/g, '+').replace(/trừ/g, '-').replace(/nhân/g, '*').replace(/chia/g, '/');
    const tok = expr.split(' ');
    let v = Number(tok[0]);
    for (let j = 1; j < tok.length; j += 2) v = eval(`${v}${tok[j]}${tok[j + 1]}`);
    assert.equal(String(v), q.right, q.q);
  }
}
console.log('toan: OK');

// Bỏ câu: hoạt động ở cả quay/doc/hoi và không bốc lại
{
  let t2 = 5_000_000;
  const k4 = new KyThi(bank);
  k4.cho(t2);
  t2 += GAME.choSec * 1000; k4.tick(t2);
  t2 += GAME.vongSec * 1000; k4.tick(t2);
  assert.equal(k4.phase, 'quay');
  const bi = k4.cau!.q.id;
  k4.boCau(t2);
  assert.equal(k4.used[bi], Number.MAX_SAFE_INTEGER);
  for (let i = 0; i < 30; i++) { k4.batDau(t2 + i); assert.ok(!k4['cauList'].some((c: any) => c.q.id === bi)); }
  console.log('bocau: OK');
}

// Quà: gộp cùng người, quà to chen lên trước
{
  let t3 = 9_000_000;
  const k5 = new KyThi(bank);
  const q = (id: string, coins: number, count = 1) => ({ id, name: id, avatar: '', gift: 'Hoa hồng', count, coins, big: coins >= GAME.bigGiftCoins });
  k5.tangQua(q('an', 1), t3);
  k5.tangQua(q('an', 5, 5), t3 + 100);
  assert.equal(k5.qua!.count, 6);
  k5.tangQua(q('binh', 1), t3 + 200);
  k5.tangQua(q('chi', 500), t3 + 300);
  t3 += GAME.quaSec * 1000 + 1;
  k5.tick(t3);
  assert.equal(k5.qua!.id, 'chi');
  t3 += GAME.quaToSec * 1000 + 1;
  k5.tick(t3);
  assert.equal(k5.qua!.id, 'binh');
  t3 += GAME.quaSec * 1000 + 1;
  k5.tick(t3);
  assert.equal(k5.qua, null);
  for (let i = 0; i < 50; i++) k5.tangQua(q('u' + i, 1), t3);
  assert.ok(k5['quaCho'].length <= 6);
  console.log('qua: OK');
}

// Thi đua miền, cứu trợ bằng tim, Câu hỏi Trạng Nguyên (câu 16 ×2 cả cộng lẫn trừ), dấu hiệu trên tên
{
  let t4 = 20_000_000;
  const k6 = new KyThi(bank, {}, () => 0.3);
  const go = (ms: number) => { t4 += ms; k6.tick(t4); };
  k6.chat({ id: 'a', name: 'An', avatar: '', comment: 'miền Bắc' }, t4);
  k6.chat({ id: 'b', name: 'Bình', avatar: '', comment: 'Nam' }, t4);
  k6.chat({ id: 'c', name: 'Chi', avatar: '', comment: 'trung bộ' }, t4);
  assert.equal(k6.mienChon.get('b'), 'nam');
  assert.equal(k6.gioiChon.has('b'), false);
  k6.cho(t4);
  go(GAME.choSec * 1000);
  const ch = () => 'ABCD'[k6.cau!.ans];
  const kinds: string[] = [];
  for (let g = 0; g < 5000 && k6.phase !== 'vinhQuy'; g++) {
    if (k6.phase === 'doc') k6.docXong(t4);
    if (k6.phase === 'hoi') {
      if (k6.cau!.vong === 3 && !k6.view(t4).cuu?.loai.length) {
        k6.tim(GAME.cuuTroTim);
        const cu = k6.view(t4).cuu!;
        assert.equal(cu.loai.length, 2);
        assert.ok(!cu.loai.includes(k6.cau!.ans));
      }
      const diemTruocA = k6.siTu.get('a')?.diem ?? 0;
      const diemTruocC = k6.siTu.get('c')?.diem ?? 0;
      const laCau16 = k6.laLatKeo;
      if (laCau16) {
        assert.equal(k6.cauSo, 16, 'câu nhân đôi phải là câu 16');
        assert.equal(k6.cau!.q.muc, 5, 'câu 16 phải là mức 5');
      }
      k6.chat({ id: 'a', name: 'An', avatar: '', comment: ch() }, t4);
      k6.chat({ id: 'b', name: 'Bình', avatar: '', comment: 'ABCD'[(k6.cau!.ans + 1) % 4] }, t4);
      // Chi đúng 15 câu đầu rồi sai câu 16 để kiểm trừ ×2 = -500
      k6.chat({ id: 'c', name: 'Chi', avatar: '', comment: laCau16 ? 'ABCD'[(k6.cau!.ans + 1) % 4] : ch() }, t4);
      go(k6['vong'].giay * 1000);
      go(GAME.chotSec * 1000);
      if (laCau16) {
        assert.ok(k6.siTu.get('a')!.diem - diemTruocA >= 2 * k6['vong'].diem, 'câu 16 đúng ngay phải cộng >= 1000');
        assert.equal(diemTruocC - k6.siTu.get('c')!.diem, 2 * Math.round(k6['vong'].diem * GAME.saiTru), 'câu 16 sai phải trừ ×2 (500)');
      }
    } else go(1000);
    kinds.push(...k6.lay().map((e) => e.t));
  }
  assert.ok(kinds.includes('latKeo'));
  assert.ok(kinds.includes('cuuTro'));
  const m = k6.diemMien();
  assert.ok(m.bac.diem > 0 && m.nam.diem === 0 && m.bac.nguoi === 1);
  const an = k6.bxh(3).find((h) => h.id === 'a')!;
  assert.equal(an.mien, 'bac');
  assert.ok(an.chuoi >= 3);
  // ván sau: An mang dấu Trạng Nguyên ván trước
  go(GAME.vinhQuySec * 1000);
  go(GAME.choSec * 1000);
  go(GAME.vongSec * 1000);
  go(GAME.quaySec * 1000);
  k6.docXong(t4);
  k6.chat({ id: 'a', name: 'An', avatar: '', comment: ch() }, t4);
  go(k6['vong'].giay * 1000);
  go(GAME.chotSec * 1000);
  assert.equal(k6.bxh(5).find((h) => h.id === 'a')!.trangTruoc, true);
  console.log('mien + cuuTro + cau 16 x2 + dau hieu: OK');
}

// Ông đồ trêu
import { loaiCmt, Treu } from './treu';
{
  assert.equal(loaiCmt('Khó quá!!'), 'kho');
  assert.equal(loaiCmt('dễ quá'), 'de');
  assert.equal(loaiCmt('chào ông đồ'), 'chao');
  assert.equal(loaiCmt('hi'), 'chao');
  assert.equal(loaiCmt('hiểu rồi'), null);
  assert.equal(loaiCmt('hahaha'), 'cuoi');
  assert.equal(loaiCmt('ông ơi gợi ý đi'), 'goiY');
  assert.equal(loaiCmt('B'), null);
  assert.equal(loaiCmt('câu này khó quá mà tôi nghĩ mãi không ra nổi'), null);
  const tr = new Treu(180_000, 12_000);
  tr.them('a', 'An', 'kho', 0);
  tr.them('a', 'An', 'de', 100);
  assert.equal(tr.lay(1000)?.name, 'An');
  tr.them('a', 'An', 'kho', 2000);
  tr.them('b', 'Bình', 'cuoi', 2000);
  assert.equal(tr.lay(5000), null);
  assert.equal(tr.lay(14_000)?.name, 'Bình');
  assert.equal(tr.lay(40_000), null);
  console.log('treu: OK');
}

// Cổ vũ, thách thức
{
  let t5 = 30_000_000;
  const k7 = new KyThi(bank, {}, Math.random);
  const go = (ms: number) => { t5 += ms; k7.tick(t5); };
  k7.chat({ id: 'a', name: 'An', avatar: '', comment: 'Bắc' }, t5);
  k7.chat({ id: 'b', name: 'Bình', avatar: '', comment: 'Trung' }, t5);
  k7.cho(t5);
  go(GAME.choSec * 1000);
  const ev: any[] = [];
  let n = 0;
  for (let g = 0; g < 5000 && k7.phase !== 'vinhQuy'; g++) {
    if (k7.phase === 'doc') k7.docXong(t5);
    if (k7.phase === 'hoi') {
      n++;
      const dung = 'ABCD'[k7.cau!.ans];
      const sai = 'ABCD'[(k7.cau!.ans + 1) % 4];
      k7.chat({ id: 'a', name: 'An', avatar: '', comment: n <= 5 ? dung : sai }, t5);
      k7.chat({ id: 'b', name: 'Bình', avatar: '', comment: n <= 5 ? sai : dung }, t5);
      go(k7['vong'].giay * 1000);
      go(GAME.chotSec * 1000);
    } else go(1000);
    ev.push(...k7.lay());
  }
  assert.ok(ev.some((e) => e.t === 'dauBang' && e.name === 'Bình'), 'hô đổi ngôi khi Bình vượt An');
  assert.ok(ev.some((e) => e.t === 'mienKem' && e.mien === 'trung'), 'cổ vũ miền Trung lúc đang thua');
  const thach = ev.filter((e) => e.t === 'thach').length;
  assert.ok(thach >= 1 && thach <= 14, `số câu thách ${thach}`);
  console.log('co vu + thach thuc: OK');
}

console.log('ALL CHECKS PASSED!');
