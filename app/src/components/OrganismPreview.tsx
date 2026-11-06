import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useStore } from '../store'

function hexToColor(hex: string) {
  try {
    return new THREE.Color(hex)
  } catch {
    return new THREE.Color('#888888')
  }
}

function n(v: number, lo = 0.55, hi = 1.55) {
  return lo + (Math.max(0, Math.min(100, v)) / 100) * (hi - lo)
}

/** Seeded hash for stable procedural noise */
function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function smoothNoise(x: number, y: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  return lerp(
    lerp(hash2(x0, y0), hash2(x0 + 1, y0), u),
    lerp(hash2(x0, y0 + 1), hash2(x0 + 1, y0 + 1), u),
    v,
  )
}

function fbm(x: number, y: number, oct = 4) {
  let v = 0
  let a = 0.5
  let f = 1
  for (let i = 0; i < oct; i++) {
    v += a * smoothNoise(x * f, y * f)
    a *= 0.5
    f *= 2
  }
  return v
}

type TexKind = 'fur' | 'skin' | 'feather' | 'eye' | 'bump'

function makeProceduralTexture(
  kind: TexKind,
  baseHex: string,
  opts: { size?: number; streak?: number; pore?: number; firm?: number } = {},
) {
  const size = opts.size ?? 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const base = hexToColor(baseHex)
  const r0 = Math.floor(base.r * 255)
  const g0 = Math.floor(base.g * 255)
  const b0 = Math.floor(base.b * 255)
  const img = ctx.createImageData(size, size)
  const d = img.data
  const streak = opts.streak ?? 1
  const pore = opts.pore ?? 1
  const firm = opts.firm ?? 0.5

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      let r = r0
      let g = g0
      let b = b0
      let a = 255

      if (kind === 'fur') {
        // Anisotropic fur streaks along Y with noise variation
        const nx = x / size
        const ny = y / size
        const strand = fbm(nx * 40 * streak, ny * 8, 5)
        const lengthVar = fbm(nx * 12, ny * 3, 3)
        const shade = 0.55 + strand * 0.55 + (lengthVar - 0.5) * 0.15
        const tip = Math.pow(ny, 0.7) * 0.12
        r = Math.min(255, Math.max(0, r0 * shade + tip * 40))
        g = Math.min(255, Math.max(0, g0 * shade + tip * 30))
        b = Math.min(255, Math.max(0, b0 * shade + tip * 20))
        // slight AO in roots
        const ao = 0.85 + ny * 0.2
        r *= ao
        g *= ao
        b *= ao
      } else if (kind === 'skin') {
        const nx = x / size
        const ny = y / size
        const pores = fbm(nx * 80 * pore, ny * 80 * pore, 3)
        const freckle = fbm(nx * 18, ny * 18, 2)
        const micro = 0.92 + pores * 0.12 + (freckle - 0.5) * 0.06
        // SSS-ish warm subsurface lift in midtones
        const warm = 1 + firm * 0.04
        r = Math.min(255, r0 * micro * warm + 4)
        g = Math.min(255, g0 * micro)
        b = Math.min(255, b0 * micro * 0.98)
      } else if (kind === 'feather') {
        const nx = x / size
        const ny = y / size
        const vane = Math.abs(Math.sin(nx * Math.PI * 14 + fbm(nx * 6, ny * 6, 2) * 2))
        const rachis = 1 - Math.min(1, Math.abs(nx - 0.5) * 8)
        const barbs = fbm(nx * 30, ny * 50, 4)
        const shade = 0.5 + vane * 0.35 + barbs * 0.2 + rachis * 0.15
        r = Math.min(255, r0 * shade)
        g = Math.min(255, g0 * shade)
        b = Math.min(255, b0 * shade + rachis * 20)
      } else if (kind === 'eye') {
        const cx = x - size / 2
        const cy = y - size / 2
        const dist = Math.sqrt(cx * cx + cy * cy) / (size / 2)
        if (dist < 0.22) {
          // pupil
          r = 8
          g = 8
          b = 12
        } else if (dist < 0.55) {
          // iris ring with radial fibers
          const ang = Math.atan2(cy, cx)
          const fiber = 0.7 + 0.3 * Math.sin(ang * 24 + dist * 8)
          const ring = 1 - Math.abs(dist - 0.38) * 3
          r = Math.min(255, r0 * fiber * (0.7 + ring * 0.4))
          g = Math.min(255, g0 * fiber * (0.7 + ring * 0.35))
          b = Math.min(255, b0 * fiber * (0.75 + ring * 0.3))
        } else if (dist < 0.92) {
          // sclera
          r = 235
          g = 238
          b = 242
        } else {
          r = 40
          g = 44
          b = 50
          a = 0
        }
        // wet highlight
        const hx = (x - size * 0.35) / size
        const hy = (y - size * 0.32) / size
        if (hx * hx + hy * hy < 0.006) {
          r = 255
          g = 255
          b = 255
        }
      } else if (kind === 'bump') {
        // grayscale bump / muscle definition map
        const nx = x / size
        const ny = y / size
        const muscle = fbm(nx * 6, ny * 4, 4)
        const fiber = fbm(nx * 28, ny * 10, 3)
        const v = Math.floor((0.35 + muscle * 0.4 * firm + fiber * 0.15) * 255)
        r = g = b = v
      }

      d[i] = r
      d[i + 1] = g
      d[i + 2] = b
      d[i + 3] = a
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function disposeMat(mat: THREE.Material | THREE.Material[]) {
  const list = Array.isArray(mat) ? mat : [mat]
  for (const m of list) {
    // Do not dispose shared procedural maps here — tracked separately
    m.dispose()
  }
}

/** Module-level PMREM — generate once, reuse across mounts */
let sharedEnvRT: THREE.Texture | null = null
let sharedEnvFailed = false

function getSharedEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture | null {
  if (sharedEnvRT) return sharedEnvRT
  if (sharedEnvFailed) return null
  try {
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    sharedEnvRT = pmrem.fromScene(room as unknown as THREE.Scene, 0.04).texture
    pmrem.dispose()
    room.dispose?.()
    return sharedEnvRT
  } catch {
    sharedEnvFailed = true
    return null
  }
}

export function OrganismPreview({ compact = false }: { compact?: boolean }) {
  const species = useStore((s) => s.species)
  const p = useStore((s) => s.phenotype)
  const mountRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ species, p })
  stateRef.current = { species, p }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !species) return

    const w = Math.max(mount.clientWidth || 0, compact ? 280 : 320)
    const h = Math.max(mount.clientHeight || 0, compact ? 160 : 280)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1218)
    scene.fog = new THREE.FogExp2(0x0a1218, 0.018)

    const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100)
    camera.position.set(0, compact ? 1.35 : 1.15, compact ? 6.2 : 4.4)

    const dprCap = compact || w < 400 ? 1.25 : 1.5
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setClearColor(0x0a1218, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap))
    renderer.setSize(w, h)
    // Shadows off — major fill-rate win; lighting still looks good with RoomEnvironment
    renderer.shadowMap.enabled = false
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    mount.appendChild(renderer.domElement)

    // Soft HDR-ish environment — PMREM generated once at module level
    const envRT = getSharedEnvironment(renderer)
    if (envRT) {
      scene.environment = envRT
      scene.environmentIntensity = 0.55
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = true
    controls.enableZoom = true
    controls.minDistance = 1.2
    controls.maxDistance = 12
    controls.target.set(0, 0.15, 0)
    controls.update()

    // Soft studio lighting: hemisphere + key + rim + fill
    scene.add(new THREE.HemisphereLight(0xd8ecff, 0x1a1008, 0.75))
    const key = new THREE.DirectionalLight(0xfff5e8, 1.55)
    key.position.set(3.4, 7.2, 4.2)
    key.castShadow = false
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x8adfff, 0.55)
    rim.position.set(-4, 2.5, -3)
    scene.add(rim)
    const fill = new THREE.PointLight(0xffc8a0, 0.4, 16)
    fill.position.set(-2.2, 0.8, 3.2)
    scene.add(fill)
    const bounce = new THREE.PointLight(0xa8c8ff, 0.22, 12)
    bounce.position.set(0, -0.5, -2)
    scene.add(bounce)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 32),
      new THREE.MeshStandardMaterial({ color: 0x081018, metalness: 0.4, roughness: 0.65 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.2
    ground.receiveShadow = false
    scene.add(ground)

    const root = new THREE.Group()
    scene.add(root)

    const textures: THREE.CanvasTexture[] = []
    const trackTex = (t: THREE.CanvasTexture) => {
      textures.push(t)
      return t
    }

    // Procedural maps created ONCE at init — applyPhenotype only tweaks material colors/scales
    const mapSize = compact ? 128 : 256
    const furMap = trackTex(makeProceduralTexture('fur', p.coatColor || p.skin, { size: mapSize, streak: 1.2 }))
    const skinMap = trackTex(makeProceduralTexture('skin', p.skin, { size: mapSize, pore: 1.1 }))
    const featherMap = trackTex(makeProceduralTexture('feather', p.featherColor || p.skin, { size: mapSize }))
    const eyeMap = trackTex(makeProceduralTexture('eye', p.eyes, { size: compact ? 64 : 128 }))
    const bumpMap = trackTex(makeProceduralTexture('bump', '#888888', { size: mapSize, firm: 0.5 }))
    bumpMap.colorSpace = THREE.NoColorSpace
    // Cap anisotropy for fill-rate
    for (const t of textures) t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: hexToColor(p.skin),
      map: skinMap,
      bumpMap,
      bumpScale: 0.04,
      roughness: 0.45,
      metalness: 0.04,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      sheen: 0.35,
      sheenRoughness: 0.55,
      sheenColor: hexToColor(p.hair),
      transmission: 0.02,
      thickness: 0.35,
      ior: 1.4,
      iridescence: 0.08,
      iridescenceIOR: 1.3,
      envMapIntensity: 0.7,
    })
    const furMat = new THREE.MeshPhysicalMaterial({
      color: hexToColor(p.coatColor || p.hair),
      map: furMap,
      bumpMap,
      bumpScale: 0.06,
      roughness: 0.72,
      metalness: 0.02,
      sheen: 1.0,
      sheenRoughness: 0.28,
      sheenColor: hexToColor(p.coatColor || p.hair),
      clearcoat: 0.08,
      clearcoatRoughness: 0.6,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 0.45,
    })
    const accentMat = new THREE.MeshPhysicalMaterial({
      color: hexToColor(p.hair),
      map: furMap,
      roughness: 0.55,
      metalness: 0.06,
      sheen: 0.85,
      sheenRoughness: 0.35,
      sheenColor: hexToColor(p.hair),
      iridescence: 0.15,
      envMapIntensity: 0.6,
    })
    const featherMat = new THREE.MeshPhysicalMaterial({
      color: hexToColor(p.featherColor),
      map: featherMap,
      roughness: 0.48,
      metalness: 0.08,
      sheen: 0.9,
      sheenRoughness: 0.25,
      sheenColor: hexToColor(p.featherColor),
      iridescence: 0.35,
      iridescenceIOR: 1.5,
      clearcoat: 0.2,
      side: THREE.DoubleSide,
      envMapIntensity: 0.75,
    })
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: eyeMap,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      emissive: hexToColor(p.eyes),
      emissiveIntensity: 0.12,
      envMapIntensity: 1.1,
    })
    const hardMat = new THREE.MeshStandardMaterial({
      color: hexToColor(p.nails),
      roughness: 0.28,
      metalness: 0.3,
      envMapIntensity: 0.8,
    })
    const hairStrandMat = new THREE.MeshPhysicalMaterial({
      color: hexToColor(p.hair),
      map: furMap,
      roughness: 0.45,
      metalness: 0.05,
      sheen: 1,
      sheenRoughness: 0.22,
      sheenColor: hexToColor(p.hair),
      clearcoat: 0.15,
      side: THREE.DoubleSide,
    })

    const parts: Record<string, THREE.Object3D> = {}
    const featherMeshes: THREE.Mesh[] = []
    const furShells: THREE.Mesh[] = []
    const hairStrands: THREE.Mesh[] = []

    function addMesh(
      name: string,
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      y = 0,
      parent: THREE.Object3D = root,
    ) {
      const m = new THREE.Mesh(geo, mat)
      m.castShadow = false
      m.receiveShadow = false
      // frustumCulled left at default true
      m.position.y = y
      parent.add(m)
      parts[name] = m
      return m
    }

    function addFurShell(
      name: string,
      geo: THREE.BufferGeometry,
      scaleBoost: number,
      parent: THREE.Object3D,
      y = 0,
    ) {
      const m = new THREE.Mesh(geo, furMat.clone())
      m.castShadow = false
      m.receiveShadow = false
      m.position.y = y
      m.scale.setScalar(scaleBoost)
      m.userData.baseScale = m.scale.clone()
      parent.add(m)
      parts[name] = m
      furShells.push(m)
      return m
    }

    function makeHeadGroup(x = 0, y = 1.05, z = 0) {
      const g = new THREE.Group()
      g.position.set(x, y, z)
      root.add(g)
      parts.headGroup = g
      return g
    }

    /** Build a limb: upper + lower + paw/foot */
    function addLimb(
      prefix: string,
      parent: THREE.Object3D,
      origin: THREE.Vector3,
      upperLen: number,
      lowerLen: number,
      radius: number,
      mat: THREE.Material,
      opts?: { pawScale?: number; claw?: boolean; forward?: number },
    ) {
      const g = new THREE.Group()
      g.position.copy(origin)
      parent.add(g)
      parts[prefix] = g

      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(radius, upperLen, 4, 8), mat)
      upper.position.y = -upperLen / 2
      upper.castShadow = false
      g.add(upper)
      parts[`${prefix}Upper`] = upper

      const lowerG = new THREE.Group()
      lowerG.position.y = -upperLen
      g.add(lowerG)
      const lower = new THREE.Mesh(new THREE.CapsuleGeometry(radius * 0.85, lowerLen, 4, 8), mat)
      lower.position.y = -lowerLen / 2
      lower.castShadow = false
      lowerG.add(lower)
      parts[`${prefix}Lower`] = lower

      const pawR = (opts?.pawScale ?? 1) * radius * 1.35
      const paw = new THREE.Mesh(new THREE.SphereGeometry(pawR, 10, 10), hardMat)
      paw.position.set(0, -lowerLen - pawR * 0.3, (opts?.forward ?? 0.04))
      paw.scale.set(1.1, 0.55, 1.35)
      paw.castShadow = false
      lowerG.add(paw)
      parts[`${prefix}Paw`] = paw

      if (opts?.claw) {
        for (let c = 0; c < 3; c++) {
          const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 6), hardMat)
          claw.position.set((c - 1) * 0.035, -lowerLen - pawR * 0.55, pawR * 0.7)
          claw.rotation.x = Math.PI / 2.2
          lowerG.add(claw)
          parts[`${prefix}Claw${c}`] = claw
        }
      }
      return g
    }

    const id = species.id
    const sil = species.silhouette
    const isDog = id === 'dog'
    const isCat = id === 'cat'
    // Geometry / shell LOD
    const segBody = compact ? 12 : 16
    const segHead = compact ? 14 : 20
    const segEye = compact ? 10 : 14
    const maxFurShells = compact || w < 400 ? 1 : 2
    let furShellBudget = maxFurShells
    const addFurShellLOD = (
      name: string,
      geo: THREE.BufferGeometry,
      scaleBoost: number,
      parent: THREE.Object3D,
      y = 0,
    ) => {
      if (furShellBudget <= 0) {
        geo.dispose()
        return null
      }
      furShellBudget--
      return addFurShell(name, geo, scaleBoost, parent, y)
    }

    const buildHumanoid = () => {
      // Anthropometric adult baseline (~5'10" at height slider mid). Torso shorter vs prior blob.
      // World: ground ~ -1.2; crown ~ 0.58 → ~1.78 units ≈ 5'10" against 6 ft (1.83) ruler.
      const torso = addMesh('torso', new THREE.CapsuleGeometry(0.22, 0.38, 6, segBody), bodyMat, 0.12)
      torso.scale.set(1.0, 1, 0.78)
      addMesh('chest', new THREE.SphereGeometry(0.22, segBody, segBody - 2), bodyMat, 0.38).scale.set(1.05, 0.55, 0.75)
      addMesh('pelvis', new THREE.SphereGeometry(0.2, segBody, 12), bodyMat, -0.22).scale.set(1.05, 0.45, 0.8)

      const hg = makeHeadGroup(0, 0.72, 0)
      // Skull + jaw (distinct volumes)
      addMesh('head', new THREE.SphereGeometry(0.27, segHead, segHead - 2), bodyMat, 0.04, hg).scale.set(1, 1.05, 0.95)
      addMesh('jaw', new THREE.SphereGeometry(0.18, segBody, 14), bodyMat, -0.14, hg).scale.set(0.95, 0.55, 0.85)
      addMesh('neck', new THREE.CylinderGeometry(0.1, 0.13, 0.22, 10), bodyMat, -0.32, hg)

      addMesh('earL', new THREE.SphereGeometry(0.065, 10, 10), bodyMat, 0.02, hg).position.set(-0.26, 0.02, -0.02)
      addMesh('earR', new THREE.SphereGeometry(0.065, 10, 10), bodyMat, 0.02, hg).position.set(0.26, 0.02, -0.02)

      // Eyes with cornea shell
      const eyeL = addMesh('eyeL', new THREE.SphereGeometry(0.042, segEye, segEye), eyeMat, 0, hg)
      eyeL.position.set(-0.09, 0.05, 0.22)
      const eyeR = addMesh('eyeR', new THREE.SphereGeometry(0.042, segEye, segEye), eyeMat, 0, hg)
      eyeR.position.set(0.09, 0.05, 0.22)
      const corneaL = addMesh(
        'corneaL',
        new THREE.SphereGeometry(0.045, segEye, segEye),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.15,
          roughness: 0.02,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.02,
          transmission: 0.6,
          thickness: 0.05,
        }),
        0,
        hg,
      )
      corneaL.position.copy(eyeL.position)
      const corneaR = addMesh(
        'corneaR',
        new THREE.SphereGeometry(0.045, segEye, segEye),
        (corneaL.material as THREE.Material).clone(),
        0,
        hg,
      )
      corneaR.position.copy(eyeR.position)

      addMesh('nose', new THREE.SphereGeometry(0.035, 10, 10), bodyMat, 0, hg).position.set(0, -0.02, 0.26)

      // Hair shell + strand cards (not just hemisphere cap)
      const hairShell = addMesh(
        'hair',
        new THREE.SphereGeometry(0.295, segHead, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
        hairStrandMat,
        0.08,
        hg,
      )
      hairShell.rotation.x = 0.12
      const strandGeo = new THREE.PlaneGeometry(0.04, 0.22)
      const strandCount = compact ? 14 : 22
      for (let i = 0; i < strandCount; i++) {
        const a = (i / strandCount) * Math.PI * 2
        const strand = new THREE.Mesh(strandGeo, hairStrandMat)
        const r = 0.22 + (i % 3) * 0.02
        strand.position.set(Math.cos(a) * r, 0.12 + (i % 5) * 0.02, Math.sin(a) * r * 0.7 - 0.05)
        strand.rotation.y = -a + Math.PI / 2
        strand.rotation.x = 0.35 + (i % 4) * 0.08
        strand.castShadow = false
        hg.add(strand)
        hairStrands.push(strand)
        parts[`hairStrand${i}`] = strand
      }

      // T-pose: arms outstretched OUTWARD (local -Y → ±X away from torso)
      addLimb('armL', root, new THREE.Vector3(-0.42, 0.42, 0), 0.3, 0.28, 0.06, bodyMat, { pawScale: 0.85, forward: 0.02 })
      ;(parts.armL as THREE.Group).rotation.z = -Math.PI / 2
      addLimb('armR', root, new THREE.Vector3(0.42, 0.42, 0), 0.3, 0.28, 0.06, bodyMat, { pawScale: 0.85, forward: 0.02 })
      ;(parts.armR as THREE.Group).rotation.z = Math.PI / 2

      // Longer legs relative to shorter torso (avg adult ratio)
      addLimb('legL', root, new THREE.Vector3(-0.12, -0.28, 0), 0.42, 0.4, 0.08, bodyMat, { pawScale: 1.05, forward: 0.08 })
      addLimb('legR', root, new THREE.Vector3(0.12, -0.28, 0), 0.42, 0.4, 0.08, bodyMat, { pawScale: 1.05, forward: 0.08 })
      parts.handL = parts.armLPaw
      parts.handR = parts.armRPaw
      parts.footL = parts.legLPaw
      parts.footR = parts.legRPaw

      // 6 ft (1.83 m) height ruler — readable scale reference
      const RULER_H = 1.83
      const groundY = -1.15
      const ruler = new THREE.Group()
      ruler.position.set(1.15, groundY, 0)
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, RULER_H, 0.025),
        new THREE.MeshStandardMaterial({ color: 0xb8c8d4, metalness: 0.3, roughness: 0.45 }),
      )
      post.position.y = RULER_H / 2
      ruler.add(post)
      const labelMat = new THREE.MeshBasicMaterial({ color: 0x3ecfbf })
      for (let ft = 0; ft <= 6; ft++) {
        const y = (ft / 6) * RULER_H
        const tick = new THREE.Mesh(new THREE.BoxGeometry(ft % 1 === 0 ? 0.14 : 0.08, 0.012, 0.012), labelMat)
        tick.position.set(0.08, y, 0)
        ruler.add(tick)
        // inch ticks between feet
        if (ft < 6) {
          for (let inch = 1; inch < 12; inch += 3) {
            const yi = y + (inch / 12 / 6) * RULER_H
            const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: 0x6b7c8d }))
            t2.position.set(0.05, yi, 0)
            ruler.add(t2)
          }
        }
      }
      // Top label plate "6 ft"
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: 0x3ecfbf }))
      top.position.set(0.16, RULER_H + 0.04, 0)
      ruler.add(top)
      root.add(ruler)
      parts.ruler = ruler

      // Canvas sprite for "6 ft / 183 cm"
      const c = document.createElement('canvas')
      c.width = 256
      c.height = 64
      const ctx = c.getContext('2d')!
      ctx.clearRect(0, 0, 256, 64)
      ctx.fillStyle = '#3ecfbf'
      ctx.font = '600 28px IBM Plex Mono, monospace'
      ctx.fillText('6 ft', 8, 28)
      ctx.fillStyle = '#8fa0b0'
      ctx.font = '500 18px IBM Plex Mono, monospace'
      ctx.fillText('183 cm · ref', 8, 52)
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
      sprite.scale.set(0.55, 0.14, 1)
      sprite.position.set(1.45, groundY + RULER_H + 0.12, 0)
      root.add(sprite)
      parts.rulerLabel = sprite
    }

    const buildQuadruped = () => {
      // Multi-volume body: chest + belly + pelvis (NOT one capsule)
      const chest = addMesh('chest', new THREE.SphereGeometry(0.42, segBody, segBody - 2), bodyMat, 0.08)
      chest.position.set(0.32, 0.08, 0)
      chest.scale.set(1.15, 0.95, 0.9)
      parts.body = chest
      parts.torso = chest

      const belly = addMesh('belly', new THREE.SphereGeometry(0.36, segBody, 14), bodyMat, 0.02)
      belly.position.set(-0.05, -0.02, 0)
      belly.scale.set(1.2, 0.75, 0.85)

      const pelvis = addMesh('pelvis', new THREE.SphereGeometry(0.34, segBody, 14), bodyMat, 0.06)
      pelvis.position.set(-0.42, 0.06, 0)
      pelvis.scale.set(1.05, 0.85, 0.95)

      // Fur shells LOD: max 2 (1 when compact / small DPR viewport)
      const coatChest = addFurShellLOD('coatChest', new THREE.SphereGeometry(0.42, 12, 10), 1.08, root, 0.08)
      if (coatChest) {
        coatChest.position.copy(chest.position)
        coatChest.scale.set(1.15 * 1.08, 0.95 * 1.08, 0.9 * 1.08)
        coatChest.userData.baseScale = coatChest.scale.clone()
      }
      const coatBelly = addFurShellLOD('coat', new THREE.SphereGeometry(0.36, 12, 10), 1.1, root, 0.02)
      if (coatBelly) coatBelly.position.copy(belly.position)

      // Neck
      const neck = addMesh('neck', new THREE.CapsuleGeometry(0.14, 0.28, 4, 8), bodyMat, 0.28)
      neck.position.set(0.62, 0.28, 0)
      neck.rotation.z = -0.55

      // Head group: distinct skull + muzzle/jowls (bulldog-aware via phenotype)
      const hg = makeHeadGroup(0.88, 0.42, 0)

      // Cranium
      const skull = addMesh('head', new THREE.SphereGeometry(0.28, segHead, segHead - 2), bodyMat, 0.02, hg)
      skull.scale.set(1.05, 0.95, 0.9)

      // Heavy jaw / jowls (emphasized when short snout / dog)
      const jaw = addMesh('jaw', new THREE.SphereGeometry(0.2, segBody, 12), bodyMat, -0.12, hg)
      jaw.scale.set(isDog ? 1.25 : 1.05, 0.55, 0.95)
      jaw.position.z = 0.02

      // Muzzle — short+wide for bulldog-like (low snoutLength)
      const snout = addMesh('snout', new THREE.CapsuleGeometry(0.11, 0.22, 6, 10), bodyMat, -0.06, hg)
      snout.rotation.z = Math.PI / 2
      snout.position.set(0.22, -0.08, 0)

      // Nose leather
      const noseTip = addMesh('noseTip', new THREE.SphereGeometry(0.055, 10, 10), hardMat, 0, hg)
      noseTip.position.set(0.38, -0.06, 0)

      // Ears
      const earL = addMesh('earL', new THREE.ConeGeometry(0.09, 0.22, 8), accentMat, 0, hg)
      earL.position.set(-0.06, 0.26, 0.14)
      earL.rotation.x = -0.35
      earL.rotation.z = -0.25
      const earR = addMesh('earR', new THREE.ConeGeometry(0.09, 0.22, 8), accentMat, 0, hg)
      earR.position.set(-0.06, 0.26, -0.14)
      earR.rotation.x = 0.35
      earR.rotation.z = -0.25

      // Eyes + wet cornea
      const eyeL = addMesh('eyeL', new THREE.SphereGeometry(0.045, segEye, segEye), eyeMat, 0, hg)
      eyeL.position.set(0.16, 0.08, 0.14)
      const eyeR = addMesh('eyeR', new THREE.SphereGeometry(0.045, segEye, segEye), eyeMat, 0, hg)
      eyeR.position.set(0.16, 0.08, -0.14)
      const corMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        roughness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        transmission: 0.55,
        thickness: 0.04,
      })
      addMesh('corneaL', new THREE.SphereGeometry(0.048, segEye, segEye), corMat, 0, hg).position.copy(eyeL.position)
      addMesh('corneaR', new THREE.SphereGeometry(0.048, segEye, segEye), corMat.clone(), 0, hg).position.copy(eyeR.position)

      // Tail (no extra fur shell — budget spent on body)
      const tail = addMesh('tail', new THREE.CapsuleGeometry(0.055, 0.7, 4, 8), accentMat)
      tail.position.set(-0.72, 0.28, 0)
      tail.rotation.z = 0.85

      // 4 legs: upper + lower + paws + claws
      const legMat = bodyMat
      const fronts = [
        { name: 'leg10', x: 0.38, z: 0.22 },
        { name: 'leg11', x: 0.38, z: -0.22 },
      ]
      const rears = [
        { name: 'leg00', x: -0.38, z: 0.2 },
        { name: 'leg01', x: -0.38, z: -0.2 },
      ]
      ;[...fronts, ...rears].forEach((leg, idx) => {
        const isFront = idx < 2
        const g = addLimb(
          leg.name,
          root,
          new THREE.Vector3(leg.x, 0.05, leg.z),
          isFront ? 0.28 : 0.3,
          isFront ? 0.26 : 0.28,
          isCat ? 0.055 : 0.07,
          legMat,
          { pawScale: isDog ? 1.15 : 1, claw: true, forward: 0.06 },
        )
        // slight outward stance
        g.rotation.z = leg.z > 0 ? 0.08 : -0.08
        // phenotype aliases
        parts[`paw${leg.name.slice(3)}`] = parts[`${leg.name}Paw`]
      })
      // Keep legacy paw names used in applyPhenotype
      parts.paw00 = parts.leg00Paw
      parts.paw01 = parts.leg01Paw
      parts.paw10 = parts.leg10Paw
      parts.paw11 = parts.leg11Paw

      if (id === 'elephant') {
        const trunk = addMesh('trunk', new THREE.CapsuleGeometry(0.09, 0.75, 6, 12), bodyMat)
        trunk.position.set(1.2, 0.05, 0)
        trunk.rotation.z = 0.55
      }
    }

    const buildAvian = () => {
      const body = addMesh('body', new THREE.SphereGeometry(0.4, segBody, segBody - 2), featherMat, 0.05)
      body.scale.set(1.15, 0.95, 0.9)
      addMesh('breast', new THREE.SphereGeometry(0.28, segBody, 14), featherMat, -0.05).position.set(0.15, -0.05, 0)

      const hg = makeHeadGroup(0.48, 0.4, 0)
      addMesh('head', new THREE.SphereGeometry(0.2, segHead, segHead), featherMat, 0, hg)
      const beak = addMesh('beak', new THREE.ConeGeometry(0.05, 0.22, 8), hardMat, 0, hg)
      beak.position.set(0.22, -0.05, 0)
      beak.rotation.z = -Math.PI / 2
      addMesh('eyeL', new THREE.SphereGeometry(0.032, segEye, segEye), eyeMat, 0, hg).position.set(0.1, 0.05, 0.11)
      addMesh('eyeR', new THREE.SphereGeometry(0.032, segEye, segEye), eyeMat, 0, hg).position.set(0.1, 0.05, -0.11)

      const wingL = addMesh('wingL', new THREE.SphereGeometry(0.36, segBody, 12), featherMat)
      wingL.scale.set(1.55, 0.18, 0.78)
      wingL.position.set(-0.05, 0.18, 0.48)
      const wingR = addMesh('wingR', new THREE.SphereGeometry(0.36, segBody, 12), featherMat)
      wingR.scale.set(1.55, 0.18, 0.78)
      wingR.position.set(-0.05, 0.18, -0.48)

      addMesh('legL', new THREE.CapsuleGeometry(0.028, 0.26, 4, 8), hardMat).position.set(0.05, -0.42, 0.1)
      addMesh('legR', new THREE.CapsuleGeometry(0.028, 0.26, 4, 8), hardMat).position.set(0.05, -0.42, -0.1)
      addMesh('talonL', new THREE.ConeGeometry(0.035, 0.11, 6), hardMat).position.set(0.08, -0.65, 0.1)
      addMesh('talonR', new THREE.ConeGeometry(0.035, 0.11, 6), hardMat).position.set(0.08, -0.65, -0.1)

      const featherGeo = new THREE.PlaneGeometry(0.06, 0.18)
      const bodyFeathers = compact ? 24 : 48
      const wingFeathers = compact ? 8 : 16
      for (let i = 0; i < bodyFeathers; i++) {
        const f = new THREE.Mesh(featherGeo, featherMat.clone())
        const a = (i / bodyFeathers) * Math.PI * 2
        const r = 0.26 + (i % 5) * 0.04
        f.position.set(Math.cos(a) * r * 0.55 - 0.05, 0.05 + (i % 7) * 0.04, Math.sin(a) * r)
        f.rotation.z = -0.4 + (i % 3) * 0.15
        f.rotation.y = a
        f.castShadow = false
        root.add(f)
        featherMeshes.push(f)
        parts[`feather${i}`] = f
      }
      for (let i = 0; i < wingFeathers; i++) {
        ;[-1, 1].forEach((side) => {
          const f = new THREE.Mesh(featherGeo, featherMat.clone())
          f.position.set(-0.15 + i * 0.06, 0.12, side * (0.35 + i * 0.03))
          f.rotation.y = side * 0.4
          f.scale.set(1, 1.25, 1)
          root.add(f)
          featherMeshes.push(f)
        })
      }
    }

    const buildAquatic = () => {
      const body = addMesh('body', new THREE.CapsuleGeometry(0.32, 1.05, 6, segBody), bodyMat, 0)
      body.rotation.z = Math.PI / 2
      addMesh('head', new THREE.SphereGeometry(0.26, segHead, segHead), bodyMat).position.set(0.85, 0.04, 0)
      addMesh('eyeL', new THREE.SphereGeometry(0.045, 12, 12), eyeMat).position.set(0.98, 0.12, 0.14)
      addMesh('eyeR', new THREE.SphereGeometry(0.045, 12, 12), eyeMat).position.set(0.98, 0.12, -0.14)
      addMesh('fin', new THREE.ConeGeometry(0.22, 0.55, 10), accentMat).position.set(-0.95, 0.08, 0)
      ;(parts.fin as THREE.Mesh).rotation.z = Math.PI / 2
      addMesh('finL', new THREE.ConeGeometry(0.12, 0.35, 8), accentMat).position.set(0.1, -0.05, 0.35)
      addMesh('finR', new THREE.ConeGeometry(0.12, 0.35, 8), accentMat).position.set(0.1, -0.05, -0.35)
      if (id === 'octopus' || id === 'jellyfish') {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2
          const t = addMesh(`tent${i}`, new THREE.CapsuleGeometry(0.04, 0.7, 4, 8), bodyMat)
          t.position.set(Math.cos(a) * 0.25, -0.55, Math.sin(a) * 0.25)
          t.rotation.x = 0.35
        }
      }
      if (id === 'turtle') {
        addMesh('shell', new THREE.SphereGeometry(0.5, segBody, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hardMat, 0.25)
      }
      if (id === 'axolotl') {
        addMesh('gillL', new THREE.ConeGeometry(0.08, 0.25, 8), accentMat).position.set(0.7, 0.25, 0.2)
        addMesh('gillR', new THREE.ConeGeometry(0.08, 0.25, 8), accentMat).position.set(0.7, 0.25, -0.2)
        addMesh('tail', new THREE.CapsuleGeometry(0.08, 0.55, 6, 8), bodyMat).position.set(-0.85, 0, 0)
      }
      if (id === 'platypus') {
        addMesh('beak', new THREE.BoxGeometry(0.35, 0.08, 0.18), hardMat).position.set(1.15, 0.02, 0)
      }
      if (id === 'dolphin') {
        addMesh('snout', new THREE.CapsuleGeometry(0.08, 0.35, 6, 8), bodyMat).position.set(1.15, 0, 0)
        ;(parts.snout as THREE.Mesh).rotation.z = Math.PI / 2
      }
    }

    const buildWorm = () => {
      const count = id === 'yeast' ? 6 : 10
      for (let i = 0; i < count; i++) {
        const seg = addMesh(`s${i}`, new THREE.SphereGeometry(id === 'yeast' ? 0.22 : 0.17 - i * 0.006, segBody, segBody), bodyMat)
        if (id === 'yeast') {
          seg.position.set((i % 3) * 0.35 - 0.35, Math.floor(i / 3) * 0.3 - 0.2, (i % 2) * 0.2)
        } else {
          seg.position.set(-1.35 + i * 0.3, Math.sin(i * 0.55) * 0.08, 0)
        }
      }
      if (id !== 'yeast') addMesh('eye', new THREE.SphereGeometry(0.035, 12, 12), eyeMat).position.set(1.2, 0.08, 0.08)
    }

    const buildInsect = () => {
      addMesh('thorax', new THREE.SphereGeometry(0.26, segBody, segBody), bodyMat, 0.08)
      addMesh('abdomen', new THREE.SphereGeometry(0.34, segBody, segBody), bodyMat).position.set(-0.42, 0, 0)
      addMesh('head', new THREE.SphereGeometry(0.18, segHead, segHead), bodyMat).position.set(0.38, 0.08, 0)
      addMesh('eyeL', new THREE.SphereGeometry(0.07, 12, 12), eyeMat).position.set(0.48, 0.12, 0.12)
      addMesh('eyeR', new THREE.SphereGeometry(0.07, 12, 12), eyeMat).position.set(0.48, 0.12, -0.12)
      addMesh('antL', new THREE.CapsuleGeometry(0.015, 0.28, 4, 6), hardMat).position.set(0.55, 0.28, 0.08)
      addMesh('antR', new THREE.CapsuleGeometry(0.015, 0.28, 4, 6), hardMat).position.set(0.55, 0.28, -0.08)
      addMesh('wingL', new THREE.SphereGeometry(0.28, 14, 10), accentMat).position.set(0, 0.2, 0.32)
      ;(parts.wingL as THREE.Mesh).scale.set(1.4, 0.12, 0.7)
      addMesh('wingR', new THREE.SphereGeometry(0.28, 14, 10), accentMat).position.set(0, 0.2, -0.32)
      ;(parts.wingR as THREE.Mesh).scale.set(1.4, 0.12, 0.7)
    }

    const buildSerpentine = () => {
      for (let i = 0; i < 12; i++) {
        const seg = addMesh(`seg${i}`, new THREE.SphereGeometry(0.15 - i * 0.005, 12, 12), bodyMat)
        seg.position.set(-1.4 + i * 0.26, Math.sin(i * 0.65) * 0.22, 0)
      }
      addMesh('eye', new THREE.SphereGeometry(0.035, 12, 12), eyeMat).position.set(1.4, 0.18, 0.1)
    }

    const buildPlant = () => {
      addMesh('stem', new THREE.CylinderGeometry(0.05, 0.09, 1.35, 12), bodyMat, 0)
      addMesh('leaf1', new THREE.SphereGeometry(0.32, 16, 12), accentMat).position.set(0.28, 0.35, 0)
      ;(parts.leaf1 as THREE.Mesh).scale.set(1.6, 0.18, 1)
      addMesh('leaf2', new THREE.SphereGeometry(0.28, 16, 12), accentMat).position.set(-0.22, 0.55, 0.1)
      ;(parts.leaf2 as THREE.Mesh).scale.set(1.4, 0.16, 1)
      addMesh('bloom', new THREE.SphereGeometry(0.2, 16, 16), eyeMat).position.set(0, 0.85, 0)
    }

    try {
      if (sil === 'humanoid') buildHumanoid()
      else if (sil === 'quadruped') buildQuadruped()
      else if (sil === 'avian') buildAvian()
      else if (sil === 'aquatic') buildAquatic()
      else if (sil === 'worm') buildWorm()
      else if (sil === 'insect') buildInsect()
      else if (sil === 'serpentine') buildSerpentine()
      else if (sil === 'plant') buildPlant()
      else buildHumanoid()
    } catch (err) {
      console.error('BioCAD preview build failed', err)
      while (root.children.length) root.remove(root.children[0])
      const fallback = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.35, 0.9, 6, 12),
        new THREE.MeshPhysicalMaterial({ color: 0x3ecfbf, emissive: 0x0a3a35, emissiveIntensity: 0.35, roughness: 0.35 }),
      )
      fallback.castShadow = false
      root.add(fallback)
      parts.body = fallback
    }

    // Optional remote GLTF (best-effort; never blocks procedural)
    let gltfRoot: THREE.Object3D | null = null
    if (isDog || isCat) {
      ;(async () => {
        try {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
          const loader = new GLTFLoader()
          const url =
            isDog
              ? 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedSimple/glTF/RiggedSimple.gltf'
              : ''
          if (!url) return
          const gltf = await loader.loadAsync(url)
          // Only use as subtle reference silhouette — keep procedural primary
          gltfRoot = gltf.scene
          gltfRoot.visible = false
          gltfRoot.scale.setScalar(0.01)
          scene.add(gltfRoot)
        } catch {
          /* procedural only */
        }
      })()
    }

    let frame = 0
    let raf = 0
    let lastPhenotype: typeof p | null = null
    let tabVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
    let onscreen = true
    let looping = false

    const applyPhenotype = () => {
      try {
        const { p: ph } = stateRef.current
        // Safety: ensure phenotype properties exist with fallbacks
        const safeNum = (val: number | undefined, def: number) => typeof val === 'number' && !isNaN(val) ? val : def
        const safeStr = (val: string | undefined, def: string) => typeof val === 'string' && val ? val : def
        
        const primary =
          sil === 'avian'
            ? safeStr(ph.featherColor, ph.skin)
            : sil === 'quadruped'
              ? safeStr(ph.coatColor, ph.skin)
              : sil === 'serpentine' || id === 'zebrafish' || id === 'shark' || id === 'turtle'
                ? safeStr(ph.scaleColor, ph.skin)
                : id === 'yeast'
                  ? safeStr(ph.colonyColor, ph.skin)
                  : sil === 'plant'
                    ? safeStr(ph.leafColor, ph.skin)
                    : safeStr(ph.skin, '#e8b896')

        bodyMat.color.copy(hexToColor(primary))
        bodyMat.sheenColor.copy(hexToColor(sil === 'avian' ? safeStr(ph.featherColor, ph.skin) : safeStr(ph.coatColor, ph.hair)))
        bodyMat.iridescence = 0.05 + safeNum(ph.iridescence, 30) / 120
        bodyMat.roughness = 0.28 + (100 - safeNum(ph.scalePattern, 40)) / 280
        // Skin SSS-ish response
        bodyMat.transmission = sil === 'humanoid' ? 0.035 : 0.015
        bodyMat.thickness = 0.25 + safeNum(ph.muscleMass, 45) / 400

      accentMat.color.copy(
        hexToColor(sil === 'avian' ? ph.featherColor : sil === 'insect' ? ph.wingTint : ph.coatColor || ph.hair),
      )
      accentMat.sheenColor.copy(accentMat.color)
      accentMat.iridescence = 0.1 + ph.iridescence / 100

      featherMat.color.copy(hexToColor(ph.featherColor))
      featherMat.sheenColor.copy(hexToColor(ph.featherColor))
      featherMat.iridescence = 0.2 + ph.iridescence / 90

      eyeMat.emissive.copy(hexToColor(ph.eyes))
      hardMat.color.copy(hexToColor(sil === 'avian' ? ph.beakColor : ph.nails || ph.beakColor))
      hairStrandMat.color.copy(hexToColor(ph.hair))
      hairStrandMat.sheenColor.copy(hexToColor(ph.hair))

      // Muscle density = definition/firmness ONLY — never overall height/limb length
      const firm = ph.muscleMass / 100
      const bulk = 1 + firm * 0.2 // radial thickness only
      bodyMat.roughness = Math.max(0.16, 0.52 - firm * 0.3)
      bodyMat.clearcoat = 0.18 + firm * 0.55
      bodyMat.clearcoatRoughness = Math.max(0.06, 0.42 - firm * 0.32)
      bodyMat.sheen = 0.22 + firm * 0.4
      bodyMat.bumpScale = 0.025 + firm * 0.08
      accentMat.roughness = Math.max(0.2, 0.58 - firm * 0.25)
      furMat.bumpScale = 0.04 + firm * 0.06

      // Height slider: human mid (~52) ≈ 5'10" vs fixed 6 ft ruler; others unchanged range
      const s =
        sil === 'humanoid' ? n(ph.height, 0.82, 1.18) : n(ph.height, 0.72, 1.28)
      root.scale.set(s, s, s)
      // Keep ruler world-scale readable: counter-scale so it stays true 6 ft
      const ruler = parts.ruler as THREE.Object3D | undefined
      if (ruler && sil === 'humanoid' && s > 0.01) {
        ruler.scale.setScalar(1 / s)
        // keep base on ground after counter-scale
        ruler.position.y = -1.15
      }
      const rulerLabel = parts.rulerLabel as THREE.Object3D | undefined
      if (rulerLabel && sil === 'humanoid' && s > 0.01) {
        rulerLabel.scale.set(0.55 / s, 0.14 / s, 1)
        rulerLabel.position.set(1.45 / s, (-1.15 + 1.83 + 0.12) / s, 0)
      }

      // headGroup uniform headSize scaling (cranium+face+hair/ears/eyes)
      const headScale = n(ph.headSize, 0.55, 1.55)
      const headGroup = parts.headGroup as THREE.Group | undefined
      if (headGroup) {
        headGroup.scale.setScalar(headScale)
      } else {
        const head = parts.head as THREE.Mesh | undefined
        if (head) head.scale.setScalar(headScale)
      }

      // Breed awareness for dogs: exaggerate via snout/ears/torso/height already in phenotype
      if (isDog) {
        try {
          const snoutLen = safeNum(ph.snoutLength, 50) / 100 // 0=bulldog short, 1=long
          const snout = parts.snout as THREE.Mesh | undefined
          if (snout && snout.scale) {
            // short snout → wide flat muzzle; long → elongated
            const len = 0.45 + snoutLen * 1.4
            const wide = 1.55 - snoutLen * 0.7
            snout.scale.set(wide, len, wide * 0.95)
            if (snout.position) snout.position.x = 0.14 + snoutLen * 0.18
          }
          const jaw = parts.jaw as THREE.Mesh | undefined
          if (jaw && jaw.scale) {
            // heavy jowls when short snout
            const jowls = 1.15 + (1 - snoutLen) * 0.45
            jaw.scale.set(jowls, 0.5 + (1 - snoutLen) * 0.2, 0.95 + (1 - snoutLen) * 0.15)
          }
          const noseTip = parts.noseTip as THREE.Mesh | undefined
          if (noseTip && noseTip.position && noseTip.scale) {
            noseTip.position.x = 0.28 + snoutLen * 0.22
            noseTip.scale.setScalar(0.9 + (1 - snoutLen) * 0.35)
          }
          const skull = parts.head as THREE.Mesh | undefined
          if (skull && skull.scale) {
            // brachycephalic = wider skull
            skull.scale.set(1.0 + (1 - snoutLen) * 0.2, 0.92, 0.88 + (1 - snoutLen) * 0.12)
          }
        } catch (e) {
          console.warn('Dog breed feature scaling failed:', e)
        }
      }

      const torso = (parts.torso || parts.body || parts.chest) as THREE.Mesh | undefined
      if (torso && torso.scale) {
        try {
          // Human: mid slider ≈ real torso length (narrower range; base mesh already short)
          const ts =
            sil === 'humanoid' ? n(safeNum(ph.torsoSize, 50), 0.72, 1.18) : n(safeNum(ph.torsoSize, 50), 0.75, 1.35)
          torso.scale.set(
            ts * bulk * (isDog ? 1.15 : sil === 'humanoid' ? 1.0 : 1),
            ts * (isDog ? 0.95 : 1),
            ts * bulk * (isDog ? 0.9 : sil === 'humanoid' ? 0.78 : 1),
          )
        } catch (e) {
          console.warn('Torso scaling failed:', e)
        }
      }
      // Human chest/pelvis follow torsoSize for coherent trunk
      if (sil === 'humanoid') {
        const ts = n(ph.torsoSize, 0.72, 1.18)
        const chestH = parts.chest as THREE.Mesh | undefined
        if (chestH) chestH.scale.set(1.05 * ts * bulk, 0.55 * ts, 0.75 * ts * bulk)
        const pelvisH = parts.pelvis as THREE.Mesh | undefined
        if (pelvisH) pelvisH.scale.set(1.05 * ts * bulk, 0.45 * ts, 0.8 * ts * bulk)
      }
      const chest = parts.chest as THREE.Mesh | undefined
      if (chest && sil === 'quadruped') {
        const ts = n(ph.torsoSize, 0.8, 1.35)
        chest.scale.set(1.15 * ts * bulk, 0.95 * ts, 0.9 * ts * bulk)
      }
      const belly = parts.belly as THREE.Mesh | undefined
      if (belly) {
        const ts = n(ph.torsoSize, 0.8, 1.3)
        belly.scale.set(1.2 * ts * (0.95 + firm * 0.1), 0.75 * ts, 0.85 * ts * bulk)
      }
      const pelvisM = parts.pelvis as THREE.Mesh | undefined
      if (pelvisM && sil === 'quadruped') {
        const ts = n(ph.torsoSize, 0.8, 1.3)
        pelvisM.scale.set(1.05 * ts * bulk, 0.85 * ts, 0.95 * ts * bulk)
      }

      // Fur shell driven by coatLength (LOD shells already capped at build)
      const coatLen = ph.coatLength
      const coatVis = coatLen > 8
      const coatScale = n(coatLen, 1.02, 1.28)
      furShells.forEach((shell) => {
        shell.visible = coatVis && sil === 'quadruped'
        const mat = shell.material as THREE.MeshPhysicalMaterial
        mat.color.copy(hexToColor(ph.coatColor))
        mat.sheenColor.copy(hexToColor(ph.coatColor))
        mat.opacity = Math.min(0.75, 0.25 + coatLen / 160)
        mat.roughness = Math.max(0.35, 0.85 - firm * 0.25)
        mat.sheen = 0.7 + coatLen / 250
        // Preserve non-uniform base scale ratios by multiplying scalar onto unit
        const base = shell.userData.baseScale as THREE.Vector3 | undefined
        if (!base) {
          shell.userData.baseScale = shell.scale.clone()
        }
        const b = shell.userData.baseScale as THREE.Vector3
        shell.scale.set(b.x * (coatScale / 1.1), b.y * (coatScale / 1.1), b.z * (coatScale / 1.1))
      })
      furMat.color.copy(hexToColor(ph.coatColor))
      furMat.sheenColor.copy(hexToColor(ph.coatColor))

      // Limb radial bulk from muscle; length from arm/legLength only
      ;['armL', 'armR'].forEach((k) => {
        const m = parts[k] as THREE.Object3D | undefined
        if (!m) return
        if (m instanceof THREE.Group) {
          m.scale.set(bulk, n(ph.armLength, 0.65, 1.45), bulk)
        } else if (m instanceof THREE.Mesh) {
          m.scale.set(bulk, n(ph.armLength, 0.65, 1.45), bulk)
        }
      })
      // Human: shoulder origin ALWAYS on outer torso surface (never clip into chest)
      if (sil === 'humanoid') {
        const ts = n(ph.torsoSize, 0.72, 1.18)
        // Match buildHumanoid radii: torso capsule 0.22, chest sphere 0.22
        const torsoRx = 0.22 * ts * bulk
        const chestRx = 0.22 * 1.05 * ts * bulk
        const halfW = Math.max(torsoRx, chestRx)
        const armRad = 0.06 * bulk // addLimb upper radius × radial scale
        const shoulderX = halfW + armRad + 0.025
        const armL = parts.armL as THREE.Object3D | undefined
        const armR = parts.armR as THREE.Object3D | undefined
        if (armL) {
          armL.position.x = -shoulderX
          armL.position.y = 0.42
          armL.position.z = 0
          armL.rotation.z = -Math.PI / 2 // T-pose: extend further -X
        }
        if (armR) {
          armR.position.x = shoulderX
          armR.position.y = 0.42
          armR.position.z = 0
          armR.rotation.z = Math.PI / 2 // T-pose: extend further +X
        }
      }
      ;['legL', 'legR', 'leg00', 'leg01', 'leg10', 'leg11'].forEach((k) => {
        const m = parts[k] as THREE.Object3D | undefined
        if (!m) return
        const len = n(ph.legLength, 0.65, 1.45)
        if (m instanceof THREE.Group) {
          m.scale.set(bulk, len, bulk)
        } else if (m instanceof THREE.Mesh) {
          m.scale.set(bulk, len, bulk)
        }
      })
      // Upper limb radial definition
      ;['armLUpper', 'armRUpper', 'legLUpper', 'legRUpper', 'leg00Upper', 'leg01Upper', 'leg10Upper', 'leg11Upper'].forEach(
        (k) => {
          const m = parts[k] as THREE.Mesh | undefined
          if (m) m.scale.set(bulk, 1, bulk)
        },
      )

      ;['earL', 'earR'].forEach((k) => {
        const m = parts[k] as THREE.Mesh | undefined
        if (m) m.scale.setScalar(n(ph.earSize, 0.5, 1.8))
      })
      const nose = (parts.nose || parts.snout || parts.trunk) as THREE.Mesh | undefined
      if (nose && !isDog) {
        nose.scale.set(
          n(ph.snoutLength || ph.noseSize, 0.55, 1.7),
          n(ph.snoutLength || ph.noseSize, 0.55, 1.7),
          1,
        )
      }
      const hair = parts.hair as THREE.Mesh | undefined
      if (hair) hair.scale.set(1, n(ph.hairLength, 0.4, 1.6), 1)
      hairStrands.forEach((strand, i) => {
        const hl = n(ph.hairLength, 0.35, 1.8)
        strand.scale.set(1, hl * (0.85 + (i % 5) * 0.06), 1)
        strand.visible = ph.hairLength > 5
        ;(strand.material as THREE.MeshPhysicalMaterial).color.copy(hexToColor(ph.hair))
      })
      const tail = parts.tail as THREE.Mesh | undefined
      if (tail) tail.scale.set(1, n(ph.tailLength, 0.5, 1.8), 1)

      // Avian
      const beak = parts.beak as THREE.Mesh | undefined
      if (beak) {
        const bl = n(ph.beakLength, 0.55, 1.9)
        const bs = n(ph.beakShape, 0.7, 1.4)
        beak.scale.set(bs, bl, bs)
        ;(beak.material as THREE.MeshStandardMaterial).color.copy(hexToColor(ph.beakColor))
      }
      const wingSpan = n(ph.wingSpan, 0.55, 1.85)
      const wingShape = n(ph.wingShape, 0.65, 1.45)
      ;['wingL', 'wingR'].forEach((k, idx) => {
        const m = parts[k] as THREE.Mesh | undefined
        if (m) {
          const base = sil === 'avian' ? [1.55, 0.18, 0.78] : [1.4, 0.12, 0.7]
          m.scale.set(base[0] * wingSpan, base[1] * wingShape, base[2] * wingSpan)
          m.position.z = (idx === 0 ? 1 : -1) * (0.42 + ph.wingSpan / 180)
        }
      })
      ;['talonL', 'talonR', 'paw00', 'paw01', 'paw10', 'paw11'].forEach((k) => {
        const m = parts[k] as THREE.Mesh | undefined
        if (m) m.scale.setScalar(n(ph.talonSize || ph.clawSize, 0.5, 1.8))
      })
      // Claw meshes
      Object.keys(parts).forEach((k) => {
        if (k.includes('Claw')) {
          const m = parts[k] as THREE.Mesh
          m.scale.setScalar(n(ph.clawSize || ph.talonSize, 0.5, 1.8))
        }
      })

      const fSize = n(ph.featherSize, 0.35, 2.1)
      const fCov = ph.featherCoverage / 100
      featherMeshes.forEach((f, i) => {
        f.visible = i / featherMeshes.length < fCov
        f.scale.setScalar(fSize * (0.7 + (i % 5) * 0.08))
        const mat = f.material as THREE.MeshPhysicalMaterial
        mat.color.copy(hexToColor(ph.featherColor))
        mat.iridescence = ph.iridescence / 80
        mat.opacity = 0.55 + fCov * 0.45
        mat.transparent = true
      })

      // Aquatic / fins
      ;['fin', 'finL', 'finR'].forEach((k) => {
        const m = parts[k] as THREE.Mesh | undefined
        if (m) m.scale.setScalar(n(ph.finSpan, 0.55, 1.75))
      })
      if (torso && (sil === 'aquatic' || sil === 'worm' || sil === 'serpentine')) {
        const bl = n(ph.bodyLength, 0.7, 1.55)
        torso.scale.set(bl, n(ph.torsoSize, 0.75, 1.3), n(ph.torsoSize, 0.75, 1.3))
      }
      for (let i = 0; i < 12; i++) {
        const tent = parts[`tent${i}`] as THREE.Mesh | undefined
        if (tent) tent.scale.set(1, n(ph.tentacleLength, 0.45, 1.9), 1)
        const seg = (parts[`seg${i}`] || parts[`s${i}`]) as THREE.Mesh | undefined
        if (seg) {
          const spacing = n(ph.bodyLength || ph.segments, 0.75, 1.4)
          seg.position.x *= 0.85 + spacing * 0.15
          seg.scale.setScalar(n(ph.height, 0.7, 1.35) * (id === 'yeast' ? n(ph.colonySize, 0.6, 1.6) : 1))
        }
      }
      ;['gillL', 'gillR'].forEach((k) => {
        const m = parts[k] as THREE.Mesh | undefined
        if (m) m.scale.setScalar(n(ph.gillsSize, 0.5, 1.8))
      })
      ;['antL', 'antR'].forEach((k) => {
        const m = parts[k] as THREE.Mesh | undefined
        if (m) m.scale.set(1, n(ph.antennaeLength, 0.45, 1.9), 1)
      })
      const shell = parts.shell as THREE.Mesh | undefined
      if (shell) shell.scale.setScalar(n(ph.shellSize, 0.6, 1.55))
      const stem = parts.stem as THREE.Mesh | undefined
      if (stem) stem.scale.set(1, n(ph.stemHeight, 0.55, 1.7), 1)
      ;['leaf1', 'leaf2'].forEach((k) => {
        const m = parts[k] as THREE.Mesh | undefined
        if (m) {
          const ls = n(ph.leafSpan, 0.6, 1.7)
          m.scale.set(1.5 * ls, 0.18, ls)
          ;(m.material as THREE.MeshPhysicalMaterial).color.copy(hexToColor(ph.leafColor))
        }
      })
      const bloom = parts.bloom as THREE.Mesh | undefined
      if (bloom) {
        bloom.scale.setScalar(n(ph.stemHeight, 0.8, 1.3))
        ;(bloom.material as THREE.MeshPhysicalMaterial).color.copy(hexToColor(ph.bloomColor))
      }

        void gltfRoot
      } catch (err) {
        console.error('BioCAD phenotype application failed:', err)
        // Keep last valid frame on error
      }
    }

    const shouldRender = () => tabVisible && onscreen

    const animate = () => {
      raf = requestAnimationFrame(animate)
      if (!shouldRender()) return
      frame++
      const curPh = stateRef.current.p
      const phChanged = curPh !== lastPhenotype
      // Heavy phenotype updates: when phenotype ref changes OR every 2nd frame
      if (phChanged || frame % 2 === 0) {
        try {
          applyPhenotype()
          lastPhenotype = curPh
        } catch {
          /* keep last frame */
        }
      }
      root.rotation.y = Math.sin(frame * 0.004) * 0.12
      controls.update()
      renderer.render(scene, camera)
    }

    const startLoop = () => {
      if (looping) return
      looping = true
      animate()
    }
    const stopLoop = () => {
      looping = false
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const onVisibility = () => {
      tabVisible = document.visibilityState === 'visible'
      if (tabVisible && onscreen) startLoop()
      else if (!tabVisible) stopLoop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              onscreen = entries.some((e) => e.isIntersecting)
              if (onscreen && tabVisible) startLoop()
              else if (!onscreen) stopLoop()
            },
            { root: null, threshold: 0.01 },
          )
        : null
    io?.observe(mount)

    startLoop()

    const onResize = () => {
      if (!mount) return
      const nw = Math.max(mount.clientWidth, 1)
      const nh = Math.max(mount.clientHeight, 1)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      const cap = compact || nw < 400 ? 1.25 : 1.5
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap))
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(() => onResize())
    ro.observe(mount)
    requestAnimationFrame(() => onResize())
    setTimeout(onResize, 50)
    setTimeout(onResize, 250)

    return () => {
      stopLoop()
      document.removeEventListener('visibilitychange', onVisibility)
      io?.disconnect()
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      controls.dispose()
      textures.forEach((t) => t.dispose())
      // sharedEnvRT is module-cached — do not dispose
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          disposeMat(obj.material)
        }
      })
    }
  }, [species?.id, compact])

  if (!species) {
    return (
      <div
        className={`instrument-panel flex items-center justify-center ${compact ? 'h-full min-h-[260px]' : 'h-full min-h-[320px]'}`}
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-bio-muted">No genome loaded</p>
      </div>
    )
  }

  return (
    <div
      className={`instrument-panel relative overflow-hidden ${compact ? 'h-full min-h-[260px]' : 'h-full min-h-[320px]'}`}
    >
      <div className="absolute left-2 top-2 z-10 border border-cyan-500/25 bg-black/55 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-300/90">
        Viewport · {species.name}
      </div>
      <div className="absolute right-2 top-2 z-10 border border-emerald-500/30 bg-black/55 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300/90">
        WebGL · LIVE
      </div>
      <div className="pointer-events-none absolute left-2 top-8 z-10 font-mono text-[8px] uppercase tracking-wider text-bio-muted/80">
        Orbit · Pan · Scroll zoom
      </div>
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex gap-1.5">
        {[
          ['LRN', p.learning],
          ['MEM', p.memory],
          ['ATT', p.attention],
          ['EMO', p.emotionalReg],
          ['GRW', p.growthRate],
        ].map(([k, v]) => (
          <div key={k as string} className="flex-1 border border-white/5 bg-black/50 px-1.5 py-1">
            <div className="font-mono text-[8px] text-bio-muted">{k}</div>
            <div className="mt-0.5 h-0.5 overflow-hidden bg-white/10">
              <div className="h-full bg-cyan-400/85" style={{ width: `${v}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
