"use client";

import { ArrowClockwise, ArrowCounterClockwise, MagnifyingGlassMinus, MagnifyingGlassPlus, X } from "@phosphor-icons/react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SpinManifest = {
  placeholder: boolean;
  frameCount: number;
  pattern: string;
  hotspots: Array<Record<string, number[] | null>>;
};

export type SpinHotspot = { id: string; title: string; text: string; extra?: ReactNode };

const frameSrc = (pattern: string, index: number) => pattern.replace("{index}", String(index).padStart(2, "0"));
const mod = (value: number, n: number) => ((value % n) + n) % n;

/**
 * A photo-sequence 360 viewer. Drag or swipe sideways to turn the product,
 * use the arrow keys or buttons, zoom in, and open feature hotspots that
 * follow the product as it turns. Vertical swipes still scroll the page.
 */
export function SpinViewer({ manifest, hotspots, label }: { manifest: SpinManifest; hotspots: SpinHotspot[]; label: string }) {
  const count = manifest.frameCount;
  const [frame, setFrame] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [active, setActive] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const [interacted, setInteracted] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; frame: number; lastX: number; lastT: number; velocity: number } | null>(null);
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

  // Load a few evenly spaced frames first so turning works at once, then the rest.
  useEffect(() => {
    let cancelled = false;
    const order = [...Array.from({ length: count }, (_, i) => i).filter((i) => i % 3 === 0), ...Array.from({ length: count }, (_, i) => i).filter((i) => i % 3 !== 0)];
    const queue = order.filter((i) => i !== 0);
    const next = () => {
      const index = queue.shift();
      if (index === undefined || cancelled) return;
      const img = new Image();
      img.onload = img.onerror = () => {
        if (cancelled) return;
        setLoaded((current) => new Set(current).add(index));
        next();
      };
      img.src = frameSrc(manifest.pattern, index);
    };
    for (let lane = 0; lane < 4; lane += 1) next();
    return () => { cancelled = true; };
  }, [count, manifest.pattern]);

  // Show the nearest frame that has loaded, so the image never goes blank.
  const visibleFrame = useMemo(() => {
    if (loaded.has(frame)) return frame;
    for (let step = 1; step < count; step += 1) {
      if (loaded.has(mod(frame - step, count))) return mod(frame - step, count);
      if (loaded.has(mod(frame + step, count))) return mod(frame + step, count);
    }
    return 0;
  }, [frame, loaded, count]);

  // One gentle turn to show that the product rotates, unless motion is reduced.
  useEffect(() => {
    if (interacted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (loaded.size < Math.ceil(count / 3)) return;
    let start: number | null = null;
    const step = (time: number) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / 2200);
      const eased = 1 - Math.pow(1 - progress, 3);
      show(eased * count);
      if (progress < 1) animation.current = requestAnimationFrame(step);
      else { show(0); setInteracted(true); }
    };
    const timer = window.setTimeout(() => { animation.current = requestAnimationFrame(step); }, 600);
    return () => { window.clearTimeout(timer); stopAnimation(); };
  }, [interacted, loaded.size, count, show]);

  const animateTo = (target: number) => {
    stopAnimation();
    setInteracted(true);
    const from = position.current;
    let delta = mod(target - from, count);
    if (delta > count / 2) delta -= count;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { show(from + delta); return; }
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
    setInteracted(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, frame: position.current, lastX: event.clientX, lastT: performance.now(), velocity: 0 };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = stage.current?.getBoundingClientRect();
    if (zoom && rect) {
      setOrigin(`${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`);
      return;
    }
    if (!drag.current || !rect) return;
    // Dragging across the full width turns the product once.
    const framesPerPixel = count / rect.width;
    show(drag.current.frame - (event.clientX - drag.current.x) * framesPerPixel);
    const now = performance.now();
    const dt = Math.max(1, now - drag.current.lastT);
    drag.current.velocity = (-(event.clientX - drag.current.lastX) * framesPerPixel) / dt;
    drag.current.lastX = event.clientX;
    drag.current.lastT = now;
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    let velocity = drag.current.velocity * 16;
    drag.current = null;
    if (Math.abs(velocity) < 0.05 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const glide = () => {
      velocity *= 0.92;
      show(position.current + velocity);
      if (Math.abs(velocity) > 0.02) animation.current = requestAnimationFrame(glide);
    };
    animation.current = requestAnimationFrame(glide);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") { event.preventDefault(); stopAnimation(); setInteracted(true); show(position.current + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); stopAnimation(); setInteracted(true); show(position.current - 1); }
  };

  // For each hotspot, the frame where it faces the viewer most directly.
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
    animateTo(bestFrame[id] ?? 0);
  };

  const activeSpot = hotspots.find((spot) => spot.id === active);
  const positions = manifest.hotspots[visibleFrame] || {};

  return (
    <div className="spin">
      <div
        ref={stage}
        className={`spin-stage${zoom ? " is-zoomed" : ""}`}
        role="img"
        aria-label={`${label}. Drag sideways or use the arrow keys to turn it.`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- frames are pre-sized files swapped many times a second */}
        <img
          className="spin-frame"
          src={frameSrc(manifest.pattern, visibleFrame)}
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
        {!interacted && <span className="spin-hint" aria-hidden="true">Drag to turn</span>}
        <span className="concept-label">{manifest.placeholder ? "Placeholder 360 view. Real product photos coming." : "Product photography"}</span>
      </div>

      <div className="spin-controls">
        <button type="button" onClick={() => { stopAnimation(); setInteracted(true); show(position.current - 3); }} aria-label="Turn left"><ArrowCounterClockwise size={18} /></button>
        <span className="spin-angle" aria-live="polite">{Math.round((frame / count) * 360)}°</span>
        <button type="button" onClick={() => { stopAnimation(); setInteracted(true); show(position.current + 3); }} aria-label="Turn right"><ArrowClockwise size={18} /></button>
        <button type="button" onClick={() => setZoom((value) => !value)} aria-pressed={zoom} aria-label={zoom ? "Zoom out" : "Zoom in"}>
          {zoom ? <MagnifyingGlassMinus size={18} /> : <MagnifyingGlassPlus size={18} />}
        </button>
      </div>

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
