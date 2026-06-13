interface AppLogoProps {
  size?: number;
  className?: string;
}

/** โลโก้สี่เหลี่ยมจัตุรัส — สมุดบัญชี + ลูกศรรายรับ/รายจ่าย */
export function AppLogo({ size = 40, className = "" }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <rect width="512" height="512" rx="112" fill="#FF6B35" />
      <rect
        x="48"
        y="48"
        width="416"
        height="416"
        rx="96"
        stroke="white"
        strokeOpacity="0.18"
        strokeWidth="8"
      />
      <rect x="156" y="132" width="200" height="248" rx="20" fill="white" fillOpacity="0.95" />
      <rect x="176" y="152" width="76" height="208" rx="8" fill="#F8FAFC" />
      <rect x="260" y="152" width="76" height="208" rx="8" fill="#F8FAFC" />
      <path d="M214 220 L214 196 L202 208 L214 220 Z" fill="#10B981" />
      <path d="M202 196 L226 196 L214 208 L202 196 Z" fill="#10B981" />
      <rect x="206" y="220" width="16" height="36" rx="4" fill="#10B981" />
      <path d="M298 256 L298 280 L310 268 L298 256 Z" fill="#EF4444" />
      <path d="M310 280 L286 280 L298 268 L310 280 Z" fill="#EF4444" />
      <rect x="294" y="220" width="16" height="36" rx="4" fill="#EF4444" />
      <line x1="248" y1="152" x2="248" y2="360" stroke="#E2E8F0" strokeWidth="4" />
      <rect x="176" y="132" width="160" height="20" rx="10" fill="white" fillOpacity="0.95" />
    </svg>
  );
}
