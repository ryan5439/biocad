import { useMemo } from 'react'

/** Normal PDF */
function normalPdf(x: number, mean: number, std: number) {
  const z = (x - mean) / std
  return Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI))
}

type Props = {
  value: number // 0-100 slider
  speciesName: string
  /** species baseline center on 0-100 display scale */
  speciesBaseline?: number
  onChange: (v: number) => void
}

export function IntelligenceCurve({ value, speciesName, speciesBaseline = 50, onChange }: Props) {
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

  return (
    <div className="instrument-panel p-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90">Intelligence</div>
        <div className="font-mono text-[10px] text-cyan-200/80">{Math.round(value)}</div>
      </div>
      <p className="mb-2 font-mono text-[10px] leading-snug text-bio-muted">
        Relative to typical {speciesName.toLowerCase()} intelligence
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="intelFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3ecfbf" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3ecfbf" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d={`${path} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z`}
          fill="url(#intelFill)"
        />
        <path d={path} fill="none" stroke="#3ecfbf" strokeWidth="2" />
        {/* baseline mean */}
        <line
          x1={pad + (mean / 100) * (width - pad * 2)}
          y1={pad}
          x2={pad + (mean / 100) * (width - pad * 2)}
          y2={height - pad}
          stroke="#22d3ee55"
          strokeDasharray="3 3"
        />
        <circle cx={markerX} cy={markerY} r="6" fill="#7ee0d4" stroke="#d8fff8" strokeWidth="2" />
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
        aria-label="Intelligence relative to species"
      />
    </div>
  )
}
