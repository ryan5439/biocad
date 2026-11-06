import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderKanban, Dna, Search, Sliders, GitBranch, Boxes, FlaskConical,
  Sparkles, Printer, Shield, Check, AlertTriangle, Play, Pause, Zap,
  FileUp, FileDown, FileCode2, Wrench, ScanSearch,
} from 'lucide-react'
import { SPECIES, PARTS, CHROM_LOCI, MODULES } from '../data'
import { useStore, type Phenotype } from '../store'
import { OrganismPreview } from './OrganismPreview'
import { IntelligenceCurve } from './IntelligenceCurve'
import { TraitCurve } from './TraitCurve'
import { SequenceEditor } from './SequenceEditor'
import {
  partSequence,
  sequenceFromTitle,
  gcPercent,
  ATP_STRUCT_SEQ,
  ATP_ANNOTATIONS,
  parseImportedDna,
  DISEASE_CATALOG,
  type GeneticFinding,
} from '../sequence'
import { getEditorSchema } from '../traits'
import { presetsForSpecies, sanitizeBreedPhenotype, type BreedPreset, type AncestryGroup } from '../breeds'

function Panel({ title, children, badge }: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <div className="module-enter panel-enter flex h-full flex-col gap-3 overflow-hidden p-1">
      <div className="flex items-center justify-between border-b border-bio-border/60 pb-2">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100">{title}</h2>
        {badge && (
          <span className="chip-instrument border-cyan-500/30 text-cyan-300/90">
            {badge}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
    </div>
  )
}

function severityChip(sev: GeneticFinding['severity']) {
  const map: Record<GeneticFinding['severity'], string> = {
    critical: 'border-red-400/50 bg-red-500/15 text-red-200',
    high: 'border-amber-400/45 bg-amber-500/10 text-amber-200',
    moderate: 'border-yellow-400/35 bg-yellow-500/10 text-yellow-100',
    low: 'border-bio-border bg-bio-card text-bio-dim',
  }
  return map[sev]
}

function GeneticScanPanel({ compact = false }: { compact?: boolean }) {
  const activeSequence = useStore((s) => s.activeSequence)
  const importedSequence = useStore((s) => s.importedSequence)
  const scanPhase = useStore((s) => s.scanPhase)
  const scanFindings = useStore((s) => s.scanFindings)
  const scanHighlight = useStore((s) => s.scanHighlight)
  const runProblemScan = useStore((s) => s.runProblemScan)
  const repairFinding = useStore((s) => s.repairFinding)
  const repairAllFindings = useStore((s) => s.repairAllFindings)
  const setScanHighlight = useStore((s) => s.setScanHighlight)
  const setModule = useStore((s) => s.setModule)
  const startPrint = useStore((s) => s.startPrint)
  const [repairingId, setRepairingId] = useState<string | null>(null)

  const seq = activeSequence ?? (importedSequence ? { title: importedSequence.title, seq: importedSequence.seq } : null)
  const hasSeq = !!(seq?.seq && seq.seq.length >= 12)
  const fixedCount = scanFindings.filter((f) => f.fixed).length

  const onRepair = (id: string) => {
    setRepairingId(id)
    const f = scanFindings.find((x) => x.id === id)
    if (f) setScanHighlight({ start: f.start, end: f.end })
    window.setTimeout(() => {
      repairFinding(id)
      setRepairingId(null)
    }, 650)
  }

  const onRepairAll = () => {
    setRepairingId('__all__')
    window.setTimeout(() => {
      repairAllFindings()
      setRepairingId(null)
    }, 900)
  }

  return (
    <div className={`glass rounded-xl ${compact ? 'p-3' : 'p-5'} relative overflow-hidden`}>
      {(scanPhase === 'scanning' || scanPhase === 'repairing') && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="scan-sweep absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent" />
        </div>
      )}
      <div className="relative z-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-cyan-300" />
            <div>
              <h3 className="font-semibold text-cyan-100">Genetic disease scan & repair</h3>
              <div className="font-mono text-[10px] text-bio-muted">
                {hasSeq
                  ? `${seq!.title} · ${seq!.seq.length.toLocaleString()} bp · ${DISEASE_CATALOG.length} conditions in panel`
                  : 'Import or open a locus to enable disease scan'}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={!hasSeq || scanPhase === 'scanning' || scanPhase === 'repairing'}
            onClick={() => runProblemScan()}
            className="btn-press cta-glow flex items-center gap-2 border border-cyan-400/45 bg-cyan-400/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-40"
          >
            <Search className="h-3.5 w-3.5" />
            Search for genetic diseases
          </button>
        </div>

        {!compact && (
          <div className="mb-3 rounded border border-bio-border/80 bg-black/35 p-2.5">
            <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-bio-dim">
              Repairable genetic diseases · {DISEASE_CATALOG.length} in studio panel
            </div>
            <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
              {DISEASE_CATALOG.map((d) => (
                <span
                  key={`${d.gene}-${d.variant}`}
                  className="border border-cyan-500/20 bg-cyan-500/5 px-1.5 py-0.5 font-mono text-[9px] text-cyan-200/85"
                  title={`${d.gene} · ${d.variant}`}
                >
                  {d.disease}
                </span>
              ))}
            </div>
          </div>
        )}

        {scanPhase === 'scanning' && (
          <div className="mb-3 space-y-2 rounded border border-cyan-500/25 bg-black/40 p-3">
            <div className="flex items-center justify-between font-mono text-[10px] text-cyan-300">
              <span className="flex items-center gap-2">
                <Dna className="h-3.5 w-3.5 animate-spin" /> Scanning disease panel · CFTR · HBB · BRCA · HTT…
              </span>
              <span className="tabular-nums">LIVE</span>
            </div>
            <div className="h-1.5 overflow-hidden bg-[#0c1218]">
              <div className="scan-bar h-full w-1/3 bg-gradient-to-r from-cyan-500/20 via-cyan-300 to-emerald-400/40" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="h-3 flex-1 rounded-sm bg-cyan-400/20"
                  style={{ opacity: 0.25 + ((i * 7) % 10) / 12, animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {scanFindings.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-bio-dim">
                Disease hits · {fixedCount}/{scanFindings.length} repaired
                {scanHighlight && (
                  <span className="ml-2 text-cyan-400/80">
                    locus {scanHighlight.start + 1}–{scanHighlight.end}
                  </span>
                )}
              </div>
              {scanPhase !== 'repaired' && (
                <button
                  type="button"
                  disabled={!!repairingId || fixedCount === scanFindings.length}
                  onClick={onRepairAll}
                  className="btn-press flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-200 disabled:opacity-40"
                >
                  <Wrench className="h-3 w-3" /> Repair all
                </button>
              )}
            </div>
            {scanFindings.map((f) => {
              const active = scanHighlight && scanHighlight.start === f.start
              const applying = repairingId === f.id || (repairingId === '__all__' && !f.fixed)
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setScanHighlight({ start: f.start, end: f.end })}
                  className={`flex w-full items-start gap-3 rounded border p-3 text-left transition ${
                    f.fixed
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : active
                        ? 'finding-pulse border-red-400/50 bg-red-500/10'
                        : 'border-bio-border bg-black/30 hover:border-cyan-400/30'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[12px] font-semibold text-cyan-100">
                        {f.disease || f.label}
                      </span>
                      <span className={`chip-instrument ${severityChip(f.severity)}`}>{f.severity}</span>
                      {f.fixed && (
                        <span className="chip-instrument border-emerald-400/40 text-emerald-300">repaired</span>
                      )}
                      {applying && (
                        <span className="font-mono text-[9px] text-amber-200">repairing disease locus…</span>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-emerald-300/80">
                      {f.gene}
                      {f.variant ? ` · ${f.variant}` : ''}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-bio-muted">{f.detail}</p>
                    <div className="mt-1 font-mono text-[9px] text-bio-dim">
                      locus nt {f.start + 1}–{f.end} · {f.type}
                    </div>
                  </div>
                  {!f.fixed && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRepair(f.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation()
                          onRepair(f.id)
                        }
                      }}
                      className="btn-press shrink-0 border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan-100 hover:bg-cyan-400/20"
                    >
                      Repair disease
                    </span>
                  )}
                  {f.fixed && <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />}
                </button>
              )
            })}
          </div>
        )}

        {scanPhase === 'repaired' && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded border border-emerald-400/35 bg-emerald-500/10 p-3">
            <div className="min-w-0 flex-1 font-mono text-[11px] text-emerald-200">
              Assembly repaired · ready for synthesis
            </div>
            <button
              type="button"
              onClick={() => {
                setModule('print')
              }}
              className="btn-press cta-glow border border-cyan-400/45 bg-cyan-400/15 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-cyan-100"
            >
              Print repaired DNA
            </button>
            <button
              type="button"
              onClick={() => startPrint()}
              className="btn-press border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-emerald-100"
            >
              Begin print
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  color,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  color?: string
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs text-bio-dim">{label}</label>
        <span className="font-mono text-[11px] text-cyan-300">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-bio w-full"
        style={color ? { background: `linear-gradient(90deg, #1a2740, ${color}66)` } : undefined}
      />
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <label className="text-xs text-bio-dim">{label}</label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-bio-muted">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-bio-border bg-transparent"
        />
      </div>
    </div>
  )
}

export function ProjectsModule() {
  const projects = useStore((s) => s.projects)
  const setModule = useStore((s) => s.setModule)
  return (
    <Panel title="Projects" badge="workspace">
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setModule('phenotype')}
            className="glass rounded-xl p-4 text-left transition hover:border-cyan-400/45 hover:bg-cyan-400/5"
          >
            <div className="font-medium text-cyan-100">{p.name}</div>
            <div className="mt-1 font-mono text-[10px] text-bio-muted">
              {p.species} · {p.date}
            </div>
          </button>
        ))}
        <div className="glass flex items-center justify-center rounded-xl border-dashed p-4 text-sm text-bio-muted">
          + New Project
        </div>
      </div>
    </Panel>
  )
}

export function LoaderModule() {
  const { loading, loadProgress, loadSpecies, species } = useStore()
  return (
    <Panel title="Genome Loader" badge="23+ species">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0 }}
            className="glass-strong mb-4 overflow-hidden rounded-xl p-5"
          >
            <div className="mb-2 flex items-center justify-between font-mono text-xs text-cyan-300">
              <span className="flex items-center gap-2">
                <Dna className="h-4 w-4 animate-spin" /> Sequencing reference genome…
              </span>
              <span>{Math.min(100, Math.round(loadProgress))}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bio-border">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1">
              {[...Array(32)].map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-sm"
                  style={{
                    background:
                      i < (loadProgress / 100) * 32
                        ? ['#3ecfbf', '#5ecf8a', '#d4a84b', '#7eb8c8'][i % 4]
                        : '#1a2740',
                    opacity: i < (loadProgress / 100) * 32 ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-bio-muted">
              Aligning contigs · calling variants · indexing loci
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {species && !loading && (
        <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 font-mono text-xs text-emerald-300">
          ✓ Loaded {species.name} ({species.latin}) — {species.genomeMb} Mb · {species.chromosomes} chr
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {['human', 'dog', 'worm'].map((id) => {
          const s = SPECIES.find((x) => x.id === id)!
          return (
            <button
              key={id}
              disabled={loading}
              onClick={() => loadSpecies(s)}
              className="border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-cyan-100 transition hover:bg-cyan-400/15 disabled:opacity-50"
            >
              Load {s.name}
            </button>
          )
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SPECIES.map((s) => (
          <button
            key={s.id}
            disabled={loading}
            onClick={() => loadSpecies(s)}
            className={`species-card instrument-panel p-2.5 text-left disabled:opacity-50 ${
              species?.id === s.id ? 'neon-border' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-bio-text">{s.name}</div>
                <div className="font-mono text-[10px] italic text-bio-muted">{s.latin}</div>
              </div>
              <span className="rounded bg-bio-border/80 px-1.5 py-0.5 font-mono text-[9px] uppercase text-bio-dim">
                {s.category}
              </span>
            </div>
            <div className="mt-2 font-mono text-[10px] text-cyan-400/70">
              {s.genomeMb} Mb · {s.chromosomes} chr
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {s.traits.slice(0, 2).map((t) => (
                <span key={t} className="border border-bio-border/80 bg-[#0a1016] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-bio-dim">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </Panel>
  )
}

export function BrowserModule() {
  const species = useStore((s) => s.species)
  const queueSequenceEdit = useStore((s) => s.queueSequenceEdit)
  const setActiveSequence = useStore((s) => s.setActiveSequence)
  const scanFindings = useStore((s) => s.scanFindings)
  const scanHighlight = useStore((s) => s.scanHighlight)
  const activeSequence = useStore((s) => s.activeSequence)
  const [editor, setEditor] = useState<{ title: string; subtitle: string; seq: string } | null>(null)

  const openLocus = (locus: string) => {
    const gene = locus.split('—').pop()?.trim() || locus
    const seq = sequenceFromTitle(locus, 360)
    setActiveSequence({ title: gene, seq })
    setEditor({
      title: gene,
      subtitle: `${locus}${species ? ` · ${species.name}` : ''}`,
      seq,
    })
  }

  const scanAnnotations = useMemo(() => {
    const base = [
      { start: 0, end: 3, label: 'ATG', color: '#34d399aa' },
      { start: 60, end: 120, label: 'CDS', color: '#22d3ee66' },
    ]
    const fromScan = scanFindings.map((f) => ({
      start: f.start,
      end: f.end,
      label: f.fixed ? `✓ ${f.label}` : f.label,
      color: f.fixed ? '#34d399cc' : '#f87171cc',
      pulse: !f.fixed,
    }))
    if (scanHighlight) {
      fromScan.unshift({
        start: scanHighlight.start,
        end: scanHighlight.end,
        label: 'focus',
        color: '#fbbf24aa',
        pulse: true,
      })
    }
    return [...base, ...fromScan]
  }, [scanFindings, scanHighlight])

  return (
    <Panel title="Genome Browser" badge="loci · scan">
      {!species ? (
        <p className="text-sm text-bio-muted">Load a genome to browse chromosomes.</p>
      ) : (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <div className="mb-3 font-mono text-xs text-cyan-300">
              {species.name} · {species.chromosomes} chromosomes · {species.genomeMb} Mb
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: Math.min(species.chromosomes, 48) }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openLocus(`chr${i + 1} — contig`)}
                  className="rounded bg-gradient-to-b from-cyan-500/40 to-cyan-500/15 transition hover:from-cyan-400/60 hover:to-cyan-400/25"
                  style={{ width: 8 + (i % 5) * 2, height: 24 + ((i * 7) % 40) }}
                  title={`chr${i + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-bio-dim">Featured loci</div>
            {CHROM_LOCI.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => openLocus(l)}
                className="flex w-full items-center gap-2 border-b border-bio-border/50 py-2 text-left font-mono text-[11px] text-bio-text transition last:border-0 hover:bg-cyan-400/5 hover:text-cyan-100"
              >
                <Search className="h-3 w-3 text-cyan-400" />
                {l}
              </button>
            ))}
          </div>
          {(activeSequence || editor) && <GeneticScanPanel compact />}
        </div>
      )}
      <SequenceEditor
        open={!!editor}
        title={editor?.title ?? ''}
        subtitle={editor?.subtitle}
        initialSequence={editor?.seq ?? ''}
        annotations={scanAnnotations}
        onClose={() => setEditor(null)}
        onCommit={(seq, meta) => {
          const prev = editor?.seq ?? ''
          queueSequenceEdit({
            part: meta.title,
            from: `${prev.length}bp`,
            to: `${meta.length}bp · GC ${meta.gc}%`,
            length: meta.length,
            gc: meta.gc,
            seq,
          })
        }}
      />
    </Panel>
  )
}


function BreedAncestryPanel({
  speciesId,
  onApply,
}: {
  speciesId: string
  onApply: (partial: Partial<Phenotype>, label: string) => void
}) {
  const pack = presetsForSpecies(speciesId)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  if (pack.kind === 'none') return null

  if (pack.kind === 'breeds' && pack.breeds) {
    return (
      <div className="instrument-panel p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">Breed preset</div>
          <span className="font-mono text-[9px] text-bio-muted">sets defaults · still editable</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pack.breeds.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setSelected(b.id)
                // Sanitize breed phenotype before applying to prevent crashes
                const sanitized = sanitizeBreedPhenotype(b.phenotype)
                onApply(sanitized, b.label)
              }}
              className={`border px-2 py-1 font-mono text-[10px] transition ${
                selected === b.id
                  ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100'
                  : 'border-bio-border bg-black/30 text-bio-dim hover:border-cyan-400/30 hover:text-bio-text'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const groups = pack.ancestry ?? []
  const active: AncestryGroup | undefined = groups.find((g) => g.id === groupId) ?? groups[0]
  return (
    <div className="instrument-panel p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">Ancestry / population</div>
        <span className="font-mono text-[9px] text-bio-muted">background defaults · fine-tune below</span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroupId(g.id)}
            className={`border px-2 py-1 font-mono text-[10px] ${
              (groupId ?? groups[0]?.id) === g.id
                ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100'
                : 'border-bio-border bg-black/30 text-bio-dim hover:border-cyan-400/30'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      {active && (
        <div className="flex flex-wrap gap-1.5 border-t border-bio-border/60 pt-2">
          {active.subtypes.map((s: BreedPreset) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelected(s.id)
                // Sanitize ancestry phenotype before applying
                const sanitized = sanitizeBreedPhenotype(s.phenotype)
                onApply(sanitized, s.label)
              }}
              className={`border px-2 py-1 font-mono text-[10px] ${
                selected === s.id
                  ? 'border-emerald-400/45 bg-emerald-400/10 text-emerald-100'
                  : 'border-bio-border bg-black/30 text-bio-dim hover:border-emerald-400/30'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PhenotypeModule() {
  const { species, phenotype, setPhenotype, edits, finalizeEdits, startPrint } = useStore()
  const set = (partial: Partial<Phenotype>) => setPhenotype(partial)
  const pending = edits.filter((e) => e.status === 'pending').length

  if (!species) {
    return (
      <Panel title="Phenotype Editor">
        <p className="text-sm text-bio-muted">Load an organism genome first.</p>
      </Panel>
    )
  }

  const schema = getEditorSchema(species)
  const val = (key: string) => (phenotype as Record<string, string | number>)[key]

  return (
    <Panel title="Phenotype Editor" badge={`${species.name} controls`}>
      <div className="grid h-full gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <BreedAncestryPanel speciesId={species.id} onApply={(partial) => set(partial)} />
          {schema.appearance.length > 0 && (
            <div className="glass rounded-xl p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400/80">Appearance</div>
              {schema.appearance.map((c) =>
                c.kind === 'color' ? (
                  <ColorRow
                    key={c.key}
                    label={c.label}
                    value={String(val(c.key) ?? '#888888')}
                    onChange={(v) => set({ [c.key]: v } as Partial<Phenotype>)}
                  />
                ) : (
                  <SliderRow
                    key={c.key}
                    label={c.label}
                    value={Number(val(c.key) ?? 50)}
                    onChange={(v) => set({ [c.key]: v } as Partial<Phenotype>)}
                  />
                ),
              )}
            </div>
          )}
          {schema.proportions.length > 0 && (
            <div className="glass rounded-xl p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400/80">Proportions</div>
              {schema.proportions.map((c) => {
                // Use TraitCurve with percentiles for key growth/physical traits
                const usesCurve = ['muscleMass', 'height', 'torsoSize', 'legLength', 'armLength', 'headSize'].includes(c.key)
                if (usesCurve) {
                  return (
                    <TraitCurve
                      key={c.key}
                      label={c.label}
                      value={Number(val(c.key) ?? 50)}
                      speciesName={species.name}
                      speciesBaseline={50}
                      onChange={(v) => set({ [c.key]: v } as Partial<Phenotype>)}
                      color="#34d399"
                    />
                  )
                }
                return (
                  <SliderRow
                    key={c.key}
                    label={c.label}
                    value={Number(val(c.key) ?? 50)}
                    onChange={(v) => set({ [c.key]: v } as Partial<Phenotype>)}
                  />
                )
              })}
            </div>
          )}
          <div className="glass rounded-xl p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300/80">Cognition</div>
            <IntelligenceCurve
              value={phenotype.iq}
              speciesName={species.name}
              speciesBaseline={schema.intelBaseline}
              onChange={(v) => set({ iq: v })}
            />
            <TraitCurve
              label="Learning rate"
              value={phenotype.learning}
              speciesName={species.name}
              speciesBaseline={schema.intelBaseline}
              onChange={(v) => set({ learning: v })}
              color="#22d3ee"
            />
            <TraitCurve
              label="Memory"
              value={phenotype.memory}
              speciesName={species.name}
              speciesBaseline={schema.intelBaseline}
              onChange={(v) => set({ memory: v })}
              color="#3ecfbf"
            />
            <TraitCurve
              label="Attention"
              value={phenotype.attention}
              speciesName={species.name}
              speciesBaseline={schema.intelBaseline}
              onChange={(v) => set({ attention: v })}
              color="#10b981"
            />
            <TraitCurve
              label="Emotional regulation"
              value={phenotype.emotionalReg}
              speciesName={species.name}
              speciesBaseline={schema.intelBaseline}
              onChange={(v) => set({ emotionalReg: v })}
              color="#14b8a6"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="min-h-[320px] flex-1">
            <OrganismPreview />
          </div>
          <div className="glass rounded-xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">Pending genomic edits</span>
              <span className="font-mono text-[10px] text-amber-300">{pending} pending</span>
            </div>
            <div className="mb-3 max-h-32 space-y-1 overflow-y-auto">
              {edits.length === 0 && <p className="font-mono text-[10px] text-bio-muted">Adjust sliders to queue edits…</p>}
              {[...edits].reverse().slice(0, 12).map((e) => (
                <div key={e.id} className="flex items-center gap-2 font-mono text-[10px]">
                  <span className={`h-1.5 w-1.5 rounded-full ${e.status === 'pending' ? 'bg-amber-400' : e.status === 'finalized' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  <span className="text-bio-dim">{e.field}</span>
                  <span className="truncate text-bio-muted">{e.from} → {e.to}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={finalizeEdits} disabled={!pending} className="flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-400/15 px-3 py-2 text-xs font-medium text-cyan-200 disabled:opacity-40">
                <Check className="h-3.5 w-3.5" /> Finalize
              </button>
              <button onClick={startPrint} disabled={edits.length === 0} className="flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 disabled:opacity-40">
                <Printer className="h-3.5 w-3.5" /> Compile → Print DNA
              </button>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function VisualModule() {
  const { species, phenotype, setPhenotype } = useStore()
  const queueSequenceEdit = useStore((s) => s.queueSequenceEdit)
  const [editor, setEditor] = useState<{ title: string; seq: string } | null>(null)
  const [colorEditor, setColorEditor] = useState<{ title: string; key: keyof Phenotype; value: string } | null>(null)
  const [traitEditor, setTraitEditor] = useState<{ title: string; key: keyof Phenotype; value: number; baseline: number } | null>(null)
  
  const schema = species ? getEditorSchema(species) : null
  const nodes = [
    { id: 'skin', x: 40, y: 60, label: 'Skin pigment', v: phenotype.skin, type: 'color-seq', key: 'skin' },
    { id: 'eye', x: 200, y: 40, label: 'Eye color', v: phenotype.eyes, type: 'color-seq', key: 'eyes' },
    { id: 'hair', x: 360, y: 70, label: 'Hair', v: phenotype.hair, type: 'color-seq', key: 'hair' },
    { id: 'intel', x: 100, y: 180, label: 'Intelligence', v: `${phenotype.iq}`, type: 'trait', key: 'iq' },
    { id: 'mem', x: 280, y: 200, label: 'Memory', v: `${phenotype.memory}`, type: 'trait', key: 'memory' },
    { id: 'morph', x: 180, y: 300, label: 'Morphology', v: `H${phenotype.height}`, type: 'trait', key: 'height' },
  ]
  
  const handleNodeClick = (node: typeof nodes[0]) => {
    if (node.type === 'color-seq') {
      setColorEditor({ title: node.label, key: node.key as keyof Phenotype, value: node.v as string })
    } else if (node.type === 'trait') {
      setTraitEditor({
        title: node.label,
        key: node.key as keyof Phenotype,
        value: Number(node.v.toString().replace(/[^\d]/g, '') || phenotype[node.key as keyof Phenotype]),
        baseline: schema?.intelBaseline ?? 50
      })
    }
  }
  
  return (
    <Panel title="Visual Editor" badge="graph · interactive">
      <div className="glass relative h-[420px] overflow-hidden rounded-xl">
        <svg className="absolute inset-0 h-full w-full">
          <line x1="70" y1="80" x2="180" y2="300" stroke="#22d3ee33" strokeWidth="1.5" />
          <line x1="230" y1="60" x2="180" y2="300" stroke="#3ecfbf33" strokeWidth="1.5" />
          <line x1="390" y1="90" x2="180" y2="300" stroke="#34d39933" strokeWidth="1.5" />
          <line x1="130" y1="200" x2="180" y2="300" stroke="#fbbf2433" strokeWidth="1.5" />
          <line x1="310" y1="220" x2="180" y2="300" stroke="#22d3ee33" strokeWidth="1.5" />
          <line x1="130" y1="200" x2="310" y2="220" stroke="#3ecfbf44" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        {nodes.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => handleNodeClick(n)}
            className="absolute w-36 cursor-pointer rounded-lg border border-cyan-400/30 bg-[#0d1424]/95 p-2 text-left transition hover:border-cyan-300/60 hover:shadow-[0_0_20px_rgba(62,207,191,0.2)]"
            style={{ left: n.x, top: n.y }}
          >
            <div className="font-mono text-[10px] text-cyan-300">{n.label}</div>
            <div className="truncate text-xs text-bio-dim">{n.v}</div>
            <div className="mt-0.5 font-mono text-[8px] text-cyan-500/70">
              {n.type === 'color-seq' ? 'COLOR · SEQ' : 'TRAIT'}
            </div>
          </button>
        ))}
      </div>
      
      {/* Color + Sequence Editor Modal */}
      {colorEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
          <div className="instrument-panel w-full max-w-md overflow-hidden">
            <div className="border-b border-bio-border bg-[#060b10] px-4 py-3">
              <h3 className="font-mono text-sm font-semibold text-cyan-100">{colorEditor.title}</h3>
              <p className="mt-0.5 font-mono text-[10px] text-bio-muted">Color picker + DNA sequence</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-cyan-300">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorEditor.value}
                    onChange={(e) => {
                      setPhenotype({ [colorEditor.key]: e.target.value } as Partial<Phenotype>)
                      setColorEditor({ ...colorEditor, value: e.target.value })
                    }}
                    className="h-12 w-full cursor-pointer rounded border border-bio-border"
                  />
                  <input
                    type="text"
                    value={colorEditor.value}
                    onChange={(e) => {
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                        setPhenotype({ [colorEditor.key]: e.target.value } as Partial<Phenotype>)
                        setColorEditor({ ...colorEditor, value: e.target.value })
                      }
                    }}
                    className="w-28 rounded border border-bio-border bg-black/40 px-3 py-2 font-mono text-sm text-cyan-200 outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditor({ title: colorEditor.title, seq: partSequence(`node-${colorEditor.key}`, '240bp') })}
                  className="flex-1 rounded border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 font-mono text-[11px] text-cyan-200 transition hover:bg-cyan-400/20"
                >
                  Edit DNA Sequence
                </button>
                <button
                  type="button"
                  onClick={() => setColorEditor(null)}
                  className="rounded border border-bio-border px-4 py-2 font-mono text-[11px] text-bio-dim hover:text-bio-text"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Trait Editor Modal with Bell Curve */}
      {traitEditor && species && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
          <div className="instrument-panel w-full max-w-md overflow-hidden">
            <div className="border-b border-bio-border bg-[#060b10] px-4 py-3">
              <h3 className="font-mono text-sm font-semibold text-cyan-100">{traitEditor.title}</h3>
              <p className="mt-0.5 font-mono text-[10px] text-bio-muted">Species-relative trait editor</p>
            </div>
            <div className="p-4">
              <TraitCurve
                label={traitEditor.title}
                value={traitEditor.value}
                speciesName={species.name}
                speciesBaseline={traitEditor.baseline}
                onChange={(v) => {
                  setPhenotype({ [traitEditor.key]: v } as Partial<Phenotype>)
                  setTraitEditor({ ...traitEditor, value: v })
                }}
                color="#3ecfbf"
              />
              <button
                type="button"
                onClick={() => setTraitEditor(null)}
                className="mt-4 w-full rounded border border-bio-border px-4 py-2 font-mono text-[11px] text-bio-dim hover:text-bio-text"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sequence Editor Modal */}
      <SequenceEditor
        open={!!editor}
        title={editor?.title ?? ''}
        subtitle="Visual graph · sequence node"
        initialSequence={editor?.seq ?? ''}
        onClose={() => setEditor(null)}
        onCommit={(seq, meta) => {
          queueSequenceEdit({
            part: meta.title,
            from: 'graph-node',
            to: `${meta.length}bp · GC ${meta.gc}%`,
            length: meta.length,
            gc: meta.gc,
            seq,
          })
          setColorEditor(null)
        }}
      />
    </Panel>
  )
}

export function PartsModule() {
  const queueSequenceEdit = useStore((s) => s.queueSequenceEdit)
  const setActiveSequence = useStore((s) => s.setActiveSequence)
  const [editor, setEditor] = useState<{
    title: string
    subtitle: string
    seq: string
    annotations: { start: number; end: number; label: string; color: string }[]
  } | null>(null)

  return (
    <Panel title="Part Library" badge="sequence editor">
      <div className="grid gap-2 sm:grid-cols-2">
        {PARTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              const isAtp = p.id === 'p013'
              const seq = isAtp ? ATP_STRUCT_SEQ : partSequence(p.id, p.size)
              setActiveSequence({ title: p.name, seq })
              setEditor({
                title: p.name,
                subtitle: isAtp
                  ? `${p.type} · cellular energy · ${p.size} · ${p.tags.join(', ')}`
                  : `${p.type} · ${p.size} · ${p.tags.join(', ')}`,
                seq,
                annotations: isAtp
                  ? [...ATP_ANNOTATIONS]
                  : [
                      { start: 0, end: 3, label: 'start', color: '#34d399aa' },
                      { start: 40, end: 90, label: 'core', color: '#22d3ee55' },
                    ],
              })
            }}
            className="glass rounded-lg p-3 text-left transition hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(62,207,191,0.12)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm text-cyan-200">{p.name}</span>
              <span className="shrink-0 rounded bg-bio-border px-1.5 py-0.5 font-mono text-[9px] text-bio-dim">{p.type}</span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-bio-muted">{p.size}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.tags.map((t) => (
                <span key={t} className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300/80">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      <SequenceEditor
        open={!!editor}
        title={editor?.title ?? ''}
        subtitle={editor?.subtitle}
        initialSequence={editor?.seq ?? ''}
        annotations={
          editor?.annotations ?? [
            { start: 0, end: 3, label: 'start', color: '#34d399aa' },
            { start: 40, end: 90, label: 'core', color: '#22d3ee55' },
          ]
        }
        onClose={() => setEditor(null)}
        onCommit={(seq, meta) => {
          const prevLen = editor?.seq.length ?? 0
          queueSequenceEdit({
            part: meta.title,
            from: `${prevLen}bp`,
            to: `${meta.length}bp · GC ${gcPercent(seq)}%`,
            length: meta.length,
            gc: meta.gc,
            seq,
          })
        }}
      />
    </Panel>
  )
}

export function SimulationModule() {
  const { simRunning, setSimRunning, phenotype, species } = useStore()
  return (
    <Panel title="Simulation" badge="fitness · live">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-xl p-4">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setSimRunning(!simRunning)}
              className="btn-press cta-glow flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/15 px-4 py-2 text-sm text-cyan-200"
            >
              {simRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {simRunning ? 'Pause' : 'Run'} simulation
            </button>
            {simRunning && <span className="pulse-glow font-mono text-xs text-emerald-400">● LIVE</span>}
          </div>
          <div className="space-y-2 font-mono text-[11px] text-bio-dim">
            <div>Organism: {species?.name ?? '—'}</div>
            <div>Fitness estimate: {(40 + phenotype.iq * 0.2 + phenotype.muscleMass * 0.15).toFixed(1)}</div>
            <div>Metabolic load: {(30 + phenotype.height * 0.3).toFixed(1)}%</div>
            <div>Neural complexity: {(phenotype.iq + phenotype.memory + phenotype.attention) / 3 | 0}</div>
            <div className="text-cyan-400/80">Parametric fitness & expression model</div>
          </div>
          {simRunning && (
            <div className="mt-4 h-24 overflow-hidden rounded-lg bg-black/40 p-2 font-mono text-[9px] text-emerald-400/70">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  t+{(i * 0.12).toFixed(2)}s · Δpheno={(Math.sin(Date.now() / 1000 + i) * 0.02).toFixed(4)} ·
                  expr=OK
                </div>
              ))}
            </div>
          )}
        </div>
        <OrganismPreview compact />
      </div>
    </Panel>
  )
}

export function AssistedModule() {
  const setPhenotype = useStore((s) => s.setPhenotype)
  const suggestions = [
    { title: 'Enhance night vision', desc: 'Boost opsin expression + pupil reflex', apply: () => setPhenotype({ eyes: '#1a4a8a', attention: 72 }) },
    { title: 'Lean athletic build', desc: 'Myostatin pathway modulate', apply: () => setPhenotype({ muscleMass: 68, height: 58, torsoSize: 55 }) },
    { title: 'Memory consolidation boost', desc: 'BDNF enhancer cassette', apply: () => setPhenotype({ memory: 80, learning: 75, iq: 70 }) },
    { title: 'Stress resilience', desc: 'Emotional regulation circuit', apply: () => setPhenotype({ emotionalReg: 85, attention: 65 }) },
  ]
  return (
    <Panel title="Assisted Design" badge="design assist">
      <div className="grid gap-3 sm:grid-cols-2">
        {suggestions.map((s) => (
          <div key={s.title} className="glass rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-cyan-400" />
              <div>
                <div className="font-medium text-cyan-100">{s.title}</div>
                <p className="mt-1 text-xs text-bio-muted">{s.desc}</p>
                <button
                  onClick={s.apply}
                  className="btn-press mt-3 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/15"
                >
                  Apply suggestion
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function PrintModule() {
  const { printPhase, printProgress, startPrint, resetPrint, edits, species, activeSequence, printSequence, printFromRepair, printDurationMs } = useStore()
  const phases = [
    { id: 'compile', label: 'Compile', desc: 'Translating phenotype deltas → base edits' },
    { id: 'assemble', label: 'Assemble', desc: 'Oligo pool design & fragment assembly' },
    { id: 'verify', label: 'Verify', desc: 'Checksum & off-target screen' },
    { id: 'print', label: 'Print DNA', desc: '~5 min synthesize · real base stream' },
    { id: 'done', label: 'Complete', desc: 'Print complete · transfer ready' },
  ] as const

  const activeIdx = phases.findIndex((p) => p.id === printPhase)
  const seq = printSequence ?? activeSequence
  const etaMin = Math.max(1, Math.round((printDurationMs || 300_000) / 60_000))

  return (
    <Panel title="Print Control" badge="~5 min synthesize">
      <div className="glass-strong relative overflow-hidden rounded-xl p-6">
        {printPhase !== 'idle' && printPhase !== 'done' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="scan-sweep absolute left-0 h-24 w-full bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent"
            />
          </div>
        )}

        <div className="relative z-10">
          {printFromRepair && seq && (
            <div className="mb-4 border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 font-mono text-[11px] text-emerald-200">
              Printing repaired assembly · {seq.title}
            </div>
          )}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Dna className="h-8 w-8 text-cyan-300" />
            <div>
              <div className="text-lg font-semibold text-cyan-100">DNA Print Pipeline</div>
              <div className="font-mono text-[10px] text-bio-muted">
                Target: {species?.name ?? '—'} · {edits.length} edits queued · ~{etaMin}m synthesize
              </div>
              {seq && (
                <div className="mt-1 font-mono text-[10px] text-cyan-400/85">
                  Active · {seq.title} · {seq.seq.length.toLocaleString()} bp
                </div>
              )}
            </div>
          </div>

          {printPhase === 'idle' && (
            <button
              onClick={startPrint}
              disabled={edits.length === 0 && !seq?.seq}
              className="btn-press cta-glow flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 to-cyan-500/20 px-6 py-3 text-sm font-semibold text-cyan-100 disabled:opacity-40"
            >
              <Zap className="h-4 w-4" /> Begin Compile → Assemble → Verify → Print
            </button>
          )}

          {printPhase !== 'idle' && (
            <div className="space-y-4">
              {phases.map((ph, i) => {
                const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'wait'
                return (
                  <div key={ph.id} className="flex items-center gap-4">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border font-mono text-xs ${
                        state === 'done'
                          ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                          : state === 'active'
                            ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                            : 'border-bio-border text-bio-muted'
                      }`}
                    >
                      {state === 'done' ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-bio-text">{ph.label}</div>
                      <div className="font-mono text-[10px] text-bio-muted">{ph.desc}</div>
                      {state === 'active' && (
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bio-border">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-400"
                            style={{ width: `${printProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {(printPhase === 'print' || printPhase === 'done') && (
                <div className="mt-4 overflow-hidden rounded-lg bg-black/50 p-3 font-mono text-[10px] leading-relaxed text-emerald-400/80">
                  {`> 5'-ATGCCG...TTAGGC...${'ACGT'.repeat(20)}...-3'\n> synthesis lanes: 48 · fidelity: 99.97%\n> drop volume: 2.5pL · cycle: ${(printProgress | 0) % 97}\n${
                    printPhase === 'done' ? '> ★ PRINT COMPLETE — cassette sealed' : '> streaming bases…'
                  }`}
                </div>
              )}

              {printPhase === 'done' && (
                <button
                  onClick={resetPrint}
                  className="rounded-lg border border-cyan-400/30 px-4 py-2 text-xs text-cyan-200"
                >
                  Reset pipeline
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}


export function IoModule() {
  const species = useStore((s) => s.species)
  const phenotype = useStore((s) => s.phenotype)
  const edits = useStore((s) => s.edits)
  const importedSequence = useStore((s) => s.importedSequence)
  const activeSequence = useStore((s) => s.activeSequence)
  const setImportedSequence = useStore((s) => s.setImportedSequence)
  const [log, setLog] = useState<string[]>([])
  const [format, setFormat] = useState<'sbol' | 'genbank' | 'fasta'>('sbol')

  const push = (msg: string) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...l].slice(0, 12))

  const exportPayload = () => {
    const name = species?.id ?? 'untitled'
    const header = species ? `${species.name} (${species.latin})` : 'Untitled assembly'
    const working = activeSequence?.seq || importedSequence?.seq || ''
    let body = ''
    let filename = ''
    if (format === 'fasta') {
      filename = `${name}_assembly.fasta`
      const seq = working || 'ATGCCGTA' + 'ACGT'.repeat(40) + 'TTAGGC'
      const title = activeSequence?.title || importedSequence?.title || name
      body = `>${title}|BioCAD|edits=${edits.length}\n${seq.match(/.{1,80}/g)?.join('\n') ?? seq}\n`
    } else if (format === 'genbank') {
      filename = `${name}_assembly.gb`
      body = `LOCUS       ${name.toUpperCase()}  2048 bp    DNA     linear\nDEFINITION  ${header} — BioCAD parametric assembly\nACCESSION   BC-${name}\nFEATURES             Location/Qualifiers\n     source          1..2048\n                     /organism="${species?.latin ?? 'synthetic'}"\n     CDS             100..800\n                     /product="phenotype_cassette"\n                     /note="skin=${phenotype.skin};intelligence=${phenotype.iq}"\nORIGIN\n        1 atgccgtaac gttagcgatt ...\n//\n`
    } else {
      filename = `${name}_design.sbol`
      body = `<?xml version="1.0" ?>\n<rdf:RDF xmlns:sbol="http://sbols.org/v2#">\n  <sbol:ComponentDefinition about="http://biocad.studio/${name}">\n    <sbol:displayId>${name}</sbol:displayId>\n    <sbol:name>${header}</sbol:name>\n    <sbol:role>http://identifiers.org/so/SO:0000804</sbol:role>\n  </sbol:ComponentDefinition>\n</rdf:RDF>\n`
    }
    const blob = new Blob([body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    push(`Exported ${filename}`)
  }

  const onImport = (file: File | null) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    const kind =
      ext === 'gb' || ext === 'gbk'
        ? 'GenBank'
        : ext === 'fasta' || ext === 'fa' || ext === 'fna'
          ? 'FASTA'
          : ext === 'xml' || ext === 'sbol' || ext === 'rdf'
            ? 'SBOL'
            : 'sequence'
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const parsed = parseImportedDna(text)
      if (!parsed.seq || parsed.seq.length < 8) {
        push(`Import failed · no ATCG bases in ${file.name}`)
        return
      }
      const title = parsed.title || file.name.replace(/\.[^.]+$/, '')
      setImportedSequence({ title, seq: parsed.seq, source: kind })
      push(`Imported ${file.name} as ${kind} (${text.length} bytes)`)
      push(`Parsed DNA · ${title} · ${parsed.seq.length.toLocaleString()} bp · ready for problem scan`)
    }
    reader.readAsText(file)
  }

  return (
    <Panel title="Import / Export" badge="CAD I/O · scan">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <FileUp className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-cyan-100">Import DNA · FASTA / GenBank / SBOL</h3>
          </div>
          <p className="mb-4 text-xs text-bio-muted">
            Drop a sequence file to load the working assembly, then search for genetic problems and repair before print.
          </p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-cyan-400/40 bg-cyan-400/5 px-4 py-8 transition hover:border-cyan-300/50 hover:bg-cyan-400/10">
            <FileCode2 className="h-8 w-8 text-cyan-400" />
            <span className="text-sm text-cyan-200">Import DNA · FASTA / GenBank / SBOL</span>
            <span className="font-mono text-[10px] text-bio-dim">.fasta · .fa · .gb · .gbk · .sbol</span>
            <input
              type="file"
              accept=".sbol,.xml,.rdf,.gb,.gbk,.fasta,.fa,.fna,.txt"
              className="hidden"
              onChange={(e) => onImport(e.target.files?.[0] ?? null)}
            />
          </label>
          {importedSequence && (
            <div className="mt-3 border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 font-mono text-[10px] text-emerald-200">
              Loaded · {importedSequence.title} · {importedSequence.seq.length.toLocaleString()} bp · {importedSequence.source}
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] text-bio-dim">
            <div className="rounded-lg border border-bio-border p-2 text-center">SBOL 2/3</div>
            <div className="rounded-lg border border-bio-border p-2 text-center">GenBank</div>
            <div className="rounded-lg border border-bio-border p-2 text-center">FASTA</div>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <FileDown className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-cyan-100">Export design</h3>
          </div>
          <p className="mb-4 text-xs text-bio-muted">
            Serialize the current organism assembly, phenotype parameters, and pending genomic edits.
          </p>
          <div className="mb-4 flex gap-2">
            {(['sbol', 'genbank', 'fasta'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`btn-press rounded-lg px-3 py-1.5 font-mono text-xs uppercase ${
                  format === f
                    ? 'border border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                    : 'border border-bio-border text-bio-dim hover:border-cyan-400/25'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={exportPayload}
            className="btn-press cta-glow flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100"
          >
            <FileDown className="h-4 w-4" /> Export {format.toUpperCase()}
          </button>
          <div className="mt-3 font-mono text-[10px] text-bio-muted">
            Target: {species?.name ?? '—'} · {edits.length} edits · intelligence {phenotype.iq}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <GeneticScanPanel />
      </div>

      <div className="glass mt-4 rounded-xl p-4">
        <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-400/80">I/O log</div>
        <div className="max-h-40 space-y-1 overflow-y-auto font-mono text-[10px] text-emerald-400/80">
          {log.length === 0 && <div className="text-bio-muted">Awaiting import / export…</div>}
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

export function SystemsModule() {
  const { immortalityOn, hostilityOn, toggleImmortality, toggleHostility } = useStore()
  return (
    <Panel title="Systems" badge="pathways">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`glass rounded-xl p-5 ${immortalityOn ? 'neon-border' : ''}`}>
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-emerald-200">Immortality Pathway</h3>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-bio-muted">
            Telomerase upregulation, senolytic cascades, and DNA-repair enhancer network for extended
            cellular lifespan programs.
          </p>
          <button
            onClick={toggleImmortality}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              immortalityOn
                ? 'border border-emerald-400/50 bg-emerald-400/20 text-emerald-200'
                : 'border border-bio-border bg-bio-card text-bio-dim'
            }`}
          >
            {immortalityOn ? 'Pathway ARMED' : 'Arm pathway'}
          </button>
          {immortalityOn && (
            <div className="mt-3 font-mono text-[10px] text-emerald-400/70">
              hTERT ↑ · p53 dampener · autophagy boost
            </div>
          )}
        </div>

        <div className={`glass rounded-xl p-5 ${hostilityOn ? 'border-red-400/40' : ''}`}>
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="font-semibold text-red-200">Hostility Pathway</h3>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-bio-muted">
            Aggression and territorial circuit markers with biocontainment kill-switch integration for
            controlled organism programs.
          </p>
          <button
            onClick={toggleHostility}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              hostilityOn
                ? 'border border-red-400/50 bg-red-400/20 text-red-200'
                : 'border border-bio-border bg-bio-card text-bio-dim'
            }`}
          >
            {hostilityOn ? 'Pathway FLAGGED' : 'Inspect pathway'}
          </button>
          {hostilityOn && (
            <div className="mt-3 font-mono text-[10px] text-red-400/70">
              MAOA locus · kill-switch armed · containment OK
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  projects: <FolderKanban className="h-4 w-4" />,
  loader: <Dna className="h-4 w-4" />,
  browser: <Search className="h-4 w-4" />,
  phenotype: <Sliders className="h-4 w-4" />,
  visual: <GitBranch className="h-4 w-4" />,
  parts: <Boxes className="h-4 w-4" />,
  io: <FileCode2 className="h-4 w-4" />,
  simulation: <FlaskConical className="h-4 w-4" />,
  assisted: <Sparkles className="h-4 w-4" />,
  print: <Printer className="h-4 w-4" />,
  systems: <Shield className="h-4 w-4" />,
}

export function SideNav() {
  const module = useStore((s) => s.module)
  const setModule = useStore((s) => s.setModule)
  return (
    <nav className="flex w-48 shrink-0 flex-col gap-0 border-r border-bio-border bg-[#05080c] p-1.5">
      <div className="mb-2 border-b border-bio-border/80 px-2 pb-2 pt-1.5">
        <div className="font-mono text-[11px] font-semibold tracking-[0.2em] text-cyan-300/90">BIOCAD</div>
        <div className="font-mono text-[8px] uppercase tracking-widest text-bio-muted">Studio · {MODULES.length} modules</div>
      </div>
      {MODULES.map((m) => (
        <button
          key={m.id}
          onClick={() => setModule(m.id)}
          className={`nav-rail-btn flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${
            module === m.id
              ? 'nav-rail-active text-cyan-100'
              : 'text-bio-dim hover:text-bio-text'
          }`}
          title={m.desc}
        >
          {ICONS[m.id]}
          {m.label}
        </button>
      ))}
    </nav>
  )
}

export function ModuleRouter() {
  const module = useStore((s) => s.module)
  switch (module) {
    case 'projects':
      return <ProjectsModule />
    case 'loader':
      return <LoaderModule />
    case 'browser':
      return <BrowserModule />
    case 'phenotype':
      return <PhenotypeModule />
    case 'visual':
      return <VisualModule />
    case 'parts':
      return <PartsModule />
    case 'io':
      return <IoModule />
    case 'simulation':
      return <SimulationModule />
    case 'assisted':
      return <AssistedModule />
    case 'print':
      return <PrintModule />
    case 'systems':
      return <SystemsModule />
    default:
      return <LoaderModule />
  }
}
