"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";

// -----------------------------------------------------------------------------
// Safe wrapper for the WebGL Statuette.
//
// Production failure modes:
//
//   1. Corporate Windows / hardware acceleration disabled → WebGL context
//      creation fails → render nothing. Plus error boundary.
//
//   2. iOS OOM. iPhone 14 Pro Max должен этим сценам не подавиться, но
//      в реальных тестах падал. Гипотеза: WebGL context + transmission
//      framebuffer держатся в GPU-памяти даже когда статуэтка off-screen
//      (frameloop пауза не освобождает ресурсы), и на фоне аккумулирующихся
//      изображений секций iOS прибивает таб. Решение в Statuette.jsx:
//      агрессивный unmount Canvas'а когда off-screen (Three.js диспозит
//      контекст), + drop transmission на lite (это самая дорогая фича,
//      и она и так не работает с DOM-video-фоном), + 2× меньше геометрия.
//      Не скипаем iOS — пробуем удержать с этими оптимизациями.
//
// Decision tree:
//   prefers-reduced-motion  → skip 3D
//   no WebGL                → skip 3D
//   mobile (≤1024 / coarse) → render <Statuette lite />
//   desktop                 → render <Statuette /> (full config)
// -----------------------------------------------------------------------------

type Decision = "checking" | "skip" | "render-full" | "render-lite";

const Statuette = dynamic(
  () => import("./Statuette").then((m) => m.Statuette ?? m.default),
  {
    ssr: false,
    loading: () => <div className="statuette-skeleton" aria-hidden />,
  }
);

function decide(): Exclude<Decision, "checking"> {
  if (typeof window === "undefined") return "skip";
  // Reduced motion — обычные правила приличия.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "skip";
  // WebGL availability check. Off-DOM canvas, no side-effects.
  try {
    const c = document.createElement("canvas");
    const gl =
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      c.getContext("experimental-webgl");
    if (!gl) return "skip";
  } catch {
    return "skip";
  }
  // Mobile (viewport ≤1024 ИЛИ coarse pointer) → lite-режим. Coarse pointer
  // ловит ещё планшеты в landscape с шириной >1024.
  if (
    window.matchMedia("(max-width: 1024px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  ) {
    return "render-lite";
  }
  return "render-full";
}

class StatuetteErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // Только лог, без падения страницы. WebGL ошибки сюда тоже падают.
    // eslint-disable-next-line no-console
    console.error("[Statuette] runtime error, falling back to empty:", error, info);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function StatuetteSafe() {
  const [decision, setDecision] = useState<Decision>("checking");

  useEffect(() => {
    setDecision(decide());
  }, []);

  if (decision === "checking" || decision === "skip") return null;

  return (
    <StatuetteErrorBoundary>
      <Statuette lite={decision === "render-lite"} />
    </StatuetteErrorBoundary>
  );
}
