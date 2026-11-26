# Dot clouds: first principles

Written for whoever adds the next project's cloud. The cloud is 1200 points (the
default `n` in `createHomeSim`) that morph between shapes as the visitor moves
through the index on the home page. All code lives in
`src/components/dot-cloud/`.

Layering: shapes (`shapes/*.ts`) and overlays (`overlays/*.ts`) are pure data
builders. `simulation.ts` (`createHomeSim`, `createPostSim`) is pure too: it
takes time and input and returns `SimFrame` batches. `renderer.ts` is a thin
three.js layer that draws those batches, and `DotCloud.tsx` wires it to the
page. You almost never touch the last two when adding a cloud.

## 1. Unit space

Shapes live in a box of roughly x ±1.5, y ±1.05, z ±1. **+y is down**, as on a
screen: a quill tip at the bottom has a positive y. As a guideline, keep a shape
within about ±0.9 so it survives rotation (home spins continuously, the post sim
swings `ry` by ±0.5 rad, and the mouse adds parallax) and perspective without
leaving the frame. Several shapes deliberately exceed it: `home.ts` dust fills
the whole box, `about.ts` nodes span x ±1.1, the quill in `writing.ts` reaches
(1.35, -0.7) and its signature starts at x -1.31, `mssg.ts` slabs reach y ±1.01
and x ±0.81, and `badge.ts` runs from y 1.08 (board bottom) to -1.3 (lanyard
top). Check any such shape at phone size and while rotating.

`math.ts` maps unit space to pixels (`projectInto`, `makeProjector`). With yaw
`ry` and pitch `rx`:

```
x1 = x*cos(ry) + z*sin(ry)
z1 = -x*sin(ry) + z*cos(ry)
y1 = y*cos(rx) - z1*sin(rx)
z2 = y*sin(rx) + z1*cos(rx)
f  = 3 / (3 + z2)                 // perspective factor
sx = ox + x1 * f * Layout.sx      // screen x
sy = oy + y1 * f * Layout.sy      // screen y
```

`Layout` (`{ ox, oy, sx, sy }`) comes from `homeLayout` (shape on the right on
desktop, above the text at `isPhone`, width at most 700 CSS px; blended to
full-viewport dust on home) or `postLayout`. Each `ShapeDef` has a `tilt`, the
pitch `rx` it is viewed with (mostly `-0.2`).

## 2. Point budget and index identity

Every shape gets exactly `n` points: `build(n, rng)` returns a `Float32Array` of
`n * 3` (use `make(n, fn)` from `shapes/make.ts`, which calls `fn(i)` in index
order). Points are identities: point `i` is the same dot in every shape, so the
morph moves dot `i` from where it was in the old shape to where it is in the new
one. Allocate index ranges or residues to parts, so each part keeps a stable set
of dots, and divide by area or length so density reads as even.

- Range split, `badge.ts`: `i < n * 0.82` is the board, the other 18% is the
  lanyard. `contact.ts` does `ME = floor(n * 0.62)` for the Earth, rest orbits.
- Residue split, `howto.ts`: `i % 3` picks one of three strokes (chevron arm,
  chevron arm, underscore). `mssg.ts`: `i % 4` picks one of four slabs.
- Mixed, `writing.ts` (the quill): `i % 20` is `< 2` shaft, `< 8` barbs, `8`
  down, else ink. Ink points also record their path parameter in `inkU` and a
  random quill point to ride on in `inkAnchor`, both on its own `WritingBuild`.
- Ranges plus residue, `about.ts`: the first `nodes.length * NP` points are
  22-point balls per node, the rest cycle through
  `edges[(i - ...) % edges.length]`.

## 3. Sampling recipes

All use the `Rng` (`() => number` in [0, 1)) passed to `build`, never
`Math.random`.

- **Uniform volume** (home dust, badge board): each axis
  `(r() * 2 - 1) * halfExtent`. Thin depth is a small half extent (`0.025` on
  the board).
- **Surface, Fibonacci sphere** (Earth in `contact.ts`):
  `y = 1 - 2(i + 0.5)/ME`, `q = sqrt(1 - y*y)`, `th = i * 2.39996` (the golden
  angle), point `(cos th * q, y, sin th * q) * RE`. Even coverage without
  clumps, and deterministic with no rng.
