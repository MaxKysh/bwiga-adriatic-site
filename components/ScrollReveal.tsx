"use client";

import { useEffect, useLayoutEffect } from "react";

// Isomorphic — на сервере useLayoutEffect выдаёт warning, потому что не
// запускается в SSR. useEffect на сервере тоже не запускается, но не варнит.
// На клиенте оба одинаково; нам важна синхронность с commit'ом ДО paint'а,
// поэтому на клиенте берём useLayoutEffect.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// -----------------------------------------------------------------------------
// Baseline scroll-triggered fade-up + heading word-reveal.
//
// На mount:
//   1. Section fade-up:
//      - берём все <section> внутри <main>, пропускаем те что уже в viewport
//        (Hero/StatsPanel — иначе они мигнули бы opacity 0→1 в первом кадре),
//        остальным навешиваем .reveal-section.
//      - IntersectionObserver: при пересечении viewport добавляем .is-in,
//        CSS-transition отрабатывает fade-up.
//   2. Heading word-reveal:
//      - Hero h1.hero-title — слова обёрнуты в spans, маска уходит когда
//        body получает .intro-done (Preloader выставит после fade-out'а
//        первичного загрузочного экрана).
//      - h2 в трекаемых секциях — слова обёрнуты, маска уходит когда
//        секция получит .is-in.
//
// Wrapping слов делается через TreeWalker по text nodes — это сохраняет
// вложенные элементы (<br>, <em>, <span>) внутри заголовка. Каждое слово
// получает inline-style --reveal-delay = i * 35ms для stagger'а.
//
// reduced-motion: ранний return до любых модификаций. Контент рендерится
// опаково/без масок.
// -----------------------------------------------------------------------------

// Развернуть .rh-word обратно в plain text после того как маска уже отыграла.
// Это убирает 50-400 span'ов из DOM навсегда (страница за раз больше не
// re-revealed — IntersectionObserver делает unobserve после первого захода),
// освобождая композиторные слои которые Safari iOS держал в GPU-памяти.
// el.normalize() склеивает соседние text nodes, возвращая исходный DOM.
function unwrapWords(el: HTMLElement) {
  el.querySelectorAll<HTMLElement>(".rh-word").forEach((span) => {
    span.replaceWith(document.createTextNode(span.textContent ?? ""));
  });
  el.normalize();
}

// Сколько времени занимает heading-reveal до полного завершения: длиннейший
// stagger (DELAY_STEP × N words) + длительность transition'а маски. Берём с
// запасом: предполагаем до ~30 слов на заголовок ≈ 1050ms + 600ms transition
// + 350ms запас = 2000ms. После этого можно безопасно unwrap'ать.
const REVEAL_SAFE_MS = 2000;

function wrapWordsInPlace(el: HTMLElement) {
  // Если уже обёрнуто (на случай повторного запуска эффекта) — выходим.
  if (el.querySelector(".rh-word")) return;

  // Сначала собираем все text nodes (не идём live, чтобы не было мутации
  // во время обхода).
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let n: Node | null = walker.nextNode();
  while (n) {
    textNodes.push(n as Text);
    n = walker.nextNode();
  }

  // Заменяем каждый text node на fragment из span.rh-word + whitespace.
  // Глобальный счётчик слов задаёт --reveal-delay (stagger по порядку чтения).
  let wordIndex = 0;
  const DELAY_STEP = 35; // ms

  textNodes.forEach((tn) => {
    const text = tn.textContent ?? "";
    if (!text.trim()) return;
    const parent = tn.parentNode;
    if (!parent) return;

    const frag = document.createDocumentFragment();
    // Split, сохраняя пробелы как отдельные части (чтобы между span'ами
    // оставались нативные whitespace text nodes — line-break работает).
    const parts = text.split(/(\s+)/);
    parts.forEach((part) => {
      if (part.length === 0) return;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement("span");
        span.className = "rh-word";
        span.textContent = part;
        span.style.setProperty("--reveal-delay", `${wordIndex * DELAY_STEP}ms`);
        wordIndex += 1;
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  });
}

export default function ScrollReveal() {
  // useLayoutEffect (на клиенте) — wrapping слов происходит ДО первого
  // paint'а, поэтому браузер сразу видит обёрнутый DOM и нет двух разных
  // состояний layout (без span'ов → со span'ами), что давало бы CLS shift.
  // Раньше через useEffect wrapping происходил ПОСЛЕ первого paint'а, и
  // Lighthouse ловил это как layout shift на hero-секции (CLS 0.446).
  useIsoLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // ---- Section fade-up + h2 word-reveal -------------------------------
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main section")
    );
    const vh = window.innerHeight;
    const toReveal: HTMLElement[] = [];
    sections.forEach((s) => {
      const rect = s.getBoundingClientRect();
      // Hero (id="hero") обрабатывается отдельно ниже — пропускаем тут.
      if (s.id === "hero") return;
      // Секции уже в viewport — без fade-up'а и без heading-маски (иначе
      // мигнули бы).
      if (rect.top < vh && rect.bottom > 0) return;
      s.classList.add("reveal-section");
      toReveal.push(s);
    });

    // Word-split применяется на всех viewport'ах — пользователь хочет
    // эффект и на мобиле. CLS-проблема от rewrap'а решена переключением
    // на useLayoutEffect (см. выше). Безкомпозиторные слои Lighthouse
    // фиксирует, но их влияние на Performance score сейчас приоритет
    // ниже visual polish'а.
    toReveal.forEach((section) => {
      const headings = section.querySelectorAll<HTMLElement>("h2");
      headings.forEach((h) => wrapWordsInPlace(h));
    });

    // Таймеры на unwrap — храним чтобы зачистить при unmount.
    const unwrapTimers: number[] = [];

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
          // После того как маска отыграла — разворачиваем слова в plain text.
          // Освобождает Safari iOS от композиторных слоёв (см. unwrapWords).
          const target = e.target as HTMLElement;
          const t = window.setTimeout(() => {
            target
              .querySelectorAll<HTMLElement>("h2")
              .forEach(unwrapWords);
          }, REVEAL_SAFE_MS);
          unwrapTimers.push(t);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    toReveal.forEach((el) => io.observe(el));

    // ---- Hero H1 word-reveal --------------------------------------------
    // Тригер — body.intro-done (выставляется Preloader'ом после fade-out'а).
    // Здесь только оборачиваем слова в spans; саму анимацию запускает CSS
    // когда .intro-done доедет. После завершения reveal'а — unwrap.
    const heroH1 = document.querySelector<HTMLElement>("#hero h1");
    let bodyClassObserver: MutationObserver | null = null;
    if (heroH1) {
      wrapWordsInPlace(heroH1);
      const scheduleHeroUnwrap = () => {
        const t = window.setTimeout(() => {
          unwrapWords(heroH1);
        }, REVEAL_SAFE_MS);
        unwrapTimers.push(t);
      };
      if (document.body.classList.contains("intro-done")) {
        scheduleHeroUnwrap();
      } else {
        bodyClassObserver = new MutationObserver(() => {
          if (document.body.classList.contains("intro-done")) {
            bodyClassObserver?.disconnect();
            bodyClassObserver = null;
            scheduleHeroUnwrap();
          }
        });
        bodyClassObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    }

    return () => {
      io.disconnect();
      bodyClassObserver?.disconnect();
      unwrapTimers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return null;
}
