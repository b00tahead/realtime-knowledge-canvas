import { VERT_SRC, FRAG_SRC } from "./shaders.js";
import type { Camera, RenderRect, ViewportSize } from "../types.js";

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL: createShader failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "unknown";
    gl.deleteShader(shader);
    throw new Error(`WebGL shader compile: ${info}`);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL: createProgram failed");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? "unknown";
    gl.deleteProgram(program);
    throw new Error(`WebGL program link: ${info}`);
  }
  return program;
}

/** Floats per vertex: x, y, r, g, b, a */
const STRIDE_FLOATS = 6;
const VERTS_PER_RECT = 6;

/**
 * WebGL2 batched axis-aligned rect renderer.
 * Uploads all visible rects as a single triangle list each frame (spike-simple).
 */
export class GlRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private buffer: WebGLBuffer;
  private uResolution: WebGLUniformLocation;
  private uCamera: WebGLUniformLocation;
  private uZoom: WebGLUniformLocation;
  private vertexCapacity = 0;
  private background: readonly [number, number, number, number];

  constructor(
    canvas: HTMLCanvasElement,
    background: readonly [number, number, number, number] = [0.06, 0.07, 0.08, 1],
  ) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) {
      throw new Error("WebGL2 is required for @rkc/canvas-engine");
    }
    this.gl = gl;
    this.background = background;
    this.program = createProgram(gl);

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    if (!vao || !buffer) throw new Error("WebGL: buffer allocation failed");
    this.vao = vao;
    this.buffer = buffer;

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const locPos = gl.getAttribLocation(this.program, "a_position");
    const locColor = gl.getAttribLocation(this.program, "a_color");
    const stride = STRIDE_FLOATS * 4;
    gl.enableVertexAttribArray(locPos);
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(locColor);
    gl.vertexAttribPointer(locColor, 4, gl.FLOAT, false, stride, 8);

    const uResolution = gl.getUniformLocation(this.program, "u_resolution");
    const uCamera = gl.getUniformLocation(this.program, "u_camera");
    const uZoom = gl.getUniformLocation(this.program, "u_zoom");
    if (!uResolution || !uCamera || !uZoom) {
      throw new Error("WebGL: missing uniforms");
    }
    this.uResolution = uResolution;
    this.uCamera = uCamera;
    this.uZoom = uZoom;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  resize(viewport: ViewportSize): void {
    const { width, height, dpr } = viewport;
    const bw = Math.max(1, Math.floor(width * dpr));
    const bh = Math.max(1, Math.floor(height * dpr));
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.gl.viewport(0, 0, bw, bh);
  }

  /**
   * Draw rects in world space. `viewport` is CSS pixels; DPR is applied in resize.
   */
  draw(
    rects: readonly RenderRect[],
    camera: Camera,
    viewport: ViewportSize,
  ): void {
    const gl = this.gl;
    const dpr = viewport.dpr;
    const [br, bg, bb, ba] = this.background;
    gl.clearColor(br, bg, bb, ba);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (rects.length === 0) return;

    const floats = new Float32Array(rects.length * VERTS_PER_RECT * STRIDE_FLOATS);
    let o = 0;
    for (const r of rects) {
      const x0 = r.x;
      const y0 = r.y;
      const x1 = r.x + r.w;
      const y1 = r.y + r.h;
      const [cr, cg, cb, ca] = r.color;
      // two triangles: (0,0)-(1,0)-(0,1) and (1,0)-(1,1)-(0,1)
      const corners: Array<[number, number]> = [
        [x0, y0],
        [x1, y0],
        [x0, y1],
        [x1, y0],
        [x1, y1],
        [x0, y1],
      ];
      for (const [px, py] of corners) {
        floats[o++] = px;
        floats[o++] = py;
        floats[o++] = cr;
        floats[o++] = cg;
        floats[o++] = cb;
        floats[o++] = ca;
      }
    }

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const byteLength = floats.byteLength;
    if (floats.length > this.vertexCapacity) {
      gl.bufferData(gl.ARRAY_BUFFER, byteLength * 2, gl.DYNAMIC_DRAW);
      this.vertexCapacity = floats.length * 2;
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, floats);

    // Shader works in CSS pixel space matching camera math
    gl.uniform2f(this.uResolution, viewport.width, viewport.height);
    gl.uniform2f(this.uCamera, camera.x, camera.y);
    gl.uniform1f(this.uZoom, camera.zoom);

    // When canvas is DPR-scaled, WebGL viewport is in device pixels but our
    // clip conversion uses CSS resolution — correct because we pass CSS size
    // in u_resolution and the canvas is CSS-sized via style.
    void dpr;

    gl.drawArrays(gl.TRIANGLES, 0, rects.length * VERTS_PER_RECT);
  }

  destroy(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }
}
