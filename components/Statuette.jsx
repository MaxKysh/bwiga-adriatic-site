'use client'

/**
 * BWiGA Adriatic статуэтка — процедурная 3D-модель.
 *
 * Что делает:
 * - Строит прозрачную акриловую пластину по SVG-силуэту (assets/statuette/form-main.svg).
 * - Строит лежащее плашмя основание с прорезью по форме (assets/statuette/form-bottom.svg).
 * - Натягивает на фронт пластины текстуру (texture-front.png) — синяя графика с буквой B,
 *   ромбом и надписью BWiGA-2026 / ADRIATIC EDITION.
 * - Сзади пластины — плоская белая поверхность.
 * - Зазор ~4мм между телом пластины и верхом основания (язычок проходит сквозь прорезь
 *   с люфтом, как на реальной статуэтке).
 *
 * Использование:
 *   import { Statuette } from '@/components/Statuette'
 *
 *   <div className="h-[600px]">
 *     <Statuette autoRotate />
 *   </div>
 *
 * Зависимости (поставить если ещё нет):
 *   npm i three @react-three/fiber @react-three/drei
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture, Environment } from '@react-three/drei'
import * as THREE from 'three'

// =============================================================================
// SVG path data - inline, без сетевых запросов
// =============================================================================
// Силуэт верхней пластины (с язычком снизу)
const FORM_MAIN = {
  d: 'M131.574 0C132.517 0 133.443 0.071068 134.357 0.177734H438.143C513.253 0.499067 574.278 61.7678 574.278 136.757C574.278 169.741 562.361 201.59 540.72 226.44C533.414 234.83 525.169 242.237 516.198 248.546C525.169 254.854 533.414 262.262 540.72 270.651C561.821 294.882 573.645 325.771 574.223 357.874C574.26 358.513 574.278 359.156 574.278 359.802V753.162H427V790H144V753.162H0V0H131.574Z',
  vbw: 575,
  vbh: 790,
}

// Силуэт основания с прорезью под язычок (через fill-rule="evenodd")
const FORM_BOTTOM = {
  d: 'M814 0C836.091 0 854 17.9086 854 40V235C854 257.091 836.091 275 814 275H40C17.9086 275 0 257.091 0 235V40C0 17.9086 17.9086 0 40 0H814ZM284 114V162H567V114H284Z',
  vbw: 854,
  vbh: 275,
}

// Реальный масштаб: 1 SVG-px = 0.026 cm (по PDF KLIRIT_IB_20x15)
const PX_TO_CM = 0.026

// =============================================================================
// SVG path parser - без сторонних либ
// =============================================================================
function parseSvgPath(d) {
  const points = []
  const cmds = d.match(/[a-zA-Z][^a-zA-Z]*/g) || []
  let cx = 0, cy = 0, startX = 0, startY = 0
  const nums = (s) =>
    (s.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(parseFloat)

  for (const seg of cmds) {
    const cmd = seg[0]
    const args = nums(seg.slice(1))
    const rel = cmd === cmd.toLowerCase()

    if (cmd === 'M' || cmd === 'm') {
      let x = args[0], y = args[1]
      if (rel) { x += cx; y += cy }
      points.push({ type: 'M', x, y })
      cx = x; cy = y; startX = x; startY = y
      for (let i = 2; i < args.length; i += 2) {
        let nx = args[i], ny = args[i + 1]
        if (rel) { nx += cx; ny += cy }
        points.push({ type: 'L', x: nx, y: ny })
        cx = nx; cy = ny
      }
    } else if (cmd === 'L' || cmd === 'l') {
      for (let i = 0; i < args.length; i += 2) {
        let nx = args[i], ny = args[i + 1]
        if (rel) { nx += cx; ny += cy }
        points.push({ type: 'L', x: nx, y: ny })
        cx = nx; cy = ny
      }
    } else if (cmd === 'H' || cmd === 'h') {
      for (const v of args) {
        const nx = rel ? cx + v : v
        points.push({ type: 'L', x: nx, y: cy })
        cx = nx
      }
    } else if (cmd === 'V' || cmd === 'v') {
      for (const v of args) {
        const ny = rel ? cy + v : v
        points.push({ type: 'L', x: cx, y: ny })
        cy = ny
      }
    } else if (cmd === 'C' || cmd === 'c') {
      for (let i = 0; i < args.length; i += 6) {
        let cp1x = args[i], cp1y = args[i + 1]
        let cp2x = args[i + 2], cp2y = args[i + 3]
        let nx = args[i + 4], ny = args[i + 5]
        if (rel) {
          cp1x += cx; cp1y += cy
          cp2x += cx; cp2y += cy
          nx += cx; ny += cy
        }
        points.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x: nx, y: ny })
        cx = nx; cy = ny
      }
    } else if (cmd === 'Z' || cmd === 'z') {
      cx = startX; cy = startY
    }
  }

  // разделяем на subpaths по M
  const subs = []
  let cur = null
  for (const p of points) {
    if (p.type === 'M') { cur = []; subs.push(cur) }
    cur.push(p)
  }
  return subs
}

