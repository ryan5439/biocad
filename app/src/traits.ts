import type { Species } from './data'

export type ControlDef =
  | { key: string; label: string; kind: 'color' }
  | { key: string; label: string; kind: 'slider'; min?: number; max?: number }

export type EditorSchema = {
  appearance: ControlDef[]
  proportions: ControlDef[]
  intelBaseline: number
}

const primate: EditorSchema = {
  appearance: [
    { key: 'skin', label: 'Skin', kind: 'color' },
    { key: 'eyes', label: 'Eyes', kind: 'color' },
    { key: 'nails', label: 'Nails', kind: 'color' },
    { key: 'hair', label: 'Hair', kind: 'color' },
    { key: 'hairLength', label: 'Hair length', kind: 'slider' },
  ],
  proportions: [
    { key: 'headSize', label: 'Head size', kind: 'slider' },
    { key: 'torsoSize', label: 'Torso', kind: 'slider' },
    { key: 'armLength', label: 'Arm length', kind: 'slider' },
    { key: 'legLength', label: 'Leg length', kind: 'slider' },
    { key: 'earSize', label: 'Ear size', kind: 'slider' },
    { key: 'noseSize', label: 'Nose size', kind: 'slider' },
    { key: 'muscleMass', label: 'Muscle density (strength)', kind: 'slider' },
    { key: 'height', label: 'Height', kind: 'slider' },
  ],
  intelBaseline: 50,
}

const furMammal = (opts: { trunk?: boolean; hooves?: boolean } = {}): EditorSchema => ({
  appearance: [
    { key: 'coatColor', label: 'Coat / fur color', kind: 'color' },
    { key: 'eyes', label: 'Eyes', kind: 'color' },
    { key: 'coatLength', label: 'Coat length', kind: 'slider' },
    ...(opts.trunk
      ? ([{ key: 'skin', label: 'Skin', kind: 'color' }, { key: 'hairLength', label: 'Sparse hair', kind: 'slider' }] as ControlDef[])
      : []),
  ],
  proportions: [
    { key: 'headSize', label: 'Head size', kind: 'slider' },
    { key: 'torsoSize', label: 'Torso', kind: 'slider' },
    { key: 'legLength', label: 'Leg length', kind: 'slider' },
    { key: 'earSize', label: 'Ear size', kind: 'slider' },
    { key: 'snoutLength', label: opts.trunk ? 'Trunk length' : 'Snout / muzzle', kind: 'slider' },
    { key: 'tailLength', label: 'Tail length', kind: 'slider' },
    { key: 'clawSize', label: opts.hooves ? 'Hoof mass' : 'Claw size', kind: 'slider' },
    { key: 'height', label: 'Body scale', kind: 'slider' },
    { key: 'muscleMass', label: 'Muscle density (strength)', kind: 'slider' },
  ],
  intelBaseline: 48,
})

const bird: EditorSchema = {
  appearance: [
    { key: 'featherColor', label: 'Feather color', kind: 'color' },
    { key: 'beakColor', label: 'Beak color', kind: 'color' },
    { key: 'eyes', label: 'Eyes', kind: 'color' },
    { key: 'featherCoverage', label: 'Feather coverage', kind: 'slider' },
    { key: 'featherSize', label: 'Feather size', kind: 'slider' },
    { key: 'iridescence', label: 'Iridescence', kind: 'slider' },
  ],
  proportions: [
    { key: 'beakLength', label: 'Beak length', kind: 'slider' },
    { key: 'beakShape', label: 'Beak curve', kind: 'slider' },
    { key: 'wingSpan', label: 'Wing span', kind: 'slider' },
    { key: 'wingShape', label: 'Wing shape', kind: 'slider' },
    { key: 'talonSize', label: 'Talon size', kind: 'slider' },
    { key: 'headSize', label: 'Head size', kind: 'slider' },
    { key: 'torsoSize', label: 'Body mass', kind: 'slider' },
    { key: 'height', label: 'Body scale', kind: 'slider' },
    { key: 'muscleMass', label: 'Flight muscle density', kind: 'slider' },
  ],
  intelBaseline: 54,
}

const fish: EditorSchema = {
  appearance: [
    { key: 'scaleColor', label: 'Scale / skin color', kind: 'color' },
    { key: 'eyes', label: 'Eyes', kind: 'color' },
    { key: 'scalePattern', label: 'Pattern intensity', kind: 'slider' },
  ],
  proportions: [
    { key: 'finSpan', label: 'Fin span', kind: 'slider' },
    { key: 'bodyLength', label: 'Body length', kind: 'slider' },
    { key: 'torsoSize', label: 'Body depth', kind: 'slider' },
    { key: 'height', label: 'Overall scale', kind: 'slider' },
    { key: 'muscleMass', label: 'Muscle density (strength)', kind: 'slider' },
  ],
  intelBaseline: 40,
}

