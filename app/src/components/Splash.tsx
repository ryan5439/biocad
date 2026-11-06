import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Dna } from 'lucide-react'

const LINES = [
  'Calibrating nucleotide inkjet heads…',
  'Indexing chromosome 14 (again)…',
  'Politely asking mitochondria to cooperate…',
  'Compiling hostility-pathway patch set…',
  'Warming DNA oven to 98.6°F… emotionally',
  'Aligning helicase torque wrenches…',
  'Defragmenting telomere cache…',
  'Syncing part library with wet-lab rack…',
  'Running GC-content vibes check…',
  'Bootstrapping codon autocomplete…',
  'Negotiating with stubborn hairpin loops…',
  'Preheating polymerase espresso machine…',
  'Queueing print bed leveling routine…',
  'Verifying SBOL handshake with lab CAD…',
]

export function Splash() {
  const skip = useStore((s) => s.skipSplash)
  const [i, setI] = useState(0)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    let alive = true
    const lineTimer = setInterval(() => {
      if (alive) setI((v) => (v + 1) % LINES.length)
    }, 700)
    const pctTimer = setInterval(() => {
      if (!alive) return
      setPct((p) => {
        const n = Math.min(100, p + 8 + Math.random() * 10)
        if (n >= 100) {
          clearInterval(pctTimer)
          clearInterval(lineTimer)
          setTimeout(() => skip(), 200)
        }
        return n
      })
    }, 100)
    // Absolute failsafe — never hang (≤3.2s)
    const hard = setTimeout(() => skip(), 3200)
    return () => {
      alive = false
      clearInterval(lineTimer)
      clearInterval(pctTimer)
      clearTimeout(hard)
    }
  }, [skip])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#05070d]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_55%)]" />
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center gap-6 px-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border border-cyan-400/30" style={{ animationDuration: '8s' }} />
          <Dna className="h-10 w-10 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-[0.2em] text-cyan-300 md:text-5xl">BioCAD</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/70">
            Computer-Aided Biological Design
          </p>
        </div>
        <div className="w-full max-w-md">
          <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[11px] text-cyan-200/80">
            <span className="truncate text-left">{LINES[i]}</span>
            <span>{Math.floor(pct)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-cyan-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400 transition-[width] duration-100"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
