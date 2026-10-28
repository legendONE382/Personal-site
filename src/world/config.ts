import * as THREE from 'three'

/**
 * THE SIGNAL — world configuration.
 *
 * One current of particles travels a Lagos power grid. At every station the
 * current resolves into a real shipped product. Everything that places things
 * in space lives here so the choreography is easy to retune.
 */

export const PALETTE = {
  ink: '#05060a',
  bone: '#efeae0',
  amber: '#ffb23e',
  cyan: '#5ad7ff',
}

export { SCENES, N, type SceneId } from './sceneList'
import { SCENES, N } from './sceneList'

/** Distance between stations along -Z. */
export const SPACING = 34

const X = [0, 0, 0.6, -0.6, 0.6, -0.6, 0]
const Y = [0, -1.2, 0.2, 0, 0.2, 0, 0]
const YAW = [0, 0, -0.16, 0.14, -0.12, 0.12, 0]

export const stations = SCENES.map((_, i) => ({
  pos: new THREE.Vector3(X[i], Y[i], -SPACING * i),
  yaw: YAW[i],
}))

/** Camera resting position relative to each station. */
const CAM: [number, number, number][] = [
  [0, 0.3, 11.5],
  [0, 4.8, 10.5],
  [0.8, 0.2, 10.8],
  [-0.8, 0.3, 10.8],
  [0.7, 0.1, 10.8],
  [-0.7, 0.2, 10.8],
  [0, 0.2, 11],
]

const LOOK: [number, number, number][] = [
  [0, 0, 0],
  [0, -0.8, 0],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
]

export const lookTargets = stations.map((s, i) => s.pos.clone().add(new THREE.Vector3(...LOOK[i])))

/**
 * Where the subject sits on screen, as a fraction of the viewport.
 * [landscape x, landscape y, portrait x, portrait y]  (+x = right, +y = up)
 */
export const SHIFT: [number, number, number, number][] = [
  [0.19, 0, 0, 0.2],
  [0, 0, 0, 0],
  [0.185, -0.07, 0, 0.09],
  [0.185, -0.07, 0, 0.09],
  [0.185, -0.07, 0, 0.09],
  [0.185, -0.07, 0, 0.09],
  [-0.17, 0, 0, 0.24],
]

/** Per-scene colour grade (multiplies the final image). */
export const GRADES: [number, number, number][] = [
  [1.0, 0.96, 0.9],
  [0.9, 0.97, 1.06],
  [1.0, 0.98, 1.02],
  [1.0, 1.0, 0.98],
  [1.02, 0.99, 0.96],
  [0.9, 1.0, 1.08],
  [1.04, 0.98, 0.92],
]

export const FOVS = [38, 40, 34, 34, 34, 34, 38]
export const BLOOMS = [1.15, 0.85, 0.7, 0.6, 0.65, 0.85, 1.2]

/** Camera rides a Catmull-Rom spline through every station, swinging wide between them. */
export function cameraSpline() {
  const pts: THREE.Vector3[] = []
  for (let k = 0; k < N; k++) {
    pts.push(stations[k].pos.clone().add(new THREE.Vector3(...CAM[k])))
    if (k < N - 1) {
      const a = stations[k].pos
      const b = stations[k + 1].pos
      const swing = (k % 2 === 0 ? 1 : -1) * 3.6
      pts.push(new THREE.Vector3((a.x + b.x) / 2 + swing, (a.y + b.y) / 2 + 1.6, (a.z + b.z) / 2 + 5))
    }
  }
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal')
}
