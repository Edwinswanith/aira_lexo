"use client";

import { ArrowLeft, ArrowRight, MagnifyingGlassMinus, MagnifyingGlassPlus, X } from "@phosphor-icons/react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * "spin": a 360 turntable sequence (many frames, dragging turns the product).
 * "angles": a small set of real photos from different angles (dragging steps
 * between them, with thumbnails).
 */
export type SpinManifest = {
  mode: "spin" | "angles";
  frameCount: number;
  frames: string[];
  thumbs?: string[];
  alts?: string[];
  /** Per-frame label, e.g. whether the image is a real photo or AI-generated. */
  labels?: string[];
  hotspots: Array<Record<string, number[] | null | undefined>>;
};

export type SpinHotspot = { id: string; title: string; text: string; extra?: ReactNode };

const mod = (value: number, n: number) => ((value % n) + n) % n;

/**
 * Product viewer: drag or swipe sideways to change the view, use the arrow
 * keys or buttons, zoom in, and open feature hotspots placed on the photos.
 * Vertical swipes still scroll the page.
 */
export function SpinViewer({ manifest, hotspots, label }: { manifest: SpinManifest; hotspots: SpinHotspot[]; label: string }) {
  const count = manifest.frameCount;
  const isSpin = manifest.mode === "spin";
  const [frame, setFrame] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [active, setActive] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const [interacted, setInteracted] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; frame: number; lastX: number; lastT: number; velocity: number; moved: boolean } | null>(null);
  const animation = useRef<number | null>(null);
  const position = useRef(0);

  const show = useCallback((value: number) => {
    position.current = value;
    setFrame(mod(Math.round(value), count));
  }, [count]);

  const stopAnimation = () => {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
  };

  // Load every few frames first so the viewer responds at once, then the rest.
  useEffect(() => {
    let cancelled = false;
    const all = Array.from({ length: count }, (_, i) => i);
    const queue = [...all.filter((i) => i % 3 === 0), ...all.filter((i) => i % 3 !== 0)].filter((i) => i !== 0);
    const next = () => {
      const index = queue.shift();
      if (index === undefined || cancelled) return;
      const img = new Image();
      img.onload = img.onerror = () => {
        if (cancelled) return;
        setLoaded((current) => new Set(current).add(index));
        next();
      };
      img.src = manifest.frames[index];
    };
    for (let lane = 0; lane < 4; lane += 1) next();
    return () => { cancelled = true; };
  }, [count, manifest.frames]);

  // Show the nearest loaded frame so the image never goes blank.
  const visibleFrame = useMemo(() => {
    if (loaded.has(frame)) return frame;
    for (let step = 1; step < count; step += 1) {
      if (loaded.has(mod(frame - step, count))) return mod(frame - step, count);
      if (loaded.has(mod(frame + step, count))) return mod(frame + step, count);
    }
    return 0;
  }, [frame, loaded, count]);

  // A 360 sequence turns once on load to show that it rotates.
  useEffect(() => {
    if (!isSpin || interacted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (loaded.size < Math.ceil(count / 3)) return;
    let start: number | null = null;
    const step = (time: number) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / 2200);
      show((1 - Math.pow(1 - progress, 3)) * count);
      if (progress < 1) animation.current = requestAnimationFrame(step);
      else { show(0); setInteracted(true); }
    };
    const timer = window.setTimeout(() => { animation.current = requestAnimationFrame(step); }, 600);
    return () => { window.clearTimeout(timer); stopAnimation(); };
  }, [isSpin, interacted, loaded.size, count, show]);

  const goTo = (target: number) => {
    stopAnimation();
    setInteracted(true);
    if (!isSpin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { show(target); return; }
    const from = position.current;
    let delta = mod(target - from, count);
    if (delta > count / 2) delta -= count;
    let start: number | null = null;
    const step = (time: number) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / 500);
      show(from + delta * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) animation.current = requestAnimationFrame(step);
    };
    animation.current = requestAnimationFrame(step);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    stopAnimation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, frame: position.current, lastX: event.clientX, lastT: performance.now(), velocity: 0, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = stage.current?.getBoundingClientRect();
    if (zoom && rect) {
      setOrigin(`${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`);
      return;
    }
    if (!drag.current || !rect) return;
    const dx = event.clientX - drag.current.x;
    if (Math.abs(dx) > 4) { drag.current.moved = true; setInteracted(true); }
    // A 360 sequence turns once across the full width; angles step every fifth of the width.
    const framesPerPixel = isSpin ? count / rect.width : 5 / rect.width;
    show(drag.current.frame - dx * framesPerPixel);
    const now = performance.now();
    drag.current.velocity = (-(event.clientX - drag.current.lastX) * framesPerPixel) / Math.max(1, now - drag.current.lastT);
    drag.current.lastX = event.clientX;
    drag.current.lastT = now;
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    let velocity = drag.current.velocity * 16;
    drag.current = null;
    if (!isSpin || Math.abs(velocity) < 0.05 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const glide = () => {
      velocity *= 0.92;
      show(position.current + velocity);
      if (Math.abs(velocity) > 0.02) animation.current = requestAnimationFrame(glide);
    };
    animation.current = requestAnimationFrame(glide);
  };

  const step = (by: number) => { stopAnimation(); setInteracted(true); show(Math.round(position.current) + by); };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
  };

  // For each hotspot, the frame where it sits closest to the centre.
  const bestFrame = useMemo(() => Object.fromEntries(hotspots.map((spot) => {
    let best = 0;
    let score = Infinity;
    manifest.hotspots.forEach((positions, index) => {
      const point = positions[spot.id];
      if (point && Math.abs(point[0] - 50) < score) { score = Math.abs(point[0] - 50); best = index; }
    });
    return [spot.id, best];
  })), [hotspots, manifest.hotspots]);

  const openSpot = (id: string) => {
    setZoom(false);
    setActive(id);
    if (!manifest.hotspots[visibleFrame]?.[id]) goTo(bestFrame[id] ?? 0);
  };

  const activeSpot = hotspots.find((spot) => spot.id === active);
  const positions = manifest.hotspots[visibleFrame] || {};
  const stepSize = isSpin ? 3 : 1;

  return (
    <div className="spin">
      <div
        ref={stage}
        className={`spin-stage${zoom ? " is-zoomed" : ""}`}
        role="img"
        aria-label={`${label}. ${manifest.alts?.[visibleFrame] || ""}. Drag sideways or use the arrow keys to change the view.`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized frames swapped as the viewer turns */}
        <img
          className="spin-frame"
          src={manifest.frames[visibleFrame]}
          alt=""
          draggable={false}
          style={{ transform: zoom ? "scale(2)" : undefined, transformOrigin: origin }}
        />
        {!zoom && hotspots.map((spot) => {
          const point = positions[spot.id];
          if (!point) return null;
          return (
            <button
              key={spot.id}
              type="button"
              className={`spin-hotspot${active === spot.id ? " is-active" : ""}`}
              style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
              onClick={() => openSpot(spot.id)}
              aria-label={`Feature: ${spot.title}`}
            >
              <span aria-hidden="true" />
            </button>
          );
        })}
        {!interacted && <span className="spin-hint" aria-hidden="true">{isSpin ? "Drag to turn" : "Drag to see more angles"}</span>}
        <span className="concept-label">{manifest.labels?.[visibleFrame] || (isSpin ? "Real product, photographed on a turntable" : "Real product photo. Background edited.")}</span>
      </div>

      <div className="spin-controls">
        <button type="button" onClick={() => step(-stepSize)} aria-label="Previous view"><ArrowLeft size={18} /></button>
        <span className="spin-angle" aria-live="polite">{isSpin ? `${Math.round((frame / count) * 360)}°` : `${visibleFrame + 1} / ${count}`}</span>
        <button type="button" onClick={() => step(stepSize)} aria-label="Next view"><ArrowRight size={18} /></button>
        <button type="button" onClick={() => setZoom((value) => !value)} aria-pressed={zoom} aria-label={zoom ? "Zoom out" : "Zoom in"}>
          {zoom ? <MagnifyingGlassMinus size={18} /> : <MagnifyingGlassPlus size={18} />}
        </button>
      </div>

      {!isSpin && manifest.thumbs && (
        <div className="spin-thumbs" role="group" aria-label="Choose a view">
          {manifest.thumbs.map((thumb, index) => (
            <button key={thumb} type="button" aria-pressed={visibleFrame === index} aria-label={manifest.alts?.[index] || `View ${index + 1}`} onClick={() => goTo(index)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- small fixed thumbnails */}
              <img src={thumb} alt="" width={96} height={72} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="spin-features" role="group" aria-label="Product features">
        {hotspots.map((spot) => (
          <button key={spot.id} type="button" aria-pressed={active === spot.id} onClick={() => (active === spot.id ? setActive(null) : openSpot(spot.id))}>{spot.title}</button>
        ))}
      </div>

      {activeSpot && (
        <div className="spin-panel" role="region" aria-label={activeSpot.title}>
          <button type="button" className="spin-panel-close" onClick={() => setActive(null)} aria-label="Close feature"><X size={16} /></button>
          <h3>{activeSpot.title}</h3>
          <p>{activeSpot.text}</p>
          {activeSpot.extra}
        </div>
      )}
    </div>
  );
}
