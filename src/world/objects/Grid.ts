import * as THREE from 'three'
import { N, SPACING } from '../config'

/**
 * THE GRID — the structural graphics of the world, entirely procedural (no
 * files, no texture memory): lattice pylons down the corridor, sagging
 * conductors strung between their arms, current sparks running along those
 * spans, hazard beacons blinking on the peaks, and a landing ring at every
 * station that burns brighter as the camera arrives.
 *
 * Two draw calls total: one LineSegments for all steel + cable + rings, one
 * Points for sparks and beacons (they share a buffer; a zero speed means
 * "beacon" and a positive speed means "travelling spark").
 */

const ARMS = 3
const ARM_Y = (a: number, h: number) => h * (0.58 + a * 0.16)
const ARM_REACH = (a: number) => 2.5 - a * 0.5
const ARM_Z = (a: number) => (0.62 - a * 0.08) * 3.2
const PEAK = (h: number) => h + 0.85

const frac = (v: number) => v - Math.floor(v)
const rnd1 = (n: number) => frac(Math.sin(n * 12.9898) * 43758.5453)

type Tower = { x: number; z: number; h: number; dir: number; seed: number }

/** The six conductor hang-points on a tower's arms, plus the peak. */
function anchor(t: Tower, a: number, side: number): number[] {
  return [t.x - t.dir * ARM_REACH(a), ARM_Y(a, t.h), t.z + side * ARM_Z(a)]
}
const peak = (t: Tower): number[] => [t.x, PEAK(t.h), t.z]

class Batches {
  pos: number[] = []
  seed: number[] = []
  kind: number[] = []
  group: number[] = []

  seg(a: number[], b: number[], kind: number, group = -1, seed = 0) {
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2])
    this.seed.push(seed, seed)
    this.kind.push(kind, kind)
    this.group.push(group, group)
  }
  get verts() {
    return this.pos.length / 3
  }
}

const GRID_VERT = /* glsl */ `
attribute float aSeed;
attribute float aKind;   // 0 steel · 1 cable · 2 ring
attribute float aGroup;  // station index for rings
uniform float uTime;
uniform vec3 uCam;
uniform float uActive;
uniform float uVelN;
varying float vA;
varying float vT;
void main(){
  vec3 p = position;
  float d = distance(p.xz, vec2(uCam.x, uCam.z));
  float fade = exp(-max(0.0, d - 7.0) * 0.03);

  if (aKind > 0.5 && aKind < 1.5) {
    // conductors sing when the visitor scrolls fast
    p.y += sin(p.z * 0.42 + uTime * 2.1 + aSeed * 40.0) * (0.01 + abs(uVelN) * 0.06);
  }

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = fade * (1.0 - smoothstep(34.0, 140.0, -mv.z));
  vT = aGroup;

  if (aKind > 1.5) {
    vA *= 0.3 + 1.6 * (1.0 - smoothstep(0.0, 1.3, abs(aGroup - uActive)));
  } else if (aKind > 0.5) {
    vA *= 0.55;
  } else {
    vA *= 0.42;
  }
  gl_Position = projectionMatrix * mv;
}`

const GRID_FRAG = /* glsl */ `
varying float vA;
varying float vT;
void main(){
  vec3 steel = vec3(0.7, 0.71, 0.73);
  vec3 amber = vec3(1.0, 0.66, 0.18);
  vec3 col = mix(steel, amber, 0.28);
  if (vT > -0.5) col = mix(amber, vec3(1.0, 0.85, 0.55), 0.35);   // station rings, warm
  gl_FragColor = vec4(col * vA, 1.0);
}`

const FLOW_VERT = /* glsl */ `
attribute vec3 aDir;
attribute vec2 aMeta;    // x phase · y speed (0 = beacon)
uniform float uTime;
uniform vec3 uCam;
varying float vA;
varying float vC;
void main(){
  bool flow = aMeta.y > 0.0001;
  float t = flow ? fract(uTime * aMeta.y + aMeta.x) : 0.0;
  vec3 p = position + aDir * t;
  if (flow) p.x += sin(uTime * 1.7 + aMeta.x * 30.0) * 0.03;

  float d = distance(p.xz, vec2(uCam.x, uCam.z));
  float live = exp(-max(0.0, d - 5.0) * 0.028);
  float head = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.5, 1.0, t));
  float blink = step(0.55, fract(uTime * 0.5 + aMeta.x));
  vA = live * (flow ? 0.18 + 2.4 * head : 0.5 + 1.3 * blink);
  vC = flow ? step(0.62, aMeta.x) : 1.0;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float size = flow ? 1.4 + 4.2 * head : 1.8 + 3.0 * blink;
  gl_PointSize = clamp(size * (13.0 / max(-mv.z, 1.0)), 1.0, 10.0);
  gl_Position = projectionMatrix * mv;
}`