// =============================================================================
// Построение Three.Shape из subpath с центрированием и mirror Y
// =============================================================================
function buildShape(subpath, vbw, vbh) {
  const cx = vbw / 2, cy = vbh / 2
  const s = new THREE.Shape()
  let first = true

  for (const p of subpath) {
    const x = (p.x - cx) * PX_TO_CM
    const y = -(p.y - cy) * PX_TO_CM // SVG Y down -> Three Y up
    if (p.type === 'M' || first) {
      s.moveTo(x, y)
      first = false
    } else if (p.type === 'L') {
      s.lineTo(x, y)
    } else if (p.type === 'C') {
      const c1x = (p.cp1x - cx) * PX_TO_CM
      const c1y = -(p.cp1y - cy) * PX_TO_CM
      const c2x = (p.cp2x - cx) * PX_TO_CM
      const c2y = -(p.cp2y - cy) * PX_TO_CM
      s.bezierCurveTo(c1x, c1y, c2x, c2y, x, y)
    }
  }
  return s
}

function buildHole(subpath, vbw, vbh) {
  const cx = vbw / 2, cy = vbh / 2
  const h = new THREE.Path()
  let first = true
  for (const p of subpath) {
    const x = (p.x - cx) * PX_TO_CM
    const y = -(p.y - cy) * PX_TO_CM
    if (first) { h.moveTo(x, y); first = false }
    else if (p.type === 'L') h.lineTo(x, y)
    else if (p.type === 'C') {
      const c1x = (p.cp1x - cx) * PX_TO_CM, c1y = -(p.cp1y - cy) * PX_TO_CM
      const c2x = (p.cp2x - cx) * PX_TO_CM, c2y = -(p.cp2y - cy) * PX_TO_CM
      h.bezierCurveTo(c1x, c1y, c2x, c2y, x, y)
    }
  }
  return h
}

