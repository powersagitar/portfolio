'use client';

import { useEffect, useRef } from 'react';

import { isPhone } from './math';
import { createRenderer } from './renderer';
import { type HomeInput, createHomeSim, createPostSim } from './simulation';
import type { CloudKey } from './types';

export type DotCloudProps =
  { variant: 'home'; cloudKey: CloudKey } | { variant: 'post' };

export default function DotCloud(props: DotCloudProps) {
  const { variant } = props;
  const cloudKey = props.variant === 'home' ? props.cloudKey : 'home';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read by the frame loop, so key changes never re-create the sim.
  const keyRef = useRef<CloudKey>(cloudKey);
  useEffect(() => {
    keyRef.current = cloudKey;
  }, [cloudKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = createRenderer(canvas);
    if (!renderer) return;
    const sim =
      variant === 'home'
        ? createHomeSim({ reduce })
        : createPostSim({ reduce });

    // One input object, mutated in place every frame.
    const input: HomeInput = {
      key: keyRef.current,
      now: 0,
      mx: 0,
      my: 0,
      W: 1,
      H: 1,
      dpr: 1,
      phone: false,
    };

    // Resizing clears the canvas, so it only happens inside a frame, right
    // before a draw: the ResizeObserver marks it dirty, and the frame also
    // checks devicePixelRatio (ResizeObserver misses DPR-only changes, e.g.
    // moving to another monitor).
    let dirty = true;
    let lastDpr = 0;
    const resize = () => {
      lastDpr = window.devicePixelRatio;
      const dpr = Math.min(lastDpr || 1, 2);
      input.dpr = dpr;
      input.W = Math.max(1, Math.round(canvas.clientWidth * dpr));
      input.H = Math.max(1, Math.round(canvas.clientHeight * dpr));
      input.phone = isPhone(canvas.clientWidth);
      renderer.resize(input.W, input.H);
      dirty = false;
    };
    const observer = new ResizeObserver(() => {
      dirty = true;
    });
    observer.observe(canvas);

    const onPointerMove = (e: PointerEvent) => {
      input.mx = e.clientX / window.innerWidth - 0.5;
      input.my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let raf = 0;
    // Set on context loss or any error: the cloud stays blank for good
    // rather than throwing every frame.
    let dead = false;
    const frame = (now: number) => {
      raf = 0;
      try {
        if (dirty || window.devicePixelRatio !== lastDpr) resize();
        input.now = now;
        input.key = keyRef.current;
        if (renderer.draw(sim.step(input))) raf = requestAnimationFrame(frame);
        else dead = true;
      } catch {
        dead = true;
      }
    };
    const start = () => {
      if (!raf && !dead) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    if (!document.hidden) start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      observer.disconnect();
      renderer.dispose();
    };
  }, [variant]);

  if (variant === 'post')
    return <canvas ref={canvasRef} className="cloud-post" aria-hidden="true" />;
  return (
    <div className="cloud-stage" aria-hidden="true">
      <canvas ref={canvasRef} className="cloud-home" aria-hidden="true" />
    </div>
  );
}