const dolphin: EditorSchema = {
  appearance: [
    { key: 'skin', label: 'Skin', kind: 'color' },
    { key: 'eyes', label: 'Eyes', kind: 'color' },
  ],
  proportions: [
    { key: 'finSpan', label: 'Fin / fluke span', kind: 'slider' },
    { key: 'bodyLength', label: 'Body length', kind: 'slider' },
    { key: 'snoutLength', label: 'Rostrum length', kind: 'slider' },
    { key: 'height', label: 'Overall scale', kind: 'slider' },
    { key: 'muscleMass', label: 'Muscle density (strength)', kind: 'slider' },
  ],
  intelBaseline: 58,
}

const octopus: EditorSchema = {
  appearance: [
    { key: 'skin', label: 'Chromatophore color', kind: 'color' },
    { key: 'eyes', label: 'Eyes', kind: 'color' },
    { key: 'beakColor', label: 'Beak color', kind: 'color' },
    { key: 'iridescence', label: 'Pattern flash', kind: 'slider' },
  ],
  proportions: [
    { key: 'tentacleLength', label: 'Arm / tentacle length', kind: 'slider' },
    { key: 'headSize', label: 'Mantle size', kind: 'slider' },
    { key: 'beakLength', label: 'Beak size', kind: 'slider' },
    { key: 'height', label: 'Overall scale', kind: 'slider' },
  ],
  intelBaseline: 60,
}

const amphibian = (axolotl = false): EditorSchema => ({
  appearance: [
    { key: 'skin', label: 'Skin', kind: 'color' },
    { key: 'eyes', label: 'Eyes', kind: 'color' },
  ],
  proportions: [
    { key: 'headSize', label: 'Head size', kind: 'slider' },
    { key: 'torsoSize', label: 'Torso', kind: 'slider' },
    { key: 'legLength', label: 'Limb length', kind: 'slider' },
    { key: 'height', label: 'Body scale', kind: 'slider' },
    { key: 'muscleMass', label: 'Muscle density (strength)', kind: 'slider' },
    ...(axolotl
      ? ([
          { key: 'gillsSize', label: 'Gill size', kind: 'slider' },
          { key: 'tailLength', label: 'Tail length', kind: 'slider' },
        ] as ControlDef[])
      : []),
  ],
  intelBaseline: 42,
})

const snake: EditorSchema = {
  appearance: [
    { key: 'scaleColor', label: 'Scale color', kind: 'color' },
    { key: 'eyes', label: 'Eyes', kind: 'color' },
    { key: 'scalePattern', label: 'Pattern intensity', kind: 'slider' },
  ],
  proportions: [
    { key: 'bodyLength', label: 'Body length', kind: 'slider' },
    { key: 'tailLength', label: 'Tail length', kind: 'slider' },
    { key: 'torsoSize', label: 'Girth', kind: 'slider' },
    { key: 'height', label: 'Overall scale', kind: 'slider' },
  ],
  intelBaseline: 38,
}

const insect: EditorSchema = {
  appearance: [
    { key: 'skin', label: 'Body color', kind: 'color' },
    { key: 'eyes', label: 'Compound eyes', kind: 'color' },
    { key: 'wingTint', label: 'Wing tint', kind: 'color' },
  ],
  proportions: [
    { key: 'wingSpan', label: 'Wing span', kind: 'slider' },
    { key: 'antennaeLength', label: 'Antennae length', kind: 'slider' },
    { key: 'bodyLength', label: 'Body length', kind: 'slider' },
    { key: 'height', label: 'Overall scale', kind: 'slider' },
  ],
  intelBaseline: 36,
}

const worm: EditorSchema = {
  appearance: [],
  proportions: [
    { key: 'bodyLength', label: 'Body length', kind: 'slider' },
    { key: 'segments', label: 'Segment count', kind: 'slider' },
    { key: 'height', label: 'Thickness', kind: 'slider' },
  ],
  intelBaseline: 35,
}

const yeast: EditorSchema = {
  appearance: [{ key: 'colonyColor', label: 'Colony color', kind: 'color' }],
  proportions: [
    { key: 'colonySize', label: 'Colony size', kind: 'slider' },
    { key: 'height', label: 'Morphology scale', kind: 'slider' },
  ],
  intelBaseline: 20,
}

