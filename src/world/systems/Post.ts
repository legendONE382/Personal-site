import * as THREE from 'three'
import {
  BlendFunction,
  BloomEffect,
  Effect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing'
import { FLUID_GRADE_FRAG } from '../shaders/post'

/** The custom lens: fluid refraction, chromatic split, dye glow, grade, shader menu. */
export class FluidGradeEffect extends Effect {
  constructor() {
    super('FluidGradeEffect', FLUID_GRADE_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['tVel', new THREE.Uniform(null)],
        ['tDye', new THREE.Uniform(null)],
        ['uTime', new THREE.Uniform(0)],
        ['uScroll', new THREE.Uniform(0)],
        ['uMenu', new THREE.Uniform(0)],
        ['uDim', new THREE.Uniform(0)],
        ['uAspect', new THREE.Uniform(1.7)],
        ['uChroma', new THREE.Uniform(1)],
        ['uRefract', new THREE.Uniform(1)],
        ['uFlash', new THREE.Uniform(0)],
        ['uGrade', new THREE.Uniform(new THREE.Vector3(1, 1, 1))],
        ['uMenuOrigin', new THREE.Uniform(new THREE.Vector2(0.94, 0.93))],
      ]),
    })
  }

  set(name: string, value: unknown) {
    const un = this.uniforms.get(name)
    if (un) un.value = value
  }
}

export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: 0 })
  composer.addPass(new RenderPass(scene, camera))

  const grade = new FluidGradeEffect()
  const bloom = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    mipmapBlur: true,
    luminanceThreshold: 0.72,
    luminanceSmoothing: 0.25,
    intensity: 1,
    radius: 0.75,
    levels: 7,
  })
  const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })
  const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.72 })
  const noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: true })
  noise.blendMode.opacity.value = 0.16

  composer.addPass(new EffectPass(camera, grade, bloom, tone, vignette, noise))
  return { composer, grade, bloom, tone, vignette, noise }
}
