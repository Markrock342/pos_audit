interface AppLogoProps {
  size?: number;
  className?: string;
}

/** โลโก้สี่เหลี่ยมจัตุรัส — ไม่ยืด */
export function AppLogo({ size = 40, className = "" }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="#FF6B35" />
      <rect
        x="3"
        y="3"
        width="34"
        height="34"
        rx="8"
        stroke="white"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, sans-serif"
        fontSize="19"
        fontWeight="800"
      >
        บ
      </text>
    </svg>
  );
}
