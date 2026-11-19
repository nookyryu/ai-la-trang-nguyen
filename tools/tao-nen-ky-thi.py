"""
Tạo 3 ảnh nền cho các kỳ thi từ public/assets/bg/nen2.jpg:
- Kỳ 1: nen2.jpg (Khảo hạch trường làng - sáng sớm, mộc mạc nguyên bản)
- Kỳ 2: nen-thi-huong.jpg (Thi Hương - trưa nắng vàng ấm áp)
- Kỳ 3: nen-thi-hoi.jpg (Thi Hội - chiều vàng cam tà dương ấm áp)
- Kỳ 4: nen-thi-dinh.jpg (Thi Đình - hoàng hôn tím vàng cung đình sang trọng)

LƯU Ý THEO TASK:
- Chỉ chỉnh màu và ánh sáng khí quyển, KHÔNG vẽ thêm hình phẳng nào lên nền (không cờ, không đèn, không thảm).
- Đồ trang trí sẽ được tạo thành các lớp ảnh WebP trong suốt riêng bằng AI và đặt chồng lên bằng code.
- Kích thước đúng 1080x1920, dung lượng mỗi file <= 800 KB, bố cục khớp 100% từng pixel với nen2.jpg.

Cách chạy:
    python tools/tao-nen-ky-thi.py
"""

import os
from PIL import Image, ImageDraw, ImageEnhance

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG_DIR = os.path.join(BASE_DIR, 'public', 'assets', 'bg')
NEN2_PATH = os.path.join(BG_DIR, 'nen2.jpg')


def tao_nen_thi_huong(im_base):
    """Kỳ 2: Thi Hương - Trưa nắng vàng rực rỡ ấm áp"""
    im = im_base.copy()
    w, h = im.size

    # Lớp phủ nắng vàng nhẹ chiếu từ trên xuống
    sunlight = Image.new('RGB', (w, h), (255, 235, 180))
    mask_sun = Image.new('L', (w, h), 0)
    d_sun = ImageDraw.Draw(mask_sun)
    for y in range(h):
        alpha = int(45 * (1.0 - y / h * 0.7))
        d_sun.line([(0, y), (w, y)], fill=alpha)

    im = Image.composite(sunlight, im, mask_sun)

    # Tăng nhẹ độ ấm và tương phản
    im = ImageEnhance.Color(im).enhance(1.10)
    im = ImageEnhance.Contrast(im).enhance(1.05)

    out_path = os.path.join(BG_DIR, 'nen-thi-huong.jpg')
    im.save(out_path, 'JPEG', quality=88, subsampling=0)
    print(f"Đã tạo nền Thi Hương: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


def tao_nen_thi_hoi(im_base):
    """Kỳ 3: Thi Hội - Chiều vàng cam ấm áp, ánh hoàng hôn sớm"""
    im = im_base.copy()
    w, h = im.size

    # Bầu trời và không gian nhuộm sắc cam ấm tà dương
    sky_orange = Image.new('RGB', (w, h), (255, 175, 80))
    mask_sky = Image.new('L', (w, h), 0)
    d_sky = ImageDraw.Draw(mask_sky)
    for y in range(h):
        if y < 450:
            val = int(80 * (1.0 - (y / 450) * 0.5))
        else:
            val = int(40 * (1.0 - (y - 450) / (h - 450)))
        d_sky.line([(0, y), (w, y)], fill=val)

    im = Image.composite(sky_orange, im, mask_sky)
    im = ImageEnhance.Color(im).enhance(1.18)
    im = ImageEnhance.Contrast(im).enhance(1.06)

    out_path = os.path.join(BG_DIR, 'nen-thi-hoi.jpg')
    im.save(out_path, 'JPEG', quality=88, subsampling=0)
    print(f"Đã tạo nền Thi Hội: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


def tao_nen_thi_dinh(im_base):
    """Kỳ 4: Thi Đình - Hoàng hôn tím vàng cung đình sang trọng, rực rỡ"""
    im = im_base.copy()
    w, h = im.size

    # Bầu trời tím hoàng hôn quý phái
    sky_sunset = Image.new('RGB', (w, h), (185, 75, 145))
    mask_sunset = Image.new('L', (w, h), 0)
    d_sunset = ImageDraw.Draw(mask_sunset)
    for y in range(h):
        if y < 380:
            val = int(95 * (1.0 - (y / 380) * 0.4))
        elif y < 700:
            val = int(55 * (1.0 - (y - 380) / 320))
        else:
            val = int(22 * (1.0 - (y - 700) / (h - 700)))
        d_sunset.line([(0, y), (w, y)], fill=val)

    im = Image.composite(sky_sunset, im, mask_sunset)

    # Ánh vàng hoàng hôn rực rỡ phủ lên mái tranh và sân đình
    glow_gold = Image.new('RGB', (w, h), (255, 175, 40))
    mask_gold = Image.new('L', (w, h), 0)
    d_gold = ImageDraw.Draw(mask_gold)
    for y in range(h):
        if 250 <= y <= 750:
            dist = abs(y - 480) / 270.0
            val = int(max(0, 45 * (1.0 - dist)))
        else:
            val = 0
        d_gold.line([(0, y), (w, y)], fill=val)

    im = Image.composite(glow_gold, im, mask_gold)
    im = ImageEnhance.Color(im).enhance(1.22)
    im = ImageEnhance.Contrast(im).enhance(1.08)

    out_path = os.path.join(BG_DIR, 'nen-thi-dinh.jpg')
    im.save(out_path, 'JPEG', quality=88, subsampling=0)
    print(f"Đã tạo nền Thi Đình: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


def main():
    if not os.path.exists(NEN2_PATH):
        raise FileNotFoundError(f"Không tìm thấy ảnh gốc {NEN2_PATH}")

    print(f"Đang đọc ảnh gốc: {NEN2_PATH}")
    im_base = Image.open(NEN2_PATH).convert('RGB')
    print(f"Kích thước gốc: {im_base.size}")

    tao_nen_thi_huong(im_base)
    tao_nen_thi_hoi(im_base)
    tao_nen_thi_dinh(im_base)
    print("Hoàn tất tạo 3 ảnh nền cho 4 kỳ thi (chỉ màu sắc/ánh sáng, không vẽ đè hình)!")


if __name__ == '__main__':
    main()
