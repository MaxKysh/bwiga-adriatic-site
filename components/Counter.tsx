"use client";

import { useEffect, useRef, useState } from "react";

// -----------------------------------------------------------------------------
// Counter — «слот-машинный» rolling-digit reveal.
//
// Каждая цифра в значении — это окошко высотой 1em с overflow: hidden,
// внутри которого вертикально лежат span'ы 0-9. translateY на полоске
// прокручивает её до нужной цифры. Stagger между цифрами создаёт эффект
// «слева направо щёлкают табло».
//
// Не-цифровые символы ("+", "−") рендерятся статично, inline на baseline.
// Если нужен <sup> — оборачивайте Counter снаружи (Counter handles только
// digit-roll).
//
// Триггер — собственный IntersectionObserver. Срабатывает один раз при
// первом попадании во viewport. prefers-reduced-motion: сразу финальное
// значение без анимации.
// -----------------------------------------------------------------------------

interface CounterProps {
  value: string;
  /** Per-digit stagger delay in ms. Default 80. */
  step?: number;
  /** Roll duration per digit in ms. Default 1200. */
  duration?: number;
  /** Глобальная задержка перед стартом всего счётчика, ms. Используется
   *  для каскада нескольких счётчиков в блоке (i*220ms на каждый). */
  delay?: number;
  className?: string;
}

// Каждая цифра прокатывается ровно ROLL_OFFSET позиций перед остановкой
// на target. Это нужно чтобы нули (target=0) тоже анимировались — иначе
// они бы стартовали и оставались на 0 без движения. Для 0 теперь start=3,
// прокат 3→4→5→6→7→8→9→0 (7 позиций). Для 9 start=2, прокат 2→...→9.
// Strip имеет 2 цикла 0-9 (20 цифр) чтобы хватило места на проход через
// «обнуление» (для маленьких target вроде 0/1).
const ROLL_OFFSET = 7;
const STRIP_CYCLES = 2;

export default function Counter({
  value,
  step = 80,
  duration = 1200,
  delay = 0,
  className = "",
}: CounterProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(true);
      return;
    }
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          // setTimeout с delay — для каскадной активации нескольких счётчиков
          // в одном блоке (i*220ms). При delay=0 вызывается сразу.
          if (delay > 0) {
            timerRef.current = window.setTimeout(() => setActive(true), delay);
          } else {
            setActive(true);
          }
        });
      },
      { threshold: 0.4, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [delay]);

  let digitIdx = 0;
  const chars = value.split("");

  return (
    <span
      ref={rootRef}
      className={`counter ${active ? "is-in" : ""} ${className}`}
      style={
        {
          ["--counter-duration" as string]: `${duration}ms`,
        } as React.CSSProperties
      }
    >
      {chars.map((ch, i) => {
        if (/\d/.test(ch)) {
          const d = digitIdx++;
          const target = parseInt(ch, 10);
          // Конечная позиция в strip'е: цель во ВТОРОМ цикле, чтобы
          // оставалось куда «откатиться назад» от целевой цифры.
          const end = 10 + target;
          const start = end - ROLL_OFFSET;
          return (
            <span key={i} className="counter-digit" aria-hidden>
              <span
                className="counter-strip"
                style={
                  {
                    ["--start" as string]: start,
                    ["--end" as string]: end,
                    ["--delay" as string]: `${d * step}ms`,
                  } as React.CSSProperties
                }
              >
                {Array.from(
                  { length: STRIP_CYCLES * 10 },
                  (_, n) => (
                    <span key={n}>{n % 10}</span>
                  )
                )}
              </span>
            </span>
          );
        }
        return (
          <span key={i} className="counter-static" aria-hidden>
            {ch}
          </span>
        );
      })}
      {/* Accessible label — скринридеры читают финальное значение,
          а не «0123456789...» из полосок. */}
      <span className="counter-sr">{value}</span>
    </span>
  );
}
