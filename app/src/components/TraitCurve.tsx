import { useMemo } from 'react'

/** Normal PDF */
function normalPdf(x: number, mean: number, std: number) {
  const z = (x - mean) / std
  return Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI))
}

/** Normal CDF for percentile calculation */
function normalCdf(x: number, mean: number, std: number) {
  const z = (x - mean) / std
  // Approximation of the error function for CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp(-z * z / 2)
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

type Props = {
  value: number // 0-100 slider
  label: string
  speciesName: string
  /** species baseline center on 0-100 display scale */
  speciesBaseline?: number
  onChange: (v: number) => void
  color?: string
}

export function TraitCurve({
  value,
  label,
  speciesName,
  speciesBaseline = 50,
  onChange,
  color = '#3ecfbf',
}: Props) {
  const width = 320
  const height = 120
  const pad = 12
  const mean = speciesBaseline
  const std = 14

  const path = useMemo(() => {
    const pts: string[] = []
    const maxY = normalPdf(mean, mean, std)
    for (let i = 0; i <= 60; i++) {
      const xNorm = i / 60
      const x = xNorm * 100
      const y = normalPdf(x, mean, std) / maxY
      const px = pad + xNorm * (width - pad * 2)
      const py = height - pad - y * (height - pad * 2 - 8)
      pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`)
    }
    return pts.join(' ')
  }, [mean, std])

  const markerX = pad + (value / 100) * (width - pad * 2)
  const maxY = normalPdf(mean, mean, std)
  const markerY =
    height - pad - (normalPdf(value, mean, std) / maxY) * (height - pad * 2 - 8)

  // Calculate percentile
  const percentile = Math.round(normalCdf(value, mean, std) * 100)
  const percentileLabel =
    percentile >= 99
      ? '99th+ percentile'
      : percentile <= 1
        ? '1st percentile'
        : percentile === 2
          ? '2nd percentile'
          : percentile === 3
            ? '3rd percentile'
            : `${percentile}th percentile`

  return (
    <div className="instrument-panel p-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </div>
        <div className="font-mono text-[10px]" style={{ color: `${color}cc` }}>
          {Math.round(value)}
        </div>
      </div>
      <p className="mb-1 font-mono text-[10px] leading-snug text-bio-muted">
        Relative to typical {speciesName.toLowerCase()} {label.toLowerCase()}
      </p>
      <p className="mb-2 font-mono text-[10px] font-semibold" style={{ color: `${color}dd` }}>
        {percentileLabel} for {speciesName}
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id={`traitFill-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d={`${path} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z`}
          fill={`url(#traitFill-${label})`}
        />
        <path d={path} fill="none" stroke={color} strokeWidth="2" />
        {/* baseline mean */}
        <line
          x1={pad + (mean / 100) * (width - pad * 2)}
          y1={pad}
          x2={pad + (mean / 100) * (width - pad * 2)}
          y2={height - pad}
          stroke={`${color}55`}
          strokeDasharray="3 3"
        />
        <circle cx={markerX} cy={markerY} r="6" fill={color} stroke="#d8fff8" strokeWidth="2" />
        <text x={pad} y={height - 2} fill="#64748b" fontSize="9" fontFamily="monospace">
          lower
        </text>
        <text
          x={width - pad}
          y={height - 2}
          fill="#64748b"
          fontSize="9"
          fontFamily="monospace"
          textAnchor="end"
        >
          higher
        </text>
      </svg>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-cyan-400"
        aria-label={`${label} relative to species`}
        style={{ accentColor: color }}
      />
    </div>
  )
}
