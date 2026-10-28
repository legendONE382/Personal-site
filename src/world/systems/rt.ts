import * as THREE from 'three'
import { FULL_VERT } from '../shaders/common'

export function makeRT(w: number, h: number, linear = true) {
  const f = linear ? THREE.LinearFilter : THREE.NearestFilter
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: f,
    magFilter: f,
    depthBuffer: false,
    stencilBuffer: false,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  })
}

/** Ping-pong pair of render targets. */
export class Double {
  read: THREE.WebGLRenderTarget
  write: THREE.WebGLRenderTarget
  constructor(w: number, h: number, linear = true) {
    this.read = makeRT(w, h, linear)
    this.write = makeRT(w, h, linear)
  }
  swap() {
    const t = this.read
    this.read = this.write
    this.write = t
  }
  dispose() {
    this.read.dispose()
    this.write.dispose()
  }
}

/** Renders one fragment shader over the whole of a render target. */
export class FullPass {
  private scene = new THREE.Scene()
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))
  private renderer: THREE.WebGLRenderer

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
  }

  run(mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    this.mesh.material = mat
    const prev = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(target)
    this.renderer.render(this.scene, this.cam)
    this.renderer.setRenderTarget(prev)
  }

  dispose() {
    this.mesh.geometry.dispose()
  }
}

export function fullMaterial(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    vertexShader: FULL_VERT,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  })
}
