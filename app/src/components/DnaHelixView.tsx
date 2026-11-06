import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export const HELIX_BASE_COLOR: Record<string, number> = {
  A: 0x34d399,
  T: 0xef4444,
  G: 0xfbbf24,
  C: 0x22d3ee,
}

const COMPLEMENT: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' }

export const HELIX_CAP = 180

type Props = {
  sequence: string
  /** Edit mode: center window on cursor. Print mode: grow through sequence. */
  cursor?: number
  /** 0–1 print progress — lights bases up to this fraction */
  progress?: number
  /** Absolute printed base count (preferred over progress when set) */
  printedCount?: number
  mode?: 'edit' | 'print'
  className?: string
}

/**
 * Shared DNA double-helix viewport (Part Library + Print modal).
 * Always fills the container with a clear spinning helix.
 */
export function DnaHelixView({
  sequence,
  cursor = 0,
  progress = 1,
  printedCount,
  mode = 'edit',
  className = 'h-full w-full',
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const seqRef = useRef(sequence)
  const cursorRef = useRef(cursor)
  const progressRef = useRef(progress)
  const printedRef = useRef(printedCount)
  const modeRef = useRef(mode)
  seqRef.current = sequence
  cursorRef.current = cursor
  progressRef.current = progress
  printedRef.current = printedCount
  modeRef.current = mode

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = Math.max(mount.clientWidth || 0, 280)
    const h = Math.max(mount.clientHeight || 0, 200)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1218)
    scene.fog = new THREE.FogExp2(0x0a1218, 0.035)

    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200)
    camera.position.set(0, 2.2, 9)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x0a1218, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w, h)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = true
    controls.enableZoom = true
    controls.minDistance = 3
    controls.maxDistance = 28
    controls.target.set(0, 0, 0)
    controls.update()

    scene.add(new THREE.AmbientLight(0x6a8aaa, 0.65))
    const key = new THREE.DirectionalLight(0xc8f0ff, 1.2)
    key.position.set(4, 8, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x3ecfbf, 0.7)
    rim.position.set(-5, 2, -3)
    scene.add(rim)

    const tipLight = new THREE.PointLight(0x22d3ee, 0, 8, 2)
    scene.add(tipLight)

    const root = new THREE.Group()
    scene.add(root)

    const sphereGeo = new THREE.SphereGeometry(0.12, 12, 12)
    const rungGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 8)

    const beadPool: THREE.Mesh[] = []
    const rungPool: THREE.Mesh[] = []

    const printerMat = new THREE.MeshStandardMaterial({
      color: 0xa5f3fc,
      emissive: 0x22d3ee,
      emissiveIntensity: 2.4,
      roughness: 0.2,
      metalness: 0.4,
    })
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), printerMat)
    tip.visible = false
    root.add(tip)
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 12), printerMat)
    head.visible = false
    root.add(head)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.04, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9 }),
    )
    ring.visible = false
    root.add(ring)

    function ensurePools(n: number) {
      while (beadPool.length < n * 2) {
        const m = new THREE.Mesh(
          sphereGeo,
          new THREE.MeshStandardMaterial({
            color: 0x3ecfbf,
            roughness: 0.3,
            metalness: 0.3,
            emissive: 0x0a3030,
            emissiveIntensity: 0.45,
          }),
        )
        m.visible = false
        root.add(m)
        beadPool.push(m)
      }
      while (rungPool.length < n) {
        const m = new THREE.Mesh(
          rungGeo,
          new THREE.MeshStandardMaterial({
            color: 0x34d399,
            roughness: 0.35,
            metalness: 0.2,
            emissive: 0x041010,
            emissiveIntensity: 0.35,
          }),
        )
        m.visible = false
        root.add(m)
        rungPool.push(m)
      }
    }

    let lastSig = ''
    function rebuild() {
      const seq = (seqRef.current || 'ATCGATCGATCG').toUpperCase().replace(/[^ATCG]/g, '') || 'ATCGATCGATCG'
      const modeNow = modeRef.current
      const printed =
        printedRef.current != null
          ? Math.max(0, Math.min(seq.length, printedRef.current))
          : Math.floor(Math.max(0, Math.min(1, progressRef.current)) * seq.length)
      const cur =
        modeNow === 'print'
          ? Math.max(printed, 1)
          : Math.max(0, Math.min(seq.length, cursorRef.current))

      const win = Math.min(HELIX_CAP, Math.max(36, Math.min(seq.length || 36, 96)))
      let start = Math.max(0, cur - Math.floor(win / 2))
      let end = Math.min(seq.length, start + win)
      if (end - start < win) start = Math.max(0, end - win)
      // Print: show window ending at frontier so growth is visible filling the view
      if (modeNow === 'print') {
        end = Math.min(seq.length, Math.max(win, printed + Math.floor(win * 0.15)))
        start = Math.max(0, end - win)
      }
      const slice = seq.slice(start, end) || 'ATCGATCGATCG'
      const sig = `${modeNow}:${start}:${end}:${printed}:${slice.length}`
      if (sig === lastSig) return
      lastSig = sig

      const n = slice.length
      ensurePools(n)
      const turns = n / 10.5
      const height = Math.max(4.5, n * 0.14)
      const radius = 1.15

      for (let i = 0; i < beadPool.length; i++) beadPool[i].visible = false
      for (let i = 0; i < rungPool.length; i++) rungPool[i].visible = false

      let tipPos = new THREE.Vector3(0, 0, 0)
      let tipBase = 'A'

      for (let i = 0; i < n; i++) {
        const globalIdx = start + i
        const t = i / Math.max(1, n - 1)
        const angle = t * turns * Math.PI * 2
        const y = (t - 0.5) * height
        const base = slice[i] || 'A'
        const comp = COMPLEMENT[base] || 'T'
        const isPrinted = modeNow !== 'print' || globalIdx < printed
        const isFrontier = modeNow === 'print' && globalIdx === Math.max(0, printed - 1)

        const a = beadPool[i * 2]
        const b = beadPool[i * 2 + 1]
        a.visible = true
        b.visible = true
        const matA = a.material as THREE.MeshStandardMaterial
        const matB = b.material as THREE.MeshStandardMaterial
        matA.color.setHex(HELIX_BASE_COLOR[base] ?? 0x888888)
        matB.color.setHex(HELIX_BASE_COLOR[comp] ?? 0x888888)
        matA.emissive.setHex(HELIX_BASE_COLOR[base] ?? 0x888888)
        matB.emissive.setHex(HELIX_BASE_COLOR[comp] ?? 0x888888)
        matA.emissiveIntensity = isPrinted ? (isFrontier ? 1.6 : 0.85) : 0.08
        matB.emissiveIntensity = isPrinted ? (isFrontier ? 1.2 : 0.55) : 0.06
        matA.opacity = isPrinted ? 1 : 0.35
        matB.opacity = isPrinted ? 1 : 0.3
        matA.transparent = !isPrinted
        matB.transparent = !isPrinted
        a.scale.setScalar(isFrontier ? 1.45 : isPrinted ? 1 : 0.7)
        b.scale.setScalar(isPrinted ? 1 : 0.7)
        a.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
        b.position.set(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius)

        const rung = rungPool[i]
        rung.visible = true
        const mat = rung.material as THREE.MeshStandardMaterial
        mat.color.setHex(HELIX_BASE_COLOR[base] ?? 0x888888)
        mat.emissive.setHex(HELIX_BASE_COLOR[base] ?? 0x888888)
        mat.emissiveIntensity = isPrinted ? 0.55 : 0.05
        mat.opacity = isPrinted ? 1 : 0.25
        mat.transparent = !isPrinted
        const mid = new THREE.Vector3().addVectors(a.position, b.position).multiplyScalar(0.5)
        rung.position.copy(mid)
        rung.scale.set(1, a.position.distanceTo(b.position), 1)
        rung.lookAt(b.position)
        rung.rotateX(Math.PI / 2)

        if (isFrontier || (modeNow === 'print' && i === Math.min(n - 1, Math.max(0, printed - start - 1)))) {
          tipPos = a.position.clone()
          tipBase = base
        }
      }

      if (modeNow === 'print') {
        tip.visible = true
        head.visible = true
        ring.visible = true
        tip.position.copy(tipPos)
        head.position.set(tipPos.x * 1.25, tipPos.y + 0.35, tipPos.z * 1.25)
        head.lookAt(tipPos)
        ring.position.copy(tipPos)
        tipLight.intensity = 3.2
        tipLight.position.copy(tipPos)
        tipLight.color.setHex(HELIX_BASE_COLOR[tipBase] ?? 0x22d3ee)
        printerMat.emissive.setHex(HELIX_BASE_COLOR[tipBase] ?? 0x22d3ee)
      } else {
        tip.visible = false
        head.visible = false
        ring.visible = false
        tipLight.intensity = 0
      }

      controls.target.set(0, 0, 0)
    }

    rebuild()

    let raf = 0
    let frame = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      frame++
      lastSig = '' // force rebuild each frame so print progress updates
      rebuild()
      root.rotation.y += modeRef.current === 'print' ? 0.012 : 0.0035
      if (modeRef.current === 'print') {
        ring.rotation.z = frame * 0.08
        tip.scale.setScalar(0.9 + Math.sin(frame * 0.2) * 0.2)
      }
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      const nw = Math.max(mount.clientWidth || 0, 280)
      const nh = Math.max(mount.clientHeight || 0, 200)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(mount)
    // layout settle
    requestAnimationFrame(onResize)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      sphereGeo.dispose()
      rungGeo.dispose()
      for (const m of beadPool) {
        ;(m.material as THREE.Material).dispose()
      }
      for (const m of rungPool) {
        ;(m.material as THREE.Material).dispose()
      }
      printerMat.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className={className} />
}
