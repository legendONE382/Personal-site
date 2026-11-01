import * as THREE from 'three'

/**
 * Shared image + texture cache.
 *
 * Every surface in the world (the particle morph targets, the dissolving
 * screenshots, the contact-scene plates) draws from the SAME set of project
 * files. Memoising by URL means one network fetch and one GPU upload per image
 * no matter how many objects use it — that's what buys the extra graphics for
 * free. Works identically for hashed URLs and for the data: URIs used in the
 * single-file build.
 */
export interface SharedImage {
  img: HTMLImageElement
  tex: THREE.Texture
}

const cache = new Map<string, Promise<SharedImage>>()

function makeTexture(img: HTMLImageElement) {
  const t = new THREE.Texture(img)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  t.generateMipmaps = true
  t.needsUpdate = true
  return t
}

function load(src: string): Promise<SharedImage> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => res({ img, tex: makeTexture(img) })
    img.onerror = () => rej(new Error('image failed: ' + src))
    img.src = src
  })
}

export function sharedImage(src: string): Promise<SharedImage> {
  let e = cache.get(src)
  if (!e) {
    e = load(src)
    cache.set(src, e)
    e.catch(() => cache.delete(src))
  }
  return e
}

export function cachedCount() {
  return cache.size
}
