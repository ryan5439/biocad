import { Splash } from './components/Splash'
import { SideNav, ModuleRouter } from './components/Modules'
import { OrganismPreview } from './components/OrganismPreview'
import { PrintHelixModal } from './components/PrintHelixModal'
import { useStore } from './store'

export default function App() {
  const showSplash = useStore((s) => s.showSplash)
  const species = useStore((s) => s.species)
  const edits = useStore((s) => s.edits)
  const module = useStore((s) => s.module)
  const printPhase = useStore((s) => s.printPhase)
  const scanPhase = useStore((s) => s.scanPhase)
  const activeSequence = useStore((s) => s.activeSequence)
  const importedSequence = useStore((s) => s.importedSequence)
  const printFromRepair = useStore((s) => s.printFromRepair)

  if (showSplash) return <Splash />

  const showDock = module !== 'phenotype' && module !== 'simulation'
  const seq = activeSequence ?? (importedSequence ? { title: importedSequence.title, seq: importedSequence.seq } : null)

  return (
    <div className="flex h-full min-h-screen flex-col bg-[#030507]">
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-bio-border bg-[#05080c] px-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/85">
            BioCAD · Genome Workstation
          </span>
          {species && (
            <span className="border border-emerald-500/35 bg-emerald-500/5 px-2 py-0.5 font-mono text-[10px] text-emerald-300/90">
              {species.name} · {species.genomeMb}Mb · {species.chromosomes}chr
            </span>
          )}
          {seq && (
            <span className="border border-cyan-500/30 bg-cyan-500/5 px-2 py-0.5 font-mono text-[10px] text-cyan-300/90">
              SEQ · {seq.title} · {seq.seq.length.toLocaleString()}bp
            </span>
          )}
          {scanPhase !== 'idle' && (
            <span className="border border-amber-500/30 bg-amber-500/5 px-2 py-0.5 font-mono text-[10px] uppercase text-amber-200/90">
              SCAN/{scanPhase}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-bio-muted">
          <span className="tabular-nums">{edits.length} edits queued</span>
          {printFromRepair && <span className="text-emerald-300/80">REPAIRED</span>}
          {printPhase !== 'idle' && <span className="text-cyan-300/80">PRINT/{printPhase.toUpperCase()}</span>}
          <span className="text-cyan-500/70">v1.2</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className={`min-h-0 flex-1 overflow-hidden ${showDock ? 'p-2' : 'p-3'}`}>
            <ModuleRouter />
          </div>
          {showDock && species && (
            <div className="hidden h-[280px] shrink-0 border-t border-bio-border bg-[#04070b] p-2 xl:block">
              <OrganismPreview compact />
            </div>
          )}
        </main>
      </div>

      <PrintHelixModal />

      <footer className="shrink-0 border-t border-bio-border bg-[#030507] px-3 py-1 font-mono text-[9px] text-bio-muted">
        <div className="flex justify-between tracking-wider">
          <span>I/O · SBOL · GENBANK · FASTA · GENETIC SCAN · PRINT DNA</span>
          <span className="text-cyan-500/70">
            {seq ? `ASSEMBLY · ${seq.seq.length.toLocaleString()} BP` : 'SEQ-CONSOLE · READY'}
          </span>
        </div>
      </footer>
    </div>
  )
}
