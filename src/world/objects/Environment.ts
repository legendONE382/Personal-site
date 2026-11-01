import * as THREE from 'three'
import { FLOOR_FRAG, FLOOR_VERT, STREAK_FRAG, STREAK_VERT } from '../shaders/objects'
import { SPACING, N } from '../config'
import { mulberry32 } from '../utils'

const additive = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendEquation: THREE.AddEquation,
} as const

/** The Lagos power grid: lines of light with current pulses, under the whole journey. */
export class Floor {
  mesh: THREE.Mesh
  private mat: THREE.ShaderMaterial

  constructor() {
    const len = SPACING * (N - 1) + 160
    this.mat = new THREE.ShaderMaterial({
      vertexShader: FLOOR_VERT,
      fragmentShader: FLOOR_FRAG,
      ...additive,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uVelN: { value: 0 } },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(260, len, 1, 1), this.mat)
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.set(0, -3.5, -(SPACING * (N - 1)) / 2 - 20)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 0
  }

  update(time: number, cam: THREE.Vector3, velN: number) {
    this.mat.uniforms.uTime.value = time
    ;(this.mat.uniforms.uCam.value as THREE.Vector3).copy(cam)
    this.mat.uniforms.uVelN.value = velN
  }

  dispose() {
    this.mat.dispose()
    this.mesh.geometry.dispose()
  }
}

/** Dust in the dark that stretches into speed-lines as the visitor scrolls. */
export class Streaks {
  lines: THREE.LineSegments
  private mat: THREE.ShaderMaterial

  constructor(count: number) {
    const rnd = mulberry32(21)
    const pos = new Float32Array(count * 6)
    const end = new Float32Array(count * 2)
    const seed = new Float32Array(count * 2)
    const zMax = 30
    const zMin = -(SPACING * (N - 1)) - 70
    for (let i = 0; i < count; i++) {
      const x = (rnd() - 0.5) * 70
      const y = -3 + rnd() * 18
      const z = zMin + rnd() * (zMax - zMin)
      const s = rnd()
      pos.set([x, y, z, x, y, z], i * 6)
      end[i * 2] = 0
      end[i * 2 + 1] = 1
      seed[i * 2] = s
      seed[i * 2 + 1] = s
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aEnd', new THREE.BufferAttribute(end, 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    this.mat = new THREE.ShaderMaterial({
      vertexShader: STREAK_VERT,
      fragmentShader: STREAK_FRAG,
      ...additive,
      uniforms: { uVel: { value: 0 }, uTime: { value: 0 } },
    })
    this.lines = new THREE.LineSegments(geo, this.mat)
    this.lines.frustumCulled = false
    this.lines.renderOrder = 1
  }

  update(time: number, velN: number) {
    this.mat.uniforms.uTime.value = time
    this.mat.uniforms.uVel.value = velN
  }

  dispose() {
    this.mat.dispose()
    this.lines.geometry.dispose()
  }
}
