import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { DnaHelixView } from './DnaHelixView'

/** Print overlay — Part Library–style helix + ~5 min letter stream. */
export function PrintHelixModal() {
  const printPhase = useStore((s) => s.printPhase)
  const printProgress = useStore((s) => s.printProgress)
  const printSequence = useStore((s) => s.printSequence)
  const activeSequence = useStore((s) => s.activeSequence)
  const species = useStore((s) => s.species)
  const edits = useStore((s) => s.edits)
  const resetPrint = useStore((s) => s.resetPrint)
  const printFromRepair = useStore((s) => s.printFromRepair)
  const streamRef = useRef<HTMLDivElement>(null)
  const [printedCount, setPrintedCount] = useState(0)

  const open = printPhase === 'print' || printPhase === 'done'
  const done = printPhase === 'done'

  const seqInfo = printSequence ?? activeSequence
  const sequence = useMemo(() => {
    const raw = (seqInfo?.seq || '').replace(/[^ATCGatcg]/g, '').toUpperCase()
    return raw.length >= 8 ? raw : 'ATGCCGTAACGGTTAGCT'
  }, [seqInfo?.seq])
  const seqTitle = seqInfo?.title ?? species?.name ?? 'assembly'

  const printDurationMs = useStore((s) => s.printDurationMs)
  const printStartedAt = useStore((s) => s.printStartedAt)

  const jobPct = done ? 100 : Math.min(100, Math.max(0, printProgress))

  useEffect(() => {
    if (!open) {
      setPrintedCount(0)
      return
    }
    if (done) {
      setPrintedCount(sequence.length)
      return
    }
    let raf = 0
    const tick = () => {
      const st = useStore.getState()
      const dur = st.printDurationMs || 5 * 60 * 1000
      const started = st.printStartedAt ?? Date.now()
      const elapsed = Math.max(0, Date.now() - started)
      const target = Math.min(sequence.length, Math.floor((elapsed / dur) * sequence.length))
      setPrintedCount((prev) => {
        if (target <= prev) return prev
        return Math.min(prev + 1, target, sequence.length)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open, done, sequence.length, printDurationMs, printStartedAt])

  useEffect(() => {
    const el = streamRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [printedCount])

  const etaMin = done ? 0 : Math.max(0, Math.ceil(((100 - jobPct) / 100) * 5))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[3px]">
      <div className="instrument-panel relative flex w-full max-w-xl flex-col overflow-hidden border border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        <div className="flex items-center justify-between border-b border-bio-border bg-[#05080c] px-4 py-2.5">
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              {done ? 'Print complete · transfer ready' : 'Printing…'}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-bio-muted">
              {printFromRepair ? 'Repaired assembly · ' : ''}
              {seqTitle} · {sequence.length} bp · {edits.length} edits
            </div>
          </div>
          <div className="text-right font-mono text-[11px] tabular-nums text-cyan-300">
            <div>{Math.round(jobPct)}%</div>
            {!done && <div className="text-[9px] text-bio-dim">~{etaMin}m left</div>}
          </div>
        </div>

        {/* Full viewport — same helix engine as Part Library */}
        <div className="relative h-72 w-full min-h-[18rem] bg-[#0a1218]">
          <DnaHelixView
            key={open ? `print-${seqTitle}-${sequence.length}` : 'closed'}
            sequence={sequence}
            mode="print"
            printedCount={done ? sequence.length : Math.max(1, printedCount)}
            progress={jobPct / 100}
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <div className="border-t border-bio-border bg-[#04070b] px-3 py-2">
          <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-bio-dim">
            <span>Base stream · live</span>
            <span className="tabular-nums text-cyan-400/80">
              {printedCount}/{sequence.length}
            </span>
          </div>
          <div
            ref={streamRef}
            className="max-h-24 overflow-y-auto rounded border border-cyan-500/20 bg-black/60 px-2 py-1.5 font-mono text-[13px] leading-6 tracking-wide"
          >
            {sequence.slice(0, printedCount).split('').map((b, i) => (
              <span
                key={`${i}-${b}`}
                className={`base-print-${b} ${i === printedCount - 1 && !done ? 'base-print-in' : ''}`}
                style={i === printedCount - 1 && !done ? undefined : { opacity: 0.88 }}
              >
                {b}
              </span>
            ))}
            {!done && (
              <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-cyan-400/90 align-middle" />
            )}
          </div>
        </div>

        <div className="border-t border-bio-border bg-[#05080c] px-4 py-3">
          <div className="mb-2 h-2 overflow-hidden border border-bio-border bg-[#0c1218]">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400 transition-[width] duration-300"
              style={{ width: `${jobPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-bio-dim">
              {done
                ? 'Lane fidelity 99.97% · transfer ready'
                : 'Inkjet · oligo stream · ~5 min synthesize'}
            </div>
            {done && (
              <button
                type="button"
                onClick={() => resetPrint()}
                className="border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan-100 hover:bg-cyan-400/20"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
