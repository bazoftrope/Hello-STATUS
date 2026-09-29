import * as React from 'react';

interface StatusLogoProps {
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Pill logo "STATUS" — fill uses CSS variable --color-primary
 * so it automatically adapts to light (#008080) / dark (#5F9EA0) theme.
 * Text is enlarged to occupy more of the oval (≈64px + letter-spacing).
 */
export function StatusLogo({ className, style, title = 'Статус' }: StatusLogoProps) {
  return (
    <svg
      viewBox="0 0 320 72"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
      style={style}
      width="320"
      height="72"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Tight pill: height 72 (~1мм padding от текста 64px), width 320 (боковые отступы ~30px ≈ в 2 раза меньше прежних 70px) */}
      <rect width="320" height="72" rx="36" fill="var(--color-primary)" />
      <text
        x="160"
        y="36"
        fontFamily="Arial, sans-serif"
        fontSize="64"
        fontWeight="800"
        letterSpacing="3"
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
      >
        STATUS
      </text>
    </svg>
  );
}
