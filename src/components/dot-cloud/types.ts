import type { SectionId } from '@/lib/sections';

/** `home` (nothing open) plus one key per section in `SECTIONS`. */
export type CloudKey = 'home' | SectionId;

export type Rng = () => number;

/**
 * What a shape's `build` returns. A shape that needs more per-build data
 * (Writing's ink, About's network) extends this with its own type and
 * declares it as `ShapeDef<ItsBuild>`; the shared type never grows.
 */
export type ShapeBuild = { points: Float32Array };

export type ViewMode = { kind: 'spin'; rate: number } | { kind: 'settle' };

export type Projected = {
  x: number;
  y: number;
  f: number;
  z: number;
  vx: number;
  vy: number;
};

export type Projector = (x: number, y: number, z: number) => Projected;

export type Layout = { ox: number; oy: number; sx: number; sy: number };

export type DotBatch = {
  xy: Float32Array;
  size: Float32Array;
  alpha: Float32Array;
  count: number;
};

export type LineBatch = {
  segments: Float32Array;
  count: number;
  alpha: number;
  width: number;
};

export type OverlayFrame = { lines: LineBatch[]; dots: DotBatch };

export type OverlayCtx = {
  project: Projector;
  t: number;
  alpha: number;
  reduce: boolean;
  dpr: number;
};

export type Overlay = { frame: (ctx: OverlayCtx) => OverlayFrame };

/**
 * `B` is the shape's own build type: `animate` and `overlay` receive what
 * this shape's `build` returned, typed as such. They are method signatures
 * so a `ShapeDef<WritingBuild>` is still a `ShapeDef`: the sim only ever
 * passes a shape's own build back to it.
 */
export type ShapeDef<B extends ShapeBuild = ShapeBuild> = {
  id: CloudKey;
  build: (n: number, rng: Rng) => B;
  view: ViewMode;
  tilt: number;
  animate?(
    b: B,
    out: Float32Array,
    tSinceSelected: number,
    reduce: boolean,
    /**
     * Per-point morph rate per 60 fps frame, prefilled with each point's
     * default; animate may override entries (1 = snap to target).
     */
    rate?: Float32Array,
  ): Float32Array;
  overlay?(b: B): Overlay;
};
