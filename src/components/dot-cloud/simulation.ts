import {
  STAGE_MAX,
  TAU,
  dotAlpha,
  dotSize,
  easeRate,
  homeLayout,
  postLayout,
  projectInto,
} from './math';
import { SHAPES } from './registry';
import { mulberry32 } from './rng';
import { writeFrame, writing } from './shapes/writing';
import type {
  CloudKey,
  DotBatch,
  Layout,
  Overlay,
  OverlayCtx,
  OverlayFrame,
  Projected,
  ShapeBuild,
  ShapeDef,
} from './types';

export type HomeInput = {
  key: CloudKey;
  now: number;
  mx: number;
  my: number;
  W: number;
  H: number;
  dpr: number;
  phone: boolean;
};

export type PostInput = {
  now: number;
  mx: number;
  my: number;
  W: number;
  H: number;
  dpr: number;
};

export type SimFrame = { dots: DotBatch; overlays: OverlayFrame[] };

export type HomeSim = {
  step(i: HomeInput): SimFrame;
  state(): {
    cur: Float32Array;
    target: Float32Array;
    ry: number;
    homeBlend: number;
    overlayAlpha: Partial<Record<CloudKey, number>>;
    selectedAt: number;
  };
};

/** Post: seconds before the quill starts writing. */
const POST_DELAY = 0.3;

/** Default seed for the dot-cloud rng stream (any fixed value works). */
export const DEFAULT_SEED = 0x5eed;

function dotBatch(n: number): DotBatch {
  return {
    xy: new Float32Array(n * 2),
    size: new Float32Array(n),
    alpha: new Float32Array(n),
    count: n,
  };
}

/**
 * Mutable rotation + layout shared by the dots and overlays of one frame.
 * `into` projects into one reused object (no allocation); `project` is the
 * Projector handed to overlays and returns a fresh object per call.
 */
function camera() {
  let cy = 1;
  let sy = 0;
  let cx = 1;
  let sx = 0;
  let l: Layout = { ox: 0, oy: 0, sx: 1, sy: 1 };
  const o: Projected = { x: 0, y: 0, f: 1, z: 0, vx: 0, vy: 0 };
  return {
    set(ry: number, rx: number, layout: Layout) {
      cy = Math.cos(ry);
      sy = Math.sin(ry);
      cx = Math.cos(rx);
      sx = Math.sin(rx);
      l = layout;
    },
    into: (x: number, y: number, z: number) =>
      projectInto(o, x, y, z, cy, sy, cx, sx, l),
    project: (x: number, y: number, z: number): Projected =>
      projectInto(
        { x: 0, y: 0, f: 0, z: 0, vx: 0, vy: 0 },
        x,
        y,
        z,
        cy,
        sy,
        cx,
        sx,
        l,
      ),
  };
}

function fillDots(
  dots: DotBatch,
  pts: Float32Array,
  cam: ReturnType<typeof camera>,
  dpr: number,
  onHome: boolean,
) {
  for (let i = 0; i < dots.count; i++) {
    const j = i * 3;
    const p = cam.into(pts[j], pts[j + 1], pts[j + 2]);
    dots.xy[i * 2] = p.x;
    dots.xy[i * 2 + 1] = p.y;
    dots.size[i] = dotSize(p.f, dpr);
    dots.alpha[i] = dotAlpha(p.z, onHome);
  }
}

/**
 * Main:383-423. Rng order (one mulberry32 stream): every shape's build in
 * `shapes` key order, then per coordinate drift phase/frequency (Main:263),
 * then per-point morph rates (Main:328).
 */
