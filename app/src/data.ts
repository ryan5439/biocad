export type Species = {
  id: string
  name: string
  latin: string
  genomeMb: number
  chromosomes: number
  category: 'mammal' | 'bird' | 'fish' | 'reptile' | 'invertebrate' | 'amphibian' | 'plant' | 'other'
  traits: string[]
  baseSkin: string
  baseEye: string
  silhouette: 'humanoid' | 'quadruped' | 'avian' | 'serpentine' | 'worm' | 'aquatic' | 'insect' | 'plant'
}

export const SPECIES: Species[] = [
  { id: 'human', name: 'Human', latin: 'Homo sapiens', genomeMb: 3200, chromosomes: 46, category: 'mammal', traits: ['bipedal', 'high cortex', 'language'], baseSkin: '#e8b896', baseEye: '#4a7c59', silhouette: 'humanoid' },
  { id: 'dog', name: 'Dog', latin: 'Canis lupus familiaris', genomeMb: 2400, chromosomes: 78, category: 'mammal', traits: ['olfaction', 'pack social', 'endurance'], baseSkin: '#c4a574', baseEye: '#8b5a2b', silhouette: 'quadruped' },
  { id: 'worm', name: 'Worm', latin: 'Caenorhabditis elegans', genomeMb: 100, chromosomes: 12, category: 'invertebrate', traits: ['simple nervous', 'transparent', 'model organism'], baseSkin: '#d4c4a8', baseEye: '#888888', silhouette: 'worm' },
  { id: 'cat', name: 'Cat', latin: 'Felis catus', genomeMb: 2500, chromosomes: 38, category: 'mammal', traits: ['night vision', 'agility', 'solitary'], baseSkin: '#d9a066', baseEye: '#7cb518', silhouette: 'quadruped' },
  { id: 'mouse', name: 'Mouse', latin: 'Mus musculus', genomeMb: 2700, chromosomes: 40, category: 'mammal', traits: ['rapid breeding', 'lab model'], baseSkin: '#a09080', baseEye: '#222222', silhouette: 'quadruped' },
  { id: 'chimp', name: 'Chimpanzee', latin: 'Pan troglodytes', genomeMb: 3300, chromosomes: 48, category: 'mammal', traits: ['tool use', 'social hierarchy'], baseSkin: '#8b6914', baseEye: '#4a3728', silhouette: 'humanoid' },
  { id: 'dolphin', name: 'Dolphin', latin: 'Tursiops truncatus', genomeMb: 2500, chromosomes: 44, category: 'mammal', traits: ['echolocation', 'aquatic', 'high intelligence'], baseSkin: '#7a8a9a', baseEye: '#1a1a2e', silhouette: 'aquatic' },
  { id: 'eagle', name: 'Bald Eagle', latin: 'Haliaeetus leucocephalus', genomeMb: 1200, chromosomes: 66, category: 'bird', traits: ['keen vision', 'flight'], baseSkin: '#c8b090', baseEye: '#f0a020', silhouette: 'avian' },
  { id: 'frog', name: 'Frog', latin: 'Xenopus laevis', genomeMb: 3100, chromosomes: 36, category: 'amphibian', traits: ['metamorphosis', 'permeable skin'], baseSkin: '#5a8f4a', baseEye: '#c04040', silhouette: 'quadruped' },
  { id: 'zebrafish', name: 'Zebrafish', latin: 'Danio rerio', genomeMb: 1400, chromosomes: 50, category: 'fish', traits: ['regeneration', 'transparent larvae'], baseSkin: '#e8c84a', baseEye: '#222222', silhouette: 'aquatic' },
  { id: 'fruitfly', name: 'Fruit Fly', latin: 'Drosophila melanogaster', genomeMb: 140, chromosomes: 8, category: 'invertebrate', traits: ['short lifespan', 'genetic toolkit'], baseSkin: '#3a2a1a', baseEye: '#c02020', silhouette: 'insect' },
  { id: 'octopus', name: 'Octopus', latin: 'Octopus vulgaris', genomeMb: 2300, chromosomes: 60, category: 'invertebrate', traits: ['distributed cognition', 'camouflage'], baseSkin: '#c06080', baseEye: '#101010', silhouette: 'aquatic' },
  { id: 'elephant', name: 'Elephant', latin: 'Loxodonta africana', genomeMb: 3200, chromosomes: 56, category: 'mammal', traits: ['memory', 'trunk dexterity'], baseSkin: '#8a8a8a', baseEye: '#4a3020', silhouette: 'quadruped' },
  { id: 'chicken', name: 'Chicken', latin: 'Gallus gallus', genomeMb: 1200, chromosomes: 78, category: 'bird', traits: ['domestication', 'flight limited'], baseSkin: '#e8d0a8', baseEye: '#f0a020', silhouette: 'avian' },
  { id: 'shark', name: 'Great White', latin: 'Carcharodon carcharias', genomeMb: 4600, chromosomes: 82, category: 'fish', traits: ['apex predator', 'electroreception'], baseSkin: '#8a9aaa', baseEye: '#101010', silhouette: 'aquatic' },
  { id: 'rabbit', name: 'Rabbit', latin: 'Oryctolagus cuniculus', genomeMb: 2700, chromosomes: 44, category: 'mammal', traits: ['herbivore', 'alertness'], baseSkin: '#d8c8b0', baseEye: '#4a3020', silhouette: 'quadruped' },
  { id: 'tiger', name: 'Tiger', latin: 'Panthera tigris', genomeMb: 2400, chromosomes: 38, category: 'mammal', traits: ['ambush', 'stripes'], baseSkin: '#d08030', baseEye: '#c0a040', silhouette: 'quadruped' },
  { id: 'cow', name: 'Cow', latin: 'Bos taurus', genomeMb: 2700, chromosomes: 60, category: 'mammal', traits: ['ruminant'], baseSkin: '#c8b090', baseEye: '#303020', silhouette: 'quadruped' },
  { id: 'horse', name: 'Horse', latin: 'Equus caballus', genomeMb: 2800, chromosomes: 64, category: 'mammal', traits: ['speed', 'herd'], baseSkin: '#8a6030', baseEye: '#202020', silhouette: 'quadruped' },
  { id: 'pig', name: 'Pig', latin: 'Sus scrofa', genomeMb: 2600, chromosomes: 38, category: 'mammal', traits: ['omnivore'], baseSkin: '#e8b0a0', baseEye: '#303030', silhouette: 'quadruped' },
  { id: 'crow', name: 'Crow', latin: 'Corvus corax', genomeMb: 1100, chromosomes: 80, category: 'bird', traits: ['problem solving', 'tool use'], baseSkin: '#2a2a2a', baseEye: '#101010', silhouette: 'avian' },
  { id: 'snake', name: 'Python', latin: 'Python bivittatus', genomeMb: 1400, chromosomes: 36, category: 'reptile', traits: ['heat sensing', 'constriction'], baseSkin: '#6a8a4a', baseEye: '#c0a040', silhouette: 'serpentine' },
  { id: 'axolotl', name: 'Axolotl', latin: 'Ambystoma mexicanum', genomeMb: 32000, chromosomes: 28, category: 'amphibian', traits: ['limb regeneration', 'neoteny'], baseSkin: '#f0a0b0', baseEye: '#202020', silhouette: 'aquatic' },
  { id: 'yeast', name: 'Baker\'s Yeast', latin: 'Saccharomyces cerevisiae', genomeMb: 12, chromosomes: 16, category: 'other', traits: ['fermentation', 'eukaryote model'], baseSkin: '#f5e6b0', baseEye: '#c8a840', silhouette: 'worm' },
  { id: 'arabidopsis', name: 'Thale Cress', latin: 'Arabidopsis thaliana', genomeMb: 135, chromosomes: 10, category: 'plant', traits: ['flowering model', 'small genome'], baseSkin: '#6aaa40', baseEye: '#f0e060', silhouette: 'plant' },
  { id: 'bee', name: 'Honey Bee', latin: 'Apis mellifera', genomeMb: 250, chromosomes: 32, category: 'invertebrate', traits: ['hive mind', 'pollination'], baseSkin: '#e8b020', baseEye: '#202020', silhouette: 'insect' },
  { id: 'turtle', name: 'Sea Turtle', latin: 'Chelonia mydas', genomeMb: 2200, chromosomes: 56, category: 'reptile', traits: ['longevity', 'navigation'], baseSkin: '#5a7a4a', baseEye: '#304020', silhouette: 'aquatic' },
  { id: 'bat', name: 'Fruit Bat', latin: 'Pteropus alecto', genomeMb: 2000, chromosomes: 38, category: 'mammal', traits: ['echolocation', 'flight', 'viral reservoir'], baseSkin: '#6a5040', baseEye: '#181818', silhouette: 'avian' },
  { id: 'platypus', name: 'Platypus', latin: 'Ornithorhynchus anatinus', genomeMb: 1800, chromosomes: 52, category: 'mammal', traits: ['electroreception', 'venom', 'egg-laying'], baseSkin: '#7a6a5a', baseEye: '#202020', silhouette: 'aquatic' },
  { id: 'jellyfish', name: 'Moon Jelly', latin: 'Aurelia aurita', genomeMb: 160, chromosomes: 20, category: 'invertebrate', traits: ['radial symmetry', 'immortality lineage'], baseSkin: '#c0e0f0', baseEye: '#80b0d0', silhouette: 'aquatic' },
  { id: 'tardigrade', name: 'Tardigrade', latin: 'Hypsibius exemplaris', genomeMb: 100, chromosomes: 10, category: 'invertebrate', traits: ['extremophile', 'cryptobiosis'], baseSkin: '#c8a878', baseEye: '#404040', silhouette: 'insect' },
  { id: 'gorilla', name: 'Gorilla', latin: 'Gorilla gorilla', genomeMb: 3100, chromosomes: 48, category: 'mammal', traits: ['strength', 'social bonding'], baseSkin: '#3a3028', baseEye: '#2a2018', silhouette: 'humanoid' },
]

