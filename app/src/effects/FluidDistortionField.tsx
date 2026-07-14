import { useRef, useEffect } from 'react'

/* ── Fullscreen triangle vertex shader ── */
const fullscreenVert = /* glsl */ `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

/* ── Fluid advection fragment shader ── */
const advectionFrag = /* glsl */ `
precision mediump float;
uniform sampler2D uFluidTex;
uniform vec2 uResolution;
uniform float uDt;
uniform vec4 iMouse;
uniform vec4 iMousePrev;

#define fluidDecay 0.001
#define fluidStrength 0.05
#define fluidRadius 0.02

vec4 encodeFluid(vec2 vel, float ink) {
  return vec4(vel / 2.0 + 0.5, ink, 1.0);
}

vec3 decodeFluid(vec4 raw) {
  return (raw.xyz - 0.5) * 2.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 texel = 1.0 / uResolution;

  vec4 prevRaw = texture2D(uFluidTex, uv);
  vec3 prev = decodeFluid(prevRaw);

  // Advection - backtrace through velocity
  vec2 advectUV = uv - prev.xy * texel * uDt * 60.0;
  vec4 advectedRaw = texture2D(uFluidTex, advectUV);
  vec3 advected = decodeFluid(advectedRaw);

  // Decay
  advected.xy *= (1.0 - fluidDecay);
  advected.z *= 0.995;

  // Splat cursor motion
  if (iMouse.z > 0.0 && iMousePrev.z > 0.0) {
    vec2 motion = iMousePrev.xy - iMouse.xy;
    float dist = length(uv - iMouse.xy);
    float falloff = exp(-dist * dist / (fluidRadius * fluidRadius));
    advected.xy += motion * falloff * fluidStrength * 8.0;
    advected.z += falloff * fluidStrength * 3.0;
  }

  // Clamp velocity
  float velMag = length(advected.xy);
  if (velMag > 1.0) advected.xy = advected.xy / velMag * 1.0;

  gl_FragColor = encodeFluid(advected.xy, advected.z);
}
`

/* ── Divergence correction fragment shader ── */
const correctionFrag = /* glsl */ `
precision mediump float;
uniform sampler2D uFluidTex;
uniform vec2 uResolution;

vec3 decodeFluid(vec4 raw) {
  return (raw.xyz - 0.5) * 2.0;
}

