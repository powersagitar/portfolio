import {
  BufferAttribute,
  BufferGeometry,
  Color,
  type InterleavedBufferAttribute,
  NormalBlending,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

import type { SimFrame } from './simulation';
import type { DotBatch, LineBatch } from './types';

export type CloudRenderer = {
  resize(W: number, H: number): void;
  draw(f: SimFrame): void;
  dispose(): void;
};

const INK = 0xf5f5f7;
const MAX_DOTS = 1200;
const OVERLAY_DOTS = 256;
const LINE_SEGMENTS = 512;
const LINE_SLOTS = 4;

const vertexShader = /* glsl */ `
  attribute float size;
  attribute float alpha;
  varying float vAlpha;
  void main() {
    vAlpha = alpha;
    gl_PointSize = size;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 color;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(color, vAlpha);
  }
`;

/** Points with preallocated position (z = 0), size and alpha attributes. */
class DotLayer {
  readonly points: Points<BufferGeometry, ShaderMaterial>;
  private cap = 0;
  private pos!: BufferAttribute;
  private size!: BufferAttribute;
  private alpha!: BufferAttribute;

  constructor(material: ShaderMaterial, cap: number) {
    this.points = new Points(new BufferGeometry(), material);
    this.points.frustumCulled = false;
    this.alloc(cap);
  }

  private alloc(cap: number) {
    const g = this.points.geometry;
    this.cap = cap;
    this.pos = new BufferAttribute(new Float32Array(cap * 3), 3);
    this.size = new BufferAttribute(new Float32Array(cap), 1);
    this.alpha = new BufferAttribute(new Float32Array(cap), 1);
    // Frees the old attributes' GPU buffers; the geometry stays usable.
    g.dispose();
    g.setAttribute('position', this.pos);
    g.setAttribute('size', this.size);
    g.setAttribute('alpha', this.alpha);
    g.setDrawRange(0, 0);
  }

  /** Clears the draw range; `push` appends batches after it. */
  begin(total: number) {
    if (total > this.cap) this.alloc(Math.max(total, this.cap * 2));
    this.points.geometry.setDrawRange(0, 0);
  }

  push(b: DotBatch) {
    const g = this.points.geometry;
    const at = g.drawRange.count;
    const pos = this.pos.array as Float32Array;
    const size = this.size.array as Float32Array;
    const alpha = this.alpha.array as Float32Array;
    for (let i = 0; i < b.count; i++) {
      const j = (at + i) * 3;
      pos[j] = b.xy[i * 2];
      pos[j + 1] = b.xy[i * 2 + 1];
      pos[j + 2] = 0;
      size[at + i] = b.size[i];
      alpha[at + i] = b.alpha[i];
    }
    g.setDrawRange(0, at + b.count);
  }

  end() {
    this.pos.needsUpdate = true;
    this.size.needsUpdate = true;
    this.alpha.needsUpdate = true;
    this.points.visible = this.points.geometry.drawRange.count > 0;
  }

  dispose() {
    this.points.geometry.dispose();
  }
}

/** One LineSegments2 whose instance buffer is reused frame to frame. */
class LineSlot {
  readonly mesh: LineSegments2;
  private cap = 0;

  constructor(cap: number) {
    const material = new LineMaterial({
      color: INK,
      linewidth: 1,
      worldUnits: false,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new LineSegments2(new LineSegmentsGeometry(), material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.alloc(cap);
  }

  private alloc(cap: number) {
    this.cap = cap;
    this.mesh.geometry.dispose();
    this.mesh.geometry.setPositions(new Float32Array(cap * 6));
  }

  set(b: LineBatch) {
    if (b.count > this.cap) this.alloc(Math.max(b.count, this.cap * 2));
    const g = this.mesh.geometry;
    const start = g.attributes.instanceStart as InterleavedBufferAttribute;
    const data = start.data;
    const out = data.array as Float32Array;
    for (let i = 0; i < b.count; i++) {
      const s = i * 4;
      const o = i * 6;
      out[o] = b.segments[s];
      out[o + 1] = b.segments[s + 1];
      out[o + 2] = 0;
      out[o + 3] = b.segments[s + 2];
      out[o + 4] = b.segments[s + 3];
      out[o + 5] = 0;
    }
    data.needsUpdate = true;
    g.instanceCount = b.count;
    this.mesh.material.linewidth = b.width;
    this.mesh.material.opacity = b.alpha;
    this.mesh.visible = b.count > 0 && b.alpha > 0;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

/**
 * Thin three.js renderer for a SimFrame: pixel-space orthographic camera
 * (y down), square points, screen-space lines. Returns null when WebGL is
 * unavailable. The context is created here first so a missing WebGL never
 * reaches three's console.error.
 */
export function createRenderer(
  canvas: HTMLCanvasElement,
): CloudRenderer | null {
  const attrs: WebGLContextAttributes = {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
  };
  let lost = false;
  // Registered before three's own listener, so it can keep three's
  // "Context Lost" log quiet; restoring the context is not supported.
  const onLost = (e: Event) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    lost = true;
  };
  canvas.addEventListener('webglcontextlost', onLost);

  let renderer: WebGLRenderer | null = null;
  try {
    const context = canvas.getContext('webgl2', attrs);
    if (context && !context.isContextLost())
      renderer = new WebGLRenderer({ canvas, context, ...attrs });
  } catch {
    renderer = null;
  }
  if (!renderer) {
    canvas.removeEventListener('webglcontextlost', onLost);
    return null;
  }
  const gl = renderer;
  gl.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new OrthographicCamera(0, 1, 0, 1, -1, 1);
  const material = new ShaderMaterial({
    uniforms: { color: { value: new Color(INK) } },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: NormalBlending,
  });
  const dots = new DotLayer(material, MAX_DOTS);
  const overlayDots = new DotLayer(material, OVERLAY_DOTS);
  overlayDots.points.renderOrder = 2;
  const lines: LineSlot[] = [];
  for (let i = 0; i < LINE_SLOTS; i++) lines.push(new LineSlot(LINE_SEGMENTS));
  scene.add(dots.points, overlayDots.points);
  for (const l of lines) scene.add(l.mesh);

  return {
    resize(W, H) {
      gl.setSize(W, H, false);
      camera.right = W;
      camera.bottom = H;
      camera.updateProjectionMatrix();
      for (const l of lines) l.mesh.material.resolution.set(W, H);
    },
    draw(f) {
      if (lost) return;
      dots.begin(f.dots.count);
      dots.push(f.dots);
      dots.end();

      let total = 0;
      let slots = 0;
      for (const o of f.overlays) {
        total += o.dots.count;
        slots += o.lines.length;
      }
      while (lines.length < slots) {
        const l = new LineSlot(LINE_SEGMENTS);
        lines.push(l);
        scene.add(l.mesh);
        l.mesh.material.resolution.copy(lines[0].mesh.material.resolution);
      }
      overlayDots.begin(total);
      let slot = 0;
      for (const o of f.overlays) {
        overlayDots.push(o.dots);
        for (const b of o.lines) lines[slot++].set(b);
      }
      overlayDots.end();
      for (; slot < lines.length; slot++) lines[slot].mesh.visible = false;

      gl.render(scene, camera);
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      dots.dispose();
      overlayDots.dispose();
      material.dispose();
      for (const l of lines) l.dispose();
      gl.dispose();
    },
  };
}
