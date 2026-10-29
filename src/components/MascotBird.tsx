import React from 'react';

interface MascotBirdProps {
  size?: number;
  className?: string;
  mood?: 'happy' | 'talking' | 'thinking' | 'listening' | 'celebrating';
  animated?: boolean;
}

export const MascotBird: React.FC<MascotBirdProps> = ({
  size = 110,
  className = '',
  mood = 'happy',
  animated = true,
}) => {
  return (
    <div
      className={`inline-block select-none relative ${animated ? 'animate-gentle-bounce' : ''} ${className}`}
      style={{ width: size, height: size * 0.95 }}
    >
      <svg
        viewBox="0 0 140 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Shadow under bird */}
        <ellipse cx="68" cy="122" rx="42" ry="7" fill="#00000015" />

        {/* Feet / Claws */}
        <path
          d="M52 114 L46 124 M52 114 L52 125 M52 114 L58 124"
          stroke="#e07a2a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M82 114 L76 124 M82 114 L82 125 M82 114 L88 124"
          stroke="#e07a2a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Tail feathers */}
        <path
          d="M26 82 C14 84 10 94 18 102 C26 100 34 94 38 88 Z"
          fill="#784724"
        />
        <path
          d="M20 74 C10 78 8 86 16 92 C24 90 32 86 36 80 Z"
          fill="#8d562f"
        />

        {/* Bird Body */}
        <ellipse
          cx="68"
          cy="82"
          rx="44"
          ry="38"
          fill="#a46838"
        />

        {/* Lighter tummy patch */}
        <ellipse
          cx="76"
          cy="87"
          rx="28"
          ry="25"
          fill="#f6e7cf"
        />

        {/* Speckles on chest */}
        <circle cx="68" cy="80" r="2.2" fill="#d29668" />
        <circle cx="76" cy="84" r="2.5" fill="#d29668" />
        <circle cx="84" cy="79" r="2.2" fill="#d29668" />
        <circle cx="72" cy="94" r="2.2" fill="#d29668" />
        <circle cx="80" cy="95" r="2" fill="#d29668" />

        {/* Wing (Left folded / gesturing) */}
        {mood === 'celebrating' || mood === 'talking' ? (
          <path
            d="M38 72 C32 60 22 62 18 72 C14 82 28 94 42 86 Z"
            fill="#784724"
          />
        ) : (
          <path
            d="M40 76 C32 72 26 82 30 92 C34 98 48 98 52 86 Z"
            fill="#784724"
          />
        )}

        {/* Right Wing (Gesture up for greeting/happy) */}
        {mood === 'celebrating' || mood === 'happy' ? (
          <path
            d="M96 74 C112 66 122 72 120 84 C118 96 102 96 94 86 Z"
            fill="#784724"
          />
        ) : (
          <path
            d="M94 76 C104 74 110 82 106 90 C102 96 92 94 88 84 Z"
            fill="#784724"
          />
        )}

        {/* Bird Head */}
        <circle cx="72" cy="46" r="32" fill="#a46838" />

        {/* Face lighter patch */}
        <ellipse cx="80" cy="50" rx="20" ry="17" fill="#f6e7cf" />

        {/* Cheeks blush */}
        <ellipse cx="62" cy="54" rx="4.5" ry="3" fill="#f87171" opacity="0.6" />
        <ellipse cx="94" cy="54" rx="4.5" ry="3" fill="#f87171" opacity="0.6" />

        {/* Left Eye */}
        <ellipse cx="66" cy="45" rx="5.5" ry="7" fill="#2d1b11" />
        <circle cx="68" cy="43" r="2.2" fill="#ffffff" />
        <circle cx="65" cy="48" r="1.1" fill="#ffffff" />

        {/* Right Eye */}
        <ellipse cx="88" cy="45" rx="5.5" ry="7" fill="#2d1b11" />
        <circle cx="90" cy="43" r="2.2" fill="#ffffff" />
        <circle cx="87" cy="48" r="1.1" fill="#ffffff" />

        {/* Beak */}
        {mood === 'talking' || mood === 'celebrating' ? (
          <path
            d="M74 48 L88 48 L81 60 Z"
            fill="#f97316"
            stroke="#ea580c"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M75 50 L87 50 L81 57 Z"
            fill="#f97316"
            stroke="#ea580c"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        )}

        {/* Safari / Explorer Hat (Matching the user screenshot!) */}
        {/* Hat Crown */}
        <ellipse cx="72" cy="22" rx="23" ry="15" fill="#a1824a" />
        {/* Hat Top creased contour */}
        <path
          d="M51 22 C56 12 88 12 93 22"
          fill="#b59458"
        />
        {/* Hat Belt / Ribbon */}
        <path
          d="M50 25 C62 27 82 27 94 25 L94 28 C82 30 62 30 50 28 Z"
          fill="#59391e"
        />
        {/* Hat Buckle badge */}
        <rect x="69" y="24" width="6" height="5" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
        {/* Hat Brim */}
        <ellipse
          cx="72"
          cy="28"
          rx="38"
          ry="9"
          fill="#a1824a"
          stroke="#7f6333"
          strokeWidth="1.5"
        />
        <ellipse
          cx="72"
          cy="27"
          rx="36"
          ry="7"
          fill="#b59458"
        />

        {/* Sparkles if celebrating */}
        {mood === 'celebrating' && (
          <>
            <path d="M115 28 L119 36 L127 40 L119 44 L115 52 L111 44 L103 40 L111 36 Z" fill="#facc15" />
            <path d="M25 35 L28 41 L34 44 L28 47 L25 53 L22 47 L16 44 L22 41 Z" fill="#60a5fa" />
          </>
        )}
      </svg>
    </div>
  );
};