export type ModuleId =
  | 'projects'
  | 'loader'
  | 'browser'
  | 'phenotype'
  | 'visual'
  | 'parts'
  | 'io'
  | 'simulation'
  | 'assisted'
  | 'print'
  | 'systems'

export const MODULES: { id: ModuleId; label: string; desc: string }[] = [
  { id: 'projects', label: 'Projects', desc: 'Saved organism designs' },
  { id: 'loader', label: 'Genome Loader', desc: 'Load reference genomes' },
  { id: 'browser', label: 'Genome Browser', desc: 'Inspect chromosomes & loci' },
  { id: 'phenotype', label: 'Phenotype Editor', desc: 'Morphology & cognition' },
  { id: 'visual', label: 'Visual Editor', desc: 'Node-based trait graph' },
  { id: 'parts', label: 'Part Library', desc: 'BioBricks & gene parts' },
  { id: 'io', label: 'Import / Export', desc: 'SBOL · GenBank · FASTA' },
  { id: 'simulation', label: 'Simulation', desc: 'In-silico phenotype preview' },
  { id: 'assisted', label: 'Assisted Design', desc: 'AI-guided edit suggestions' },
  { id: 'print', label: 'Print Control', desc: 'Compile & print DNA' },
  { id: 'systems', label: 'Systems', desc: 'Immortality & hostility pathways' },
]

