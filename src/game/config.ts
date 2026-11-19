// =====================================================
//  CẤU HÌNH GAME "AI LÀ TRẠNG NGUYÊN – MÙA 2: TRẠNG NGUYÊN MUÔN MÔN"
//  Thay đổi nhỏ (thời gian, điểm, lời ông đồ, màu môn) chỉ cần sửa file này.
//  Câu đọc: `name` = tên người xem (đã làm sạch), `kenh` = tên kênh (ô "Tên kênh" ở trang điều khiển)
// =====================================================

import type { WishTopic } from '../live/chatter';

// Nhóm câu trong các file cũ src/game/cau-hoi/*.txt (kho dự phòng):
//   [de] -> mức 1 · [vua] -> mức 2 · [kho] -> mức 3 · [dinh] -> mức 4–5 · [meo] -> Đố mẹo (3–5)
export type Level = 'de' | 'vua' | 'kho' | 'dinh' | 'meo';

// 5 mức độ khó Mùa 2
export type Muc = 1 | 2 | 3 | 4 | 5;

// 7 môn chính + Đố mẹo + Toán nhanh (tự sinh ở Kỳ 2)
export type MonId =
  | 'lich-su'
  | 'dia-ly'
  | 'khoa-hoc'
  | 'hoa-hoc'
  | 'van-hoc'
  | 'van-hoa'
  | 'xa-hoi'
  | 'do-meo'
  | 'toan-nhanh';

export type MonDanhHieuId = Exclude<MonId, 'toan-nhanh'>;

export interface MonInfo {
  id: MonId;
  ten: string;
  tenNgan: string;
  danhHieu?: string;
  emoji: string;
  mau: string; // màu viền / nhấn chính
  mauSang: string; // màu chữ / phát sáng
  nen: string; // màu nền khung bảng đen theo môn
  glow: string; // bóng sáng
  wheelColor: string; // màu múi vòng quay
}

export interface Vong {
  ten: string; // đọc + hiện ở bảng
  nhan: string; // nhãn ngắn trên tab
  cau: number; // số câu trong kỳ (4 câu)
  giay: number; // thời gian trả lời mỗi câu
  diem: number; // điểm tối đa khi đúng ngay giây đầu
  muc: Muc[]; // độ khó từng câu trong kỳ (không giảm dần)
  toan?: { viTri: number; cap: number; muc: Muc }; // vị trí câu toán tự sinh (0-based)
}

export const MON_LIST: MonDanhHieuId[] = [
  'lich-su',
  'dia-ly',
  'khoa-hoc',
  'hoa-hoc',
  'van-hoc',
  'van-hoa',
  'xa-hoi',
  'do-meo',
];

