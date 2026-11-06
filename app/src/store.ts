import { create } from 'zustand'
import { SPECIES, type ModuleId, type Species } from './data'
import {
  applyRepair,
  sanitizeDna,
  scanGeneticProblems,
  type GeneticFinding,
} from './sequence'

export type Phenotype = {
  skin: string
  eyes: string
  nails: string
  hair: string
  hairLength: number
  headSize: number
  torsoSize: number
  armLength: number
  legLength: number
  earSize: number
  noseSize: number
  muscleMass: number
  height: number
  speciesTrait: number
  iq: number
  learning: number
  memory: number
  attention: number
  emotionalReg: number
  coatColor: string
  coatLength: number
  featherColor: string
  featherCoverage: number
  featherSize: number
  iridescence: number
  beakColor: string
  beakLength: number
  beakShape: number
  wingSpan: number
  wingShape: number
  talonSize: number
  snoutLength: number
  tailLength: number
  clawSize: number
  finSpan: number
  bodyLength: number
  scaleColor: string
  scalePattern: number
  tentacleLength: number
  gillsSize: number
  antennaeLength: number
  wingTint: string
  segments: number
  colonyColor: string
  colonySize: number
  leafColor: string
  bloomColor: string
  stemHeight: number
  leafSpan: number
  shellSize: number
}

export type GenomicEdit = {
  id: string
  locus: string
  field: string
  from: string
  to: string
  status: 'pending' | 'finalized' | 'compiled'
}

export type PrintPhase = 'idle' | 'compile' | 'assemble' | 'verify' | 'print' | 'done'
export type ScanPhase = 'idle' | 'scanning' | 'found' | 'repairing' | 'repaired'
export type { GeneticFinding }

export type AppState = {
  showSplash: boolean
  skipSplash: () => void
  module: ModuleId
  setModule: (m: ModuleId) => void
  species: Species | null
  loadProgress: number
  loading: boolean
  loadSpecies: (s: Species) => void
  phenotype: Phenotype
  setPhenotype: (p: Partial<Phenotype>) => void
  edits: GenomicEdit[]
  finalizeEdits: () => void
  clearEdits: () => void
  printPhase: PrintPhase
  printProgress: number
  printStartedAt: number | null
  printSequence: { title: string; seq: string } | null
  startPrint: () => void
  resetPrint: () => void
  setActiveSequence: (s: { title: string; seq: string } | null) => void
  projects: { id: string; name: string; species: string; date: string }[]
  immortalityOn: boolean
  hostilityOn: boolean
  toggleImmortality: () => void
  toggleHostility: () => void
  simRunning: boolean
  setSimRunning: (v: boolean) => void
  activeSequence: { title: string; seq: string } | null
  queueSequenceEdit: (payload: {
    part: string
    from: string
    to: string
    length: number
    gc: number
    seq: string
  }) => void
  importedSequence: { title: string; seq: string; source: string } | null
  scanFindings: GeneticFinding[]
  scanPhase: ScanPhase
  scanHighlight: { start: number; end: number } | null
  printFromRepair: boolean
  printDurationMs: number
  setImportedSequence: (s: { title: string; seq: string; source: string } | null) => void
  runProblemScan: () => void
  repairFinding: (id: string) => void
  repairAllFindings: () => void
  setScanHighlight: (h: { start: number; end: number } | null) => void
  clearScan: () => void
}

const defaultPhenotype = (s?: Species | null): Phenotype => {
  const human = s?.id === 'human' || s?.silhouette === 'humanoid'
  const isDog = s?.id === 'dog'
  const isQuadruped = s?.silhouette === 'quadruped'
  
  // Safe fallbacks for all species
  const baseSkin = s?.baseSkin ?? '#e8b896'
  const baseEye = s?.baseEye ?? '#4a7c59'
  
  return {
  skin: baseSkin,
  eyes: baseEye,
  nails: '#c8b0a0',
  hair: '#3a2818',
  hairLength: human ? 42 : 40,
  // Average adult anthropometrics at mid-sliders (human); others keep prior mid defaults
  headSize: human ? 48 : isDog ? 50 : 50,
  torsoSize: 50, // mid maps to real torso ratio after preview recalibration
  armLength: human ? 52 : 50,
  legLength: human ? 55 : isDog ? 52 : 50,
  earSize: isDog ? 55 : 50,
  noseSize: 50,
  muscleMass: human ? 48 : isDog ? 50 : 45,
  height: human ? 52 : isDog ? 55 : 50, // ~5'10" adult baseline vs 6 ft ruler
  speciesTrait: 50,
  iq: 50,
  learning: 50,
  memory: 50,
  attention: 50,
  emotionalReg: 50,
  // Dog/quadruped-specific defaults with safe fallbacks
  coatColor: isDog || isQuadruped ? (s?.baseSkin ?? '#c4a574') : (s?.baseSkin ?? '#c4a574'),
  coatLength: isDog ? 35 : 45,
  featherColor: s?.baseSkin ?? '#2a2a2a',
  featherCoverage: 70,
  featherSize: 55,
  iridescence: 30,
  beakColor: '#c8b090',
  beakLength: 50,
  beakShape: 45,
  wingSpan: 60,
  wingShape: 50,
  talonSize: 45,
  snoutLength: isDog ? 50 : 50,
  tailLength: isDog ? 55 : 50,
  clawSize: isDog ? 45 : 40,
  finSpan: 55,
  bodyLength: isDog ? 55 : 55,
  scaleColor: s?.baseSkin ?? '#6a8a4a',
  scalePattern: 40,
  tentacleLength: 60,
  gillsSize: 55,
  antennaeLength: 50,
  wingTint: '#a0c8e8',
  segments: 50,
  colonyColor: '#f5e6b0',
  colonySize: 50,
  leafColor: '#6aaa40',
  bloomColor: '#f0e060',
  stemHeight: 55,
  leafSpan: 50,
  shellSize: 55,
  }
}

