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
import { useTexture, Environment } from '@react-three/drei'
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

// Силуэт основания с прорезью под язычок (через fill-rule="evenodd").
// Source: /Users/maxkysh/Desktop/Subtract.svg
// Прямоугольник 854×275 со скруглением 40px по углам и прямоугольной
// прорезью 283×48 в центре (X 284..567, Y 114..162) под tongue пластины.
const BASE_SVG = {
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
  acrylic = true,
}) {
  const groupRef = useRef()
  // Target rotation written by window.mousemove, read by useFrame.
  // Kept in a ref to avoid re-renders on every cursor move.
  const targetRot = useRef({ x: 0, y: 0 })

  // ---- Environment-driven feature flags (mobile + reduced-motion) ----------
  // matchMedia lookups are client-only; StatuetteScene runs inside <Canvas>
  // which itself is mounted only on the client, so useEffect is safe here.
  const [isMobile, setIsMobile] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mqM = window.matchMedia('(max-width: 768px)')
    const mqR = window.matchMedia('(prefers-reduced-motion: reduce)')
    const upd = () => {
      setIsMobile(mqM.matches)
      setReducedMotion(mqR.matches)
    }
    upd()
    mqM.addEventListener('change', upd)
    mqR.addEventListener('change', upd)
    return () => {
      mqM.removeEventListener('change', upd)
      mqR.removeEventListener('change', upd)
    }
  }, [])

  // ---- Mouse-driven tilt -------------------------------------------------
  // Track cursor across the whole window (not just the canvas) so the
  // statuette reacts no matter where the user moves the pointer on the page.
  // Normalize to (-1..+1) on both axes, then scale to clamped rotation
  // targets: Y axis ±0.5 rad (≈±28°), X axis ±0.35 rad (≈±20°).
  // Sign conventions:
  //   - Mouse right → positive Y rotation (statuette's right edge swings back)
  //   - Mouse up    → negative X rotation (top edge leans away from viewer)
  // Reduced-motion users get a fully static statuette facing forward.
  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion) return
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1   // -1 left → +1 right
      const ny = -((e.clientY / window.innerHeight) * 2 - 1) // -1 bottom → +1 top
      const cx = Math.max(-1, Math.min(1, nx))
      const cy = Math.max(-1, Math.min(1, ny))
      targetRot.current.y = cx * 0.5    // ±0.5 rad
      targetRot.current.x = -cy * 0.35  // ±0.35 rad
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [reducedMotion])

  // Загружаем текстуру лица (синяя плёнка с графикой)
  const frontTexture = useTexture('/statuette/texture-front.png')
  // Текстура должна быть с прозрачностью; flip Y потому что Three.js по умолчанию
  // использует Y-down для UV, а наш экстрюд - Y-up
  frontTexture.flipY = true
  frontTexture.colorSpace = THREE.SRGBColorSpace

  // Парсим SVG пластины
  const { plateShape, plateBounds } = useMemo(() => {
    const mainSubs = parseSvgPath(FORM_MAIN.d)
    const plateShape = buildShape(mainSubs[0], FORM_MAIN.vbw, FORM_MAIN.vbh)

    // Тело пластины ограничено снизу строкой y=753.162 в SVG.
    // После центровки + flip: world Y = -(753.162 - 395) * 0.026 = -9.31cm
    const plateBodyBottomY = -(753.162 - FORM_MAIN.vbh / 2) * PX_TO_CM
    const plateWidth = FORM_MAIN.vbw * PX_TO_CM
    const plateHeight = FORM_MAIN.vbh * PX_TO_CM

    return {
      plateShape,
      plateBounds: { plateBodyBottomY, plateWidth, plateHeight },
    }
  }, [])

  // Новая база из BASE_SVG — fresh build. Отдельный useMemo, отдельный
  // pipeline. Outer subpath даёт силуэт скруглённого прямоугольника,
  // второй subpath (через fill-rule="evenodd") становится hole'ом —
  // прорезью под tongue пластины.
  const baseShape = useMemo(() => {
    const subs = parseSvgPath(BASE_SVG.d)
    const shape = buildShape(subs[0], BASE_SVG.vbw, BASE_SVG.vbh)
    if (subs[1]) {
      shape.holes.push(buildHole(subs[1], BASE_SVG.vbw, BASE_SVG.vbh))
    }
    return shape
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
      // curveSegments: 32 → 16. Делит количество tri на скруглённых краях
      // плиты пополам — заметно дешевле и vertex stage, и transmission pass,
      // визуально на bbox 575×790 силуэта разница в кривизне ~незаметна.
      curveSegments: 16,
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

  // Геометрия основания (extrude + поворот плашмя). slabHeightCm понижен
  // 1.2 → 0.8 (×1.5 тоньше). Значение должно совпадать с slabHeight в
  // basePositionY ниже — иначе верх базы съедет относительно низа плиты.
  const baseGeometry = useMemo(() => {
    const slabHeightCm = 0.8
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

  // Позиция основания: его верх на расстоянии gap от низа тела пластины.
  // slabHeight 0.8 синхронизирован с baseGeometry выше.
  const basePositionY = useMemo(() => {
    const gapCm = gapMm / 10
    const slabHeight = 0.8
    return plateBounds.plateBodyBottomY - gapCm - slabHeight / 2
  }, [gapMm, plateBounds])

  // Smoothly interpolate current rotation toward the mouse-driven target.
  // Lerp factor 0.06 → ~250 ms to reach 95% of the target at 60 fps, which
  // feels fluid without lag. Reduced-motion: no-op (stays facing forward).
  useFrame(() => {
    const g = groupRef.current
    if (!g || reducedMotion) return
    g.rotation.y += (targetRot.current.y - g.rotation.y) * 0.06
    g.rotation.x += (targetRot.current.x - g.rotation.x) * 0.06
  })

  return (
    <group ref={groupRef}>
      {/* Пластина с multi-material:
          - индекс 0: front face — текстура с прозрачностью
          - индекс 1: back face — белая */}
      <mesh geometry={plateGeometry}>
        {acrylic ? (
          <>
            <meshPhysicalMaterial
              attach="material-0"
              map={frontTexture}
              // color #b8b8b8 — тинт чуть ниже белого (72% яркости). При
              // наличии map финальный diffuse = color × map.rgb, так что
              // синяя печать теперь читается приглушённее на ~30%.
              color="#b8b8b8"
              transparent
              transmission={0.5}
              thickness={1.2}
              roughness={0.05}
              ior={1.49}
              clearcoat={0.17}
              clearcoatRoughness={0.15}
            />
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

      {/* Новая база — multi-material, копирующий схему плиты:
          - material-0 (капы, т.е. верх и низ плашки): прозрачное стекло
            с opacity 0.2 и лёгким clearcoat. Через них видно сквозь.
          - material-1 (стенки, т.е. тонкие торцы по периметру плашки
            + внутренние стенки прорези): опаковая белая, точно как у
            плиты. Эти 1.2см торцы и дают тот самый видимый «контур»,
            который читается у плиты сверху. */}
      <mesh
        geometry={baseGeometry}
        position={[0, basePositionY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {acrylic ? (
          <>
            <meshPhysicalMaterial
              attach="material-0"
              color="#ffffff"
              transparent
              opacity={0.2}
              roughness={0.08}
              metalness={0}
              // clearcoat 0.4 → 0.27 (ещё в 1.5× слабее).
              clearcoat={0.27}
              clearcoatRoughness={0.15}
              ior={1.5}
            />
            <meshPhysicalMaterial
              attach="material-1"
              color="#939393"
              // roughness 0.5 → 0.75 — стенки сильнее матовые, env reflections
              // почти размыты (×1.5 шероховатее).
              roughness={0.75}
              metalness={0}
            />
          </>
        ) : (
          <meshStandardMaterial color="#cccccc" roughness={0.3} />
        )}
      </mesh>

      {/* Shadow plane removed — статуэтка плавает на фоне страницы без
          фейкового контактного пятна. */}
    </group>
  )
}

// =============================================================================
// Внешний компонент с Canvas - то, что импортируется в страницы
// =============================================================================
export function Statuette({
  thicknessMm = 8,
  gapMm = 2,
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
        // Cap DPR at 1 (was 1.5). На 4K мониторе 1.5× давало ~8M*1.5 = 12M
        // пикселей в backing buffer на каждый transmission pass — основная
        // причина просадки. На 1× acrylic edges чуть мыльнее, но transmission
        // и так сам по себе размывает фон, разница почти не видна.
        dpr={1}
        // shadows УДАЛЕНЫ. На прозрачном акриле cast/receive shadows почти
        // невидимы (плита refract'ит фон, а не отбрасывает чёткую тень),
        // но shadow-map render pass идёт каждый кадр. Хороший free perf win.
        frameloop={active ? 'always' : 'never'}
      >
        {/* Освещение — без shadow casting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[8, 12, 14]} intensity={1.2} />
        <directionalLight position={[-10, 4, 8]} intensity={0.4} />
        {/* Rim light - синий, сзади. Это даёт «грани играют синим» */}
        <directionalLight position={[0, 6, -14]} intensity={1.8} color="#3083C6" />

        {/* HDR-окружение для отражений. resolution={128} (по умолчанию 256)
            — PMREM cubemap генерируется в 4× меньше, mip-сэмплинг per pixel
            на стенках/clearcoat'е тоже дешевле. На roughness 0.35 у базы
            и 0.06 у clearcoat'а плиты разница в чёткости отражений ~незаметна. */}
        {acrylic && <Environment preset="studio" resolution={128} />}

        <StatuetteScene
          thicknessMm={thicknessMm}
          gapMm={gapMm}
          acrylic={acrylic}
        />

        {/* OrbitControls удалены: ротация теперь полностью управляется
            window mousemove → лерп в useFrame. Драг-to-rotate конфликтовал
            бы с этим. Зум тоже отключён — статуэтка показывается на
            фиксированной дистанции. */}
      </Canvas>
    </div>
  )
}

export default Statuette
