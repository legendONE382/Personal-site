import * as THREE from 'three'
import { IMAGE_FRAG, PLANE_VERT } from '../shaders/objects'
import type { SharedUniforms } from '../scenes/types'

/**
 * A real project screenshot placed in the world. See IMAGE_FRAG for the
 * pixel-dissolve reveal, fluid refraction and scroll-velocity colour split.
 */
export class ImagePlane {
  mesh: THREE.Mesh
  private mat: THREE.ShaderMaterial

  constructor(tex: THREE.Texture, crop: THREE.Vector4, width: number, aspect: number, shared: SharedUniforms) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: PLANE_VERT,
      fragmentShader: IMAGE_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: tex },
        uCrop: { value: crop },
        uVel: shared.uVel,
        uRes: shared.uRes,
        uScrollVel: shared.uScrollVel,
        uAspect: { value: aspect },
        uReveal: { value: 0 },
        uPresence: { value: 0 },
        uTime: { value: 0 },
      },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / aspect), this.mat)
    this.mesh.renderOrder = 2
    this.mesh.visible = false
  }

  set(presence: number, reveal: number, time: number) {
    const u = this.mat.uniforms
    u.uPresence.value = presence
    u.uReveal.value = reveal
    u.uTime.value = time
    this.mesh.visible = presence > 0.003
  }

  dispose() {
    this.mat.dispose()
    this.mesh.geometry.dispose()
  }
}