export const MON_INFO: Record<MonId, MonInfo> = {
  'lich-su': {
    id: 'lich-su',
    ten: 'Lịch sử',
    tenNgan: 'Sử',
    danhHieu: 'Trạng Sử',
    emoji: '📜',
    mau: '#dc2626',
    mauSang: '#fca5a5',
    nen: 'rgba(42, 11, 9, 0.84)',
    glow: 'rgba(239, 68, 68, 0.55)',
    wheelColor: '#b91c1c',
  },
  'dia-ly': {
    id: 'dia-ly',
    ten: 'Địa lý',
    tenNgan: 'Địa',
    danhHieu: 'Trạng Địa',
    emoji: '🌍',
    mau: '#0d9488',
    mauSang: '#5eead4',
    nen: 'rgba(7, 30, 30, 0.84)',
    glow: 'rgba(45, 212, 191, 0.50)',
    wheelColor: '#0f766e',
  },
  'khoa-hoc': {
    id: 'khoa-hoc',
    ten: 'Khoa học',
    tenNgan: 'Khoa',
    danhHieu: 'Trạng Khoa',
    emoji: '⚛️',
    mau: '#2563eb',
    mauSang: '#93c5fd',
    nen: 'rgba(10, 20, 44, 0.85)',
    glow: 'rgba(96, 165, 250, 0.55)',
    wheelColor: '#1d4ed8',
  },
  'hoa-hoc': {
    id: 'hoa-hoc',
    ten: 'Hóa học',
    tenNgan: 'Hóa',
    danhHieu: 'Trạng Hóa',
    emoji: '🧪',
    mau: '#16a34a',
    mauSang: '#86efac',
    nen: 'rgba(10, 32, 18, 0.84)',
    glow: 'rgba(74, 222, 128, 0.55)',
    wheelColor: '#15803d',
  },
  'van-hoc': {
    id: 'van-hoc',
    ten: 'Văn học',
    tenNgan: 'Văn',
    danhHieu: 'Trạng Văn',
    emoji: '🪶',
    mau: '#9333ea',
    mauSang: '#e9d5ff',
    nen: 'rgba(32, 12, 42, 0.85)',
    glow: 'rgba(216, 180, 254, 0.50)',
    wheelColor: '#7e22ce',
  },
  'van-hoa': {
    id: 'van-hoa',
    ten: 'Văn hóa',
    tenNgan: 'Văn hóa',
    danhHieu: 'Trạng Phong Tục',
    emoji: '🏮',
    mau: '#d97706',
    mauSang: '#fde68a',
    nen: 'rgba(38, 20, 6, 0.84)',
    glow: 'rgba(251, 191, 36, 0.55)',
    wheelColor: '#b45309',
  },
  'xa-hoi': {
    id: 'xa-hoi',
    ten: 'Xã hội',
    tenNgan: 'Xã hội',
    danhHieu: 'Trạng Đời',
    emoji: '🧭',
    mau: '#0284c7',
    mauSang: '#7dd3fc',
    nen: 'rgba(8, 26, 42, 0.85)',
    glow: 'rgba(56, 189, 248, 0.52)',
    wheelColor: '#0369a1',
  },
  'do-meo': {
    id: 'do-meo',
    ten: 'Đố mẹo',
    tenNgan: 'Mẹo',
    danhHieu: 'Trạng Mẹo',
    emoji: '💡',
    mau: '#e11d48',
    mauSang: '#fda4af',
    nen: 'rgba(44, 10, 24, 0.85)',
    glow: 'rgba(251, 113, 133, 0.60)',
    wheelColor: '#be123c',
  },
  'toan-nhanh': {
    id: 'toan-nhanh',
    ten: 'Toán nhanh',
    tenNgan: 'Toán',
    emoji: '🧮',
    mau: '#ea580c',
    mauSang: '#fdba74',
    nen: 'rgba(40, 18, 6, 0.85)',
    glow: 'rgba(251, 146, 60, 0.55)',
    wheelColor: '#c2410c',
  },
};

