import type { Phenotype } from './store'

export type BreedPreset = {
  id: string
  label: string
  /** partial phenotype applied on select */
  phenotype: Partial<Phenotype>
}

export type AncestryGroup = {
  id: string
  label: string
  subtypes: BreedPreset[]
}

const dog = (
  id: string,
  label: string,
  p: Partial<Phenotype>,
): BreedPreset => ({ id, label, phenotype: p })

/** Top ~10 popular dog breeds — coat/ears/snout/size defaults */
export const DOG_BREEDS: BreedPreset[] = [
  dog('labrador', 'Labrador Retriever', {
    coatColor: '#c4a574', coatLength: 35, earSize: 55, snoutLength: 55,
    height: 58, torsoSize: 58, legLength: 55, muscleMass: 58, tailLength: 55, clawSize: 45, eyes: '#4a3020',
  }),
  dog('frenchie', 'French Bulldog', {
    coatColor: '#d8c8b0', coatLength: 20, earSize: 72, snoutLength: 28,
    height: 38, torsoSize: 62, legLength: 35, muscleMass: 55, tailLength: 22, clawSize: 40, eyes: '#3a2818',
  }),
  dog('gsd', 'German Shepherd', {
    coatColor: '#8a6030', coatLength: 48, earSize: 78, snoutLength: 62,
    height: 65, torsoSize: 55, legLength: 62, muscleMass: 62, tailLength: 60, clawSize: 50, eyes: '#3a2818',
  }),
  dog('golden', 'Golden Retriever', {
    coatColor: '#d4a84b', coatLength: 70, earSize: 58, snoutLength: 52,
    height: 58, torsoSize: 56, legLength: 54, muscleMass: 55, tailLength: 62, clawSize: 45, eyes: '#5a3a18',
  }),
  dog('bulldog', 'Bulldog', {
    coatColor: '#e8b0a0', coatLength: 18, earSize: 45, snoutLength: 25,
    height: 40, torsoSize: 72, legLength: 32, muscleMass: 65, tailLength: 20, clawSize: 42, eyes: '#2a2018',
  }),
  dog('poodle', 'Poodle', {
    coatColor: '#f0e8e0', coatLength: 85, earSize: 50, snoutLength: 48,
    height: 52, torsoSize: 48, legLength: 55, muscleMass: 48, tailLength: 50, clawSize: 40, eyes: '#2a2018',
  }),
  dog('beagle', 'Beagle', {
    coatColor: '#c08040', coatLength: 30, earSize: 82, snoutLength: 50,
    height: 42, torsoSize: 50, legLength: 42, muscleMass: 48, tailLength: 48, clawSize: 42, eyes: '#4a3020',
  }),
  dog('rottweiler', 'Rottweiler', {
    coatColor: '#1a1210', coatLength: 28, earSize: 48, snoutLength: 55,
    height: 62, torsoSize: 68, legLength: 58, muscleMass: 78, tailLength: 45, clawSize: 55, eyes: '#1a1010',
  }),
  dog('dachshund', 'Dachshund', {
    coatColor: '#8a4020', coatLength: 32, earSize: 70, snoutLength: 58,
    height: 28, torsoSize: 45, legLength: 22, bodyLength: 78, muscleMass: 42, tailLength: 40, clawSize: 38, eyes: '#3a2010',
  }),
  dog('gsp', 'German Shorthaired Pointer', {
    coatColor: '#b0a090', coatLength: 22, earSize: 55, snoutLength: 60,
    height: 58, torsoSize: 52, legLength: 60, muscleMass: 58, tailLength: 55, clawSize: 48, eyes: '#3a2818',
  }),
]