let editCounter = 0
let loadTimer: ReturnType<typeof setInterval> | null = null
let printTimer: ReturnType<typeof setInterval> | null = null

/** DNA print duration ≈ 5 minutes (snappy per-base stream) */
const PRINT_BASE_MS = 5 * 60 * 1000

function computePrintDurationMs(_seqLen: number): number {
  // ~5 minutes total for every job — snappy letter stream
  return PRINT_BASE_MS
}

function fieldLabel(key: string) {
  if (key === 'iq') return 'Intelligence'
  if (key === 'muscleMass') return 'Muscle density (strength)'
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

export const useStore = create<AppState>((set, get) => ({
  showSplash: true,
  skipSplash: () => set({ showSplash: false }),
  module: 'loader',
  setModule: (m) => set({ module: m }),
  species: null,
  loadProgress: 0,
  loading: false,
  loadSpecies: (s) => {
    if (loadTimer) clearInterval(loadTimer)
    set({
      loading: true,
      loadProgress: 0,
      species: null,
      edits: [],
      printPhase: 'idle',
      printProgress: 0,
      printStartedAt: null,
      printSequence: null,
      module: 'loader',
    })
    loadTimer = setInterval(() => {
      const next = get().loadProgress + 4 + Math.random() * 8
      if (next >= 100) {
        if (loadTimer) clearInterval(loadTimer)
        loadTimer = null
        set({
          loadProgress: 100,
          loading: false,
          species: s,
          phenotype: defaultPhenotype(s),
          module: 'phenotype',
        })
      } else {
        set({ loadProgress: next })
      }
    }, 60)
  },
  phenotype: defaultPhenotype(SPECIES[0]),
  setPhenotype: (partial) => {
    const prev = get().phenotype
    // Validate and sanitize incoming phenotype data
    const sanitized: Partial<Phenotype> = {}
    for (const [key, value] of Object.entries(partial)) {
      if (value === undefined || value === null) continue
      // Ensure numeric values are valid numbers
      if (typeof prev[key as keyof Phenotype] === 'number') {
        const num = typeof value === 'number' ? value : parseFloat(String(value))
        sanitized[key as keyof Phenotype] = isNaN(num) ? prev[key as keyof Phenotype] : Math.max(0, Math.min(100, num)) as any
      } else if (typeof prev[key as keyof Phenotype] === 'string') {
        // Ensure string values (colors) are valid
        sanitized[key as keyof Phenotype] = String(value) as any
      }
    }
    const next = { ...prev, ...sanitized }
    const newEdits: GenomicEdit[] = []
    for (const key of Object.keys(sanitized) as (keyof Phenotype)[]) {
      const from = String(prev[key])
      const to = String(next[key])
      if (from === to) continue
      editCounter += 1
      newEdits.push({
        id: `edit-${editCounter}`,
        locus: `synth://${key}@v${editCounter}`,
        field: fieldLabel(key),
        from,
        to,
        status: 'pending',
      })
    }
    set({ phenotype: next, edits: [...get().edits, ...newEdits].slice(-40) })
  },
  edits: [],
  finalizeEdits: () =>
    set({
      edits: get().edits.map((e) =>
        e.status === 'pending' ? { ...e, status: 'finalized' } : e,
      ),
    }),
  clearEdits: () => set({ edits: [] }),
  printPhase: 'idle',
  printProgress: 0,
  printStartedAt: null,
  printSequence: null,
  startPrint: () => {
    if (printTimer) clearInterval(printTimer)
    const phases: PrintPhase[] = ['compile', 'assemble', 'verify', 'print', 'done']
    const active = get().activeSequence
    const seq =
      active?.seq && /[ATCG]/i.test(active.seq)
        ? active.seq.replace(/[^ATCGatcg]/g, '').toUpperCase()
        : null
    // Fallback: deterministic job sequence from edits/species so print always has bases
    let printSeq = seq
    let printTitle = active?.title ?? 'assembly'
    if (!printSeq || printSeq.length < 8) {
      const seed = `job|${get().species?.id ?? 'x'}|${get().edits.map((e) => e.id).join(',')}`
      let h = 2166136261 >>> 0
      for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i)
        h = Math.imul(h, 16777619)
      }
      const len = Math.min(800, Math.max(96, 48 + get().edits.length * 24))
      const bases = ['A', 'T', 'G', 'C'] as const
      const out: string[] = []
      for (let i = 0; i < len; i++) {
        h = (Math.imul(h, 1664525) + 1013904223) >>> 0
        out.push(bases[h & 3])
      }
      if (len >= 3) {
        out[0] = 'A'
        out[1] = 'T'
        out[2] = 'G'
      }
      printSeq = out.join('')
      printTitle = active?.title ?? `${get().species?.name ?? 'Genome'} print job`
    }
    const durationMs = computePrintDurationMs(printSeq.length)
    set({
      printPhase: 'compile',
      printProgress: 0,
      printStartedAt: null,
      printSequence: { title: printTitle, seq: printSeq },
      printDurationMs: durationMs,
      module: 'print',
      edits: get().edits.map((e) => ({ ...e, status: 'compiled' })),
    })
    let phaseIdx = 0
    printTimer = setInterval(() => {
      const phase = get().printPhase
      if (phase === 'print') {
        let started = get().printStartedAt
        if (!started) {
          started = Date.now()
          set({ printStartedAt: started })
        }
        const dur = get().printDurationMs || computePrintDurationMs(get().printSequence?.seq.length ?? 0)
        const pct = Math.min(100, ((Date.now() - started) / dur) * 100)
        if (pct >= 100) {
          if (printTimer) clearInterval(printTimer)
          printTimer = null
          set({ printPhase: 'done', printProgress: 100 })
        } else {
          set({ printProgress: pct })
        }
        return
      }
      const step = 4.2
      const p = get().printProgress + step
      if (p >= 100) {
        phaseIdx += 1
        const next = phases[phaseIdx]
        if (!next || next === 'done') {
          // Should enter print before done — if somehow past print, finish
          if (printTimer) clearInterval(printTimer)
          printTimer = null
          set({ printPhase: 'done', printProgress: 100 })
        } else if (next === 'print') {
          set({ printPhase: 'print', printProgress: 0, printStartedAt: Date.now() })
        } else {
          set({ printPhase: next, printProgress: 0 })
        }
      } else {
        set({ printProgress: p })
      }
    }, 100)
  },
  resetPrint: () => {
    if (printTimer) clearInterval(printTimer)
    printTimer = null
    set({ printPhase: 'idle', printProgress: 0, printStartedAt: null })
  },
  setActiveSequence: (s) => set({ activeSequence: s }),
  projects: [
    { id: 'prj-1', name: 'Neon Canid v0.3', species: 'Dog', date: '2026-09-02' },
    { id: 'prj-2', name: 'C. elegans + GFP', species: 'Worm', date: '2026-08-28' },
    { id: 'prj-3', name: 'Cortex Boost Pipeline', species: 'Human', date: '2026-09-08' },
  ],
  immortalityOn: false,
  hostilityOn: false,
  toggleImmortality: () => set({ immortalityOn: !get().immortalityOn }),
  toggleHostility: () => set({ hostilityOn: !get().hostilityOn }),
  simRunning: false,
  setSimRunning: (v) => set({ simRunning: v }),
  activeSequence: null,
  importedSequence: null,
  scanFindings: [],
  scanPhase: 'idle',
  scanHighlight: null,
  printFromRepair: false,
  printDurationMs: PRINT_BASE_MS,
  setImportedSequence: (s) => {
    if (!s) {
      set({ importedSequence: null })
      return
    }
    const clean = sanitizeDna(s.seq)
    const payload = { title: s.title, seq: clean, source: s.source }
    set({
      importedSequence: payload,
      activeSequence: { title: s.title, seq: clean },
      printSequence: { title: s.title, seq: clean },
      printFromRepair: false,
      scanFindings: [],
      scanPhase: 'idle',
      scanHighlight: null,
    })
  },
  runProblemScan: () => {
    const active = get().activeSequence ?? (get().importedSequence
      ? { title: get().importedSequence!.title, seq: get().importedSequence!.seq }
      : null)
    if (!active?.seq) return
    const clean = sanitizeDna(active.seq)
    set({
      scanPhase: 'scanning',
      scanFindings: [],
      scanHighlight: null,
      activeSequence: { title: active.title, seq: clean },
      printSequence: { title: active.title, seq: clean },
    })
    // Sync findings after brief scanning window (UI animates); still deterministic
    window.setTimeout(() => {
      const findings = scanGeneticProblems(clean)
      const first = findings[0]
      set({
        scanPhase: findings.length ? 'found' : 'repaired',
        scanFindings: findings,
        scanHighlight: first ? { start: first.start, end: first.end } : null,
      })
    }, 1400)
  },
  repairFinding: (id) => {
    const finding = get().scanFindings.find((f) => f.id === id)
    if (!finding || finding.fixed) return
    const active = get().activeSequence
    if (!active?.seq) return
    set({
      scanPhase: 'repairing',
      scanHighlight: { start: finding.start, end: finding.end },
    })
    const before = sanitizeDna(active.seq)
    const after = applyRepair(before, finding)
    const oldSpan = Math.max(0, finding.end - finding.start)
    const newSpan =
      finding.repairMode === 'delete'
        ? 0
        : finding.repairMode === 'insert'
          ? sanitizeDna(finding.suggestedRepair || 'ATG').length
          : sanitizeDna(finding.suggestedRepair || before.slice(finding.start, finding.end)).length
    const delta = finding.repairMode === 'insert' ? newSpan : newSpan - oldSpan
    editCounter += 1
    const edit: GenomicEdit = {
      id: `edit-${editCounter}`,
      locus: `repair://${finding.type}@${finding.start}`,
      field: `Repair · ${finding.label}`,
      from: before.slice(finding.start, finding.end) || `${oldSpan}bp`,
      to: finding.suggestedRepair || 'Δ',
      status: 'pending',
    }
    const nextFindings = get().scanFindings.map((f) => {
      if (f.id === id) {
        return {
          ...f,
          fixed: true,
          end: finding.start + Math.max(1, newSpan || 1),
        }
      }
      if (f.fixed) return f
      if (f.start >= finding.end) {
        return { ...f, start: f.start + delta, end: f.end + delta }
      }
      return f
    })
    const allFixed = nextFindings.every((f) => f.fixed)
    set({
      edits: [...get().edits, edit].slice(-40),
      activeSequence: { title: active.title, seq: after },
      printSequence: { title: `${active.title} · repaired`, seq: after },
      printFromRepair: true,
      scanFindings: nextFindings,
      scanPhase: allFixed ? 'repaired' : 'found',
      scanHighlight: {
        start: finding.start,
        end: finding.start + Math.max(1, newSpan || 1),
      },
    })
  },
  repairAllFindings: () => {
    const active = get().activeSequence
    if (!active?.seq) return
    const pending = get().scanFindings.filter((f) => !f.fixed)
    if (!pending.length) {
      set({ scanPhase: 'repaired', printFromRepair: true })
      return
    }
    set({ scanPhase: 'repairing' })
    let seq = sanitizeDna(active.seq)
    // Apply in reverse genomic order so indices stay valid
    const ordered = [...pending].sort((a, b) => b.start - a.start)
    const newEdits: GenomicEdit[] = []
    for (const finding of ordered) {
      const beforeSlice = seq.slice(finding.start, finding.end)
      seq = applyRepair(seq, finding)
      editCounter += 1
      newEdits.push({
        id: `edit-${editCounter}`,
        locus: `repair://${finding.type}@${finding.start}`,
        field: `Repair · ${finding.label}`,
        from: beforeSlice || `${finding.end - finding.start}bp`,
        to: finding.suggestedRepair || 'Δ',
        status: 'pending',
      })
    }
    set({
      edits: [...get().edits, ...newEdits].slice(-40),
      activeSequence: { title: active.title, seq },
      printSequence: { title: `${active.title} · repaired`, seq },
      printFromRepair: true,
      scanFindings: get().scanFindings.map((f) => ({ ...f, fixed: true })),
      scanPhase: 'repaired',
      scanHighlight: null,
    })
  },
  setScanHighlight: (h) => set({ scanHighlight: h }),
  clearScan: () =>
    set({
      scanFindings: [],
      scanPhase: 'idle',
      scanHighlight: null,
    }),
  queueSequenceEdit: (payload) => {
    editCounter += 1
    const clean = (payload.seq || '').replace(/[^ATCGatcg]/g, '').toUpperCase()
    const edit: GenomicEdit = {
      id: `edit-${editCounter}`,
      locus: `seq://${payload.part.replace(/\s+/g, '_')}@v${editCounter}`,
      field: `DNA · ${payload.part}`,
      from: payload.from,
      to: payload.to,
      status: 'pending',
    }
    set({
      edits: [...get().edits, edit].slice(-40),
      activeSequence: { title: payload.part, seq: clean },
      printSequence: { title: payload.part, seq: clean },
    })
  },
}))