export const GAME = {
  title: 'Ai Là Trạng Nguyên – Mùa 2',
  // mặc định khi trang điều khiển để trống
  tieuDeMacDinh: 'AI LÀ TRẠNG NGUYÊN', // chữ trên mái tranh
  tenOngDoMacDinh: 'Ông Đồ', // bảng tên trên đầu ông đồ
  defaultChannelName: 'kênh mình',

  // Bộ nhận diện các môn học
  mon: MON_INFO,
  monQuay: MON_LIST,
  monDanhHieu: MON_LIST,

  // Ảnh nền theo 4 kỳ thi (kỳ 1 Khảo hạch giữ nen2.jpg)
  nenKy: [
    '/assets/bg/nen2.jpg',
    '/assets/bg/nen-thi-huong.jpg',
    '/assets/bg/nen-thi-hoi.jpg',
    '/assets/bg/nen-thi-dinh.jpg',
  ],

  // Đồ trang trí theo kỳ thi: khai báo toạ độ, kích thước, hiệu ứng chuyển động
  trangTri: [
    // Kỳ 2 (Thi Hương): cờ ngũ sắc mép mái và đôi lọng đỏ 2 bên ngoài mép bảng đen
    {
      id: 'co-ngu-sac',
      src: '/assets/trang-tri/co-ngu-sac.webp',
      ky: 1,
      kyHet: 1,
      left: 100,
      top: 405,
      width: 880,
      height: 95,
      className: 'co-bay',
      zIndex: 6,
    },
    {
      id: 'long-do-trai',
      src: '/assets/trang-tri/long-do.webp',
      ky: 1,
      kyHet: 1,
      left: 105,
      top: 480,
      width: 105,
      height: 230,
      className: 'long-dua',
      zIndex: 6,
    },
    {
      id: 'long-do-phai',
      src: '/assets/trang-tri/long-do.webp',
      ky: 1,
      kyHet: 1,
      left: 870,
      top: 480,
      width: 105,
      height: 230,
      flipX: true,
      className: 'long-dua',
      zIndex: 6,
    },
  ],

  // ---------- Luật thi Mùa 2: 4 kỳ × 4 câu = 16 câu, 5 mức độ khó ----------
  vong: [
    { ten: 'Khảo hạch trường làng', nhan: 'KHẢO HẠCH', cau: 4, giay: 10, diem: 100, muc: [1, 1, 2, 2] },
    { ten: 'Thi Hương', nhan: 'THI HƯƠNG', cau: 4, giay: 15, diem: 200, muc: [2, 2, 3, 3], toan: { viTri: 2, cap: 2, muc: 3 } },
    { ten: 'Thi Hội', nhan: 'THI HỘI', cau: 4, giay: 20, diem: 300, muc: [3, 3, 4, 4] },
    { ten: 'Thi Đình', nhan: 'THI ĐÌNH', cau: 4, giay: 25, diem: 500, muc: [4, 4, 5, 5] },
  ] as Vong[],
  monMaxMoiVan: 3, // mỗi môn tối đa 3 câu trong 1 ván
  doMeoMaxMoiVan: 2, // đố mẹo tối đa 2 câu trong 1 ván
  doMeoTuKy: 2, // 0-based: đố mẹo chỉ xuất hiện từ Kỳ 3 (Thi Hội) và Kỳ 4 (Thi Đình)
  danhHieuMonToiThieu: 2, // đúng ít nhất 2 câu cùng môn mới được phong Trạng chuyên môn

  saiTru: 0.5, // sai bị trừ nửa điểm tối đa của kỳ; tổng điểm không xuống dưới 0
  diemSan: 0.5, // đúng sát giờ vẫn được 50% điểm tối đa
  latKeoNhan: 2, // câu cuối (câu 16 - Câu hỏi Trạng Nguyên): điểm cộng và trừ đều nhân đôi
  cuuTroTim: 200, // Thi Đình: cả phòng thả đủ chừng này tim thì loại 2 đáp án sai
  thachTiLe: 0.35, // bao nhiêu phần câu hỏi ông đồ thách thức trước khi đọc đề
  dauBangCach: 3, // đổi ngôi đầu bảng: cách ít nhất 3 câu mới hô lại
  mienCach: 5, // cổ vũ phe miền đang thua: 5 câu 1 lần
  chuoiMoi: 3, // đúng liền 3 câu thì thưởng
  chuoiThuong: 100,
  earlySendGraceMs: 500, // gửi trước lúc hiện đáp án quá 0,5 giây thì không tính (không mất lượt)

  // ---------- Nhịp (giây) ----------
  choSec: 15, // đếm ngược trước ván mới
  vongSec: 5, // bảng giới thiệu kỳ thi
  quaySec: 2.4, // vòng quay môn học (~2 giây quay + dừng ngắn khoe môn)
  docMaxSec: 28, // giọng đọc đề hỏng thì tối đa chừng này giây là tự hiện đáp án
  chotSec: 2.6, // "Hết giờ!" + trống dồn trước khi công bố
  dapAnSec: 7, // công bố đáp án (câu cũ không có Bạn có biết)
  dapAnGiaiThichSec: 11, // công bố đáp án + thẻ Bạn có biết để ông đồ đọc trọn
  bangVangSec: 9, // hết mỗi kỳ hiện top 20 + danh hiệu môn
  vinhQuySec: 18, // màn vinh quy tam khôi + phong Trạng chuyên môn

  // Danh hiệu theo hạng trong ván
  danhHieu: (hang: number) =>
    hang === 1 ? 'Trạng Nguyên'
    : hang === 2 ? 'Bảng Nhãn'
    : hang === 3 ? 'Thám Hoa'
    : hang <= 10 ? 'Tiến sĩ'
    : hang <= 15 ? 'Cử nhân'
    : hang <= 20 ? 'Tú tài'
    : 'Sĩ tử',

  // ---------- Lời quan chủ khảo (ông đồ hóm hỉnh, hay trêu sĩ tử) ----------
  // Thẻ cảm xúc của giọng VieNeu: [cười] [thở dài] [hắng giọng]. Giọng Edge tự bỏ thẻ, không đọc ra.
  loi: {
    cho: [
      '[hắng giọng] Trường thi Muôn Môn sắp mở cửa! Mười sáu câu qua tám môn học, gõ A, B, C hoặc D để tranh ngôi Trạng Nguyên.',
      'Ván mới sắp bắt đầu rồi đây. Quay trúng môn nào thi môn nấy, đúng càng nhanh điểm càng cao nhé. [cười]',
      'Ai vừa vào thì nghe ông dặn này: gõ A, B, C hoặc D là thành sĩ tử luôn, ai giỏi môn nào còn được phong Trạng môn đó nữa đấy. [cười]',
    ],
    vong: [
      [
        '[hắng giọng] Khảo hạch trường làng bắt đầu! Bốn câu khởi động, mười giây một câu, gõ A, B, C hoặc D nhé.',
        'Vào khảo hạch trường làng nào. Bốn câu làm nóng tay, ai sai là ông trêu cả làng nghe đấy. [cười]',
      ],
      [
        'Qua được làng rồi, giờ lên thi Hương! Bốn câu, mười lăm giây mỗi câu, có cả thử thách Toán nhanh đấy nhé.',
        '[hắng giọng] Thi Hương bắt đầu! Từ đây câu hỏi khó dần rồi, giữ bình tĩnh mà bấm.',
      ],
      [
        'Vào thi Hội! Bốn câu cam go, sai là trừ một trăm năm mươi điểm, lại bắt đầu có cả Đố mẹo nữa đấy.',
        '[hắng giọng] Thi Hội đây. Nghĩ kỹ rồi hãy gõ, coi chừng dính bẫy đố mẹo của ông nhé. [cười]',
      ],
      [
        '[hắng giọng] Thi Đình! Bốn câu cuối cùng, mỗi câu năm trăm điểm, câu mười sáu là Câu hỏi Trạng Nguyên nhân đôi điểm!',
        'Đây là thi Đình rồi. Cả trường thả tim đủ hai trăm là được cứu trợ, cố lên nào!',
      ],
    ],
    // Giới thiệu môn khi vòng quay dừng (ngắn gọn, tạo giọng trước từ đầu)
    gioiThieuMon: {
      'lich-su': [
        '[hắng giọng] Vòng quay dừng ở Lịch sử! Để xem sĩ tử nhớ sử nước nhà tới đâu.',
        'Môn Lịch sử lên sàn! Mở cuộn sử xưa ra thi nào.',
      ],
      'dia-ly': [
        'Trúng ngay Địa lý! Ai hay đi du lịch màn ảnh nhỏ thì trổ tài đi. [cười]',
        '[hắng giọng] Môn Địa lý! Non sông đất nước, để xem ai rành nhất.',
      ],
      'khoa-hoc': [
        'Vòng quay gọi tên Khoa học! Câu này thử độ tò mò của cả trường.',
        '[hắng giọng] Môn Khoa học! Khám phá bí ẩn tự nhiên nào các sĩ tử.',
      ],
      'hoa-hoc': [
        'Bình thí nghiệm sủi bọt rồi, môn Hóa học! Ai hay ngủ gật giờ hóa thì cẩn thận nhé. [cười]',
        '[hắng giọng] Môn Hóa học! Phản ứng cho nhanh nhưng đừng đoán bừa.',
      ],
      'van-hoc': [
        'Trúng môn Văn học! Đến lượt các thi sĩ trường làng tỏa sáng rồi đây.',
        '[cười] Môn Văn học lên tiếng! Câu chữ mượt mà, đọc cho thật kỹ nhé.',
      ],
      'van-hoa': [
        'Đèn lồng sáng rồi, môn Văn hóa! Phong tục quê hương, ai rành thì ghi điểm.',
        '[hắng giọng] Môn Văn hóa! Nét đẹp dân gian mình nằm lòng cả chứ?',
      ],
      'xa-hoi': [
        'Vòng quay dừng ở Xã hội! Kiến thức đời sống đây, xem ai lanh lợi nhất.',
        '[cười] Môn Xã hội! Chuyện quanh ta hằng ngày, tưởng dễ mà hay bất ngờ lắm đấy.',
      ],
      'do-meo': [
        '[cười] Ôi chà, trúng Đố mẹo rồi! Đừng nghĩ thẳng quá kẻo sập bẫy của ông nhé.',
        'Môn Đố mẹo xuất hiện! Cả trường cẩn thận, câu này xoắn não lắm đấy. [cười]',
      ],
      'toan-nhanh': [
        '[hắng giọng] Thử thách Toán nhanh! Cất máy tính đi, nhẩm bằng đầu mới oai nhé. [cười]',
        'Trúng Toán nhanh rồi! Ai nhẩm siêu nhất trường thi, lên tiếng ngay nào.',
      ],
    } as Record<MonId, string[]>,
    // Câu cuối cùng (câu 16): Câu hỏi Trạng Nguyên mức 5, nhân đôi điểm
    latKeo: [
      '[hắng giọng] Câu hỏi Trạng Nguyên! Câu cuối cùng mức năm, điểm cộng và trừ đều nhân đôi! Ai bản lĩnh thì bứt phá ngay bây giờ!',
      '[hắng giọng] Đã tới Câu hỏi Trạng Nguyên rồi! Mức khó nhất, đúng được gấp đôi điểm, sai cũng mất gấp đôi. Cả trường tập trung cao độ!',
    ],
    // Xướng danh các Trạng chuyên môn ở màn Vinh Quy
    xungDanhMon: (ds: { danhHieu: string; name: string }[]) => {
      if (!ds.length) return '';
      const noi = ds.slice(0, 5).map((x) => `${x.danhHieu} gọi tên ${x.name}`).join('. ');
      return `[cười] Xin phong danh hiệu chuyên môn: ${noi}. Quá xuất sắc!`;
    },
    // hết giờ, trống dồn: câu chung nên giọng được tạo sẵn từ đầu buổi
    hetGio: ['Hết giờ! Đáp án đúng là...', 'Hết giờ rồi! Và đáp án chính xác là...', 'Dừng bút! Đáp án đúng là...'],
    // giục giữa giờ
    nhac: [
      'Nhanh tay lên các sĩ tử!',
      'Ai chưa nộp bài thì gõ đi nào!',
      'Thời gian không chờ đợi ai đâu nhé!',
      '[cười] Nghĩ kỹ chưa đấy?',
      'Cố lên các sĩ tử, sai thì câu sau gỡ lại!',
      'Không chắc thì loại dần đáp án sai đi, còn kịp đấy!',
      'Cả trường cố lên nào, ông đang nhìn đây!',
      '[cười] Ai đang phân vân thì suy luận thử xem, đừng bỏ trống nhé.',
    ],
    // thách thức trước khi đọc đề
    thach: [
      'Câu này mà ai đúng thì ông xin bái phục!',
      '[cười] Câu tiếp theo hơi xoắn não đấy, tập trung vào!',
      'Sĩ tử nào tự nhận là giỏi thì chứng minh ở câu này đi!',
      'Ông đoán câu này cả trường sẽ chia làm bốn phe. Thử xem nào!',
      'Ai trả lời đúng câu này nhanh nhất, ông khen cả buổi!',
      '[hắng giọng] Câu này phân biệt sĩ tử với trạng nguyên đây!',
      'Nghe kỹ nhé, câu này ông ra để thử bản lĩnh.',
      'Câu này dễ hay khó là tùy người đấy. [cười] Ông thì thấy dễ.',
    ],
    // có người vượt lên dẫn đầu ván
    dauBang: [
      (n: string) => `${n} vừa vượt lên dẫn đầu! Ai muốn giành lại thì nhanh tay lên!`,
      (n: string) => `[cười] Ngôi đầu đổi chủ rồi, giờ là ${n}! Bảng vàng gay cấn quá.`,
      (n: string) => `${n} lên đỉnh bảng vàng rồi. Có ai dám thách đấu không?`,
      (n: string) => `Cả trường ơi, ${n} đang ngồi ghế đầu. Kéo xuống đi chứ!`,
    ],
    // phe miền đang thua điểm
    mienKem: [
      (m: string, goi: string) => `Phe ${m} đang bị bỏ lại phía sau, cố lên nào! Ai chưa chọn phe thì gõ ${goi}.`,
      (m: string, goi: string) => `Bà con ${m} đâu cả rồi? Gõ ${goi} vào phe, kéo điểm lên đi!`,
      (m: string) => `[cười] ${m} ơi, điểm thấp nhất trường rồi đấy. Gỡ lại đi chứ!`,
    ],
    // cổ vũ người xếp sau, đọc thêm ở bảng vàng
    coVuSau: [
      'Ai đang xếp sau đừng nản, câu phía sau điểm cao lắm!',
      'Còn cơ hội lội ngược dòng, cố lên các sĩ tử!',
      'Bảng vàng còn đổi chỗ dài dài, chưa ai chắc đỗ đâu.',
    ],
    // gần như cả trường đúng
    deQua: [
      (n: number, name: string) => `[cười] Dễ quá phải không! ${n} người đúng, nhanh nhất là ${name}.`,
      (n: number, name: string) => `Cả trường thi đúng gần hết! Nhanh tay nhất là ${name}.`,
    ],
    // bình thường
    dungNhieu: [
      (n: number, name: string) => `${n} người trả lời đúng, nhanh nhất là ${name}.`,
      (n: number, name: string) => `Có ${n} người đúng. ${name} bấm nhanh nhất câu này, giỏi!`,
    ],
    // ít người đúng
    itDung: [
      (n: number, name: string) => `Ối giời ơi, câu này lừa được cả khối người! Chỉ ${n} người đúng, nhanh nhất là ${name}.`,
      (n: number, name: string) => `[cười] Câu này đánh rơi khối sĩ tử nhé. Có ${n} người đúng thôi, đứng đầu là ${name}.`,
    ],
    dungMot: [
      (name: string) => `Cả trường thi chỉ mình ${name} đúng! [cười] Nhân tài đây chứ đâu.`,
      (name: string) => `Một mình ${name} trả lời đúng, ông phải ghi tên vào sổ mới được.`,
    ],
    khongAi: [
      '[thở dài] Không ai đúng câu nào. Sĩ tử bây giờ lười đọc sách quá.',
      '[thở dài] Câu này ông hỏi cả trường mà không ai trả lời được. Thôi, nghe ông giải thích rồi sang câu khác.',
    ],
    // người nhanh nhất đúng trong 2 giây đầu
    thanDong: [
      (name: string) => `${name} mới nhìn đề đã trả lời, đúng là thần đồng!`,
      (name: string) => `[cười] ${name} nhanh như chớp, ông còn chưa kịp vuốt râu.`,
    ],
    bangVang: [
      (vong: string, name: string) => `Hết ${vong}. Đứng đầu bảng vàng lúc này là ${name}. Ai muốn giật ngôi thì cố lên!`,
      (vong: string, name: string) => `Xong ${vong}. ${name} đang dẫn đầu, [cười] nhưng chưa đỗ Trạng đâu, đừng vội mừng.`,
    ],
    bangVangTrong: (vong: string) => `Hết ${vong}. Bảng vàng vẫn trống, ai vào thi đi chứ!`,
    vinhQuy: (tn: string, bn?: string, th?: string) =>
      `[cười] Xin chúc mừng ${tn} đỗ Trạng Nguyên!` +
      (bn ? ` Bảng Nhãn là ${bn}.` : '') +
      (th ? ` Thám Hoa là ${th}.` : '') +
      ' Vinh quy bái tổ thôi, cả làng ra đón nào!',
    tuanDau: [
      (name: string) => `Tuần này ${name} đang đứng đầu bảng vàng, ai muốn vượt thì vào thi đi!`,
      (name: string) => `Bảng vàng tuần vẫn gọi tên ${name}. [cười] Có ai dám tranh ngôi không?`,
    ],
    cuuTro: [
      '[cười] Cả trường thả tim đủ rồi! Ông bỏ giúp hai đáp án sai nhé.',
      'Tim đầy rồi! Ông đồ ra tay, loại bớt hai đáp án sai cho cả phòng.',
    ],
    mienThang: (mien: string, diem: number) => `Phe ${mien} thắng ván này với ${diem} điểm! Ai chưa chọn phe thì gõ Bắc, Trung hoặc Nam nhé.`,
    // Trêu / đáp bình luận vào khoảng lặng (KHÔNG đọc nguyên văn bình luận). vong = tên kỳ thi đang thi
    treu: {
      kho: [
        (n: string, vong: string) => `${n} than khó à? Mới ${vong} thôi đấy, lên thi Đình còn khó nữa cơ. [cười]`,
        (n: string) => `${n} kêu khó, ông nghe thấy rồi nhé. Học đâu chắc đó, thi đâu đỗ đó!`,
      ],
      de: [
        (n: string) => `${n} chê dễ hả? Được, câu sau ông cho khó hơn. [cười]`,
        (n: string) => `Dễ thì ${n} trả lời nhanh lên cho ông xem nào!`,
      ],
      chao: [
        (n: string) => `Chào ${n}! Vào thi luôn đi, gõ A, B, C hoặc D là được.`,
        (n: string) => `À ${n} đến rồi. Mài mực đi, sắp có câu hỏi đấy.`,
      ],
      goiY: [
        (n: string) => `${n} xin gợi ý à? [cười] Trường thi không có quay cóp đâu nhé!`,
        (n: string) => `Ông không nhắc bài đâu ${n}. Đến thi Đình thả tim thì cả phòng được cứu trợ.`,
      ],
      cuoi: [
        (n: string) => `${n} cười gì đấy? Trả lời đúng chưa mà cười. [cười]`,
        (n: string) => `Nghe ${n} cười là biết vừa trả lời đúng rồi.`,
      ],
      yeu: [
        (n: string) => `Cảm ơn ${n} nhé, ông đồ vui lắm. [cười]`,
        (n: string) => `${n} khen thế thì ông phải ra câu hay hơn mới được.`,
      ],
      sai: [
        (n: string) => `[thở dài] ${n} sai ba câu liền rồi. Bình tĩnh, đọc kỹ đề rồi hãy gõ nhé.`,
        (n: string) => `${n} ơi, ba câu liền chưa trúng câu nào. [cười] Câu sau phải gỡ lại đấy!`,
      ],
    },
    khongAiThi: '[thở dài] Ván này trường thi vắng tanh. Ván sau mọi người vào thi cho vui nhé.',
  },

  // ---------- Chào người vào ----------
  greetEveryMs: 8000,
  namesPerGreeting: 3,
  greeting: (names: string) => `Chào ${names} vào trường thi.`,

  // ---------- Cảm ơn quà (quà KHÔNG cho lợi thế gì trong game) ----------
  giftThanksCooldownMs: 30_000,
  quaSec: 4, // băng rôn cảm ơn quà nhỏ hiện bao lâu
  quaToSec: 8, // quà to (từ bigGiftCoins xu)
  tuanTop: 10, // bảng vàng tuần hiện bao nhiêu người
  soTre: 6, // số đứa trẻ chạy lên chạy xuống lối giữa sân (mang tên người chưa có ghế)
  soGhe: 31, // số chỗ ngồi sĩ tử trong sân thi (toạ độ bàn ở HANG trong GameStage.tsx)
  bigGiftCoins: 99,
  thankGift: (name: string, gift: string, kenh: string) => `${kenh} cảm ơn ${name} đã tặng ${gift}.`,
  giftMenu: [
    {
      xu: 1, icon: '🌹', ten: 'Hoa hồng', viec: 'Tặng ông đồ bông hoa',
      cam: [
        (n: string) => `${n} tặng ông bông hồng. [cười] Ông cắm ngay lên nghiên mực đây.`,
        (n: string) => `Hoa của ${n} thơm quá, ông đồ dạy học bao năm mới được tặng hoa đấy.`,
      ],
    },
    {
      xu: 5, icon: '🫰', ten: 'Bắn tim', viec: 'Bắn tim cho ông đồ',
      cam: [
        (n: string) => `Ối, ${n} bắn trúng tim ông rồi! [cười] Già rồi mà vẫn rung rinh.`,
        (n: string) => `${n} bắn tim cho ông, ông nhận nhé. Thi tiếp cho vui nào!`,
      ],
    },
    {
      xu: 10, icon: '🐷', ten: 'Chú heo may mắn', viec: 'Góp heo đất trường thi',
      cam: [
        (n: string) => `${n} góp heo đất cho trường thi. Ông chúc ${n} học đâu nhớ đó!`,
        (n: string) => `[cười] Chú heo của ${n} béo tròn thế này, cả trường thi được lộc rồi.`,
      ],
    },
    {
      xu: 100, icon: '🎆', ten: 'Thả tim', viec: 'Bắn pháo hoa mừng sĩ tử',
      cam: [
        (n: string) => `${n} bắn pháo hoa mừng cả trường thi! Ông đồ xin vái tạ ơn tấm lòng.`,
        (n: string) => `Pháo hoa của ${n} sáng rực cả làng rồi. [cười] Sĩ tử nào cũng được ăn mừng ké nhé!`,
      ],
    },
  ],
  giftWishes: ['Chúc bạn thi đâu đỗ đó.', 'Chúc bạn một ngày thật vui.', 'Chúc bạn làm gì cũng suôn sẻ nha.'],

  thankFollow: (name: string, kenh: string) => `${kenh} cảm ơn ${name} đã theo dõi kênh nha.`,

  // Comment có lời cầu chúc: đọc 1 câu chúc soạn sẵn, KHÔNG BAO GIỜ đọc nguyên văn comment
  wishPerUserMs: 10 * 60_000,
  wishGlobalMs: 20_000,
  wishReplies: {
    exam: [
      (name: string) => `Chúc ${name} ôn bài vô đầu, vào phòng thi thật bình tĩnh.`,
      (name: string) => `Chúc ${name} học đâu nhớ đó, thi đâu đỗ đó.`,
    ],
    health: [(name: string) => `Chúc ${name} với người nhà mau khỏe, ăn ngon ngủ yên.`],
    love: [(name: string) => `Chúc ${name} sớm gặp người thương mình thật lòng.`],
    family: [(name: string) => `Chúc nhà ${name} luôn êm ấm, ai cũng khỏe.`],
    work: [(name: string) => `Chúc ${name} công việc thuận lợi, sớm được như ý.`],
    wealth: [(name: string) => `Chúc ${name} làm ăn phát đạt, tiền vô đều tay.`],
    peace: [(name: string) => `Chúc ${name} mọi chuyện bình an, thuận lợi.`],
  } as Record<WishTopic, ((name: string) => string)[]>,

  // Nhắc chia sẻ live mỗi 5 phút
  shareReminderEveryMs: 5 * 60_000,
  shareLines: [
    'Ai thấy vui thì bấm chia sẻ live, rủ bạn bè vào thi cùng nha.',
    'Rủ thêm bạn vào thi cho đông, bấm chia sẻ live giúp kênh nhé.',
  ],
};