const FLOW_FRAG = /* glsl */ `
varying float vA;
varying float vC;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.03, r);
  a *= a;
  vec3 col = mix(vec3(1.0, 0.72, 0.26), vec3(0.35, 0.84, 1.0), vC);
  gl_FragColor = vec4(col * a * vA, 1.0);
}`

export class Grid {
  readonly lines: THREE.LineSegments
  readonly sparks: THREE.Points
  private lineMat: THREE.ShaderMaterial
  private sparkMat: THREE.ShaderMaterial

  constructor(mobile: boolean) {
    const towers: Tower[] = []
    let i = 0
    for (let z = 15; z > -(SPACING * (N - 1)) - 32; z -= mobile ? 23 : 16) {
      for (const dir of [1, -1]) {
        const s = rnd1(i * 3 + dir)
        towers.push({ x: -dir * 9.2, z, h: 6.2 + s * 2.8, dir, seed: s })
        i++
      }
    }

    const B = new Batches()
    const cables: { a: number[]; b: number[] }[] = []
    const beacons: number[][] = []

    for (const t of towers) this.pylon(B, t)
    for (const side of [1, -1]) {
      const row = towers.filter((t) => t.dir === side)
      for (let k = 0; k + 1 < row.length; k++) this.spans(B, cables, row[k], row[k + 1])
    }
    for (let s = 0; s < N; s++) this.ring(B, s, -SPACING * s, mobile)
    for (const t of towers) beacons.push(peak(t))

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(B.pos), 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(B.seed), 1))
    g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(B.kind), 1))
    g.setAttribute('aGroup', new THREE.BufferAttribute(new Float32Array(B.group), 1))
    this.lineMat = new THREE.ShaderMaterial({
      vertexShader: GRID_VERT,
      fragmentShader: GRID_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uActive: { value: 0 }, uVelN: { value: 0 } },
    })
    this.lines = new THREE.LineSegments(g, this.lineMat)
    this.lines.frustumCulled = false
    this.lines.renderOrder = 1

    /* sparks + beacons share one point cloud */
    const nS = mobile ? 460 : 1200
    const nB = beacons.length
    const total = nS + nB
    const sp = new Float32Array(total * 3)
    const sd = new Float32Array(total * 3)
    const meta = new Float32Array(total * 2)
    for (let k = 0; k < nS; k++) {
      const c = cables.length ? cables[(k * 7919) % cables.length] : null
      const o = k * 3
      if (c) {
        sp[o] = c.a[0]
        sp[o + 1] = c.a[1]
        sp[o + 2] = c.a[2]
        sd[o] = c.b[0] - c.a[0]
        sd[o + 1] = c.b[1] - c.a[1]
        sd[o + 2] = c.b[2] - c.a[2]
      }
      meta[k * 2] = rnd1(k * 91.7)
      meta[k * 2 + 1] = 0.3 + rnd1(k * 17.3) * 0.55
    }
    for (let k = 0; k < nB; k++) {
      const p = beacons[k]
      const o = (nS + k) * 3
      sp[o] = p[0]
      sp[o + 1] = p[1]
      sp[o + 2] = p[2]
      meta[(nS + k) * 2] = rnd1(k * 7.7)
      meta[(nS + k) * 2 + 1] = 0
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(sp, 3))
    pg.setAttribute('aDir', new THREE.BufferAttribute(sd, 3))
    pg.setAttribute('aMeta', new THREE.BufferAttribute(meta, 2))
    this.sparkMat = new THREE.ShaderMaterial({
      vertexShader: FLOW_VERT,
      fragmentShader: FLOW_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() } },
    })
    this.sparks = new THREE.Points(pg, this.sparkMat)
    this.sparks.frustumCulled = false
    this.sparks.renderOrder = 1
  }

  /** Tapered lattice: four legs, horizontal frames, X bracing, three cross-arms. */
  private pylon(B: Batches, t: Tower) {
    const rb = 1.2
    const rt = 0.44
    const corners = [
      [1, 1],
      [1, -1],
      [-1, -1],
      [-1, 1],
    ]
    const box = (f: number) => rb + (rt - rb) * f
    const pt = (k: number, f: number) => {
      const r = box(f)
      return [t.x + corners[k][0] * r, t.h * f, t.z + corners[k][1] * r]
    }
    const levels = 5
    for (let l = 0; l < levels; l++) {
      const f0 = l / levels
      const f1 = (l + 1) / levels
      for (let k = 0; k < 4; k++) {
        B.seg(pt(k, f0), pt(k, f1), 0, -1, t.seed)
        B.seg(pt(k, f0), pt((k + 1) % 4, f0), 0, -1, t.seed)
        B.seg(pt(k, f0), pt((k + 1) % 4, f1), 0, -1, t.seed)
      }
    }
    for (let a = 0; a < ARMS; a++) {
      const y = ARM_Y(a, t.h)
      const z = ARM_Z(a)
      const tipY = y + 0.12
      for (const s of [-1, 1]) {
        B.seg([t.x, y, t.z + s * z], [t.x - t.dir * ARM_REACH(a), tipY, t.z + s * z * 0.7], 0, -1, t.seed)
        B.seg([t.x, y - 0.5, t.z + s * z], [t.x - t.dir * ARM_REACH(a), tipY, t.z + s * z * 0.7], 0, -1, t.seed)
      }
    }
    B.seg([t.x, t.h, t.z], peak(t), 0, -1, t.seed)
  }

  /** Six sagging conductors + an earth wire, hung from the arm tips. */
  private spans(B: Batches, cables: { a: number[]; b: number[] }[], A: Tower, C: Tower) {
    const dz = Math.abs(C.z - A.z)
    if (dz < 1 || dz > 70) return
    const hang = (t: Tower, a: number, s: number) => anchor(t, a, s)
    for (let a = 0; a < ARMS; a++) {
      for (const s of [-1, 1]) {
        const from = hang(A, a, s)
        const to = hang(C, a, s)
        this.cat(B, cables, from, to, 0.5 + a * 0.12)
      }
    }
    this.cat(B, cables, peak(A), peak(C), 0.2)
  }

  private cat(B: Batches, cables: { a: number[]; b: number[] }[], a: number[], b: number[], sag: number) {
    const SEG = 8
    let prev = a
    for (let s = 1; s <= SEG; s++) {
      const u = s / SEG
      const cur = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(Math.PI * u) * sag, a[2] + (b[2] - a[2]) * u]
      B.seg(prev, cur, 1, 0, 0)
      cables.push({ a: prev, b: cur })
      prev = cur
    }
  }

  /** Landing pad for a station: circle + radial ticks on the grid floor. */
  private ring(B: Batches, index: number, z: number, mobile: boolean) {
    const R = 4.4
    const seg = mobile ? 56 : 88
    let prev = [Math.cos(0) * R, -3.42, z + Math.sin(0) * R]
    for (let s = 1; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2
      const cur = [Math.cos(a) * R, -3.42, z + Math.sin(a) * R]
      B.seg(prev, cur, 2, index)
      prev = cur
    }
    const ticks = mobile ? 10 : 18
    for (let s = 0; s < ticks; s++) {
      const a = (s / ticks) * Math.PI * 2
      B.seg([Math.cos(a) * (R + 0.24), -3.42, z + Math.sin(a) * (R + 0.24)], [Math.cos(a) * (R + 0.72), -3.42, z + Math.sin(a) * (R + 0.72)], 2, index)
    }
  }

  update(time: number, cam: THREE.Vector3, active: number, velN: number) {
    this.lineMat.uniforms.uTime.value = time
    this.lineMat.uniforms.uActive.value = active
    this.lineMat.uniforms.uVelN.value = velN
    ;(this.lineMat.uniforms.uCam.value as THREE.Vector3).copy(cam)
    this.sparkMat.uniforms.uTime.value = time
    ;(this.sparkMat.uniforms.uCam.value as THREE.Vector3).copy(cam)
  }

  dispose() {
    this.lines.geometry.dispose()
    this.lineMat.dispose()
    this.sparks.geometry.dispose()
    this.sparkMat.dispose()
  }
}