// =============================================================================
// Основной компонент сцены
// =============================================================================
function StatuetteScene({
  thicknessMm = 8,
  gapMm = 4,
  autoRotate = true,
  acrylic = true,
}) {
  const groupRef = useRef()

  // Загружаем текстуру лица (синяя плёнка с графикой)
  const frontTexture = useTexture('/statuette/texture-front.png')
  // Текстура должна быть с прозрачностью; flip Y потому что Three.js по умолчанию
  // использует Y-down для UV, а наш экстрюд - Y-up
  frontTexture.flipY = true
  frontTexture.colorSpace = THREE.SRGBColorSpace

  // Парсим SVG один раз
  const { plateShape, baseShape, plateBounds } = useMemo(() => {
    const mainSubs = parseSvgPath(FORM_MAIN.d)
    const plateShape = buildShape(mainSubs[0], FORM_MAIN.vbw, FORM_MAIN.vbh)

    const bottomSubs = parseSvgPath(FORM_BOTTOM.d)
    const baseShape = buildShape(bottomSubs[0], FORM_BOTTOM.vbw, FORM_BOTTOM.vbh)
    if (bottomSubs[1]) {
      baseShape.holes.push(buildHole(bottomSubs[1], FORM_BOTTOM.vbw, FORM_BOTTOM.vbh))
    }

    // Запоминаем размеры для UV-мапа и позиционирования
    // Тело пластины ограничено снизу строкой y=753.162 в SVG
    // После центровки + flip: world Y = -(753.162 - 395) * 0.026 = -9.31cm
    const plateBodyBottomY = -(753.162 - FORM_MAIN.vbh / 2) * PX_TO_CM
    const plateWidth = FORM_MAIN.vbw * PX_TO_CM
    const plateHeight = FORM_MAIN.vbh * PX_TO_CM

    return {
      plateShape,
      baseShape,
      plateBounds: { plateBodyBottomY, plateWidth, plateHeight },
    }
  }, [])

  // Геометрия пластины с UV для текстуры
  const plateGeometry = useMemo(() => {
    const depth = thicknessMm / 10 // mm -> cm
    const ext = {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 2,
      curveSegments: 32,
    }
    const geom = new THREE.ExtrudeGeometry(plateShape, ext)
    geom.translate(0, 0, -depth / 2) // центрируем по Z

    // Генерируем UV для front-face: разворачиваем в (0..1, 0..1) по bbox
    geom.computeBoundingBox()
    const { min, max } = geom.boundingBox
    const w = max.x - min.x
    const h = max.y - min.y
    const uv = geom.attributes.uv
    const pos = geom.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      uv.setXY(i, (x - min.x) / w, (y - min.y) / h)
    }
    uv.needsUpdate = true
    return geom
  }, [plateShape, thicknessMm])

  // Геометрия основания (extrude + поворот плашмя)
  const baseGeometry = useMemo(() => {
    const slabHeightCm = 1.2
    const ext = {
      depth: slabHeightCm,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
      curveSegments: 16,
    }
    const geom = new THREE.ExtrudeGeometry(baseShape, ext)
    geom.translate(0, 0, -slabHeightCm / 2)
    return geom
  }, [baseShape])

  // Позиция основания: его верх на расстоянии gap от низа тела пластины
  const basePositionY = useMemo(() => {
    const gapCm = gapMm / 10
    const slabHeight = 1.2
    return plateBounds.plateBodyBottomY - gapCm - slabHeight / 2
  }, [gapMm, plateBounds])

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      {/* Пластина с multi-material:
          - индекс 0: front face — текстура с прозрачностью
          - индекс 1: back face — белая
          - индекс 2: side faces — прозрачный акрил */}
      <mesh geometry={plateGeometry} castShadow receiveShadow>
        {acrylic ? (
          <>
            {/* front - текстура поверх прозрачного */}
            <meshPhysicalMaterial
              attach="material-0"
              map={frontTexture}
              transparent
              transmission={0.85}
              thickness={1.2}
              roughness={0.05}
              ior={1.49}
              clearcoat={0.4}
              clearcoatRoughness={0.06}
            />
            {/* back - белая основа */}
            <meshPhysicalMaterial
              attach="material-1"
              color="#ffffff"
              roughness={0.5}
              metalness={0}
            />
          </>
        ) : (
          <>
            <meshStandardMaterial attach="material-0" map={frontTexture} transparent />
            <meshStandardMaterial attach="material-1" color="#ffffff" />
          </>
        )}
      </mesh>

      {/* Основание - акриловое или серое */}
      <mesh
        geometry={baseGeometry}
        position={[0, basePositionY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        {acrylic ? (
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={0.95}
            thickness={1.5}
            roughness={0.04}
            ior={1.49}
            transparent
          />
        ) : (
          <meshStandardMaterial color="#cccccc" roughness={0.3} />
        )}
      </mesh>

      {/* Тень под основанием */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, basePositionY - 0.85, 0]}
      >
        <planeGeometry args={[28, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

// =============================================================================
// Внешний компонент с Canvas - то, что импортируется в страницы
// =============================================================================
export function Statuette({
  autoRotate = true,
  thicknessMm = 8,
  gapMm = 4,
  acrylic = true,
  className = '',
}) {
  // Pause the WebGL render loop entirely while the Hero is off-screen.
  // Saves ~5-10% CPU when scrolling through the lower sections, plus
  // frees the GPU completely when the user is not looking at it.
  const wrapRef = useRef(null)
  const [active, setActive] = useState(true)
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setActive(e.isIntersecting)),
      { threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 4, 80], fov: 28 }}
        gl={{ antialias: true, alpha: true }}
        // Cap pixel ratio at 1.5 — at 2× on a 4K display the backing buffer
        // explodes to 33M+ pixels per frame and transmission/IBL becomes
        // the bottleneck. 1.5× keeps acrylic edges crisp without the cost.
        dpr={[1, 1.5]}
        shadows
        // frameloop="never" parks the render loop; "always" runs it. We
        // toggle on viewport intersection.
        frameloop={active ? 'always' : 'never'}
      >
        {/* Освещение */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[8, 12, 14]}
          intensity={1.2}
          castShadow
          // Halved shadow map (1024→512). Statuette is acrylic so the cast
          // shadow is soft anyway — full-res map isn't visible to the user.
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        <directionalLight position={[-10, 4, 8]} intensity={0.4} />
        {/* Rim light - синий, сзади. Это даёт «грани играют синим» */}
        <directionalLight position={[0, 6, -14]} intensity={1.8} color="#3083C6" />

        {/* HDR-окружение для отражений на акриле.
            Если не нужно/тяжело — закомментируй: */}
        {acrylic && <Environment preset="studio" />}

        <StatuetteScene
          thicknessMm={thicknessMm}
          gapMm={gapMm}
          autoRotate={autoRotate}
          acrylic={acrylic}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={30}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2 + 0.3}
          minPolarAngle={Math.PI / 2 - 0.5}
        />
      </Canvas>
    </div>
  )
}

export default Statuette
