import type { Light } from '../lib/scoring'

/**
 * A little illustrated crag that reacts to the verdict: clear sky + happy sun +
 * a climber topping out on GO, a hazy shrug on MEH, a grumpy rain cloud + a
 * climber under an umbrella on NO. Purely decorative — the verdict text says it
 * all for screen readers.
 */
export function CragScene({ light }: { light: Light }) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative scene; verdict is announced in text
    <svg
      className={`scene scene--${light}`}
      viewBox="0 0 320 172"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop className="sky-top" offset="0" />
          <stop className="sky-bot" offset="1" />
        </linearGradient>
      </defs>

      <rect className="sky" x="0" y="0" width="320" height="172" rx="18" fill="url(#cs-sky)" />

      {light === 'red' ? (
        <RainCloud />
      ) : (
        <Sun partly={light === 'yellow'} happy={light === 'green'} />
      )}

      {/* rolling back ridge */}
      <path
        className="mtn mtn-back"
        d="M0 116 Q 44 74 84 102 Q 120 126 158 92 Q 206 60 248 100 Q 286 134 320 96 L320 172 L0 172 Z"
      />
      {/* the crag — climber tops out on the peak at (160,114) */}
      <path
        className="mtn mtn-front"
        d="M0 150 Q 52 122 96 140 Q 130 152 160 114 Q 196 150 250 136 Q 290 126 320 142 L320 172 L0 172 Z"
      />

      <Climber light={light} />
    </svg>
  )
}

function Sun({ partly, happy }: { partly: boolean; happy: boolean }) {
  const rays = Array.from({ length: 8 }, (_, i) => i * 45)
  return (
    <g className="sun" transform="translate(250 46)">
      <g className="sun-rays">
        {rays.map((deg) => (
          <line key={deg} x1="0" y1="-24" x2="0" y2="-31" transform={`rotate(${deg})`} />
        ))}
      </g>
      <circle className="sun-disc" r="17" />
      {happy && (
        <g className="sun-face">
          <circle cx="-6" cy="-3" r="1.7" />
          <circle cx="6" cy="-3" r="1.7" />
          <path d="M-7 4 Q 0 10 7 4" fill="none" />
        </g>
      )}
      {partly && <Cloud className="cloud cloud--puff" transform="translate(-26 10) scale(0.8)" />}
    </g>
  )
}

function RainCloud() {
  const drops = [116, 128, 140, 152]
  return (
    <g className="raincloud">
      <Cloud className="cloud" transform="translate(116 24)" />
      <g className="cloud-face">
        <circle cx="130" cy="32" r="1.8" />
        <circle cx="144" cy="32" r="1.8" />
        <path d="M129 39 Q 137 44 145 39" fill="none" />
      </g>
      <g className="rain">
        {drops.map((x, i) => (
          <line
            key={x}
            className="drop"
            x1={x}
            y1="46"
            x2={x - 3}
            y2="56"
            style={{ animationDelay: `${(i % 3) * 0.25}s` }}
          />
        ))}
      </g>
    </g>
  )
}

function Cloud({ className, transform }: { className: string; transform?: string }) {
  return (
    <g className={className} transform={transform}>
      <circle cx="0" cy="8" r="11" />
      <circle cx="14" cy="0" r="14" />
      <circle cx="30" cy="8" r="11" />
      <rect x="-1" y="6" width="32" height="13" rx="6" />
    </g>
  )
}

/** The mascot, posed per verdict. Feet sit at the peak (160, 114). */
function Climber({ light }: { light: Light }) {
  return (
    <g className={`climber climber--${light}`} transform="translate(160 114)">
      <g className="cl-fig">
        <circle className="cl-head" cy="-30" r="5.5" />
        {light === 'green' && (
          <>
            {/* topped out, arms up */}
            <path className="cl-limb" d="M0 -24 L0 -10" />
            <path className="cl-limb" d="M0 -22 L-12 -33" />
            <path className="cl-limb" d="M0 -22 L12 -33" />
            <path className="cl-limb" d="M0 -10 L-6 2" />
            <path className="cl-limb" d="M0 -10 L6 2" />
            <path className="cl-flag" d="M12 -33 L12 -45 L22 -41 L12 -38" />
          </>
        )}
        {light === 'yellow' && (
          <>
            {/* a shrug — one hand up, one out */}
            <path className="cl-limb" d="M0 -24 L1 -9" />
            <path className="cl-limb" d="M0 -22 L11 -33" />
            <path className="cl-limb" d="M0 -22 L-11 -28" />
            <path className="cl-limb" d="M1 -9 L-6 3" />
            <path className="cl-limb" d="M1 -9 L7 3" />
            <text className="cl-emote" x="11" y="-36">
              ?
            </text>
          </>
        )}
        {light === 'red' && (
          <>
            {/* waiting it out under an umbrella */}
            <path className="cl-limb" d="M0 -24 L0 -9" />
            <path className="cl-limb" d="M0 -20 L-9 -10" />
            <path className="cl-limb" d="M0 -19 L8 -31" />
            <path className="cl-limb" d="M0 -9 L-6 3" />
            <path className="cl-limb" d="M0 -9 L6 3" />
            <line className="cl-limb" x1="8" y1="-31" x2="8" y2="-43" />
            <path className="cl-brolly" d="M-4 -43 Q 8 -55 20 -43 Z" />
          </>
        )}
      </g>
    </g>
  )
}