export function createHomeSim(o: {
  reduce: boolean;
  n?: number;
  seed?: number;
  shapes?: Record<CloudKey, ShapeDef>;
}): HomeSim {
  const { reduce } = o;
  const n = o.n ?? 1200;
  const shapes = o.shapes ?? SHAPES;
  const r = mulberry32(o.seed ?? DEFAULT_SEED);
  const keys = Object.keys(shapes) as CloudKey[];

  const built = {} as Record<CloudKey, ShapeBuild>;
  for (const k of keys) built[k] = shapes[k].build(n, r);
  const ph = new Float32Array(n * 3);
  const fq = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) {
    ph[i] = r() * TAU;
    fq[i] = 0.12 + r() * 0.3;
  }
  const spd = new Float32Array(n);
  for (let i = 0; i < n; i++) spd[i] = 0.035 + r() * 0.06;
  const rate = new Float32Array(n);

  const overlays: [CloudKey, Overlay][] = [];
  const overlayAlpha: Partial<Record<CloudKey, number>> = {};
  for (const k of keys) {
    const ov = shapes[k].overlay?.(built[k]);
    if (ov) {
      overlays.push([k, ov]);
      overlayAlpha[k] = 0;
    }
  }

  const cur = new Float32Array(n * 3);
  const target = new Float32Array(n * 3);
  const dots = dotBatch(n);
  const out: OverlayFrame[] = [];
  const frame: SimFrame = { dots, overlays: out };
  const cam = camera();
  const ctx: OverlayCtx = {
    project: cam.project,
    t: 0,
    alpha: 0,
    reduce,
    dpr: 1,
  };

  let started = false;
  let t0 = 0;
  let last = 0;
  let prevKey: CloudKey | null = null;
  let selectedAt = 0;
  let ry = 0.6;
  let homeBlend = 0;

  return {
    step(i) {
      const { key, now } = i;
      const shape = shapes[key];
      const b = built[key];
      const isHome = key === 'home';
      if (!started) {
        t0 = now;
        last = now;
      }
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (key !== prevKey) {
        prevKey = key;
        selectedAt = now;
      }

      // target: animated frame or the built points, plus home drift; rates
      // default to each point's own, an animated shape may override them
      rate.set(spd);
      if (shape.animate)
        shape.animate(b, target, (now - selectedAt) / 1000, reduce, rate);
      else target.set(b.points);
      if (isHome && !reduce) {
        const amp = 0.18;
        for (let j = 0; j < n * 3; j++)
          target[j] += Math.sin(t * fq[j] + ph[j]) * amp;
      }

      // morph
      if (!started || reduce) cur.set(target);
      else
        for (let p = 0; p < n; p++) {
          const k = easeRate(rate[p], dt);
          const j = p * 3;
          cur[j] += (target[j] - cur[j]) * k;
          cur[j + 1] += (target[j + 1] - cur[j + 1]) * k;
          cur[j + 2] += (target[j + 2] - cur[j + 2]) * k;
        }

      // view
      if (reduce) ry = 0.6;
      else if (shape.view.kind === 'spin') ry += dt * shape.view.rate;
      else {
        const goal =
          Math.round((ry - 0.35) / TAU) * TAU + 0.35 + 0.18 * Math.sin(t * 0.5);
        ry += (goal - ry) * easeRate(0.04, dt);
      }

      // blends (snap on the first frame)
      const h = isHome ? 1 : 0;
      homeBlend =
        !started || reduce
          ? h
          : homeBlend + (h - homeBlend) * easeRate(0.05, dt);
      for (const [k] of overlays) {
        const g = k === key ? 1 : 0;
        const a = overlayAlpha[k] as number;
        overlayAlpha[k] = started ? a + (g - a) * easeRate(0.06, dt) : g;
      }
      started = true;

      cam.set(
        ry + i.mx * 0.6,
        shape.tilt + i.my * 0.3,
        homeLayout(i.W, i.H, i.phone, homeBlend, STAGE_MAX * i.dpr),
      );
      fillDots(dots, cur, cam, i.dpr, isHome);

      out.length = 0;
      ctx.t = t;
      ctx.dpr = i.dpr;
      for (const [k, ov] of overlays) {
        const a = overlayAlpha[k] as number;
        if (a <= 0.01) continue;
        ctx.alpha = a;
        out.push(ov.frame(ctx));
      }
      return frame;
    },
    state: () => ({ cur, target, ry, homeBlend, overlayAlpha, selectedAt }),
  };
}

/**
 * Post:79-207. The quill writes once from the first step (after a short
 * delay); dots ease toward the frame as on home, so ink flies onto the line.
 */
export function createPostSim(o: {
  reduce: boolean;
  n?: number;
  seed?: number;
}): { step(i: PostInput): SimFrame } {
  const { reduce } = o;
  const n = o.n ?? 900;
  const r = mulberry32(o.seed ?? DEFAULT_SEED);
  const b = writing.build(n, r);
  const spd = new Float32Array(n);
  for (let i = 0; i < n; i++) spd[i] = 0.035 + r() * 0.06;
  const rate = new Float32Array(n);
  const target = new Float32Array(n * 3);
  const cur = new Float32Array(n * 3);
  const dots = dotBatch(n);
  const frame: SimFrame = { dots, overlays: [] };
  const cam = camera();
  let t0: number | null = null;
  let last = 0;

  return {
    step(i) {
      const first = t0 === null;
      if (t0 === null) t0 = i.now;
      const t = (i.now - t0) / 1000;
      const dt = Math.min(0.05, (i.now - last) / 1000);
      last = i.now;
      rate.set(spd);
      writeFrame(b, target, t - POST_DELAY, reduce, rate);
      if (first || reduce) cur.set(target);
      else
        for (let p = 0; p < n; p++) {
          const k = easeRate(rate[p], dt);
          const j = p * 3;
          cur[j] += (target[j] - cur[j]) * k;
          cur[j + 1] += (target[j + 1] - cur[j + 1]) * k;
          cur[j + 2] += (target[j + 2] - cur[j + 2]) * k;
        }
      const ry = (reduce ? 0.6 : Math.sin(t * 0.3) * 0.5) + i.mx * 0.6;
      cam.set(ry, -0.25 + i.my * 0.3, postLayout(i.W, i.H));
      fillDots(dots, cur, cam, i.dpr, false);
      return frame;
    },
  };
}
