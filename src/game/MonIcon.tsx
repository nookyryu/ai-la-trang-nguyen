import type { MonId } from './config';

/**
 * Biểu tượng SVG riêng từng môn có chuyển động nhẹ (chỉ dùng CSS transform/opacity).
 */
export function MonIcon({ mon, size = 32 }: { mon: MonId; size?: number }) {
  const s = { width: size, height: size };
  switch (mon) {
    case 'lich-su':
      // Cuộn sử vàng đung đưa nhẹ
      return (
        <svg viewBox="0 0 40 40" style={s} className="shrink-0 overflow-visible">
          <g className="mon-sway">
            <rect x="9" y="8" width="22" height="24" rx="2" fill="#fde68a" stroke="#b91c1c" strokeWidth="2" />
            <rect x="6" y="6" width="28" height="5" rx="2.5" fill="#dc2626" stroke="#fde68a" strokeWidth="1.2" />
            <rect x="6" y="29" width="28" height="5" rx="2.5" fill="#dc2626" stroke="#fde68a" strokeWidth="1.2" />
            <path d="M14 16h12M14 20.5h10M14 25h8" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      );
    case 'dia-ly':
      // Quả địa cầu xoay chậm
      return (
        <svg viewBox="0 0 40 40" style={s} className="shrink-0 overflow-visible">
          <circle cx="20" cy="20" r="14" fill="#0f766e" stroke="#5eead4" strokeWidth="2.2" />
          <g className="mon-spin">
            <ellipse cx="20" cy="20" rx="7" ry="13.5" fill="none" stroke="#99f6e4" strokeWidth="1.6" />
            <path d="M7 20h26M10 13h20M10 27h20" stroke="#99f6e4" strokeWidth="1.4" opacity="0.85" />
          </g>
          <circle cx="20" cy="20" r="14" fill="none" stroke="#5eead4" strokeWidth="2" />
        </svg>
      );
    case 'khoa-hoc':
      // Nguyên tử quỹ đạo xoay
      return (
        <svg viewBox="0 0 40 40" style={s} className="shrink-0 overflow-visible">
          <g className="mon-spin">
            <ellipse cx="20" cy="20" rx="15" ry="6" fill="none" stroke="#93c5fd" strokeWidth="1.8" />
            <ellipse cx="20" cy="20" rx="15" ry="6" transform="rotate(60 20 20)" fill="none" stroke="#60a5fa" strokeWidth="1.8" />
            <ellipse cx="20" cy="20" rx="15" ry="6" transform="rotate(-60 20 20)" fill="none" stroke="#38bdf8" strokeWidth="1.8" />
          </g>
          <circle cx="20" cy="20" r="4" fill="#dbeafe" className="mon-pulse" />
        </svg>
      );
    case 'hoa-hoc':
      // Bình thí nghiệm sủi bọt
      return (
        <svg viewBox="0 0 40 40" style={s} className="shrink-0 overflow-visible">
          <path d="M15 7h10v7l8 15a4 4 0 0 1-3.5 6H10.5A4 4 0 0 1 7 29l8-15V7z" fill="#14532d" stroke="#86efac" strokeWidth="2" strokeLinejoin="round" />
          <path d="M11 26h18l3 4a2.5 2.5 0 0 1-2.2 3.6H10.2A2.5 2.5 0 0 1 8 30l3-4z" fill="#22c55e" />
          <rect x="13" y="5" width="14" height="3" rx="1.5" fill="#bbf7d0" />
          <circle cx="17" cy="25" r="2.1" fill="#dcfce7" className="mon-bubble-1" />
          <circle cx="23" cy="27" r="1.7" fill="#bbf7d0" className="mon-bubble-2" />
          <circle cx="20" cy="23" r="1.5" fill="#ffffff" className="mon-bubble-3" />
        </svg>
      );
    case 'van-hoc':
      // Bút lông & trang thơ
      return (
        <svg viewBox="0 0 40 40" style={s} className="shrink-0 overflow-visible">
          <rect x="7" y="13" width="18" height="21" rx="2.5" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1.8" />
          <path d="M11 19h10M11 24h8M11 29h9" stroke="#7e22ce" strokeWidth="1.8" strokeLinecap="round" />
          <g className="mon-sway">
            <path d="M33 6c-7 2-12 7-14 15l5 2c5-5 9-10 9-17z" fill="#e879f9" stroke="#faf5ff" strokeWidth="1.4" />
            <path d="M19 21l-3 6 5-3" fill="#fde047" />
          </g>
        </svg>
      );
    case 'van-hoa':
      // Đèn lồng hội làng đung đưa
      return (
        <svg viewBox="0 0 40 40" style={s} className="shrink-0 overflow-visible">
          <g className="mon-sway">
            <line x1="20" y1="4" x2="20" y2="9" stroke="#fde68a" strokeWidth="2" />
            <rect x="15" y="8" width="10" height="3" rx="1" fill="#fbbf24" />
            <ellipse cx="20" cy="20" rx="11" ry="10" fill="#d97706" stroke="#fde68a" strokeWidth="2" />
            <ellipse cx="20" cy="20" rx="5" ry="10" fill="none" stroke="#fef3c7" strokeWidth="1.4" />
            <rect x="15" y="29" width="10" height="3" rx="1" fill="#fbbf24" />
            <path d="M18 32v5M20 32v6M22 32v5" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </svg>
      );
    case 'xa-hoi':
      // La bàn cộng đồng kim dao động
      return (
        <svg viewBox="0 0 40 40" style={s} className="shrink-0 overflow-visible">
          <circle cx="20" cy="20" r="14" fill="#0c4a6e" stroke="#7dd3fc" strokeWidth="2.2" />
          <circle cx="20" cy="20" r="10.5" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
          <g className="mon-compass">
            <polygon points="20,9 23.5,20 20,18 16.5,20" fill="#f87171" />
            <polygon points="20,31 23.5,20 20,22 16.5,20" fill="#e0f2fe" />
          </g>
          <circle cx="20" cy="20" r="2.2" fill="#fde047" />
        </svg>
      );
    case 'do-meo':
      // Bóng đèn ý tưởng lóe sáng
      return (
        <svg viewBox="0 0 40 40" style={s} className="shrink-0 overflow-visible">
          <g className="mon-pulse">
            <path d="M20 3v4M7 11l3 2M33 11l-3 2M4 21h4M32 21h4" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
          </g>
          <path d="M20 9a9.5 9.5 0 0 0-5.8 17c1.2 1 1.8 2.2 1.8 3.5h8c0-1.3.6-2.5 1.8-3.5A9.5 9.5 0 0 0 20 9z" fill="#fb7185" stroke="#ffe4e6" strokeWidth="1.8" />
          <rect x="16" y="30" width="8" height="3" rx="1" fill="#fde047" />
          <rect x="17.5" y="33.5" width="5" height="2.5" rx="1" fill="#f59e0b" />
        </svg>
      );
    case 'toan-nhanh':
      // Bàn tính cổ hạt trượt nhẹ
      return (
        <svg viewBox="0 0 40 40" style={s} className="shrink-0 overflow-visible">
          <rect x="5" y="8" width="30" height="24" rx="3" fill="#431407" stroke="#fdba74" strokeWidth="2.2" />
          <line x1="7" y1="15" x2="33" y2="15" stroke="#fb923c" strokeWidth="1.6" />
          <line x1="7" y1="22" x2="33" y2="22" stroke="#fb923c" strokeWidth="1.6" />
          <line x1="7" y1="28" x2="33" y2="28" stroke="#fb923c" strokeWidth="1.6" />
          <g className="mon-slide">
            <circle cx="14" cy="15" r="2.8" fill="#fde047" />
            <circle cx="21" cy="15" r="2.8" fill="#fde047" />
            <circle cx="24" cy="22" r="2.8" fill="#fb923c" />
            <circle cx="15" cy="28" r="2.8" fill="#fde047" />
            <circle cx="27" cy="28" r="2.8" fill="#fb923c" />
          </g>
        </svg>
      );
  }
}
