"use client";

import { useEffect, useRef } from "react";
import { colors } from "@/content/generated/tokens";

/**
 * Suminagashi: a real-time ink-on-water field (WebGL2, ping-pong framebuffers).
 * A dye texture is advected by a slowly turning curl-noise flow; the pointer drops ink
 * (oxblood on Ivory, linen on OLED) and drags the water. Colours come from the token set,
 * so the shader can never introduce an off-brand hue. Pauses off-screen and when the tab
 * is hidden; renders a single still frame for reduced motion; falls back to CSS without WebGL2.
 */
const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

const NOISE = `
vec3 hash3(vec2 p){ vec3 q=vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9))); return fract(sin(q)*43758.5453); }
float noise(vec2 x){ vec2 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  float a=hash3(i).x, b=hash3(i+vec2(1,0)).x, c=hash3(i+vec2(0,1)).x, d=hash3(i+vec2(1,1)).x;
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
vec2 curl(vec2 p, float t){ float e=.01;
  float n1=noise(p+vec2(0,e)+t), n2=noise(p-vec2(0,e)+t), n3=noise(p+vec2(e,0)+t), n4=noise(p-vec2(e,0)+t);
  return vec2(n1-n2, -(n3-n4))/(2.*e); }`;

// Advect the dye along the flow, add pointer splats, slowly dissolve.
const STEP = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D dye; uniform vec2 res; uniform float t; uniform vec3 mouse; uniform vec2 mvel; uniform float aspect;
${NOISE}
void main(){
  vec2 q = uv; q.x *= aspect;
  vec2 flow = curl(q*2.2, t*.035)*.0009 + curl(q*6., -t*.05)*.00025;
  vec2 m = mouse.xy; m.x *= aspect;
  float d = distance(q, m);
  float r = exp(-d*d/ .0016) * mouse.z;
  flow += mvel * r * .9;
  vec2 back = uv - flow;
  vec4 c = texture(dye, back);
  // concentric suminagashi rings: drops lay down banded ink
  float ring = .5 + .5*sin(d*150. - t*1.2);
  c.r = max(c.r*.9975, r*(.55+.45*ring));
  // ambient drops so the field breathes without a pointer
  for(int i=0;i<3;i++){
    float fi=float(i);
    vec2 a = vec2(.5+.33*sin(t*.07+fi*2.1), .5+.28*cos(t*.05+fi*1.7)); a.x*=aspect;
    float da = distance(q,a);
    c.r = max(c.r, exp(-da*da/.0009)*.35*(.5+.5*sin(da*120.-t*.8)));
  }
  o = vec4(clamp(c.r,0.,1.),0.,0.,1.);
}`;

// Paint: map dye density to paper → ink, with a subtle paper grain.
const PAINT = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D dye; uniform vec3 paper; uniform vec3 ink; uniform vec3 deep; uniform float t;
${NOISE}
void main(){
  float k = texture(dye, uv).r;
  float edge = smoothstep(.02,.6,k);
  vec3 col = mix(paper, ink, edge*.85);
  col = mix(col, deep, smoothstep(.55,1.,k)*.6);
  float g = (noise(uv*900.+t)-.5)*.025;
  o = vec4(col+g, 1.);
}`;

function hexToRgb(h: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export function InkField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) {
      canvas.dataset.fallback = "true";
      return;
    }
    const reduced = document.documentElement.classList.contains("reduced");

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const program = (frag: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
      gl.bindAttribLocation(p, 0, "p");
      gl.linkProgram(p);
      return p;
    };
    let step: WebGLProgram, paint: WebGLProgram;
    try {
      step = program(STEP);
      paint = program(PAINT);
    } catch {
      canvas.dataset.fallback = "true";
      return;
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const SIM = 384;
    const makeTarget = () => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, SIM, SIM, 0, gl.RED, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fb };
    };
    let a = makeTarget();
    let b = makeTarget();

    const mouse = { x: 0.5, y: 0.5, z: 0, vx: 0, vy: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      mouse.vx = (x - mouse.x) * 0.6;
      mouse.vy = (y - mouse.y) * 0.6;
      mouse.x = x;
      mouse.y = y;
      mouse.z = 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let palette = readPalette();
    const onTheme = () => (palette = readPalette());
    window.addEventListener("nt:theme", onTheme);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onTheme);

    const resize = () => {
      const dpr = Math.min(1.5, devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = Boolean(e?.isIntersecting)));
    io.observe(canvas);

    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000 + (reduced ? 40 : 0);
      if (visible && !document.hidden) {
        gl.useProgram(step);
        gl.viewport(0, 0, SIM, SIM);
        gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, a.tex);
        gl.uniform1i(gl.getUniformLocation(step, "dye"), 0);
        gl.uniform1f(gl.getUniformLocation(step, "t"), t);
        gl.uniform1f(gl.getUniformLocation(step, "aspect"), canvas.width / canvas.height);
        gl.uniform3f(gl.getUniformLocation(step, "mouse"), mouse.x, mouse.y, mouse.z);
        gl.uniform2f(gl.getUniformLocation(step, "mvel"), mouse.vx * 0.02, mouse.vy * 0.02);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        [a, b] = [b, a];
        mouse.z *= 0.92;
        mouse.vx *= 0.9;
        mouse.vy *= 0.9;

        gl.useProgram(paint);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindTexture(gl.TEXTURE_2D, a.tex);
        gl.uniform1i(gl.getUniformLocation(paint, "dye"), 0);
        gl.uniform1f(gl.getUniformLocation(paint, "t"), Math.floor(t * 12) / 12);
        gl.uniform3fv(gl.getUniformLocation(paint, "paper"), palette.paper);
        gl.uniform3fv(gl.getUniformLocation(paint, "ink"), palette.ink);
        gl.uniform3fv(gl.getUniformLocation(paint, "deep"), palette.deep);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        canvas.dataset.ready = "true";
      }
      if (reduced) {
        // One settled frame is enough: warm the field, then stop.
        if (now - t0 < 400) raf = requestAnimationFrame(frame);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const lost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      canvas.dataset.fallback = "true";
    };
    canvas.addEventListener("webglcontextlost", lost);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("nt:theme", onTheme);
      mq.removeEventListener("change", onTheme);
      canvas.removeEventListener("webglcontextlost", lost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} className={`ink-field ${className ?? ""}`} aria-hidden="true" />;
}

function readPalette() {
  const dark = document.documentElement.dataset.mode === "dark";
  const c = dark ? colors.dark : colors.light;
  return dark
    ? { paper: hexToRgb(c.canvas), ink: hexToRgb(c.oxblood), deep: hexToRgb(c.blush) }
    : { paper: hexToRgb(c.canvas), ink: hexToRgb(c.rosewood), deep: hexToRgb(c.accent) };
}
