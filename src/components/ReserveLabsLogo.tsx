import React from 'react';

export interface ReserveLabsLogoProps {
  variant?: 'full' | 'horizontal' | 'icon';
  theme?: 'dark' | 'light' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ReserveLabsLogo: React.FC<ReserveLabsLogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  className = '',
}) => {
  // Unique gradient ID suffix to avoid DOM collisions
  const idSuffix = React.useId().replace(/:/g, '_');

  // Emblem Only Component (Square viewbox for icon variant)
  const Emblem = ({ iconClass = '' }: { iconClass?: string }) => (
    <svg
      viewBox="0 0 240 220"
      className={`${iconClass} shrink-0 drop-shadow-xs`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ReserveLabs Icon"
    >
      <defs>
        <linearGradient id={`calGrad_${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B41AC" />
          <stop offset="100%" stopColor="#0062F5" />
        </linearGradient>
        <linearGradient id={`circleGrad_${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#072C7A" />
          <stop offset="100%" stopColor="#0047BA" />
        </linearGradient>
      </defs>

      <g transform="translate(10, 10)">
        {/* Top Rings/Hooks */}
        <rect x="44" y="2" width="13" height="26" rx="6.5" fill="#0A3A9E" />
        <rect x="120" y="2" width="13" height="26" rx="6.5" fill="#0A3A9E" />

        {/* Calendar Shell */}
        <rect x="12" y="14" width="154" height="148" rx="26" fill={`url(#calGrad_${idSuffix})`} />

        {/* Inner White Sheet */}
        <rect x="25" y="46" width="128" height="104" rx="16" fill="#FFFFFF" />

        {/* Calendar Grid (4 cols x 3 rows) */}
        {/* Row 1 */}
        <rect x="36" y="57" width="20" height="16" rx="4" fill="#0D44B4" />
        <rect x="63" y="57" width="20" height="16" rx="4" fill="#0D44B4" />
        <rect x="90" y="57" width="20" height="16" rx="4" fill="#0D44B4" />
        <rect x="117" y="57" width="20" height="16" rx="4" fill="#0D44B4" />

        {/* Row 2: Checkmark slot */}
        <g transform="translate(36, 80)">
          <path
            d="M 3 11 L 8 16 L 17 4"
            fill="none"
            stroke="#0A2A75"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <rect x="63" y="80" width="20" height="16" rx="4" fill="#0D44B4" />
        <rect x="90" y="80" width="20" height="16" rx="4" fill="#0D44B4" />
        <rect x="117" y="80" width="20" height="16" rx="4" fill="#0D44B4" />

        {/* Row 3 */}
        <rect x="36" y="103" width="20" height="16" rx="4" fill="#0D44B4" />
        <rect x="63" y="103" width="20" height="16" rx="4" fill="#0D44B4" />
        <rect x="90" y="103" width="20" height="16" rx="4" fill="#0D44B4" />
        <rect x="117" y="103" width="20" height="16" rx="4" fill="#0D44B4" />

        {/* Overlapping Flask Circle Badge */}
        <g transform="translate(162, 134)">
          <circle cx="0" cy="0" r="44" fill={`url(#circleGrad_${idSuffix})`} stroke="#FFFFFF" strokeWidth="6.5" />
          <g transform="translate(-19, -21) scale(0.78)">
            <path d="M 16 6 L 32 6" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" />
            <path
              d="M 19 7 L 19 18 L 6 43 C 4.5 46 6.5 49 10 49 L 38 49 C 41.5 49 43.5 46 42 43 L 29 18 L 29 7"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M 12 37 L 36 37" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="21" cy="42" r="2" fill="#FFFFFF" />
            <circle cx="28" cy="44" r="1.5" fill="#FFFFFF" />
            <circle cx="24" cy="29" r="1.8" fill="#FFFFFF" />
          </g>
        </g>
      </g>
    </svg>
  );

  // Size configurations
  const dimensions = {
    xs: { icon: 'w-6 h-6', title: 'text-xs', labs: 'text-xs', subtitle: 'text-[7px]', bar: 'h-6' },
    sm: { icon: 'w-8 h-8', title: 'text-sm', labs: 'text-sm', subtitle: 'text-[8.5px]', bar: 'h-8' },
    md: { icon: 'w-10 h-10', title: 'text-lg', labs: 'text-lg', subtitle: 'text-[10px]', bar: 'h-10' },
    lg: { icon: 'w-14 h-14', title: 'text-2xl', labs: 'text-2xl', subtitle: 'text-xs', bar: 'h-14' },
    xl: { icon: 'w-20 h-20', title: 'text-4xl', labs: 'text-4xl', subtitle: 'text-base', bar: 'h-20' },
  }[size];

  // Theme text colors
  const reserveColor =
    theme === 'dark'
      ? 'text-white'
      : theme === 'light'
      ? 'text-[#091B42]'
      : 'text-slate-900 dark:text-white';

  const subtitleColor =
    theme === 'dark'
      ? 'text-slate-300'
      : theme === 'light'
      ? 'text-[#091B42]'
      : 'text-slate-600 dark:text-slate-300';

  if (variant === 'icon') {
    return <Emblem iconClass={`${dimensions.icon} ${className}`} />;
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <Emblem iconClass={dimensions.icon} />
        <div className="mt-2">
          <div className="flex items-center justify-center gap-1 font-black leading-none">
            <span className={`${dimensions.title} ${reserveColor} tracking-tight`}>RESERVE</span>
            <span className={`${dimensions.labs} text-[#0066FF] tracking-tight`}>LABS</span>
          </div>
          <p className={`mt-1 font-extrabold uppercase tracking-[0.2em] ${dimensions.subtitle} ${subtitleColor}`}>
            Sistema de Reserva de Laboratórios
          </p>
        </div>
      </div>
    );
  }

  // Default: Horizontal layout matching the exact uploaded logo
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* 1. Emblem (Calendar + Overlapping Flask) */}
      <Emblem iconClass={dimensions.icon} />

      {/* 2. Vertical Golden Accent Separator */}
      <span className={`w-[3.5px] ${dimensions.bar} bg-[#F59E0B] rounded-full shrink-0 shadow-2xs`} />

      {/* 3. Typography */}
      <div className="flex flex-col justify-center leading-tight">
        {/* Title: RESERVE LABS */}
        <div className="flex items-center gap-1 font-black leading-none tracking-tight">
          <span className={`${dimensions.title} ${reserveColor}`}>
            RESERVE
          </span>
          <span className={`${dimensions.labs} text-[#0066FF] dark:text-[#388BFD]`}>
            LABS
          </span>
        </div>

        {/* Subtitle: SISTEMA DE RESERVA DE LABORATÓRIOS */}
        <p className={`font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] mt-0.5 whitespace-nowrap ${dimensions.subtitle} ${subtitleColor}`}>
          Sistema de Reserva de Laboratórios
        </p>
      </div>
    </div>
  );
};