export const PARTS = [
  { id: 'p001', name: 'pT7-GFP', type: 'Reporter', size: '720bp', tags: ['fluorescence', 'T7'] },
  { id: 'p002', name: 'CMV-Promoter', type: 'Promoter', size: '589bp', tags: ['mammalian', 'constitutive'] },
  { id: 'p003', name: 'Cas9-nuclease', type: 'Editor', size: '4101bp', tags: ['CRISPR', 'edit'] },
  { id: 'p004', name: 'gRNA-scaffold', type: 'Guide', size: '96bp', tags: ['CRISPR'] },
  { id: 'p005', name: 'Melanocortin-1R', type: 'Gene', size: '951bp', tags: ['pigmentation'] },
  { id: 'p006', name: 'FOXP2-variant', type: 'Gene', size: '2145bp', tags: ['cognition', 'language'] },
  { id: 'p007', name: 'Myostatin-KO', type: 'Knockout', size: '—', tags: ['muscle', 'size'] },
  { id: 'p008', name: 'Telomerase-hTERT', type: 'Gene', size: '3396bp', tags: ['immortality', 'longevity'] },
  { id: 'p009', name: 'Opsin-SWS1', type: 'Gene', size: '1044bp', tags: ['vision', 'UV'] },
  { id: 'p010', name: 'Collagen-COL1A1', type: 'Gene', size: '5921bp', tags: ['skin', 'structure'] },
  { id: 'p011', name: 'BDNF-enhancer', type: 'Enhancer', size: '340bp', tags: ['memory', 'learning'] },
  { id: 'p012', name: 'Kill-switch-v2', type: 'Safety', size: '480bp', tags: ['biocontainment', 'safety'] },
  {
    id: 'p013',
    name: 'Adenosine triphosphate (ATP)',
    type: 'Metabolite',
    size: '507 Da',
    tags: ['metabolite', 'energy', 'cofactor', 'phosphorylation'],
  },
]

export const CHROM_LOCI = [
  'chr1:q42.2 — FOXP2',
  'chr11:p15.5 — HBB',
  'chr15:q25.1 — OCA2',
  'chr16:p13.3 — HBA1',
  'chr17:q21.31 — MAPT',
  'chr19:q13.32 — APOE',
  'chr6:p21.3 — MHC',
  'chrX:q28 — MECP2',
  'mtDNA:ND4 — OXPHOS',
  'chr4:q35 — FST',
]
