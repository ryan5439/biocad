import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DnaHelixView, HELIX_CAP } from './DnaHelixView'
import { X, Undo2, Search, Plus, Trash2, Printer, Dna, Eye, User, Scissors } from 'lucide-react'
import {
  sanitizeDna,
  gcPercent,
  countOrfs,
  translateFrame0,
  findMotifIndices,
  sequenceFromTitle,
} from '../sequence'

/**
 * Derives trait color from DNA sequence via simple hash
 * Different sequences produce different colors deterministically
 */
function sequenceToColor(seq: string): string {
  let h = 2166136261 >>> 0
  for (let i = 0; i < Math.min(seq.length, 120); i++) {
    h ^= seq.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // Generate a color with reasonable saturation and lightness
  const hue = h % 360
  const sat = 45 + (h % 40)
  const light = 35 + (h % 35)
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

/**
 * Get human-readable color name from hex/hsl
 */
function getColorName(color: string): string {
  // Convert hsl to approximate name
  const hueMatch = color.match(/hsl\((\d+)/)
  if (hueMatch) {
    const hue = parseInt(hueMatch[1])
    if (hue < 20) return 'Red-Brown'
    if (hue < 40) return 'Brown'
    if (hue < 60) return 'Amber'
    if (hue < 80) return 'Golden'
    if (hue < 120) return 'Green'
    if (hue < 180) return 'Cyan'
    if (hue < 220) return 'Blue'
    if (hue < 260) return 'Violet'
    if (hue < 300) return 'Purple'
    if (hue < 330) return 'Magenta'
    return 'Red'
  }
  return 'Custom'
}

export type SequenceAnnotation = {
  start: number
  end: number
  label: string
  color?: string
  pulse?: boolean
}

export type SequenceEditorProps = {
  open: boolean
  title: string
  subtitle?: string
  initialSequence: string
  annotations?: SequenceAnnotation[]
  onClose: () => void
  onCommit: (seq: string, meta: { gc: number; length: number; title: string }) => void
}

const MAX_UNDO = 30

export function SequenceEditor({
  open,
  title,
  subtitle,
  initialSequence,
  annotations = [],
  onClose,
  onCommit,
}: SequenceEditorProps) {
  const [seq, setSeq] = useState('')
  const [undo, setUndo] = useState<string[]>([])
  const [motif, setMotif] = useState('')
  const [motifIdx, setMotifIdx] = useState(0)
  const [cursor, setCursor] = useState(0)
  const [selStart, setSelStart] = useState(0)
  const [selEnd, setSelEnd] = useState(0)
  const [nmer, setNmer] = useState('ATCG')
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    const seed =
      sanitizeDna(initialSequence) ||
      sequenceFromTitle(title, 240)
    setSeq(seed)
    setUndo([])
    setMotif('')
    setMotifIdx(0)
    setCursor(0)
    setSelStart(0)
    setSelEnd(0)
  }, [open, initialSequence, title])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        doUndo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, undo, onClose])

  const pushUndo = useCallback((prev: string) => {
    setUndo((u) => [...u, prev].slice(-MAX_UNDO))
  }, [])

  const applySeq = useCallback(
    (next: string, fromUndo = false) => {
      const clean = sanitizeDna(next)
      if (!fromUndo) pushUndo(seq)
      setSeq(clean)
    },
    [pushUndo, seq],
  )

  const doUndo = useCallback(() => {
    setUndo((u) => {
      if (u.length === 0) return u
      const prev = u[u.length - 1]
      setSeq(prev)
      return u.slice(0, -1)
    })
  }, [])

  const onInput = (raw: string) => {
    const clean = sanitizeDna(raw)
    pushUndo(seq)
    setSeq(clean)
  }

  const syncSelection = () => {
    const el = taRef.current
    if (!el) return
    setSelStart(el.selectionStart)
    setSelEnd(el.selectionEnd)
    setCursor(el.selectionStart)
  }

  const insertAtCursor = (chunk: string) => {
    const insert = sanitizeDna(chunk)
    if (!insert) return
    const a = Math.min(selStart, selEnd)
    const b = Math.max(selStart, selEnd)
    const next = seq.slice(0, a) + insert + seq.slice(b)
    applySeq(next)
    const pos = a + insert.length
    requestAnimationFrame(() => {
      const el = taRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(pos, pos)
        setCursor(pos)
        setSelStart(pos)
        setSelEnd(pos)
      }
    })
  }

  const deleteSelection = () => {
    const a = Math.min(selStart, selEnd)
    const b = Math.max(selStart, selEnd)
    if (a === b) {
      if (a <= 0) return
      applySeq(seq.slice(0, a - 1) + seq.slice(a))
      const pos = a - 1
      requestAnimationFrame(() => {
        const el = taRef.current
        if (el) {
          el.focus()
          el.setSelectionRange(pos, pos)
          setCursor(pos)
          setSelStart(pos)
          setSelEnd(pos)
        }
      })
      return
    }
    applySeq(seq.slice(0, a) + seq.slice(b))
    requestAnimationFrame(() => {
      const el = taRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(a, a)
        setCursor(a)
        setSelStart(a)
        setSelEnd(a)
      }
    })
  }

  const hits = useMemo(() => findMotifIndices(seq, motif), [seq, motif])

  const findNext = () => {
    if (hits.length === 0) return
    const next = (motifIdx + 1) % hits.length
    setMotifIdx(next)
    const pos = hits[next]
    const len = sanitizeDna(motif).length
    requestAnimationFrame(() => {
      const el = taRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(pos, pos + len)
        setSelStart(pos)
        setSelEnd(pos + len)
        setCursor(pos)
      }
    })
  }

  const gc = gcPercent(seq)
  const orfs = countOrfs(seq)
  const winStart = Math.max(0, cursor - Math.floor(Math.min(HELIX_CAP, seq.length) / 2))
  const winLen = Math.min(HELIX_CAP, seq.length)
  const visible = seq.slice(winStart, winStart + winLen)
  const aaStrip = translateFrame0(visible)

  // Compute resulting trait from sequence
  const resultingColor = useMemo(() => sequenceToColor(seq), [seq])
  const colorName = useMemo(() => getColorName(resultingColor), [resultingColor])
  
  // Determine trait type from title
  const isEyeColor = title.toLowerCase().includes('eye')
  const isSkinPigment = title.toLowerCase().includes('skin')
  const isHair = title.toLowerCase().includes('hair')

  const commit = () => {
    onCommit(seq, { gc, length: seq.length, title })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="instrument-panel flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden shadow-[0_0_0_1px_rgba(62,207,191,0.2)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-bio-border/80 bg-[#060b10] px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Dna className="h-4 w-4 text-cyan-300" />
              <h2 className="truncate font-mono text-sm font-semibold tracking-wide text-cyan-100">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate font-mono text-[10px] text-bio-muted">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-bio-border p-1.5 text-bio-dim transition hover:border-cyan-400/40 hover:text-cyan-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Editor column */}
          <div className="flex min-h-0 flex-col border-b border-bio-border/60 lg:border-b-0 lg:border-r">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-bio-border/60 bg-[#070b12] px-3 py-2">
              <button
                type="button"
                onClick={doUndo}
                disabled={undo.length === 0}
                className="flex items-center gap-1 rounded border border-bio-border px-2 py-1 font-mono text-[10px] text-bio-dim disabled:opacity-35 hover:border-cyan-400/35 hover:text-cyan-200"
              >
                <Undo2 className="h-3 w-3" /> Undo
              </button>
              <div className="flex items-center gap-1">
                <input
                  value={nmer}
                  onChange={(e) => setNmer(sanitizeDna(e.target.value).slice(0, 48))}
                  className="w-24 rounded border border-bio-border bg-black/40 px-2 py-1 font-mono text-[10px] text-cyan-200 outline-none focus:border-cyan-400/50"
                  placeholder="N-mer"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => insertAtCursor(nmer || 'N')}
                  className="flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-400/10 px-2 py-1 font-mono text-[10px] text-cyan-200"
                >
                  <Plus className="h-3 w-3" /> Insert
                </button>
              </div>
              <button
                type="button"
                onClick={deleteSelection}
                className="flex items-center gap-1 rounded border border-bio-border px-2 py-1 font-mono text-[10px] text-bio-dim hover:border-red-400/40 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
              <div className="ml-auto flex items-center gap-1">
                <Search className="h-3 w-3 text-bio-muted" />
                <input
                  value={motif}
                  onChange={(e) => {
                    setMotif(e.target.value)
                    setMotifIdx(-1)
                  }}
                  className="w-28 rounded border border-bio-border bg-black/40 px-2 py-1 font-mono text-[10px] text-amber-200 outline-none focus:border-amber-400/40"
                  placeholder="Motif"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={findNext}
                  disabled={hits.length === 0}
                  className="rounded border border-amber-500/30 bg-amber-400/10 px-2 py-1 font-mono text-[10px] text-amber-200 disabled:opacity-35"
                >
                  Find next{hits.length ? ` (${hits.length})` : ''}
                </button>
              </div>
            </div>

            {/* Ruler + annotations */}
            <div className="relative border-b border-bio-border/50 bg-[#05080c] px-3 py-1.5">
              <div className="relative h-6 overflow-hidden font-mono text-[9px] text-bio-muted">
                <div className="absolute inset-x-0 top-0 flex justify-between">
                  <span>1</span>
                  <span>{Math.max(1, Math.floor(seq.length / 4))}</span>
                  <span>{Math.max(1, Math.floor(seq.length / 2))}</span>
                  <span>{Math.max(1, Math.floor((seq.length * 3) / 4))}</span>
                  <span>{seq.length || 0}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#0d1520]">
                  {annotations.map((a, i) => {
                    const len = Math.max(1, seq.length)
                    const left = (Math.max(0, a.start) / len) * 100
                    const width = (Math.max(1, a.end - a.start) / len) * 100
                    return (
                      <div
                        key={`${a.label}-${i}`}
                        title={`${a.label} [${a.start}–${a.end}]`}
                        className={`absolute top-0 h-full ${a.pulse ? 'finding-pulse' : ''}`}
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(0.4, width)}%`,
                          background: a.color || '#3ecfbf88',
                        }}
                      />
                    )
                  })}
                  {hits.map((h) => {
                    const len = Math.max(1, seq.length)
                    const mlen = Math.max(1, sanitizeDna(motif).length)
                    return (
                      <div
                        key={`hit-${h}`}
                        className="absolute top-0 h-full bg-amber-400/70"
                        style={{
                          left: `${(h / len) * 100}%`,
                          width: `${(mlen / len) * 100}%`,
                        }}
                      />
                    )
                  })}
                </div>
              </div>
              {annotations.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {annotations.slice(0, 8).map((a, i) => (
                    <span
                      key={`lab-${i}`}
                      className="rounded border border-bio-border/80 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-cyan-300/80"
                    >
                      {a.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Textarea */}
            <textarea
              ref={taRef}
              value={seq}
              onChange={(e) => onInput(e.target.value)}
              onSelect={syncSelection}
              onClick={syncSelection}
              onKeyUp={syncSelection}
              spellCheck={false}
              className="min-h-[220px] flex-1 resize-none bg-[#03070b] px-3 py-3 font-mono text-[12px] leading-5 tracking-wider text-cyan-100/90 outline-none selection:bg-cyan-400/30"
              style={{ wordBreak: 'break-all' }}
            />

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 border-t border-bio-border/60 bg-[#060b10] px-3 py-2 font-mono text-[10px] text-bio-dim">
              <span>
                LEN <span className="text-cyan-300">{seq.length}</span> bp
              </span>
              <span>
                GC <span className="text-emerald-300">{gc}%</span>
              </span>
              <span>
                ORF <span className="text-amber-300">{orfs}</span>
              </span>
              <span className="text-bio-muted">
                CUR {cursor}
                {selStart !== selEnd ? ` · SEL ${Math.abs(selEnd - selStart)}` : ''}
              </span>
              <span className="ml-auto text-bio-muted">undo {undo.length}/{MAX_UNDO}</span>
            </div>
          </div>

          {/* Helix column */}
          <div className="flex min-h-[260px] flex-col bg-[#0a1218]">
            <div className="border-b border-bio-border/50 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-400/70">
              Double helix · ±{Math.min(HELIX_CAP, seq.length || HELIX_CAP)} bp window
            </div>
            <div className="min-h-0 flex-1">
              <DnaHelixView sequence={seq} cursor={cursor} mode="edit" />
            </div>
            
            {/* Resulting Trait Preview */}
            {seq.length >= 12 && (
              <div className="border-t border-bio-border/50 bg-[#060b10] px-3 py-3">
                <div className="mb-2 flex items-center gap-2">
                  {isEyeColor && <Eye className="h-3.5 w-3.5 text-cyan-400" />}
                  {isSkinPigment && <User className="h-3.5 w-3.5 text-cyan-400" />}
                  {isHair && <Scissors className="h-3.5 w-3.5 text-cyan-400" />}
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-400/90">
                    Resulting trait
                  </div>
                </div>
                
                {isEyeColor && (
                  <div className="flex items-center gap-3">
                    {/* Iris preview */}
                    <div className="relative h-16 w-16 shrink-0 rounded-full" style={{ backgroundColor: resultingColor }}>
                      <div className="absolute inset-0 rounded-full bg-gradient-radial from-black/60 via-transparent to-transparent" />
                      <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" />
                      <div className="absolute left-[35%] top-[30%] h-2 w-2 rounded-full bg-white/80" />
                    </div>
                    <div>
                      <div className="font-mono text-[11px] font-semibold" style={{ color: resultingColor }}>
                        {colorName}
                      </div>
                      <div className="font-mono text-[9px] text-bio-muted">{resultingColor}</div>
                      <div className="mt-1 font-mono text-[8px] text-cyan-300/70">Live from sequence</div>
                    </div>
                  </div>
                )}
                
                {isSkinPigment && (
                  <div className="flex items-center gap-3">
                    {/* Skin swatch */}
                    <div className="h-16 w-16 shrink-0 rounded-lg border-2 border-bio-border" style={{ backgroundColor: resultingColor }}>
                      <div className="h-full w-full rounded-lg bg-gradient-to-br from-white/10 to-transparent" />
                    </div>
                    <div>
                      <div className="font-mono text-[11px] font-semibold" style={{ color: resultingColor }}>
                        {colorName} tone
                      </div>
                      <div className="font-mono text-[9px] text-bio-muted">{resultingColor}</div>
                      <div className="mt-1 font-mono text-[8px] text-cyan-300/70">Skin pigmentation</div>
                    </div>
                  </div>
                )}
                
                {isHair && (
                  <div className="flex items-center gap-3">
                    {/* Hair swatch */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-bio-border" style={{ backgroundColor: resultingColor }}>
                      {/* Hair texture effect */}
                      <div className="absolute inset-0" style={{
                        background: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px)`
                      }} />
                      <div className="h-full w-full bg-gradient-to-b from-white/15 to-transparent" />
                    </div>
                    <div>
                      <div className="font-mono text-[11px] font-semibold" style={{ color: resultingColor }}>
                        {colorName} hair
                      </div>
                      <div className="font-mono text-[9px] text-bio-muted">{resultingColor}</div>
                      <div className="mt-1 font-mono text-[8px] text-cyan-300/70">Hair color/texture</div>
                    </div>
                  </div>
                )}
                
                {!isEyeColor && !isSkinPigment && !isHair && (
                  <div className="flex items-center gap-3">
                    {/* Generic trait preview */}
                    <div className="h-16 w-16 shrink-0 rounded-lg border-2 border-bio-border bg-gradient-to-br from-cyan-500/20 to-emerald-500/20" />
                    <div>
                      <div className="font-mono text-[11px] font-semibold text-cyan-300">{title}</div>
                      <div className="font-mono text-[9px] text-bio-muted">{seq.length} bp · GC {gc}%</div>
                      <div className="mt-1 font-mono text-[8px] text-cyan-300/70">Sequence trait</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="border-t border-bio-border/50 bg-[#060b10] px-3 py-2">
              <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-bio-muted">
                Codon ribbon · frame 0 · visible window
              </div>
              <div className="overflow-x-auto whitespace-nowrap font-mono text-[11px] tracking-[0.2em] text-emerald-300/85">
                {aaStrip || '—'}
              </div>
              <div className="mt-1 flex gap-3 font-mono text-[8px] text-bio-muted">
                <span className="text-emerald-400">A</span>
                <span className="text-red-400">T</span>
                <span className="text-amber-400">G</span>
                <span className="text-cyan-400">C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 border-t border-bio-border bg-[#05080c] px-4 py-3">
          <span className="font-mono text-[9px] text-bio-muted">ESC close · Ctrl+Z undo · ATCG only</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-bio-border px-3 py-2 font-mono text-[11px] text-bio-dim hover:text-bio-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commit}
              className="flex items-center gap-2 rounded border border-cyan-400/45 bg-cyan-400/15 px-4 py-2 font-mono text-[11px] font-semibold text-cyan-100 shadow-[0_0_20px_rgba(62,207,191,0.15)]"
            >
              <Printer className="h-3.5 w-3.5" /> Queue to print pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
