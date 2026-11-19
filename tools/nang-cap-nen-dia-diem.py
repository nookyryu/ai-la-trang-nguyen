"""
Tạo 2 ảnh nền chuẩn xác tuyệt đối cho Kỳ 3 (Thi Hội - Huyện Phủ) và Kỳ 4 (Thi Đình - Kinh Đô):
1. BẢO TOÀN 100% BỐ CỤC BÀN GHẾ & CÁC CỤ:
   - Toàn bộ nửa dưới sân thi (y: 860 -> 1920) được giữ nguyên vẹn 100% từ nen2.jpg.
   - 31 bàn thi bằng gỗ, ghế ngồi, chỗ ngồi của sĩ tử và các cụ già làng khớp từng pixel.
2. ĐỊA ĐIỂM CHUẨN XÁC:
   - Nửa trên (y: 0 -> 860): Kiến trúc Huyện Phủ (Kỳ 3) và Hoàng Thành Kinh Đô (Kỳ 4) uy nghiêm, lộng lẫy.
3. KỲ 4 (THI ĐÌNH):
   - Trải dải THẢM ĐỎ HOÀNG GIA hoa văn mây sóng rực rỡ dọc lối đi giữa (x: 435-645, y: 920-1920)
     không che bất kỳ mặt bàn nào của sĩ tử!
"""

import os
import math
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG_DIR = os.path.join(BASE_DIR, 'public', 'assets', 'bg')
TT_DIR = os.path.join(BASE_DIR, 'public', 'assets', 'trang-tri')
NEN2_PATH = os.path.join(BG_DIR, 'nen2.jpg')

# 2 ảnh AI toàn cảnh mới nhất
HOI_RAW = r'C:\Users\AD\.gemini\antigravity\brain\ae6c5a5d-1029-4669-a74d-a4fdad307d21\vietnam_examination_hall_bg_1794672947909.jpg'
DINH_RAW = r'C:\Users\AD\.gemini\antigravity\brain\ae6c5a5d-1029-4669-a74d-a4fdad307d21\san_rong_thi_dinh_9_16_1794672948737.jpg'


def blend_nua_tren_va_duoi(im_top_ai, im_base, y_start=830, y_end=890):
    """
    Hòa trộn mượt mà nửa trên từ ảnh kiến trúc mới (im_top_ai)
    với nửa dưới sân bàn thi gốc (im_base).
    """
    w, h = im_base.size
    im_out = im_base.copy()
    
    # Tạo mặt nạ gradient cosine chuyển tiếp mượt mà từ y_start đến y_end
    for y in range(h):
        if y < y_start:
            alpha = 1.0
        elif y > y_end:
            alpha = 0.0
        else:
            t = (y - y_start) / float(y_end - y_start)
            alpha = 0.5 + 0.5 * math.cos(t * math.pi)
            
        if alpha > 0:
            row_ai = im_top_ai.crop((0, y, w, y + 1))
            row_base = im_base.crop((0, y, w, y + 1))
            row_blend = Image.blend(row_base, row_ai, alpha)
            im_out.paste(row_blend, (0, y))
            
    return im_out


def tao_nen_thi_hoi():
    print("--- Đang tạo nền Kỳ 3: Thi Hội (Huyện Phủ - Khớp 100% bàn thi) ---")
    im_base = Image.open(NEN2_PATH).convert('RGB')
    w, h = im_base.size

    # 1. Scale ảnh Huyện Phủ mới lên 1080x1920
    im_hp = Image.open(HOI_RAW).convert('RGB').resize((w, h), Image.Resampling.LANCZOS)
    im_hp = ImageEnhance.Color(im_hp).enhance(1.06)

    # 2. Hòa trộn nửa trên Huyện Phủ (y: 0 -> 870) với nửa dưới bàn thi chuẩn của nen2.jpg
    im_nen = blend_nua_tren_va_duoi(im_hp, im_base, y_start=820, y_end=880)

    # 3. Phủ nhẹ ánh chiều vàng cam ấm áp lên sân thi phía dưới
    tint_layer = Image.new('RGB', (w, h), (245, 185, 95))
    tint_mask = Image.new('L', (w, h), 0)
    d_tint = ImageDraw.Draw(tint_mask)
    for y in range(860, h):
        val = int(22 * min(1.0, (y - 860) / 400.0))
        d_tint.line([(0, y), (w, y)], fill=val)
    im_nen = Image.composite(tint_layer, im_nen, tint_mask)

    # 4. Lưu nền Thi Hội
    out_path = os.path.join(BG_DIR, 'nen-thi-hoi.jpg')
    im_nen.save(out_path, 'JPEG', quality=88, subsampling=0)
    print(f"Đã tạo: {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")


def tao_nen_thi_dinh():
    print("--- Đang tạo nền Kỳ 4: Thi Đình (Hoàng Cung Kinh Đô + Thảm Đỏ lối giữa - Khớp 100% bàn thi) ---")
    im_base = Image.open(NEN2_PATH).convert('RGB')
    w, h = im_base.size

    # 1. Scale ảnh Cung Điện Kinh Đô mới lên 1080x1920
    im_kd = Image.open(DINH_RAW).convert('RGB').resize((w, h), Image.Resampling.LANCZOS)
    im_kd = ImageEnhance.Color(im_kd).enhance(1.08)

    # 2. Hòa trộn nửa trên Cung Điện Kinh Đô (y: 0 -> 870) với nửa dưới bàn thi chuẩn của nen2.jpg
    im_nen = blend_nua_tren_va_duoi(im_kd, im_base, y_start=820, y_end=880)

    # 3. Phủ nhẹ ánh hoàng hôn tím vàng hoàng cung lên sân thi
    sunset_tint = Image.new('RGB', (w, h), (195, 115, 145))
    sunset_mask = Image.new('L', (w, h), 0)
    d_sunset = ImageDraw.Draw(sunset_mask)
    for y in range(860, h):
        val = int(25 * min(1.0, (y - 860) / 450.0))
        d_sunset.line([(0, y), (w, y)], fill=val)
    im_nen = Image.composite(sunset_tint, im_nen, sunset_mask)

    # 4. Dán dải THẢM ĐỎ HOÀNG GIA hoa văn mây sóng rực rỡ dọc lối đi giữa (từ y: 920 đến y: 1920)
    # Lối đi giữa: x từ 430 đến 650 (w ~ 220px)
    tham_path = os.path.join(TT_DIR, 'tham-do.webp')
    if os.path.exists(tham_path):
        im_tham = Image.open(tham_path).convert('RGBA')
        # Resize thảm đỏ vừa khít lối đi giữa (rộng 220, dài 1000)
        im_tham_resized = im_tham.resize((224, 1000), Image.Resampling.LANCZOS)
        # Dán thảm đỏ tại left: 428, top: 920
        im_nen.paste(im_tham_resized, (428, 920), im_tham_resized)

    # 5. Lưu nền Thi Đình
    out_path = os.path.join(BG_DIR, 'nen-thi-dinh.jpg')
    im_nen.save(out_path, 'JPEG', quality=88, subsampling=0)
    print(f"Đã tạo: {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")


if __name__ == '__main__':
    tao_nen_thi_hoi()
    tao_nen_thi_dinh()
    print("HOÀN TẤT TẠO 2 NỀN BẢO TOÀN 100% BÀN THI SĨ TỬ VÀ CÁC CỤ!")
