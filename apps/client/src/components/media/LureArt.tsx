import { useId } from 'react';
export function LureArt({
  type = '',
  className = '',
  decorative = false,
}: {
  type?: string;
  className?: string;
  decorative?: boolean;
}) {
  const gradientId = useId();
  const soft = type === 'Soft Lure';
  return (
    <svg
      className={`lure-art ${className}`}
      viewBox="0 0 320 180"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${type || 'Fishing'} lure illustration`}
    >
      <defs>
        <linearGradient id={gradientId} x2=".2" y2="1">
          <stop stopColor={soft ? '#777b48' : '#6f9b84'} />
          <stop offset=".48" stopColor={soft ? '#afb179' : '#d2d9ab'} />
          <stop offset="1" stopColor="#f0debd" />
        </linearGradient>
      </defs>
      <ellipse cx="161" cy="148" rx="86" ry="7" fill="currentColor" opacity=".06" />
      <g transform="rotate(-14 160 85)">
        <path
          d="M65 91 Q85 48 158 62 Q211 66 238 84 L268 67 L263 109 L236 94 Q156 125 65 91Z"
          fill={`url(#${gradientId})`}
          stroke="#426657"
          strokeWidth="1.5"
        />
        {Array.from({ length: 6 }, (_, i) => (
          <path
            key={i}
            d={`M${110 + i * 18} 65 q-12 14 -3 34`}
            fill="none"
            stroke="#315d49"
            strokeWidth="4"
            opacity=".55"
          />
        ))}
        <path d="M74 91 Q110 113 230 94" stroke="#f4e8c4" strokeWidth="6" fill="none" />
        <circle cx="91" cy="80" r="7" fill="#efbd57" />
        <circle cx="91" cy="80" r="3.5" fill="#172c25" />
        <path d="M62 87 L39 95 L52 109 L81 98" fill="#fff" fillOpacity=".45" stroke="#9bada7" />
        <path
          d="M125 108 v22 q0 18 -13 7 m13 -7 q0 18 13 7 M208 102 v23 q0 18 -13 7 m13 -7 q0 18 13 7"
          stroke="#5e6b68"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="62" cy="87" r="3" fill="none" stroke="#657771" />
      </g>
    </svg>
  );
}
export function Photo({ src, alt, type }: { src?: string; alt: string; type?: string }) {
  return src ? (
    <img src={src} alt={alt} loading="lazy" />
  ) : (
    <LureArt type={type} decorative={!alt} />
  );
}