const plant: EditorSchema = {
  appearance: [
    { key: 'leafColor', label: 'Leaf color', kind: 'color' },
    { key: 'bloomColor', label: 'Bloom color', kind: 'color' },
  ],
  proportions: [
    { key: 'stemHeight', label: 'Stem height', kind: 'slider' },
    { key: 'leafSpan', label: 'Leaf span', kind: 'slider' },
    { key: 'height', label: 'Overall scale', kind: 'slider' },
  ],
  intelBaseline: 15,
}

const BY_ID: Record<string, EditorSchema> = {
  human: { ...primate, intelBaseline: 50 },
  chimp: { ...primate, intelBaseline: 55 },
  gorilla: { ...primate, intelBaseline: 52 },
  dog: furMammal(),
  cat: furMammal(),
  mouse: furMammal(),
  rabbit: furMammal(),
  tiger: furMammal(),
  cow: furMammal({ hooves: true }),
  horse: furMammal({ hooves: true }),
  pig: furMammal(),
  elephant: { ...furMammal({ trunk: true }), intelBaseline: 56 },
  crow: bird,
  eagle: bird,
  chicken: bird,
  zebrafish: fish,
  shark: fish,
  dolphin,
  octopus,
  frog: amphibian(false),
  axolotl: amphibian(true),
  snake,
  fruitfly: insect,
  bee: insect,
  tardigrade: insect,
  worm,
  yeast,
  arabidopsis: plant,
  bat: {
    appearance: [
      { key: 'coatColor', label: 'Fur color', kind: 'color' },
      { key: 'eyes', label: 'Eyes', kind: 'color' },
      { key: 'wingTint', label: 'Membrane tint', kind: 'color' },
      { key: 'coatLength', label: 'Fur length', kind: 'slider' },
    ],
    proportions: [
      { key: 'wingSpan', label: 'Wing span', kind: 'slider' },
      { key: 'earSize', label: 'Ear size', kind: 'slider' },
      { key: 'snoutLength', label: 'Snout', kind: 'slider' },
      { key: 'height', label: 'Body scale', kind: 'slider' },
    ],
    intelBaseline: 50,
  },
  platypus: {
    appearance: [
      { key: 'skin', label: 'Fur / skin', kind: 'color' },
      { key: 'eyes', label: 'Eyes', kind: 'color' },
      { key: 'beakColor', label: 'Bill color', kind: 'color' },
    ],
    proportions: [
      { key: 'beakLength', label: 'Bill length', kind: 'slider' },
      { key: 'tailLength', label: 'Tail', kind: 'slider' },
      { key: 'finSpan', label: 'Webbing', kind: 'slider' },
      { key: 'height', label: 'Body scale', kind: 'slider' },
    ],
    intelBaseline: 47,
  },
  turtle: {
    appearance: [
      { key: 'scaleColor', label: 'Shell / skin', kind: 'color' },
      { key: 'eyes', label: 'Eyes', kind: 'color' },
    ],
    proportions: [
      { key: 'shellSize', label: 'Shell size', kind: 'slider' },
      { key: 'finSpan', label: 'Flipper span', kind: 'slider' },
      { key: 'headSize', label: 'Head size', kind: 'slider' },
      { key: 'height', label: 'Body scale', kind: 'slider' },
    ],
    intelBaseline: 41,
  },
  jellyfish: {
    appearance: [
      { key: 'skin', label: 'Bell color', kind: 'color' },
      { key: 'iridescence', label: 'Glow', kind: 'slider' },
    ],
    proportions: [
      { key: 'tentacleLength', label: 'Tentacle length', kind: 'slider' },
      { key: 'headSize', label: 'Bell size', kind: 'slider' },
      { key: 'height', label: 'Overall scale', kind: 'slider' },
    ],
    intelBaseline: 25,
  },
}

export function getEditorSchema(species: Species): EditorSchema {
  return BY_ID[species.id] ?? {
    appearance: [{ key: 'skin', label: 'Surface color', kind: 'color' }, { key: 'eyes', label: 'Eyes', kind: 'color' }],
    proportions: [{ key: 'height', label: 'Scale', kind: 'slider' }, { key: 'bodyLength', label: 'Length', kind: 'slider' }],
    intelBaseline: 45,
  }
}

export const EXTENDED_DEFAULTS: Record<string, string | number> = {
  coatColor: '#c4a574',
  coatLength: 45,
  featherColor: '#2a2a2a',
  featherCoverage: 70,
  featherSize: 55,
  iridescence: 30,
  beakColor: '#c8b090',
  beakLength: 50,
  beakShape: 45,
  wingSpan: 60,
  wingShape: 50,
  talonSize: 45,
  snoutLength: 50,
  tailLength: 50,
  clawSize: 40,
  finSpan: 55,
  bodyLength: 55,
  scaleColor: '#6a8a4a',
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
