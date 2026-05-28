"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type NavItem = { id: string; label: string };

// Labels lifted verbatim from the design file's sidebar (project/index.html
// .rail-nav). More descriptive than the earlier one-word shorthand.
const NAV: NavItem[] = [
  { id: "about", label: "About Awards" },
  { id: "awards", label: "Nominations" },
  { id: "people", label: "Speakers & Jury" },
  { id: "day", label: "Schedule & Tickets" },
  { id: "place", label: "Location & Venue" },
  { id: "partners", label: "Partners & Media" },
  { id: "contacts", label: "Contacts" },
];

export default function Sidebar() {
  const [active, setActive] = useState<string>("hero");
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    // Scroll-spy через rAF + direct bounds check, а не IntersectionObserver.
    // Старый подход с rootMargin "-40% 0px -55% 0px" создавал тонкую полосу
    // в ~5% viewport — при коротких секциях / быстром скролле она могла не
    // получить событие isIntersecting, и active state «застревал» на
    // предыдущей секции (типичный сюрприз для секции #day).
    //
    // Новый подход: на каждом scroll-tick'е находим секцию, верхняя граница
    // которой выше триггер-линии (35% от верха viewport'а), а нижняя — ниже.
    // Такая секция гарантированно ровно одна, никаких race condition'ов и
    // пропусков.
    const ids = ["hero", ...NAV.map((n) => n.id)];

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const triggerY = window.innerHeight * 0.35;
      let currentId = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerY && rect.bottom > triggerY) {
          currentId = id;
          break;
        }
      }
      setActive(currentId);
    };
    const onScroll = () => {
      if (rafId) return; // throttle to one update per frame
      rafId = window.requestAnimationFrame(update);
    };

    update(); // initial state
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`rail-toggle ${open ? "is-open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="rail-toggle-bar bar1" aria-hidden />
        <span className="rail-toggle-bar bar2" aria-hidden />
      </button>

      {/* Mobile backdrop — затемнение за компактным меню (bottom-right).
          Клик по нему закрывает меню. На десктопе display:none. */}
      <div
        className={`rail-backdrop ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside
        className={`rail ${open ? "rail--open" : ""}`}
        aria-label="Primary navigation"
      >
        <a className="rail-logo" href="#hero" aria-label="BWiGA home" onClick={() => setOpen(false)}>
          <Image
            src="/bwiga-logo-clean.svg"
            alt="BWiGA"
            width={220}
            height={64}
            priority
          />
        </a>

        <nav className="rail-nav">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`rail-link ${active === item.id ? "is-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Credits — Organized by + Made in CHIPSA. Replaces the old
            vertical "Adriatic '26" mark. */}
        <div className="rail-foot">
          <a
            className="rail-credit"
            href="https://leadvolume.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="rail-credit-label">Organized by</span>
            {/* Lead Volume mark — VP9 WebM (transparent alpha) instead of
                a GIF. 17 KB vs 120 KB, decode is hardware-accelerated, and
                the browser stops decoding when the tab is backgrounded.
                The wrapper still crops 20px off the left of the asset. */}
            <span className="rail-credit-logo-wrap">
              <video
                className="rail-credit-logo"
                src="/lead-volume.webm"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-label="Lead Volume"
              />
            </span>
          </a>

          <a
            className="rail-credit-chipsa"
            href="https://igaming.chipsa.design/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="rail-credit-label">Made in</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="rail-credit-chipsa-sign"
              src="/chipsa-sign.svg"
              alt=""
              aria-hidden
              loading="lazy"
            />
            <span className="rail-credit-chipsa-name">Chipsa</span>
          </a>
        </div>
      </aside>

      <style jsx>{`
        .rail {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--rail);
          /* Solid black — fully opaque, no blend with the page background.
             Also cheap to composite (no transparency, no blur). */
          background: #000;
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          padding: 28px 28px;
          z-index: 50;
        }
        .rail-logo {
          display: block;
          width: 100%;
          color: var(--paper-0);
          position: relative;
          isolation: isolate;
          padding: 6px 8px;
          /* Subtle radial halo behind the mark — soft ambient volume on
             the dark rail, matches the volumetric treatment on buttons. */
          background: radial-gradient(
            ellipse 95% 80% at 50% 35%,
            rgba(48, 131, 198, 0.16),
            transparent 75%
          );
          border-radius: 6px;
          transition: transform 350ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rail-logo :global(img) {
          width: 100%;
          height: auto;
          position: relative;
          z-index: 1;
        }
        .rail-logo:hover {
          transform: scale(1.05);
        }
        .rail-nav {
          margin-top: 64px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .rail-link {
          position: relative;
          font-family: var(--font-inter);
          /* Adaptive font — at narrow viewports rail is ~205px and the
             longer labels ("Schedule & Tickets", "Speakers & Jury") wrap
             at 18px. Scales back up to 18px on 1500px+ screens. */
          font-size: clamp(14px, 1.15vw, 18px);
          font-weight: 600;
          letter-spacing: 0.01em;
          color: var(--paper-2);
          padding: 8px 0 8px 16px;
          text-decoration: none;
          /* Stay on a single line; if a label is too long for the rail,
             prefer to ellipsis than to break to two lines. */
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          transition: color 220ms var(--ease-soft), padding-left 220ms var(--ease-soft);
        }
        .rail-link::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--paper-2);
          transform: translateY(-50%) scale(0.6);
          opacity: 0;
          transition: background 220ms var(--ease-soft),
            opacity 220ms var(--ease-soft),
            transform 220ms var(--ease-soft);
        }
        .rail-link:hover {
          color: var(--paper-0);
        }
        .rail-link.is-active {
          color: var(--bwiga-blue);
        }
        .rail-link.is-active::before {
          background: var(--bwiga-blue);
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
        /* Footer credits — Lead Volume (organizer) + Chipsa (design
           partner). Stacked at the bottom of the rail with generous gap
           between them. */
        .rail-foot {
          display: flex;
          flex-direction: column;
          gap: 36px;
          margin-top: 28px;
        }
        .rail-credit,
        .rail-credit-chipsa {
          text-decoration: none;
          color: inherit;
          display: flex;
        }
        .rail-credit {
          flex-direction: column;
          gap: 10px;
        }
        .rail-credit-label {
          font-family: var(--font-inter);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1;
        }
        /* Lead Volume GIF — wrapped so the asset's 20px left margin gets
           clipped. Image is ~6.667% wider than the wrap (320/300 ratio),
           pulled left by the matching margin so the visible 100% of the
           wrap maps to the cropped 300×46 region of the original GIF. */
        .rail-credit-logo-wrap {
          display: block;
          overflow: hidden;
          width: 100%;
          max-width: 190px;
        }
        .rail-credit-logo {
          display: block;
          width: calc(100% + 6.667%);
          margin-left: -6.667%;
          height: auto;
          opacity: 0.96;
          transition: opacity 220ms ease;
          /* Video elements default to filling their box — keep aspect ratio
             explicit from the source for early layout (matches 320×46 GIF). */
          aspect-ratio: 320 / 46;
        }
        .rail-credit:hover .rail-credit-logo {
          opacity: 1;
        }

        .rail-credit-chipsa {
          align-items: center;
          gap: 10px;
          font-family: var(--font-inter);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          transition: color 220ms ease;
        }
        .rail-credit-chipsa-sign {
          width: 32px;
          height: 18px;
          flex: 0 0 auto;
          /* Subtle desaturation at rest; full gradient on hover. */
          filter: grayscale(1) brightness(2) opacity(0.85);
          transition: filter 220ms ease;
        }
        .rail-credit-chipsa-name {
          color: inherit;
        }
        .rail-credit-chipsa:hover {
          color: var(--paper-0);
        }
        .rail-credit-chipsa:hover .rail-credit-chipsa-sign {
          filter: none;
        }

        /* Toggle (FAB) и backdrop — только мобильные, на десктопе скрыты. */
        .rail-toggle {
          display: none;
        }
        .rail-backdrop {
          display: none;
        }

        @media (max-width: 1023px) {
          /* ---- Toggle FAB: bottom-right, плоская, инверсия задника ----
             backdrop-filter: invert(1) инвертирует то, что отрендерено ЗА
             кнопкой (hero-видео), в пределах её скруглённого box'а. На ярком
             фоне читается как тёмная. Собственные дети (палочки) фильтром НЕ
             затрагиваются — остаются чисто белыми. В отличие от
             mix-blend-mode, backdrop-filter не страдает от изоляции
             stacking-контекста у fixed-элемента. Без градиента, без тени. */
          .rail-toggle {
            display: grid;
            place-items: center;
            position: fixed;
            right: 18px;
            bottom: 18px;
            width: 52px;
            height: 52px;
            padding: 0;
            border: 0;
            background: transparent;
            box-shadow: none;
            border-radius: 14px;
            cursor: pointer;
            z-index: 70;
            /* Полная инверсия фона. opacity(0.5) пробовали — давала плоский
               серый (полупрозрачность гасит инверсию), поэтому invert(1). */
            -webkit-backdrop-filter: invert(1);
            backdrop-filter: invert(1);
            transition: transform 200ms var(--ease-soft),
              background 360ms var(--ease-soft);
          }
          .rail-toggle:active {
            transform: scale(0.94);
          }
          /* Открыто: за кнопкой сплошной тёмный backdrop меню. Гасим фильтр
             и даём чуть-светлее-фона полупрозрачную заливку, чтобы кнопка
             слегка выделялась на тёмном (не сливалась). */
          .rail-toggle.is-open {
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
            background: rgba(255, 255, 255, 0.12);
          }
          /* Палочки толще (3px). mix-blend-mode: difference — блендятся
             против инвертированного тела кнопки, поэтому ВСЕГДА контрастят:
             на тёмном теле (яркий hero) выглядят белыми, на светлом теле
             (тёмный hero, где invert делает тело белым) становятся тёмными.
             Решает проблему «белые палочки на белом теле». */
          .rail-toggle-bar {
            position: absolute;
            z-index: 1;
            width: 24px;
            height: 3px;
            border-radius: 3px;
            background: #fff;
            mix-blend-mode: difference;
            transition: transform 400ms var(--ease-spring);
          }
          /* В открытом меню тело — предсказуемо тёмное (rgba white 0.12 на
             тёмном backdrop'е), обычные белые палочки читаются без блендинга. */
          .rail-toggle.is-open .rail-toggle-bar {
            mix-blend-mode: normal;
          }
          .rail-toggle-bar.bar1 {
            transform: translateY(-5px);
          }
          .rail-toggle-bar.bar2 {
            transform: translateY(5px);
          }
          .rail-toggle.is-open .rail-toggle-bar.bar1 {
            transform: rotate(45deg);
          }
          .rail-toggle.is-open .rail-toggle-bar.bar2 {
            transform: rotate(-45deg);
          }

          /* ---- Backdrop: ПОЛНОЕ затемнение (без прозрачности), fade-in ---- */
          .rail-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: #05070d;
            opacity: 0;
            pointer-events: none;
            transition: opacity 360ms var(--ease-soft);
            z-index: 55;
          }
          .rail-backdrop.is-open {
            opacity: 1;
            pointer-events: auto;
          }

          /* ---- Меню-панель: на весь экран, прозрачная. Контент разнесён
             по углам (logo top-left, nav bottom-right, credits bottom-left).
             Сама панель pointer-events:none — пустые зоны кликаются «сквозь»
             на backdrop (закрытие). Кликабельны только дети. ---- */
          .rail {
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: auto;
            height: auto;
            max-height: none;
            background: transparent;
            border: 0;
            border-right: 0;
            padding: 0;
            align-items: stretch;
            opacity: 0;
            transform: translateY(12px);
            pointer-events: none;
            transition: opacity 320ms var(--ease-soft),
              transform 320ms var(--ease-soft);
            z-index: 60;
          }
          .rail--open {
            opacity: 1;
            transform: translateY(0);
          }
          .rail--open .rail-logo,
          .rail--open .rail-nav,
          .rail--open .rail-foot {
            pointer-events: auto;
          }
          /* Разделительная линия между блоками (меню+кредиты, низ ~90px) и
             кнопкой внизу (верх ~70px). На 76px. Заметнее, чем раньше
             (0.1 → 0.22). Гаснет вместе с панелью (часть .rail). */
          .rail::after {
            content: "";
            position: absolute;
            left: 24px;
            right: 24px;
            bottom: 76px;
            height: 1px;
            background: rgba(255, 255, 255, 0.22);
          }

          /* Логотип BWiGA — сверху слева. */
          .rail-logo {
            display: block;
            position: absolute;
            top: 26px;
            left: 24px;
            width: auto;
            padding: 0;
            background: none;
          }
          .rail-logo :global(img) {
            width: 198px;
          }

          /* Nav: правый нижний угол (опущено ниже), мельче, со stagger'ом. */
          .rail-nav {
            position: absolute;
            right: 24px;
            bottom: 100px;
            margin-top: 0;
            flex: 0 0 auto;
            align-items: flex-end;
            gap: 2px;
          }
          .rail-link {
            font-size: 17px;
            padding: 9px 0;
            text-align: right;
            /* Чисто белые пункты. Активный остаётся синим — у
               .rail-link.is-active специфичность выше (0,2,0 vs 0,1,0). */
            color: #fff;
            opacity: 0;
            transform: translateX(14px);
            transition: opacity 300ms var(--ease-soft),
              transform 300ms var(--ease-soft),
              color 220ms var(--ease-soft);
          }
          .rail-link::before {
            display: none;
          }
          .rail--open .rail-link {
            opacity: 1;
            transform: translateX(0);
          }
          /* Stagger сверху вниз. Delay только при .rail--open — на закрытии
             селекторы не матчатся, всё гаснет разом (быстрый close). */
          .rail--open .rail-nav .rail-link:nth-child(1) {
            transition-delay: 80ms;
          }
          .rail--open .rail-nav .rail-link:nth-child(2) {
            transition-delay: 125ms;
          }
          .rail--open .rail-nav .rail-link:nth-child(3) {
            transition-delay: 170ms;
          }
          .rail--open .rail-nav .rail-link:nth-child(4) {
            transition-delay: 215ms;
          }
          .rail--open .rail-nav .rail-link:nth-child(5) {
            transition-delay: 260ms;
          }
          .rail--open .rail-nav .rail-link:nth-child(6) {
            transition-delay: 305ms;
          }
          .rail--open .rail-nav .rail-link:nth-child(7) {
            transition-delay: 350ms;
          }

          /* Кредиты (Lead Volume + Chipsa) — левый нижний угол. bottom: 90px
             (ниже, чем nav-anchor 100): у пунктов меню есть padding-bottom
             9px, который опускает текст «Contacts» относительно его бокса.
             Сдвиг кредитов вниз компенсирует это — низ CHIPSA встаёт на
             уровень текста «Contacts». gap 24px — больше воздуха между
             Lead Volume и Chipsa. */
          .rail-foot {
            position: absolute;
            left: 24px;
            bottom: 110px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
            margin-top: 0;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 300ms var(--ease-soft) 410ms,
              transform 300ms var(--ease-soft) 410ms;
          }
          .rail--open .rail-foot {
            opacity: 1;
            transform: translateY(0);
          }
          .rail-credit {
            align-items: flex-start;
            gap: 7px;
          }
          .rail-credit-label {
            font-size: 9.5px;
            letter-spacing: 0.16em;
          }
          .rail-credit-logo-wrap {
            max-width: 104px;
          }
          /* Chipsa — в две строки: "Made in" сверху, [знак] Chipsa снизу. */
          .rail-credit-chipsa {
            flex-wrap: wrap;
            gap: 6px 8px;
            font-size: 11px;
            letter-spacing: 0.12em;
          }
          .rail-credit-chipsa .rail-credit-label {
            flex-basis: 100%;
          }
          .rail-credit-chipsa-sign {
            width: 26px;
            height: 15px;
          }
        }
      `}</style>
    </>
  );
}
