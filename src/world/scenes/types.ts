import type * as THREE from 'three'
import type { SceneId } from '../config'
import type { Rnd } from '../utils'

export interface ShapeOut {
  x: number
  y: number
  z: number
  r: number
  g: number
  b: number
}

/** Writes particle `i` (of `n`) of a scene's morph target into `o`. Positions are station-local. */
export type ShapeFn = (i: number, n: number, rnd: Rnd, o: ShapeOut) => void

/** Uniforms shared by every material that reads the fluid or scroll speed. */
export interface SharedUniforms {
  uVel: { value: THREE.Texture | null }
  uRes: { value: THREE.Vector2 }
  uScrollVel: { value: number }
}

export interface SceneCtx {
  shared: SharedUniforms
  portrait: boolean
  /** World-space size of the view at the subject's distance. */
  viewW: number
  viewH: number
  introReveal: number
  pointer: THREE.Vector2
  /** Screen fraction (0..1, y down) → offset from the station centre, accounting for the layout shift. */
  localFromScreen: (fx: number, fy: number) => { x: number; y: number }
}

/** Each scene is its own module: a morph target, optional 3D objects, and an update. */
export interface SceneModule {
  id: SceneId
  index: number
  /** How much the cloud shimmers while this scene holds (low = crisp image). */
  baseCurl: number
  isImage: boolean
  load?: () => Promise<void>
  shape: ShapeFn
  build: (root: THREE.Group, ctx: SceneCtx) => void
  /** `pres` fades the scene's objects in/out; `reveal` is 1 only while it holds. */
  update: (ctx: SceneCtx, pres: number, reveal: number) => void
  dispose: () => void
}
