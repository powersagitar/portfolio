import type { SectionId } from '@/lib/sections';

/** `home` (nothing open) plus one key per section in `SECTIONS`. */
export type CloudKey = 'home' | SectionId;

export type Rng = () => number;

export type Network = {
  nodes: [number, number, number][];
  edges: [number, number, number][];
  depth: number;
};

export type ShapeBuild = {
  points: Float32Array;
  inkU?: Float32Array;
  /** Writing: per point, the quill point unwritten ink rides on. */
  inkAnchor?: Int32Array;
  net?: Network;
};

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

export type ShapeDef = {
  id: CloudKey;
  build: (n: number, rng: Rng) => ShapeBuild;
  view: ViewMode;
  tilt: number;
  animate?: (
    b: ShapeBuild,
    out: Float32Array,
    tSinceSelected: number,
    reduce: boolean,
    /**
     * Per-point morph rate per 60 fps frame, prefilled with each point's
     * default; animate may override entries (1 = snap to target).
     */
    rate?: Float32Array,
  ) => Float32Array;
  overlay?: (b: ShapeBuild) => Overlay;
};
