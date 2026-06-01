"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";

// -----------------------------------------------------------------------------
// Safe wrapper for the WebGL Statuette.
//
// Two production failure modes we're protecting against:
//
//   1. iOS Safari/Chrome OOM (out-of-memory) crash on mobile. The hero already
//      runs a background <video>; adding a transmission-heavy R3F Canvas with
//      env-map PMREM cubemap on top can push a tab past iOS's per-tab memory
//      cap (~256–512MB depending on device). Tab crashes mid-scroll, user
//      sees "Не удалось открыть страницу". Fix: skip 3D entirely on mobile.
//
//   2. Corporate Windows machines (or any device) with hardware acceleration
//      disabled — WebGL context creation throws. Without protection R3F's
//      <Canvas> bubbles the error up past Next's runtime → page shows
//      "Application error" (server-rendered error page). Fix: detect WebGL
//      availability before mount; render nothing if unavailable. Also wrap
//      the mount in an error boundary as a second line of defense.
//
// Decision tree on mount (client-only):
//   prefers-reduced-motion  → skip (respect user preference)
//   mobile (≤1024 / coarse) → skip (OOM prevention)
//   no WebGL                → skip (corporate hardware / blocked drivers)
//   otherwise               → render <Statuette /> inside an error boundary
//
// All checks gate a single useEffect after mount; until then we render a
// neutral placeholder so server HTML and first client paint match.
// -----------------------------------------------------------------------------

const Statuette = dynamic(
  () => import("./Statuette").then((m) => m.Statuette ?? m.default),
  {
    ssr: false,
    loading: () => <div className="statuette-skeleton" aria-hidden />,
  }
);

function detectCanRender3D(): boolean {
  if (typeof window === "undefined") return false;
  // Reduced motion — обычные правила приличия.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // Mobile heuristic: viewport ≤1024 OR coarse pointer (touch device).
  // Coarse pointer ловит ещё планшеты в landscape с шириной >1024.
  if (window.matchMedia("(max-width: 1024px)").matches) return false;
  if (window.matchMedia("(pointer: coarse)").matches) return false;
  // WebGL availability. Используем off-DOM canvas, никаких side-effect'ов
  // если контекст не дадут — он молча null'нет.
  try {
    const c = document.createElement("canvas");
    const gl =
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      c.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
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
  // `null` = ещё не определились (первый рендер), не показываем тяжёлый
  // компонент пока не подтвердим что устройство справится.
  const [shouldRender, setShouldRender] = useState<boolean | null>(null);

  useEffect(() => {
    setShouldRender(detectCanRender3D());
  }, []);

  // Пока проверка идёт ИЛИ отказано — рендерим невидимый плейсхолдер.
  // Контейнер .hero-stage внешний; внутри пусто = места не занимаем.
  if (!shouldRender) return null;

  return (
    <StatuetteErrorBoundary>
      <Statuette />
    </StatuetteErrorBoundary>
  );
}
