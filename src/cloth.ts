/**
 * Hero "cloth": the pre-rendered shirt bitmap drawn on a finely subdivided WebGL plane.
 *
 * - On start, a short breeze ripples the sleeves and hem (~4 s), then settles.
 * - With a mouse, the fabric bulges under the cursor and ripples outward when the cursor moves.
 * - Folds catch light from normals computed in the shader, so the bitmap reads as 3D cloth.
 *
 * Frames are only drawn while something is moving; when everything settles the loop stops.
 * `setActive(false)` hides the canvas and stops rendering (the static SVG takes over).
 */

const VERT = `
attribute vec2 aUv;
uniform float uTime, uWind, uHover, uRipple, uAspect, uScale;
uniform vec2 uMouse;
varying vec2 vUv;
varying float vShade;

float height(vec2 uv) {
  vec2 p = vec2(uv.x * uAspect, uv.y);
  // collar is the anchor: cloth moves more the further it is from the neck
  float anchor = smoothstep(0.06, 0.62, distance(p, vec2(0.54 * uAspect, 0.12)));
  float wind = uWind * anchor * (
      0.6 * sin(uv.x * 7.0 - uTime * 2.3 + uv.y * 3.0)
    + 0.4 * sin(uv.y * 11.0 + uTime * 3.1 + uv.x * 2.0));
  vec2 m = vec2(uMouse.x * uAspect, uMouse.y);
  float d = distance(p, m);
  float bulge = uHover * exp(-d * d / 0.020);
  float ripple = uHover * uRipple * sin(d * 36.0 - uTime * 7.0) * exp(-d * 6.5);
  return wind * 0.040 + bulge * 0.068 + ripple * 0.024;
}

void main() {
  float z = height(aUv);
  float e = 0.004;
  float dx = (height(aUv + vec2(e, 0.0)) - z) / e;
  float dy = (height(aUv + vec2(0.0, e)) - z) / e;
  vec3 n = normalize(vec3(-dx * 0.55, dy * 0.55, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.55, 0.85));
  vShade = 1.0 + (dot(n, L) - L.z) * 1.6;
  vUv = aUv;
  vec2 pos = (aUv * 2.0 - 1.0) * vec2(1.0, -1.0) * uScale;
  pos.x += z * 0.10;
  gl_Position = vec4(pos, 0.0, 1.0 - z * 1.1);
}`

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
varying vec2 vUv;
varying float vShade;
void main() {
  vec4 c = texture2D(uTex, vUv);
  float s = clamp(vShade, 0.55, 1.6);
  c.rgb *= s;
  c.rgb += c.a * max(s - 1.0, 0.0) * 0.07; // faint sheen on raised folds
  gl_FragColor = c;
}`

export type Cloth = { setActive: (on: boolean) => void; dispose: () => void }

type Opts = {
  host: HTMLElement // element that receives data-cloth and holds the canvas
  box: Element // element whose box the shirt texture fills (the live SVG)
  image: HTMLImageElement // decoded shirt bitmap
  interactive: boolean
  pad?: number // canvas overflow around the box, as a fraction, so waves don't clip
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function createCloth({ host, box, image, interactive, pad = 0.08 }: Opts): Cloth | null {
  const canvas = document.createElement('canvas')
  canvas.className = 'cloth-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.setProperty('--cloth-pad', String(pad))
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true })
  if (!gl) return null

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
    return s
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

  // grid
  const NX = 96, NY = 78
  const uv = new Float32Array((NX + 1) * (NY + 1) * 2)
  let k = 0
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { uv[k++] = i / NX; uv[k++] = j / NY }
  const idx = new Uint16Array(NX * NY * 6)
  k = 0
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1
    idx.set([a, c, b, b, c, d], k); k += 6
  }
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
  const aUv = gl.getAttribLocation(prog, 'aUv')
  gl.enableVertexAttribArray(aUv)
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0)

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const U = (n: string) => gl.getUniformLocation(prog, n)
  const u = { time: U('uTime'), wind: U('uWind'), hover: U('uHover'), ripple: U('uRipple'), aspect: U('uAspect'), scale: U('uScale'), mouse: U('uMouse') }
  gl.uniform1f(u.aspect, image.naturalWidth / image.naturalHeight)
  gl.uniform1f(u.scale, 1 / (1 + 2 * pad))

  // sizing (DPR capped to keep fill cost modest)
  const resize = () => {
    const r = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr))
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h) }
  }

  // state
  const t0 = performance.now()
  let active = true
  let raf = 0
  let hover = 0, hoverTarget = 0
  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5
  let ripple = 0, speed = 0
  let lastX = 0, lastY = 0

  const draw = (now: number) => {
    const t = (now - t0) / 1000
    const wind = smooth(0, 0.9, t) * (1 - smooth(2.6, 4.6, t))
    hover += (hoverTarget - hover) * 0.07
    mx += (tx - mx) * 0.14
    my += (ty - my) * 0.14
    ripple += (Math.min(speed * 40, 1) - ripple) * 0.08
    speed *= 0.86
    resize()
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(u.time, t)
    gl.uniform1f(u.wind, wind)
    gl.uniform1f(u.hover, hover)
    gl.uniform1f(u.ripple, ripple)
    gl.uniform2f(u.mouse, mx, my)
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0)
    const settled =
      wind < 0.001 && t > 4.7 &&
      Math.abs(hoverTarget - hover) < 0.003 &&
      Math.abs(tx - mx) < 0.0015 && Math.abs(ty - my) < 0.0015 &&
      ripple < 0.004
    raf = settled || !active ? 0 : requestAnimationFrame(draw)
  }
  const kick = () => { if (active && !raf) raf = requestAnimationFrame(draw) }

  const onMove = (e: PointerEvent) => {
    if (!active || e.pointerType !== 'mouse') return
    const r = box.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    const inside = x > -0.05 && x < 1.05 && y > -0.05 && y < 1.05
    hoverTarget = inside ? 1 : 0
    if (inside) {
      speed = Math.max(speed, Math.hypot(x - lastX, y - lastY))
      tx = x; ty = y
    }
    lastX = x; lastY = y
    kick()
  }
  const onLeave = () => { hoverTarget = 0; kick() }
  if (interactive) {
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
  }
  const ro = new ResizeObserver(() => kick())
  ro.observe(host)

  host.insertBefore(canvas, host.firstChild)
  host.setAttribute('data-cloth', '')
  kick()

  return {
    setActive(on) {
      if (on === active) return
      active = on
      host.toggleAttribute('data-cloth', on)
      if (on) { hoverTarget = 0; kick() } else if (raf) { cancelAnimationFrame(raf); raf = 0 }
    },
    dispose() {
      active = false
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      ro.disconnect()
      host.removeAttribute('data-cloth')
      canvas.remove()
      gl.deleteTexture(tex); gl.deleteBuffer(vb); gl.deleteBuffer(ib); gl.deleteProgram(prog)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