vec4 encodeFluid(vec2 vel, float ink) {
  return vec4(vel / 2.0 + 0.5, ink, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 texel = 1.0 / uResolution;

  vec4 colRaw = texture2D(uFluidTex, uv);
  vec3 col = decodeFluid(colRaw);

  vec3 e = decodeFluid(texture2D(uFluidTex, uv + vec2(texel.x, 0.0)));
  vec3 w = decodeFluid(texture2D(uFluidTex, uv - vec2(texel.x, 0.0)));
  vec3 n = decodeFluid(texture2D(uFluidTex, uv + vec2(0.0, texel.y)));
  vec3 s = decodeFluid(texture2D(uFluidTex, uv - vec2(0.0, texel.y)));

  col.xy = (col.xy + n.xy + s.xy + e.xy + w.xy) / 5.0;
  col.z *= 0.98;

  gl_FragColor = encodeFluid(col.xy, col.z);
}
`

/* ── Display fragment shader ── */
const displayFrag = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uFluidTex;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uColorIntensity;
uniform float uSeed;

// Simple noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    val += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return val;
}

vec3 palette(float t) {
  return mix(
    mix(uColor1, uColor2, smoothstep(0.0, 0.5, t)),
    mix(uColor2, uColor3, smoothstep(0.5, 1.0, t)),
    t
  ) * uColorIntensity;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uResolution.xy * 0.5) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;

  // Sample fluid displacement
  vec2 fluidSample = texture2D(uFluidTex, gl_FragCoord.xy / uResolution).xy;
  uv += fluidSample * 0.3;

  float angle = atan(uv.y, uv.x);
  float radius = length(uv);

  float n = noise(uv * 2.0 + t * 0.1);
  vec2 polarUv = vec2(
    angle / 6.28318 + 0.5 + t * 0.02 + n * 0.1,
    radius * 2.0 - t * 0.1
  );

  float pattern = fbm(polarUv * 2.0);
  vec3 col = palette(pattern);

  // Flow lines
  float flowLine = sin(angle * 5.0 + t + radius * 3.0) * 0.5 + 0.5;
  col += uColor2 * smoothstep(0.05, 0.0, abs(flowLine - 0.5)) * 0.3;

  // Energy ring
  float energy = exp(-pow(radius - 0.3 * sin(angle * 3.0 + t) * 0.1, 2.0) / (0.02 * 0.02));
  col += uColor3 * energy * 0.3;

  // Radial fade
  col *= smoothstep(0.8, 0.2, radius);
  col = max(col, vec3(0.0));

  gl_FragColor = vec4(col, 1.0);
}
`

interface FluidColors {
  color1: [number, number, number]
  color2: [number, number, number]
  color3: [number, number, number]
}

interface Props {
  colors: FluidColors
  seed: number
  intensity?: number
}

export default function FluidDistortionField({ colors, seed, intensity = 0.8 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, active: false })
  const startTimeRef = useRef(performance.now())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    })
    if (!gl) return

    // Helpers
    function createShader(src: string, type: number) {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, src)
      gl!.compileShader(s)
      return s
    }

    function createProgram(vs: string, fs: string) {
      const p = gl!.createProgram()!
      gl!.attachShader(p, createShader(vs, gl!.VERTEX_SHADER))
      gl!.attachShader(p, createShader(fs, gl!.FRAGMENT_SHADER))
      gl!.linkProgram(p)
      return p
    }

    function createFBO(w: number, h: number) {
      const tex = gl!.createTexture()!
      gl!.bindTexture(gl!.TEXTURE_2D, tex)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, w, h, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
      const fb = gl!.createFramebuffer()!
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fb)
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0)
      return { texture: tex, framebuffer: fb }
    }

    // Resize
    const dpr = Math.min(window.devicePixelRatio, 1.5)
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const w = Math.floor(rect.width * dpr * 0.5) // Half res
      const h = Math.floor(rect.height * dpr * 0.5)
      canvas.width = w
      canvas.height = h
      return { w, h }
    }
    let { w, h } = resize()

    // Programs
    const advectionProg = createProgram(fullscreenVert, advectionFrag)
    const correctionProg = createProgram(fullscreenVert, correctionFrag)
    const displayProg = createProgram(fullscreenVert, displayFrag)

    // Fullscreen triangle
    const triBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

    function bindAttrib(prog: WebGLProgram) {
      const loc = gl!.getAttribLocation(prog, 'a_position')
      gl!.bindBuffer(gl!.ARRAY_BUFFER, triBuf)
      gl!.enableVertexAttribArray(loc)
      gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0)
    }

    // FBOs
    let fboA = createFBO(w, h)
    let fboB = createFBO(w, h)

    // Uniform locations cache
    const advectionLocs = {
      uFluidTex: gl.getUniformLocation(advectionProg, 'uFluidTex'),
      uResolution: gl.getUniformLocation(advectionProg, 'uResolution'),
      uDt: gl.getUniformLocation(advectionProg, 'uDt'),
      iMouse: gl.getUniformLocation(advectionProg, 'iMouse'),
      iMousePrev: gl.getUniformLocation(advectionProg, 'iMousePrev'),
    }
    const correctionLocs = {
      uFluidTex: gl.getUniformLocation(correctionProg, 'uFluidTex'),
      uResolution: gl.getUniformLocation(correctionProg, 'uResolution'),
    }
    const displayLocs = {
      uTime: gl.getUniformLocation(displayProg, 'uTime'),
      uResolution: gl.getUniformLocation(displayProg, 'uResolution'),
      uFluidTex: gl.getUniformLocation(displayProg, 'uFluidTex'),
      uColor1: gl.getUniformLocation(displayProg, 'uColor1'),
      uColor2: gl.getUniformLocation(displayProg, 'uColor2'),
      uColor3: gl.getUniformLocation(displayProg, 'uColor3'),
      uColorIntensity: gl.getUniformLocation(displayProg, 'uColorIntensity'),
      uSeed: gl.getUniformLocation(displayProg, 'uSeed'),
    }

    // Mouse handlers
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.prevX = mouseRef.current.x
      mouseRef.current.prevY = mouseRef.current.y
      mouseRef.current.x = (e.clientX - rect.left) / rect.width
      mouseRef.current.y = 1.0 - (e.clientY - rect.top) / rect.height
      mouseRef.current.active = true
    }
    const onMouseLeave = () => {
      mouseRef.current.active = false
    }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    // Animation loop
    const render = () => {
      const time = (performance.now() - startTimeRef.current) * 0.001
      const mouse = mouseRef.current

      // Pass 1: Advection (read B, write A)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboA.framebuffer)
      gl.viewport(0, 0, w, h)
      gl.useProgram(advectionProg)
      bindAttrib(advectionProg)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fboB.texture)
      gl.uniform1i(advectionLocs.uFluidTex, 0)
      gl.uniform2f(advectionLocs.uResolution, w, h)
      gl.uniform1f(advectionLocs.uDt, 1.0 / 60.0)
      gl.uniform4f(advectionLocs.iMouse, mouse.x, mouse.y, mouse.active ? 1.0 : 0.0, 0.0)
      gl.uniform4f(advectionLocs.iMousePrev, mouse.prevX, mouse.prevY, mouse.active ? 1.0 : 0.0, 0.0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      // Pass 2: Correction (read A, write B)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.framebuffer)
      gl.viewport(0, 0, w, h)
      gl.useProgram(correctionProg)
      bindAttrib(correctionProg)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fboA.texture)
      gl.uniform1i(correctionLocs.uFluidTex, 0)
      gl.uniform2f(correctionLocs.uResolution, w, h)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      // Pass 3: Display to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(displayProg)
      bindAttrib(displayProg)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fboB.texture)
      gl.uniform1i(displayLocs.uFluidTex, 0)
      gl.uniform1f(displayLocs.uTime, time)
      gl.uniform2f(displayLocs.uResolution, canvas.width, canvas.height)
      gl.uniform3f(displayLocs.uColor1, colors.color1[0] / 255, colors.color1[1] / 255, colors.color1[2] / 255)
      gl.uniform3f(displayLocs.uColor2, colors.color2[0] / 255, colors.color2[1] / 255, colors.color2[2] / 255)
      gl.uniform3f(displayLocs.uColor3, colors.color3[0] / 255, colors.color3[1] / 255, colors.color3[2] / 255)
      gl.uniform1f(displayLocs.uColorIntensity, intensity)
      gl.uniform1f(displayLocs.uSeed, seed)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    const onResize = () => {
      const newSize = resize()
      w = newSize.w
      h = newSize.h
      // Recreate FBOs at new size
      fboA = createFBO(w, h)
      fboB = createFBO(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [colors, seed, intensity])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        mixBlendMode: 'screen',
        opacity: 0.5,
        pointerEvents: 'auto',
      }}
    />
  )
}
