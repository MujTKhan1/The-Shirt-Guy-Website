/**
 * Finish-studies reel: photo cards bent around a tilted cylinder and laid out as a spiral.
 * Turning the cylinder (driven by scroll) swings each card to the front in sequence.
 *
 * Draws only when `render(progress)` is called, i.e. when the scroll position changes.
 * No continuous loop.
 */

const VERT = `
attribute vec2 aST;
uniform float uTheta, uDy, uPhi, uTilt, uLift, uAspect, uArc, uH, uR, uD, uF, uY;
varying vec2 vUv;
varying float vFront;

void main() {
  float a = uTheta + (aST.x - 0.5) * uArc;
  vec3 p = vec3(uR * sin(a), (0.5 - aST.y) * uH + uDy - uY, uR * cos(a));
  // turn the cylinder
  float c = cos(uPhi), s = sin(uPhi);
  p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  vFront = cos(a + uPhi);
  // lean it back, then tilt it in the picture plane
  float cl = cos(uLift), sl = sin(uLift);
  p = vec3(p.x, cl * p.y - sl * p.z, sl * p.y + cl * p.z);
  p.y += sl * uR; // keep the front card centred after leaning back
  float ct = cos(uTilt), st = sin(uTilt);
  p = vec3(ct * p.x - st * p.y, st * p.x + ct * p.y, p.z);
  float w = uD - p.z;
  vUv = aST;
  gl_Position = vec4(p.x * uF / uAspect, p.y * uF, 0.0, w);
}`

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform float uHasTex, uArcLen, uCardH;
varying vec2 vUv;
varying float vFront;

void main() {
  // rounded corners
  vec2 size = vec2(uArcLen, uCardH);
  vec2 q = abs(vUv - 0.5) * size - (size * 0.5 - 0.05);
  float d = length(max(q, 0.0)) - 0.05;
  if (d > 0.0) discard;
  vec3 col = uHasTex > 0.5 ? texture2D(uTex, vUv).rgb : vec3(0.11, 0.11, 0.10);
  float lit = mix(0.32, 1.0, smoothstep(-0.25, 0.9, vFront));
  float alpha = smoothstep(-0.95, -0.35, vFront);
  gl_FragColor = vec4(col * lit * alpha, alpha);
}`

export type Reel = { render: (progress: number) => void; resize: () => void; dispose: () => void }

type Opts = { canvas: HTMLCanvasElement; urls: string[] }

// world layout
// A wide, gently curved cylinder so each photo reads almost flat at the front
const R = 2.2
const ARC = 0.5 // card angular width (rad) -> arc length 1.1
const STEP = 0.6 // angle between consecutive cards (rad)
const H = 1.3 // card height (photos are cropped 4:5-ish to match)
const DY = 0.3 // vertical rise per card (spiral)
const D = 5.0 // camera distance
const F = 2.3 // focal scale
const TILT = -0.36 // lean in the picture plane (rad)
const LIFT = 0.14

export function createReel({ canvas, urls }: Opts): Reel | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true })
  if (!gl) return null
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
    return sh
  }
  let prog: WebGLProgram
  try {
    prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  } catch {
    return null
  }
  gl.useProgram(prog)

  // one bent card mesh, reused for every card
  const NX = 28, NY = 2
  const st = new Float32Array((NX + 1) * (NY + 1) * 2)
  let k = 0
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { st[k++] = i / NX; st[k++] = j / NY }
  const idx = new Uint16Array(NX * NY * 6)
  k = 0
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1
    idx.set([a, c, b, b, c, d], k); k += 6
  }
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, st, gl.STATIC_DRAW)
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
  const aST = gl.getAttribLocation(prog, 'aST')
  gl.enableVertexAttribArray(aST)
  gl.vertexAttribPointer(aST, 2, gl.FLOAT, false, 0, 0)

  const U = (n: string) => gl.getUniformLocation(prog, n)
  const u = {
    theta: U('uTheta'), dy: U('uDy'), phi: U('uPhi'), tilt: U('uTilt'), lift: U('uLift'), aspect: U('uAspect'),
    arc: U('uArc'), h: U('uH'), r: U('uR'), d: U('uD'), f: U('uF'), y: U('uY'), hasTex: U('uHasTex'), arcLen: U('uArcLen'), cardH: U('uCardH'),
  }
  gl.uniform1f(u.arc, ARC); gl.uniform1f(u.h, H); gl.uniform1f(u.r, R); gl.uniform1f(u.d, D); gl.uniform1f(u.f, F)
  gl.uniform1f(u.tilt, TILT); gl.uniform1f(u.lift, LIFT); gl.uniform1f(u.arcLen, ARC * R); gl.uniform1f(u.cardH, H)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const n = urls.length
  let last = 0
  let redraw = () => {}
  const cards = urls.map(() => ({ tex: gl.createTexture()!, ready: false }))
  urls.forEach((url, i) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      const c = cards[i]
      gl.bindTexture(gl.TEXTURE_2D, c.tex)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      c.ready = true
      redraw() // one redraw as each photo arrives
    }
    img.src = url
  })

  const resize = () => {
    const r = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr))
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform1f(u.aspect, canvas.width / canvas.height)
  }

  const render = (progress: number) => {
    last = progress
    resize()
    const pos = progress * (n - 1) // fractional index of the card at the front
    const phi = -pos * STEP
    gl.uniform1f(u.phi, phi)
    gl.uniform1f(u.y, pos * DY)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    // painter's order: furthest card first
    const order = cards
      .map((_, i) => ({ i, front: Math.cos(i * STEP + phi) }))
      .sort((a, b) => a.front - b.front)
    for (const { i } of order) {
      const c = cards[i]
      gl.uniform1f(u.theta, i * STEP)
      gl.uniform1f(u.dy, i * DY)
      gl.uniform1f(u.hasTex, c.ready ? 1 : 0)
      gl.bindTexture(gl.TEXTURE_2D, c.tex)
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0)
    }
  }

  redraw = () => render(last)

  return {
    render,
    resize: () => render(last),
    dispose() {
      cards.forEach((c) => gl.deleteTexture(c.tex))
      gl.deleteBuffer(vb); gl.deleteBuffer(ib); gl.deleteProgram(prog)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