export const CAT_BREEDS: BreedPreset[] = [
  dog('dsh', 'Domestic Shorthair', {
    coatColor: '#d9a066', coatLength: 28, earSize: 55, snoutLength: 42,
    height: 40, torsoSize: 48, legLength: 48, muscleMass: 48, tailLength: 55, clawSize: 50, eyes: '#7cb518',
  }),
  dog('maine', 'Maine Coon', {
    coatColor: '#c4a574', coatLength: 88, earSize: 72, snoutLength: 48,
    height: 55, torsoSize: 62, legLength: 55, muscleMass: 58, tailLength: 85, clawSize: 55, eyes: '#c0a040',
  }),
  dog('siamese', 'Siamese', {
    coatColor: '#f0e6d8', coatLength: 22, earSize: 78, snoutLength: 55,
    height: 42, torsoSize: 40, legLength: 55, muscleMass: 42, tailLength: 70, clawSize: 45, eyes: '#40a0d0',
  }),
  dog('ragdoll', 'Ragdoll', {
    coatColor: '#e8e0d8', coatLength: 75, earSize: 50, snoutLength: 40,
    height: 48, torsoSize: 55, legLength: 48, muscleMass: 45, tailLength: 65, clawSize: 42, eyes: '#40a0d0',
  }),
  dog('bengal', 'Bengal', {
    coatColor: '#d08030', coatLength: 30, earSize: 55, snoutLength: 45,
    height: 45, torsoSize: 50, legLength: 55, muscleMass: 58, tailLength: 55, clawSize: 55, eyes: '#c0a040',
  }),
  dog('persian', 'Persian', {
    coatColor: '#f5e6d0', coatLength: 92, earSize: 35, snoutLength: 22,
    height: 38, torsoSize: 58, legLength: 35, muscleMass: 40, tailLength: 50, clawSize: 38, eyes: '#7cb518',
  }),
  dog('bsh', 'British Shorthair', {
    coatColor: '#9aa0a8', coatLength: 35, earSize: 42, snoutLength: 38,
    height: 42, torsoSize: 62, legLength: 40, muscleMass: 52, tailLength: 45, clawSize: 42, eyes: '#7cb518',
  }),
  dog('sphynx', 'Sphynx', {
    coatColor: '#e8b0a0', coatLength: 2, earSize: 85, snoutLength: 45,
    height: 40, torsoSize: 48, legLength: 48, muscleMass: 50, tailLength: 50, clawSize: 48, skin: '#e8b0a0', eyes: '#4a7c59',
  }),
  dog('abyssinian', 'Abyssinian', {
    coatColor: '#c08040', coatLength: 25, earSize: 70, snoutLength: 48,
    height: 42, torsoSize: 42, legLength: 58, muscleMass: 52, tailLength: 60, clawSize: 48, eyes: '#c0a040',
  }),
  dog('scottish', 'Scottish Fold', {
    coatColor: '#d8c8b0', coatLength: 40, earSize: 18, snoutLength: 40,
    height: 38, torsoSize: 52, legLength: 40, muscleMass: 45, tailLength: 48, clawSize: 42, eyes: '#7cb518',
  }),
]

function human(
  id: string,
  label: string,
  skin: string,
  hair: string,
  eyes: string,
  extra: Partial<Phenotype> = {},
): BreedPreset {
  return {
    id,
    label,
    phenotype: {
      skin,
      hair,
      eyes,
      nails: '#c8b0a0',
      hairLength: 45,
      noseSize: 50,
      earSize: 50,
      headSize: 50,
      muscleMass: 48,
      height: 52,
      ...extra,
    },
  }
}

