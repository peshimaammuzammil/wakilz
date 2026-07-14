import { useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── GLSL helpers (prepended to both shaders) ── */
const glslHelpers = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float pnoise(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

mat3 rotation3dY(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

vec3 rotateY(vec3 v, float angle) { return rotation3dY(angle) * v; }
`

/* ── Vertex shader ── */
const vertexShader = /* glsl */ `
${glslHelpers}

uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;
uniform float uBlobRadius;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uDensity;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vDistort;

void main() {
  float distortion = pnoise(normal * uDensity, vec3(10.)) * uNoiseStrength;
  float angle = sin(uv.y * uFrequency + uTime) * uAmplitude;
  vec3 newPosition = rotateY(position + normal * distortion, angle);
  float radius = uBlobRadius + (sin(uv.x * 10.0 + uTime) * 0.1);
  newPosition *= radius;
  vUv = uv;
  vNormal = normal;
  vPosition = newPosition;
  vDistort = distortion;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`

/* ── Fragment shader ── */
const fragmentShader = /* glsl */ `
${glslHelpers}

uniform float uTime;
uniform float uHue;
uniform float uSaturation;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vDistort;

vec3 hueShift(vec3 color, float hue) {
  const vec3 k = vec3(0.57735);
  float cosAngle = cos(hue);
  return color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle);
}

void main() {
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = dot(viewDirection, vNormal);
  fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
  fresnel = pow(fresnel, 3.0);
  float pattern = pnoise(vPosition + uTime, vec3(3.0)) * 0.5 + 0.5;
  float gradient = vUv.x + vUv.y;
  vec3 color = vec3(0.2 + gradient * 0.3, 0.4 + pattern * 0.4, 0.8);
  color += fresnel * 0.4;
  color = hueShift(color, uHue + uTime * 0.05);
  float saturation = uSaturation + sin(uTime) * 0.1;
  vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
  color = mix(gray, color, saturation);
  color += vDistort * 0.1;

  // Dissolve effect based on progress
  float dissolveNoise = pnoise(vPosition * 2.0 + uTime * 0.5, vec3(5.0));
  float dissolveThreshold = uProgress * 1.5 - 0.2;
  float dissolveMask = smoothstep(dissolveThreshold - 0.1, dissolveThreshold + 0.1, dissolveNoise);

  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color, dissolveMask * (1.0 - uProgress * 0.3));
}
`

/* ── Particle vertex shader ── */
const particleVertexShader = /* glsl */ `
uniform float uTime;
uniform float uProgress;
attribute float aScale;
attribute vec3 aVelocity;
varying float vAlpha;
void main() {
  vec3 pos = position;
  // Particles drift outward as progress increases
  pos += aVelocity * uProgress * 0.5;
  pos += sin(uTime * 0.5 + aScale * 10.0) * 0.02;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aScale * (200.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  vAlpha = 1.0 - uProgress * 0.8;
}
`

/* ── Particle fragment shader ── */
const particleFragmentShader = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
  gl_FragColor = vec4(uColor, alpha * 0.4);
}
`

/* ── Sphere mesh component ── */
function IridescentSphere({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uNoiseScale: { value: 1.5 },
    uNoiseStrength: { value: 0.3 },
    uBlobRadius: { value: 1.0 },
    uFrequency: { value: 1.5 },
    uAmplitude: { value: 0.6 },
    uDensity: { value: 1.0 },
    uProgress: { value: 0 },
    uHue: { value: 0.5 },
    uSaturation: { value: 0.8 },
  }), [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time
      materialRef.current.uniforms.uHue.value = Math.sin(time * 0.1) * 0.5 + 0.5
      materialRef.current.uniforms.uProgress.value = progressRef.current
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.08
      const scale = 1.2 * (1.0 - progressRef.current * 0.5)
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <mesh ref={meshRef} position={[2.5, 0, 0]}>
      <sphereGeometry args={[1, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  )
}

/* ── Particle field component ── */
function ParticleField({ color, scale, progressRef }: {
  color: string
  scale: number
  progressRef: React.MutableRefObject<number>
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const count = 800

  const { positions, scales, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const scl = new Float32Array(count)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 0.8 + Math.random() * 0.6
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      scl[i] = 0.5 + Math.random() * 1.5
      vel[i * 3] = (Math.random() - 0.5) * 0.3
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.3
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3
    }
    return { positions: pos, scales: scl, velocities: vel }
  }, [])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor: { value: new THREE.Color(color) },
  }), [color])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time
      materialRef.current.uniforms.uProgress.value = progressRef.current
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.05
    }
  })

  return (
    <points ref={pointsRef} position={[2.5, 0, 0]} scale={scale}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aVelocity" args={[velocities, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ── Scene ── */
function Scene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera } = useThree()

  useEffect(() => {
    const orthoCam = camera as THREE.OrthographicCamera
    orthoCam.zoom = 100
    orthoCam.near = 0.01
    orthoCam.far = 1000
    orthoCam.updateProjectionMatrix()
  }, [camera])

  return (
    <>
      <IridescentSphere progressRef={progressRef} />
      <ParticleField color="#162032" scale={1.0} progressRef={progressRef} />
      <ParticleField color="#2A3FE0" scale={1.05} progressRef={progressRef} />
      <ParticleField color="#5A6CFF" scale={1.1} progressRef={progressRef} />
      <ParticleField color="#8A9BFF" scale={1.15} progressRef={progressRef} />
    </>
  )
}

/* ── Main exported component ── */
export default function HeroSphere({ visible }: { visible: boolean }) {
  const progressRef = useRef(0)
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    const trig = ScrollTrigger.create({
      trigger: '.hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress
      },
    })

    return () => { trig.kill() }
  }, [])

  useEffect(() => {
    setShouldRender(visible)
  }, [visible])

  return (
    <div className={`hero-canvas-container ${!visible ? 'hidden' : ''}`}>
      {shouldRender && (
        <Canvas
          orthographic
          camera={{ position: [0, 0, 5] }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Scene progressRef={progressRef} />
        </Canvas>
      )}
    </div>
  )
}
