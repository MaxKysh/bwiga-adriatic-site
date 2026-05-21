"use client";

import { useEffect } from "react";

type Props = {
  videoId: string | null;
  onClose: () => void;
};

export default function YouTubeModal({ videoId, onClose }: Props) {
  const open = Boolean(videoId);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;

  return (
    <div
      className="yt-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Video player"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="yt-frame">
        <button type="button" className="yt-close" onClick={onClose} aria-label="Close video">
          Close
        </button>
        <iframe
          src={src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          title="BWiGA past edition recap"
        />
      </div>

      <style jsx>{`
        .yt-modal {
          position: fixed;
          inset: 0;
          background: rgba(5, 7, 13, 0.88);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
        }
        .yt-frame {
          position: relative;
          width: min(1100px, 100%);
          aspect-ratio: 16 / 9;
          background: #000;
          border: 1px solid var(--hairline-strong);
        }
        .yt-frame :global(iframe) {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
        .yt-close {
          position: absolute;
          top: -42px;
          right: 0;
          color: var(--paper-0);
          background: transparent;
          border: 0;
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .yt-close::before {
          content: "";
          display: inline-block;
          width: 18px;
          height: 1px;
          background: currentColor;
        }
      `}</style>
    </div>
  );
}
