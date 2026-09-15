import React from 'react';

interface ReserveLabsLogoProps {
  variant?: 'full' | 'horizontal' | 'icon';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ReserveLabsLogo: React.FC<ReserveLabsLogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  className = '',
}) => {
  // Dimensions
  const iconSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  }[size];

  const titleSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }[size];

  const subtitleSizeClasses = {
    sm: 'text-[9px] tracking-[0.2em]',
    md: 'text-[11px] tracking-[0.25em]',
    lg: 'text-sm tracking-[0.3em]',
    xl: 'text-lg tracking-[0.35em]',
  }[size];

  // SVG Emblem
  const Emblem = () => (
    <svg
      viewBox="0 0 320 280"
      className={`${iconSizeClasses} shrink-0 drop-shadow-sm`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="flaskLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="goldSwoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Golden Orbital Swoop Underneath */}
      <path
        d="M 50 170 C 40 210, 110 245, 185 245 C 240 245, 290 225, 305 200 C 275 228, 195 238, 110 215 C 75 205, 55 188, 50 170 Z"
        fill="url(#goldSwoopGrad)"
      />

      {/* Calendar Base */}
      <g transform="translate(60, 20)">
        {/* Top Rings */}
        <rect x="36" y="0" width="14" height="28" rx="7" fill="#0D3B66" />
        <rect x="110" y="0" width="14" height="28" rx="7" fill="#0D3B66" />

        {/* Calendar Blue Shell */}
        <rect x="5" y="14" width="150" height="142" rx="26" fill="#0D3B66" />

        {/* White Inner Sheet */}
        <rect x="15" y="48" width="130" height="98" rx="15" fill="#FFFFFF" />

        {/* Grid Slots */}
        {/* Row 1 */}
        <rect x="28" y="60" width="18" height="18" rx="4" fill="#E2E8F0" />
        <rect x="54" y="60" width="18" height="18" rx="4" fill="#E2E8F0" />
        <rect x="80" y="60" width="18" height="18" rx="4" fill="#E2E8F0" />
        <rect x="106" y="60" width="18" height="18" rx="4" fill="#E2E8F0" />

        {/* Row 2 */}
        <rect x="28" y="86" width="18" height="18" rx="4" fill="#E2E8F0" />
        {/* Yellow Slot with Checkmark */}
        <rect x="54" y="86" width="18" height="18" rx="4" fill="#F59E0B" />
        <path
          d="M 59 95 L 62 98 L 68 91"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="80" y="86" width="18" height="18" rx="4" fill="#CBD5E1" />
        <rect x="106" y="86" width="18" height="18" rx="4" fill="#CBD5E1" />

        {/* Row 3 */}
        <rect x="28" y="112" width="18" height="18" rx="4" fill="#CBD5E1" />
        <rect x="54" y="112" width="18" height="18" rx="4" fill="#CBD5E1" />
        <rect x="80" y="112" width="18" height="18" rx="4" fill="#CBD5E1" />
        <rect x="106" y="112" width="18" height="18" rx="4" fill="#CBD5E1" />
      </g>

      {/* Laboratory Flask Overlapping Right */}
      <g transform="translate(145, 50)">
        <path
          d="M 50 12 L 66 12 C 69 12 71 14 71 17 C 71 20 69 22 66 22 L 64 22 L 64 52 L 102 110 C 108 120 102 130 90 130 L 26 130 C 14 130 8 120 14 110 L 52 52 L 52 22 L 50 22 C 47 22 45 20 45 17 C 45 14 47 12 50 12 Z"
          fill="#FFFFFF"
          stroke="#0D3B66"
          strokeWidth="11"
          strokeLinejoin="round"
        />

        {/* Liquid Inside */}
        <path
          d="M 32 98 Q 58 92 84 98 C 93 112 93 121 86 121 L 30 121 C 23 121 23 112 32 98 Z"
          fill="url(#flaskLiquidGrad)"
        />

        {/* Liquid Bubble */}
        <circle cx="62" cy="74" r="3.5" fill="#F59E0B" />
        <circle cx="55" cy="60" r="2.5" fill="#FBBF24" />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return <Emblem />;
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <Emblem />
        <div className="mt-1">
          <span
            className={`font-black tracking-tight block ${titleSizeClasses} ${
              theme === 'dark' ? 'text-white' : 'text-[#0D3B66]'
            }`}
          >
            RESERVE
          </span>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="w-5 h-[2px] bg-amber-500 rounded-full" />
            <span className={`font-black text-amber-500 uppercase ${subtitleSizeClasses}`}>
              LABS
            </span>
            <span className="w-5 h-[2px] bg-amber-500 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Emblem />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight leading-none ${titleSizeClasses} ${
              theme === 'dark' ? 'text-white' : 'text-[#0D3B66]'
            }`}
          >
            RESERVE
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[10px] tracking-wider leading-none shadow-2xs">
            LABS
          </span>
        </div>
      </div>
    </div>
  );
};