/** Human ancestry / population background presets */
export const HUMAN_ANCESTRY: AncestryGroup[] = [
  {
    id: 'african',
    label: 'African / Black',
    subtypes: [
      human('west_african', 'West African', '#4a3020', '#1a1010', '#2a1a10', { noseSize: 58, hairLength: 35, muscleMass: 55 }),
      human('east_african', 'East African', '#5a3820', '#1a1010', '#3a2818', { noseSize: 52, height: 58, legLength: 58 }),
      human('african_american', 'African American', '#5c3a24', '#1a1010', '#2a2018', { hairLength: 40, muscleMass: 52 }),
      human('afro_caribbean', 'Afro-Caribbean', '#4e321c', '#1a1010', '#2a1a10', { hairLength: 55, noseSize: 55 }),
      human('southern_african', 'Southern African', '#6a4428', '#1a1010', '#3a2818', { noseSize: 54 }),
    ],
  },
  {
    id: 'european',
    label: 'European / White',
    subtypes: [
      human('northern_eu', 'Northern European', '#f0d5c0', '#c8a060', '#4a7c59', { hairLength: 50, noseSize: 48, eyes: '#5a8aaa' }),
      human('southern_eu', 'Southern European', '#e0b898', '#2a1810', '#4a3020', { hairLength: 48, skin: '#e0b898' }),
      human('eastern_eu', 'Eastern European', '#ebd0b8', '#3a2818', '#4a6090', { hairLength: 52 }),
    ],
  },
  {
    id: 'hispanic',
    label: 'Hispanic / Latino',
    subtypes: [
      human('mexican', 'Mexican', '#c8956a', '#1a1010', '#3a2818', { hairLength: 55, noseSize: 52 }),
      human('caribbean_lat', 'Caribbean Latino', '#b07850', '#1a1010', '#2a2018', { hairLength: 50 }),
      human('south_american', 'South American', '#c49068', '#1a1210', '#3a2818', { hairLength: 58 }),
    ],
  },
  {
    id: 'east_asian',
    label: 'East Asian',
    subtypes: [
      human('chinese', 'Chinese', '#e8c4a0', '#1a1010', '#2a2018', { noseSize: 42, earSize: 48, hairLength: 60 }),
      human('japanese', 'Japanese', '#f0d0b0', '#1a1010', '#2a2018', { noseSize: 40, hairLength: 55 }),
      human('korean', 'Korean', '#ecd0b4', '#1a1010', '#2a2018', { noseSize: 42, hairLength: 50 }),
    ],
  },
  {
    id: 'south_asian',
    label: 'South Asian',
    subtypes: [
      human('indian', 'Indian', '#b07848', '#1a1010', '#2a1a10', { hairLength: 65, noseSize: 55, eyes: '#3a2818' }),
      human('pakistani', 'Pakistani', '#c09060', '#1a1010', '#2a2018', { hairLength: 55, noseSize: 54 }),
      human('bangladeshi', 'Bangladeshi', '#a87040', '#1a1010', '#2a1a10', { hairLength: 60 }),
    ],
  },
  {
    id: 'mena',
    label: 'Middle Eastern / North African',
    subtypes: [
      human('levantine', 'Levantine', '#d4a878', '#1a1010', '#3a2818', { hairLength: 45, noseSize: 55 }),
      human('north_african', 'North African', '#c09060', '#1a1010', '#2a2018', { hairLength: 40, noseSize: 56 }),
      human('gulf', 'Gulf Arab', '#d8b090', '#1a1010', '#3a2818', { hairLength: 35, noseSize: 54 }),
    ],
  },
  {
    id: 'indigenous',
    label: 'Indigenous / Native',
    subtypes: [
      human('native_american', 'Native American', '#b07848', '#1a1010', '#2a2018', { hairLength: 70, noseSize: 52 }),
      human('aboriginal_au', 'Aboriginal Australian', '#5a3820', '#1a1010', '#2a1a10', { hairLength: 45, noseSize: 58 }),
      human('maori', 'Māori', '#8a5a38', '#1a1010', '#2a2018', { hairLength: 55, noseSize: 55, muscleMass: 58 }),
      human('andian', 'Andean Indigenous', '#a07048', '#1a1010', '#2a2018', { hairLength: 65, height: 45 }),
    ],
  },
  {
    id: 'pacific',
    label: 'Pacific Islander',
    subtypes: [
      human('polynesian', 'Polynesian', '#8a5a38', '#1a1010', '#2a2018', { muscleMass: 65, height: 58, hairLength: 50 }),
      human('melanesian', 'Melanesian', '#4a3020', '#1a1010', '#2a1a10', { hairLength: 55, noseSize: 56 }),
      human('micronesian', 'Micronesian', '#9a6840', '#1a1010', '#2a2018', { hairLength: 48 }),
    ],
  },
  {
    id: 'mixed',
    label: 'Mixed / Custom',
    subtypes: [
      human('mixed_custom', 'Mixed / Custom', '#c8956a', '#3a2818', '#4a3020', { hairLength: 50 }),
    ],
  },
]

/**
 * Validates and sanitizes breed preset phenotype data
 * Ensures all required properties exist and have valid values
 */
export function sanitizeBreedPhenotype(phenotype: Partial<Phenotype>): Partial<Phenotype> {
  const sanitized: Partial<Phenotype> = {}
  for (const [key, value] of Object.entries(phenotype)) {
    if (value === undefined || value === null) continue
    // Ensure numeric values are in valid range [0-100]
    if (typeof value === 'number') {
      sanitized[key as keyof Phenotype] = Math.max(0, Math.min(100, value)) as any
    } else if (typeof value === 'string') {
      // Ensure color strings are valid hex or keep as-is
      const str = String(value).trim()
      sanitized[key as keyof Phenotype] = str.startsWith('#') ? str : `#${str}` as any
    }
  }
  return sanitized
}

export function presetsForSpecies(speciesId: string): { kind: 'breeds' | 'ancestry' | 'none'; breeds?: BreedPreset[]; ancestry?: AncestryGroup[] } {
  if (speciesId === 'dog') return { kind: 'breeds', breeds: DOG_BREEDS }
  if (speciesId === 'cat') return { kind: 'breeds', breeds: CAT_BREEDS }
  if (speciesId === 'human') return { kind: 'ancestry', ancestry: HUMAN_ANCESTRY }
  return { kind: 'none' }
}
