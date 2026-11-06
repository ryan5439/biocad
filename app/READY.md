# BioCAD Studio — Ready for Deploy

**dist path:** `/workspace/biocaddemo-app/dist`  
**base:** `/biocaddemo/`  
**build:** succeeded (`npm run build` → Vite production)

## Stack
- Vite + React + TypeScript + Tailwind v4
- framer-motion, lucide-react, zustand

## Feature checklist
- [x] Epic splash (skippable) → studio
- [x] Genome Loader: Human, Dog, Worm + 22 more (25 species total)
- [x] Dramatic genome load animation
- [x] Phenotype Editor: skin, eyes, nails, hair, body-part sizes, proportions, species traits
- [x] Intelligence/cognition sliders: IQ, learning, memory, attention, emotional regulation
- [x] Live SVG organism preview (silhouette-aware)
- [x] Pending genomic edits → Finalize → Compile → Print DNA pipeline (Compile/Assemble/Verify/Print)
- [x] Side nav: Projects, Genome Loader, Genome Browser, Phenotype Editor, Visual Editor (node graph), Part Library, Import/Export, Simulation, Assisted Design, Print Control, Systems
- [x] CAD Import/Export: SBOL, GenBank, FASTA (file import + download export)
- [x] Systems: Immortality + Hostility pathways
- [x] Dark biotech neon/glass UI
- [x] `base: '/biocaddemo/'` in vite.config

## Deploy note
Stackdrop: serve contents of `dist/` at `/biocaddemo/`.