- **Ball clusters** (network nodes in `about.ts`): a uniform direction
  (`u = r()*2-1`, `th = r()*TAU`, `q = sqrt(1-u*u)`) times radius
  `rad * cbrt(r())`. The cube root makes density uniform through the ball;
  without it points pile up at the centre.
- **Line segments** (`howto.ts` prompt, badge lanyard, network edges):
  `A + (B - A) * r()`. Jitter is optional: only `howto.ts` adds it, a small
  `(r() - 0.5) * 0.08` wobble plus z thickness so the stroke has body. The
  lanyard and the network edges are pure lerps.
- **Layered planes** (`mssg.ts`): `i % 4` picks a slab, each a uniform rectangle
  offset in x, y and z by its layer index.
- **Parametric curves** (orbits in `shapes/orbit.ts`, re-exported by
  `contact.ts`): `orbit(plane, u)` returns a tilted circle (`ORBIT.INC` radians)
  rotated about y per plane, with `u` from `r() * TAU`.
- **Splines with an arc-length table** (the quill's ink in `shapes/pen.ts`):
  `buildPen()` runs a Catmull-Rom spline through control points and builds a
  cumulative length table (`PenLut.L`), so `penAt(u)` returns the point at
  fraction `u` of the _length_, not of the parameter. Uniform `u` then gives
  uniform density along the curve. The "MD" signature is one stroke (no pen-up
  gaps) that ends exactly at the quill's nib (`NIB`).

## 4. Silhouette first

A cloud must read as its subject at a glance, and that comes mostly from the 2D
outline. Design the outline first, then add depth. Thin z spread adds volume
without blurring the silhouette: `howto.ts` uses `±0.16` of z on strokes only
`0.08` wide in x/y, the badge `±0.025`. Check each new shape three ways: while
it spins (`view: spin`), at phone size (narrow window, `isPhone`), and with
reduced motion, which fixes `ry = 0.6`. A shape that only works edge-on will
look wrong in the last case.

## 5. Depth and density

Perspective gives each dot a size from `f` (`dotSize(f, dpr) = (0.9 + f) * dpr`)
and depth gives it an alpha (`dotAlpha(z, onHome)`: `(1.2 - z) / 2` clamped to
[0.12, 1], times 0.6 on home). Near dots are bigger and brighter, which is what
sells the 3D. What breaks it is uneven density: a part with twice the points per
unit area looks twice as bright and reads as a different object. Near-uniform
density matters more than the point count, so spend your budget (section 2)
proportional to area or length.

## 6. Motion and meaning

**View modes** (`ShapeDef.view`, type `ViewMode`):

- `{ kind: 'spin', rate }`: yaw advances continuously. Rates range from `0.02`
  (home) to `0.2` (badge, howto, mssg, spaces).
- `{ kind: 'settle' }`: yaw eases to the nearest turn of `0.35` rad plus a slow
  sway, so the shape stays facing the reader (`about`, `writing`).

**Overlays** (`ShapeDef.overlay`, type `Overlay`) draw things points cannot:
edges, links, signals. Earn one only when the subject is a structure rather than
a silhouette: `about` has `networkOverlay` (edges plus forward-pass pulses),
`contact` has `constellationOverlay` (laser mesh, satellites, one routed
message; it uses `occluded` to hide what is behind the globe). Keep overlays
sparse and faint (edges at alpha `0.14`-`0.16`), preallocate every buffer in the
`overlay(build)` factory, and respect `OverlayCtx.reduce` (no pulses, no message
dot) and the fade `alpha`, which the sim eases in and out as the shape is
selected.

**Animated targets** (`ShapeDef.animate`) are for time-varying shapes. The sim
calls `animate(build, out, tSinceSelected, reduce, rate)` each frame and uses
`out` as the target; `rate` holds each point's morph rate (per 60 fps frame) and
an animation may override entries (`1` snaps). The quill (`writing.ts`, via
`writeFrame`) stores each ink point's path parameter in `inkU`. With `p` the
eased writing progress (3 s, after 0.35 s on home and 0.3 s on posts), written
ink (`inkU[i] <= p`) sits at `penAt(inkU[i])` and snaps there; unwritten ink
rides on its `inkAnchor` quill point and, within `0.08` of the nib, slides down
into it at a fast rate. With `reduce`, `p = 1`: already finished. Selecting the
shape again resets `tSinceSelected`, so it writes again from the start.

**Reduced motion** (`prefers-reduced-motion: reduce`): no drift, `ry` fixed at
`0.6`, instant morphs, no pulses, no message dot, writing finished.

## 7. Determinism and performance

- Seeded `rng`: `mulberry32(seed)` in `rng.ts`, seeded with `DEFAULT_SEED`.
  Never use `Math.random` in a shape; the same seed must give the same cloud
  (`shapes.test.ts` builds each shape twice with the same seed).
- Build once: `createHomeSim` calls every `build` up front. `animate` and the
  overlay `frame` functions run every frame, so keep them cheap.
- No per-point allocation per frame: write into the buffers passed in (`out`,
  the overlay's preallocated `Float32Array`s, `penInto` instead of `penAt`). A
  few small objects per frame (the layout, one `Projected` per `project` call)
  are accepted; per-point arrays are not.
- The renderer uses premultiplied alpha (three's default for the canvas), so dot
  colour and alpha are written as the shader expects. Do not flip
  `premultipliedAlpha` without checking dim dots against the black page.

## 8. Checklist: adding a cloud

1. Create `shapes/<id>.ts` exporting a `ShapeDef` (`id`, `build`, `view`,
   `tilt`, optionally `animate` and `overlay`). Use `make`. Reference the design
   source line in a comment as the others do. If `animate` or `overlay` needs
   more than `points`, define the shape's own build type (`ShapeBuild & {…}`,
   like `WritingBuild` or `NetBuild`) and export a `ShapeDef<ThatBuild>`; do not
   add fields to the shared `ShapeBuild`.
2. Add the section (`id`, `title`, `meta`) to `SECTIONS` in
   `src/lib/sections.ts`, in display order. `CloudKey` derives from it, and
   TypeScript then fails until `SHAPES` in `registry.ts` and the `extras` record
   in `src/components/home/IndexList.tsx` both have the id.
3. Add the entry to `SHAPES`, and the panel (in `src/components/home/panels/`)
   to `IndexList`'s `extras`. Row numbers, the hero's count and the `#<id>` hash
   follow automatically; hovering or focusing the row selects the cloud.
4. Add tests to `shapes/shapes.test.ts`: add your shape to the array in the
   "every shape" loop, which checks size, finiteness and determinism (it does
   not include `writing`, which `writing.test.ts` covers, so nothing is added
   automatically); add a case for your shape's own structure (bounds, index
   split) and update the "views and tilts" test.
5. Add a line to the catalogue below.

## Catalogue

| id        | Subject                          | Recipe                                                | Points split                                   | View      | Overlay / animate                               |
| --------- | -------------------------------- | ----------------------------------------------------- | ---------------------------------------------- | --------- | ----------------------------------------------- |
| `home`    | Free-floating dust               | Uniform volume                                        | All points                                     | spin 0.02 | Drift added per frame                           |
| `about`   | 4-7-7-3 feed-forward network     | `cbrt` ball clusters, pure-lerp segments              | 22 per node, rest by edge (`% edges`)          | settle    | `networkOverlay`                                |
| `badge`   | Name badge on a lanyard          | Uniform thin box, segments                            | 82% board, 18% lanyard                         | spin 0.2  | None                                            |
| `howto`   | Terminal prompt `>_`             | Jittered segments, z thickness                        | `i % 3`: two chevron arms, underscore          | spin 0.2  | None                                            |
| `mssg`    | Four stacked message pages       | Layered planes                                        | `i % 4`: one slab each                         | spin 0.2  | None                                            |
| `spaces`  | Three Space thumbnails           | Filled rectangle, rectangle outlines by arc length    | `i % 4`: 0-1 middle filled, 2-3 side outlines  | spin 0.2  | None                                            |
| `writing` | Quill signing "MD"               | Curved shaft, barbs, down; spline with arc-length LUT | `i % 20`: <2 shaft, <8 barbs, 8 down, else ink | settle    | `animate`: writes in 3s, ink fed from the quill |
| `contact` | Earth with Starlink-style orbits | Fibonacci sphere, parametric orbits                   | 62% Earth, rest across 6 planes (`% 6`)        | spin 0.06 | `constellationOverlay`                          |
